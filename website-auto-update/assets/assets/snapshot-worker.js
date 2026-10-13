/**
 * Cloudflare「整页快照」Worker 模板 —— 由技能 website-auto-update 提供
 * 适用：整站已经完整复刻（导航每个栏目、每个 tab、榜单、每一期、每个详情页都在站内），
 *       不需要重建页面，只想让线上站点始终跟着原站的最新内容走。
 *
 * 机制（2026-10 已在生产跑通）：
 *   1) 访客请求页面 → 先读 KV 快照，命中就直接返回，不打扰原站；
 *   2) 快照没有或已过期 → 实时回源原站，拿到最新 HTML 写回 KV 再返回；
 *   3) Cron 每两天全量回刷「页面清单」里的所有页面 —— 没人访问的冷门页也不会发霉；
 *   4) 回源失败（原站 404 / 风控 / 网络抖动）→ 回退本地复刻副本，站点永远不开天窗。
 *
 * 关键约定：
 *   - PAGES 必须覆盖「全部页面」（含每个栏目、每个 tab、每一期、每个详情页）；
 *     复刻新增了页面，就重跑 assets/build-pages-list.ps1 重新生成 pages.js，
 *     否则新页面只能靠访客访问被动更新，Cron 不会主动刷它。
 *   - PAGE_TTL（快照有效期）要和 cron 周期对齐：每两天一刷就写 172800 秒。
 *   - 只改写品牌域名，GitHub 等项目源码链接保持真实跳转。
 */
import { PAGES } from './pages.js';

const CONFIG = {
  ORIGIN: 'https://原站域名', // 被抓取的原站
  SELF: 'https://本站域名', // 本站线上域名
  INDEX_KEY: 'index.html', // 首页快照在 KV 里的键
  PAGE_TTL: 172800, // 详情页快照有效期（秒）＝ cron 周期，每两天一刷填 172800
  CONCURRENCY: 8, // 全量回刷并发数
  GAP_MS: 150, // 每个页面之间的间隔，别把原站打疼
  MIN_HTML: 2000, // 小于这个长度视为抓残了，判为无效
  UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
};
// 部署时把 CONFIG 里的占位域名换成真实域名；KV 绑定名在 wrangler 配置里（binding: SNAPSHOT）

const HEADERS = {
  'User-Agent': CONFIG.UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9',
  Referer: CONFIG.ORIGIN + '/',
};

const REF_ATTR_RE = /(href|src|srcset|poster|data-src|action|style|content)="([^"]*)"/g;
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// 只把品牌域名换成本站域名，外部链接（如项目源码的 GitHub）原样保留
function rewrite(html) {
  html = html.replace(REF_ATTR_RE, (m, attr, val) => {
    const out = val
      .replace(new RegExp('https?://' + hostOf(CONFIG.ORIGIN), 'gi'), CONFIG.SELF)
      .replace(new RegExp('//' + hostOf(CONFIG.ORIGIN), 'gi'), CONFIG.SELF);
    return out === val ? m : `${attr}="${out}"`;
  });
  return html.replace(new RegExp('"canonicalUrl":"https?://' + hostOf(CONFIG.ORIGIN), 'gi'), `"canonicalUrl":"${CONFIG.SELF}`);
}

function hostOf(u) {
  return u.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
}

function isHomePath(p) {
  return p === '/' || p === '/index.html';
}

function isPagePath(p) {
  return isHomePath(p) || /\.html?$/i.test(p);
}

function validHtml(html, min = CONFIG.MIN_HTML) {
  return typeof html === 'string' && html.length >= min && /<\/html>/i.test(html);
}

function originFetch(pathname, search = '') {
  return fetch(CONFIG.ORIGIN + pathname + search, { headers: HEADERS, cf: { cacheTtl: 0 } });
}

function htmlResponse(body, tag) {
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=600',
      'x-snapshot': tag, // 排查利器：live-self / live-page-cached / live-page / 无此头=本地兜底
    },
  });
}

// 首页快照刷新
async function refresh(env) {
  try {
    const res = await originFetch('/');
    if (!res.ok) return { ok: false, reason: 'upstream status ' + res.status };
    const html = await res.text();
    if (!validHtml(html, 20000)) return { ok: false, reason: 'invalid html length ' + html.length };
    const out = rewrite(html);
    await env.SNAPSHOT.put(CONFIG.INDEX_KEY, out, {
      metadata: { fetchedAt: new Date().toISOString(), size: out.length },
    });
    return { ok: true, size: out.length, fetchedAt: new Date().toISOString() };
  } catch (e) {
    return { ok: false, reason: String(e && e.message ? e.message : e) };
  }
}

// 单个详情页快照刷新
async function refreshPage(pathname, env) {
  try {
    const res = await originFetch(pathname);
    if (!res.ok) return { ok: false, pathname, reason: 'status ' + res.status };
    const html = await res.text();
    if (!validHtml(html)) return { ok: false, pathname, reason: 'invalid html' };
    await env.SNAPSHOT.put('p:' + pathname, rewrite(html), { expirationTtl: CONFIG.PAGE_TTL });
    return { ok: true, pathname, size: html.length };
  } catch (e) {
    return { ok: false, pathname, reason: String(e && e.message ? e.message : e) };
  }
}

// 全量回刷：清单里所有页面，受限并发，控制在 waitUntil 的 30 秒窗口内
async function refreshAll(env, concurrency = CONFIG.CONCURRENCY) {
  const queue = PAGES.slice();
  let refreshed = 0;
  let failed = 0;
  const failures = [];
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, async () => {
    while (queue.length) {
      const p = queue.shift();
      const r = await refreshPage(p, env);
      if (r.ok) refreshed++;
      else {
        failed++;
        if (failures.length < 10) failures.push(p + ' (' + r.reason + ')');
      }
      await sleep(CONFIG.GAP_MS);
    }
  });
  await Promise.all(workers);
  return { total: PAGES.length, refreshed, failed, failures, at: new Date().toISOString() };
}

// 实时回源一个页面并写回 KV，供后续访客复用
async function livePage(url, env, ctx) {
  const home = isHomePath(url.pathname);
  try {
    const res = await originFetch(url.pathname, url.search);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return null;
    const html = rewrite(await res.text());
    if (!validHtml(html, 500)) return null;
    if (env.SNAPSHOT) {
      const write = home
        ? env.SNAPSHOT.put(CONFIG.INDEX_KEY, html, {
            metadata: { fetchedAt: new Date().toISOString(), size: html.length },
          })
        : env.SNAPSHOT.put('p:' + url.pathname, html, { expirationTtl: CONFIG.PAGE_TTL });
      if (ctx && ctx.waitUntil) ctx.waitUntil(write.catch(() => {}));
      else await write.catch(() => {});
    }
    return htmlResponse(html, home ? 'live-self-live' : 'live-page');
  } catch (e) {
    return null;
  }
}

function authorized(url, env) {
  return Boolean(env.REFRESH_TOKEN) && url.searchParams.get('token') === env.REFRESH_TOKEN;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // 手动刷新首页：curl -s "https://本站域名/__refresh?token=xxx"
    if (url.pathname === '/__refresh') {
      if (!authorized(url, env)) return new Response('forbidden', { status: 403 });
      return Response.json(await refresh(env));
    }

    // 手动全量回刷：curl -s "https://本站域名/__refresh-all?token=xxx"
    if (url.pathname === '/__refresh-all') {
      if (!authorized(url, env)) return new Response('forbidden', { status: 403 });
      if (ctx && ctx.waitUntil) {
        ctx.waitUntil(refreshAll(env));
        return Response.json({ started: true, total: PAGES.length });
      }
      return Response.json(await refreshAll(env));
    }

    // 页面：原站最新优先，本地复刻副本兜底
    if (isPagePath(url.pathname)) {
      const home = isHomePath(url.pathname);
      const kvKey = home ? CONFIG.INDEX_KEY : 'p:' + url.pathname;

      const hit = await env.SNAPSHOT.get(kvKey);
      if (hit) return htmlResponse(rewrite(hit), home ? 'live-self' : 'live-page-cached');

      const live = await livePage(url, env, ctx);
      if (live) return live;

      const fallback = await env.ASSETS.fetch(req);
      if (fallback.status !== 404) return fallback;

      return new Response('404 Not Found', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    // 静态资源：本地优先，缺失再实时回源
    const assetRes = await env.ASSETS.fetch(req);
    if (assetRes.status !== 404) return assetRes;

    try {
      const upstream = await fetch(CONFIG.ORIGIN + url.pathname + url.search, { headers: HEADERS });
      if (!upstream.ok) {
        return new Response(upstream.status === 404 ? '404 Not Found' : 'upstream error', {
          status: upstream.status === 404 ? 404 : upstream.status,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
      const ct = upstream.headers.get('content-type') || 'application/octet-stream';
      if (ct.includes('text/html')) return htmlResponse(rewrite(await upstream.text()), 'live-page');
      return new Response(upstream.body, {
        headers: { 'content-type': ct, 'cache-control': 'public, max-age=3600', 'x-snapshot': 'live-asset' },
      });
    } catch (e) {
      return new Response('502 Bad Gateway', {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  },

  // 每两天一次：首页 + 全部页面全量回刷（wrangler 配置 [triggers] crons = ["0 3 */2 * *"]）
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
    ctx.waitUntil(refreshAll(env));
  },
};
