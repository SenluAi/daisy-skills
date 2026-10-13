/**
 * 静态网站自动更新模板 —— 由技能 website-auto-update 提供
 *
 * 用法：node update.js [--force] [--no-deploy]
 *   --force      没有新增项目也重新构建并部署
 *   --no-deploy  只构建 + 本地校验，不部署（试运行）
 *
 * 先把下面 CONFIG 填成自己项目的样子，再试运行一次。填写要点见技能 SKILL.md。
 */
const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const ROOT = __dirname;

const CONFIG = {
  // ---- 数据 ----
  dataFile: 'details.json',            // 本地数据文件：{ <唯一标识>: {...} }
  keyField: 'full_name',               // 唯一标识字段
  rawDir: 'detail-raw',                // 原站页面缓存目录（已抓过的不重抓）

  // ---- 原站 ----
  listUrl: 'https://example.com/api/list?page=', // 列表接口，后面拼页码；返回数组或 {data:[],has_more:true}
  listArrayKeys: ['data', 'items'],    // 从返回 JSON 里取数组的候选字段（按顺序试）
  hasMoreKey: 'has_more',
  maxPages: 3,
  detailUrl: key => 'https://example.com/item/' + key, // 详情页地址
  detailMustContain: '__NEXT_DATA__',   // 详情页里必须出现的标志串，用来判断是否抓成功
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36' },

  // ---- 站内结构 ----
  siteDir: 'site',
  indexPath: 'site/index.html',
  cardContainer: '<div class="divide-y divide-gray-100 overflow-hidden dark:divide-gray-700">', // 新卡片插到这个容器开标签之后
  cardKeyMarker: key => '/' + String(key).replace(/\//g, '__') + '.html', // 判断首页是否已有这张卡片
  linkPattern: /href="\.\/(repo|tag)\/([^"]+)"/g,  // 首页里的站内链接
  linkTarget: (kind, name) => path.join(ROOT, 'site', kind, name), // 站内链接应对应的真实文件
  livePaths: ['/', '/tag/index.html'],  // 线上抽查路径

  // ---- 构建与部署 ----
  buildSteps: ['extract.js', 'build-detail.js', 'build-tags.js'], // 依次执行的 node 脚本
  deployCmd: '"C:\\Program Files\\nodejs\\npx.cmd" wrangler deploy', // 无人值守部署命令
  siteUrl: 'https://example.com',
  backupKeep: 7,
  logFile: 'update-log.txt',
};

// ===== 工具 =====
const args = process.argv.slice(2);
const NO_DEPLOY = args.includes('--no-deploy');
const FORCE = args.includes('--force');
const LOG = path.join(ROOT, CONFIG.logFile);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(...a) {
  const line = '[' + new Date().toLocaleString('zh-CN') + '] ' + a.join(' ');
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}
function runNode(script) {
  const out = execFileSync(process.execPath, [path.join(ROOT, script)], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  out.trim().split('\n').forEach(l => l.trim() && log('   ' + script + ': ' + l.trim()));
}
function pickArray(json) {
  if (Array.isArray(json)) return json;
  for (const k of CONFIG.listArrayKeys) if (Array.isArray(json[k])) return json[k];
  return [];
}
// TODO: 按自己站的卡片 HTML 结构写。注意 href 必须是站内 './xxx.html'，并带 data-card="1"
function cardHtml(item) {
  return `<article><a href="./detail/${String(item[CONFIG.keyField]).replace(/\//g, '__')}.html" data-card="1">${item.name}</a></article>`;
}

(async () => {
  log('===== 开始同步 =====');

  // 0) 备份 + 清理旧备份
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(ROOT, 'backup', stamp);
  fs.mkdirSync(backup, { recursive: true });
  for (const f of [CONFIG.dataFile, CONFIG.indexPath]) {
    const src = path.join(ROOT, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(backup, path.basename(f)));
  }
  const bkRoot = path.join(ROOT, 'backup');
  const dirs = fs.readdirSync(bkRoot).filter(d => fs.statSync(path.join(bkRoot, d)).isDirectory()).sort();
  for (const d of dirs.slice(0, Math.max(0, dirs.length - CONFIG.backupKeep))) fs.rmSync(path.join(bkRoot, d), { recursive: true, force: true });
  log('已备份到 backup/' + stamp + '（保留最近 ' + CONFIG.backupKeep + ' 份）');

  // 1) 抓原站列表
  const items = [];
  for (let page = 1; page <= CONFIG.maxPages; page++) {
    const res = await fetch(CONFIG.listUrl + page, { headers: CONFIG.headers });
    if (!res.ok) { log('列表接口失败 page' + page + ' status=' + res.status + '，跳过该页'); continue; }
    const j = await res.json();
    items.push(...pickArray(j));
    if (!j[CONFIG.hasMoreKey]) break;
  }
  log('原站列表取到 ' + items.length + ' 条');
  if (!items.length) { log('列表为空，终止（不部署）'); return; }

  // 2) 找新增
  const dataPath = path.join(ROOT, CONFIG.dataFile);
  const data = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : {};
  const before = Object.keys(data).length;
  const fresh = items.filter(it => !data[it[CONFIG.keyField]]);
  log('本地已有 ' + before + ' 条，新增 ' + fresh.length + ' 条' + (fresh.length ? '：' + fresh.map(i => i[CONFIG.keyField]).join(', ') : ''));
  if (!fresh.length && !FORCE) { log('没有新增内容，无需更新（--force 可强制重建）'); log('===== 结束 ====='); return; }

  // 3) 抓新增条目的详情页
  const rawDir = path.join(ROOT, CONFIG.rawDir);
  fs.mkdirSync(rawDir, { recursive: true });
  let crawled = 0; const failed = [];
  for (const it of fresh) {
    const key = String(it[CONFIG.keyField]);
    const file = path.join(rawDir, key.replace(/\//g, '__') + '.html');
    if (fs.existsSync(file) && fs.statSync(file).size > 5000) { crawled++; continue; }
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      try {
        const res = await fetch(CONFIG.detailUrl(key), { headers: CONFIG.headers });
        const t = await res.text();
        if (res.ok && t.includes(CONFIG.detailMustContain)) { fs.writeFileSync(file, t); ok = true; crawled++; }
        else log('详情抓取失败 ' + key + ' status=' + res.status);
      } catch (e) { log('详情抓取异常 ' + key + ' ' + e.message); }
      await sleep(600);
    }
    if (!ok) failed.push(key);
    await sleep(600);
  }
  log('详情页抓取成功 ' + crawled + ' 条' + (failed.length ? '，失败：' + failed.join(', ') : ''));

  // 4) 重建数据
  if (CONFIG.buildSteps.length) runNode(CONFIG.buildSteps[0]);
  const data2 = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // 5) 首页插入新卡片（只插详情页已就绪的）
  const idxPath = path.join(ROOT, CONFIG.indexPath);
  let idx = fs.readFileSync(idxPath, 'utf8');
  const ci = idx.indexOf(CONFIG.cardContainer);
  if (ci < 0) { log('错误：首页找不到卡片容器，终止（不部署）'); return; }
  const toAdd = items.filter(it => data2[it[CONFIG.keyField]] && !idx.includes(CONFIG.cardKeyMarker(it[CONFIG.keyField])));
  if (toAdd.length) {
    idx = idx.slice(0, ci + CONFIG.cardContainer.length) + toAdd.map(cardHtml).join('') + idx.slice(ci + CONFIG.cardContainer.length);
    fs.writeFileSync(idxPath, idx);
    log('首页新增卡片 ' + toAdd.length + ' 个：' + toAdd.map(i => i.name || i[CONFIG.keyField]).join(', '));
  } else log('首页无需新增卡片');

  // 6) 重建其余页面
  for (const s of CONFIG.buildSteps.slice(1)) runNode(s);

  // 7) 本地校验
  const home = fs.readFileSync(idxPath, 'utf8');
  const dead = (home.match(/href="#"/g) || []).length;
  const links = [...home.matchAll(CONFIG.linkPattern)];
  const missing = links.filter(m => !fs.existsSync(CONFIG.linkTarget(m[1], m[2]))).map(m => m[2]);
  log('校验 · 首页卡片 ' + (home.match(/data-card="1"/g) || []).length + ' 张，站内链接 ' + links.length + ' 个，死链 ' + dead + ' 个，指向不存在的文件 ' + missing.length + (missing.length ? '：' + [...new Set(missing)].join(', ') : ''));
  if (dead || missing.length) { log('本地校验未通过，终止部署（可用 backup/' + stamp + ' 回滚）'); log('===== 结束 ====='); return; }
  if (NO_DEPLOY) { log('已指定 --no-deploy，跳过部署。===== 结束 ====='); return; }

  // 8) 部署
  log('开始部署…');
  const dep = execSync(CONFIG.deployCmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, shell: 'cmd.exe' });
  log('部署输出：' + dep.split('\n').filter(l => /Success|Uploaded|Deployed|error/i.test(l)).slice(-4).join(' | '));

  // 9) 线上校验
  await sleep(4000);
  for (const p of CONFIG.livePaths) {
    try {
      const res = await fetch(CONFIG.siteUrl + p + (p.includes('?') ? '&' : '?') + 't=' + Date.now());
      log('线上 ' + p + '：' + res.status);
    } catch (e) { log('线上 ' + p + ' 校验异常：' + e.message); }
  }
  log('同步完成：新增 ' + toAdd.length + ' 条，当前共 ' + Object.keys(data2).length + ' 条');
  log('===== 结束 =====');
})().catch(e => {
  log('运行异常：' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e));
  log('===== 结束（异常） =====');
  process.exitCode = 1;
});
