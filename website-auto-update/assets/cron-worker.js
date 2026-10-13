/**
 * Cloudflare Cron Worker 模板 —— 由技能 website-auto-update 提供
 * 适用：站点部署在 Cloudflare（Pages / R2）时，用它做云端定时，不依赖本地电脑开机。
 *
 * 职责只有一个：到点叫一次站点重建（POST Pages Deploy Hook）。
 * 抓新内容、重建页面、校验、上线全部在站点构建流程里完成，Worker 不碰文件。
 *
 * 用法：
 *   1) 和 wrangler.toml 放同一目录，改 wrangler.toml 里的 name 与 [triggers] crons
 *   2) npx wrangler secret put DEPLOY_HOOK_URL   # Pages → Settings → Deploy hooks 里的完整地址
 *   3) npx wrangler secret put ADMIN_KEY         # 可选，手动触发用的口令
 *   4) npx wrangler deploy
 *   5) npx wrangler tail                         # 看下一次触发日志
 */

const UA = 'site-auto-update-cron/1.0';

export default {
  // 定时入口：Cloudflare 按 wrangler.toml 里的 [triggers] crons 调用（时间是 UTC）
  async scheduled(event, env, ctx) {
    ctx.waitUntil(run(event.cron, env));
  },

  // 手动入口：GET https://<worker>.<账号>.workers.dev/?key=<ADMIN_KEY>
  async fetch(req, env) {
    const key = new URL(req.url).searchParams.get('key');
    if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return new Response('forbidden', { status: 403 });
    return Response.json(await run('manual', env));
  },
};

async function run(trigger, env) {
  const started = Date.now();
  if (!env.DEPLOY_HOOK_URL) {
    console.error('[cron] 缺少 DEPLOY_HOOK_URL，请先 npx wrangler secret put DEPLOY_HOOK_URL');
    return { ok: false, cron: trigger, error: 'missing DEPLOY_HOOK_URL' };
  }

  // 可选预检：配了 CHECK_URL + KV 绑定时，先看原站列表有没有变化，没变化就跳过本次构建（省 Pages 构建次数）
  if (env.CHECK_URL && env.KV) {
    try {
      const res = await fetch(env.CHECK_URL, { headers: { 'user-agent': UA } });
      const sig = await sha256(await res.text());
      const last = await env.KV.get('source-sig');
      if (sig === last) {
        console.log('[cron] 原站无变化，跳过重建（' + (Date.now() - started) + 'ms）');
        return { ok: true, cron: trigger, built: false, ms: Date.now() - started };
      }
      await env.KV.put('source-sig', sig);
      console.log('[cron] 原站有变化，触发重建');
    } catch (e) {
      // 预检失败时宁可让构建去判断（构建里的校验不过就不会上线）
      console.error('[cron] 列表预检失败，仍触发构建：' + e.message);
    }
  }

  const res = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST', headers: { 'user-agent': UA } });
  const body = (await res.text()).slice(0, 200);
  console.log('[cron] 触发 Deploy Hook：HTTP ' + res.status + ' ' + body + '（' + (Date.now() - started) + 'ms）');
  return { ok: res.ok, cron: trigger, built: res.ok, status: res.status, ms: Date.now() - started };
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
