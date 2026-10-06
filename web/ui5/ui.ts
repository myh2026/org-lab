// ============================================================================
// web/ui5/ui.ts — ORG Web UI v5（从零重写 · 2026-10-04）
// ----------------------------------------------------------------------------
// 定位：v4 之前的 UI 是在 v2/v3 底座上多轮演进的结果（9543 行、结构层叠）。
// 本文件按「推翻重写」令从零编写：**新设计语言 · 新结构 · 新客户端代码**，
// 服务器层（web/entry.ts 路由/SSE）不动，通过 ORG_WEB_UI=v5 切换渲染。
//
// 设计语言（参考 ui-research.md：codex / dsh / zcode 三源收敛）：
//   · operator's console —— 信息密度优先，chrome 克制（codex）
//   · rail(56) + side(280) + main + statusbar 一条线（dsh 三栏参数）
//   · composer 内联 chip（模式/车道/审批）· 审批 composer 接管（dsh）
//   · 工具/事件行双行内联、可折叠（opencode）
//   · 设计规则即可执行约束（--fs-* 六档；色值仅 token 与契约串）
// 技术纪律：
//   · 单文件、零外链、无第三方依赖；客户端 JS 字符串拼接（无模板串）
//   · 模板字符串内：反引号 \`、美元花括号 \\${ 一律转义；客户端正则反斜杠双写
//   · 契约串（8 项）不在此文件 —— 旧客户端未动，契约由 tests/web.test.ts 继续锁定
// ============================================================================
import { ORG_VERSION as VERSION } from "../../lib/version.ts";

export function renderV5Page(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0c0e">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" href="/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="org">
<title>org · console</title>
<style>
/* ── v5 · tokens ────────────────────────────────────────────────────────── */
:root {
  --bg0:#0b0c0e; --bg1:#101114; --bg2:#15171b; --bg3:#1b1e23;
  --ln:rgba(255,255,255,.07); --ln2:rgba(255,255,255,.13);
  --tx:#e9eaee; --tx2:#a7abb6; --tx3:#6d717c;
  --ac:#6aa9ff; --ac-bg:rgba(106,169,255,.12); --ac-ring:rgba(106,169,255,.35);
  --ok:#3ecf8e; --warn:#e0a83a; --err:#ef6262; --lane-x:#7dd3fc;
  --fs-xs:11px; --fs-sm:11.5px; --fs-base:13px; --fs-md:14.5px; --fs-lg:17px; --fs-xl:22px;
  --sp1:4px; --sp2:8px; --sp3:12px; --sp4:16px; --sp5:24px;
  --r1:6px; --r2:10px; --r3:14px;
  --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Segoe UI","Microsoft YaHei",sans-serif;
  --mono:ui-monospace,"SF Mono","Cascadia Code",Menlo,Consolas,"Noto Sans Mono CJK SC",monospace;
  --ease-out:cubic-bezier(.23,1,.32,1); --ease-drawer:cubic-bezier(.32,.72,0,1);
  --sh:0 0 0 1px rgba(255,255,255,.05),0 18px 44px rgba(0,0,0,.5);
}
* { box-sizing:border-box; margin:0; padding:0; }
html,body { height:100%; }
body { background:var(--bg0); color:var(--tx); font:var(--fs-base)/1.6 var(--sans);
  overflow:hidden; -webkit-font-smoothing:antialiased;
  padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
::selection { background:var(--ac); color:#0b0c0e; }
::-webkit-scrollbar { width:9px; height:9px; }
::-webkit-scrollbar-thumb { background:rgba(255,255,255,.13); border-radius:99px;
  border:3px solid transparent; background-clip:padding-box; }
button { font-family:var(--sans); color:inherit; background:none; border:none;
  cursor:pointer; transition:transform 130ms var(--ease-out),background 130ms var(--ease-out),
  border-color 130ms var(--ease-out),color 130ms var(--ease-out),opacity 130ms var(--ease-out); }
button:active { transform:scale(.97); }
button:disabled { opacity:.45; cursor:not-allowed; }
input,textarea,select { font-family:var(--sans); color:var(--tx); background:none; border:none; outline:none; }
:focus-visible { outline:none; box-shadow:0 0 0 3px var(--ac-ring); border-radius:var(--r1); }
[hidden] { display:none !important; }

/* ── v5 · 布局 ──────────────────────────────────────────────────────────── */
#app { display:grid; grid-template-columns:56px 280px 1fr; grid-template-rows:1fr 28px;
  height:calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)); }
#rail { grid-row:1; grid-column:1; border-right:1px solid var(--ln); background:var(--bg1);
  display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 0; }
#rail .rgrow { flex:1; }
.rb { width:40px; height:40px; border-radius:var(--r2); display:flex; align-items:center;
  justify-content:center; color:var(--tx3); }
.rb:hover { background:var(--bg3); color:var(--tx2); }
.rb.on { background:var(--ac-bg); color:var(--ac); }
.rb svg { width:19px; height:19px; stroke:currentColor; fill:none; stroke-width:1.7;
  stroke-linecap:round; stroke-linejoin:round; }
#side { grid-row:1; grid-column:2; border-right:1px solid var(--ln); background:var(--bg1);
  display:flex; flex-direction:column; min-height:0; }
.sec { display:none; flex-direction:column; min-height:0; flex:1; }
.sec.on { display:flex; }
.shead { display:flex; align-items:center; gap:var(--sp2); padding:10px 12px 6px;
  color:var(--tx3); font:600 var(--fs-xs) var(--sans); text-transform:uppercase;
  letter-spacing:.05em; }
.shead .cnt { margin-left:auto; font:var(--fs-xs) var(--mono); color:var(--tx3); }
.slist { flex:1; overflow-y:auto; padding:2px 6px 10px; min-height:0; }
.sgrp { margin-top:6px; }
.sitem { display:block; width:100%; text-align:left; padding:6px 8px; border-radius:var(--r1);
  color:var(--tx2); font-size:var(--fs-base); white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis; }
.sitem:hover { background:var(--bg3); color:var(--tx); }
.sitem.on { background:var(--ac-bg); color:var(--ac); }
.sitem .sub { color:var(--tx3); font:var(--fs-xs) var(--mono); }
.sitem .bdg { float:right; color:var(--tx3); font-size:var(--fs-xs); }
.sempty { color:var(--tx3); padding:10px 12px; font-size:var(--fs-sm); }
#newAsk { margin:10px 10px 4px; padding:9px 10px; border:1px solid var(--ln2);
  border-radius:var(--r2); color:var(--tx); background:var(--bg2); font-size:var(--fs-base); }
#newAsk:hover { border-color:var(--ac); color:var(--ac); }

/* ── v5 · 主列 ──────────────────────────────────────────────────────────── */
#main { grid-row:1; grid-column:3; display:flex; flex-direction:column; min-width:0; min-height:0;
  background:var(--bg0); }
#top { flex:none; height:44px; display:flex; align-items:center; gap:var(--sp3);
  padding:0 18px; border-bottom:1px solid var(--ln); }
#crumb { color:var(--tx2); font:var(--fs-sm) var(--sans); white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; }
#crumb b { color:var(--tx); font-weight:600; }
#top .grow { flex:1; }
.tbtn { padding:5px 10px; border:1px solid var(--ln); border-radius:var(--r1);
  color:var(--tx2); font-size:var(--fs-sm); }
.tbtn:hover { border-color:var(--ln2); color:var(--tx); }

#stream { flex:1; overflow-y:auto; min-height:0; padding:22px 0 12px; }
.col { width:min(780px,100%); margin:0 auto; padding:0 18px; }
.msg { margin:0 0 16px; }
.msg .who { font:600 var(--fs-xs) var(--sans); color:var(--tx3); text-transform:uppercase;
  letter-spacing:.05em; margin-bottom:4px; }
.msg.user .bubble { background:var(--bg2); border:1px solid var(--ln); border-radius:var(--r3);
  padding:10px 14px; white-space:pre-wrap; }
.msg.agent .md { font-size:var(--fs-md); line-height:1.7; color:var(--tx); }
.md code { font:12px var(--mono); background:var(--bg3); padding:1px 5px; border-radius:4px; }
.md pre { font:12px/1.55 var(--mono); background:var(--bg2); border:1px solid var(--ln);
  border-radius:var(--r2); padding:10px 12px; overflow-x:auto; margin:8px 0; white-space:pre-wrap; }
.md p { margin:6px 0; }
.md b { color:#fff; }

/* 运行卡：operator 式 —— 头部一行 + 事实流 */
.rc { border:1px solid var(--ln); border-radius:var(--r3); background:var(--bg1);
  margin:0 0 16px; overflow:hidden; }
.rc .rhead { display:flex; align-items:center; gap:var(--sp2); padding:9px 13px;
  border-bottom:1px solid var(--ln); color:var(--tx2); font-size:var(--fs-sm); }
.rc .rhead .ttl { color:var(--tx); font-weight:600; white-space:nowrap;
  overflow:hidden; text-overflow:ellipsis; }
.rc .rhead .st { margin-left:auto; font:var(--fs-xs) var(--mono); color:var(--tx3); }
.rc .rbody { padding:6px 0; max-height:340px; overflow-y:auto; }
.fact { display:flex; gap:var(--sp2); padding:3px 13px; font-size:var(--fs-sm);
  color:var(--tx2); line-height:1.5; }
.fact .dot { flex:none; width:14px; text-align:center; color:var(--tx3); font:var(--fs-xs)/1.8 var(--mono); }
.fact.ok .dot, .fact.ok { color:var(--ok); }
.fact.warn .dot, .fact.warn { color:var(--warn); }
.fact.err .dot, .fact.err { color:var(--err); }
.fact.lane .dot, .fact.lane { color:var(--lane-x); }
.fact.dim { color:var(--tx3); }
.fact b { color:var(--tx); font-weight:600; }
.fact code { font:11.5px var(--mono); color:var(--tx2); background:var(--bg3);
  padding:0 4px; border-radius:4px; }
/* v5 · S1：任务行聚合 + 会话工具 + 空态 */
.fact .role { color:var(--tx2); font-style:normal; }
.fact .seg { margin-left:7px; }
.fact .seg.ok { color:var(--ok); }
.fact .seg.warn { color:var(--warn); }
.fact .seg.err { color:var(--err); }
button.mini { font:var(--fs-xs) var(--mono); color:var(--tx3); border:1px solid var(--ln2);
  border-radius:99px; padding:1px 8px; cursor:pointer; background:none; }
button.mini:hover { color:var(--tx); background:var(--bg3); }
/* v5 · S2：工具箱面板（drawer + tool cards + hit rows） */
#drawer { position:fixed; top:0; right:0; bottom:28px; width:clamp(360px,46vw,760px);
  background:var(--bg1); border-left:1px solid var(--ln2); z-index:40; display:flex; flex-direction:column;
  box-shadow:var(--sh); }
#drawer[hidden] { display:none; }
.dw-head { display:flex; align-items:center; gap:var(--sp2); padding:10px 14px; border-bottom:1px solid var(--ln);
  font:600 var(--fs-sm) var(--sans); color:var(--tx); }
.dw-head .grow { flex:1; }
#dwClose { color:var(--tx3); font-size:var(--fs-base); padding:2px 8px; border-radius:var(--r1); }
#dwClose:hover { color:var(--tx); background:var(--bg3); }
#dwBody { flex:1; overflow-y:auto; padding:12px 14px; min-height:0; }
.tool { display:block; width:100%; text-align:left; padding:8px 10px; border:1px solid var(--ln); border-radius:var(--r2);
  margin-bottom:6px; color:var(--tx2); background:var(--bg2); }
.toolf { display:block; width:100%; background:var(--bg2); border:1px solid var(--ln); border-radius:var(--r2);
  padding:6px 9px; color:var(--tx); font:var(--fs-sm) var(--sans); }
.toolf:focus { border-color:var(--ln2); outline:none; }
.tool:hover { border-color:var(--ln2); color:var(--tx); }
.tool b { color:var(--tx); }
.tool .sub { display:block; color:var(--tx3); font-size:var(--fs-xs); margin-top:2px; }
.hit { padding:4px 2px; border-bottom:1px solid var(--ln); font:var(--fs-sm)/1.5 var(--mono); color:var(--tx2); }
.hit .sev-err { color:var(--err); }
.hit .sev-warn { color:var(--warn); }
.hit .f { color:var(--lane-x); }
.dw-meta { color:var(--tx3); font:var(--fs-xs) var(--mono); margin:6px 0 10px; }
.dw-form { display:flex; gap:6px; margin-bottom:10px; }
.dw-form input { flex:1; background:var(--bg2); border:1px solid var(--ln2); border-radius:var(--r2); padding:6px 10px;
  color:var(--tx); font:var(--fs-sm) var(--mono); }
.dw-form button { border:1px solid var(--ln2); border-radius:var(--r2); padding:6px 14px; color:var(--tx); }
.dw-form button:hover { background:var(--bg3); }
.dw-form button.on { background:var(--bg3); color:var(--tx); border-color:var(--ln2); }
.dw-pre { white-space:pre-wrap; word-break:break-all; font:var(--fs-sm)/1.55 var(--mono); color:var(--tx2);
  background:var(--bg2); border:1px solid var(--ln); border-radius:var(--r2); padding:8px 10px;
  max-height:52vh; overflow:auto; margin:0; }
.dw-ta { display:block; width:100%; min-height:110px; background:var(--bg2); border:1px solid var(--ln2);
  border-radius:var(--r2); padding:8px 10px; color:var(--tx); font:var(--fs-sm)/1.5 var(--mono);
  resize:vertical; margin-bottom:8px; }
.dw-form select { background:var(--bg2); border:1px solid var(--ln2); border-radius:var(--r2);
  padding:6px 8px; color:var(--tx); font:var(--fs-sm) var(--mono); }
.dw-form label { color:var(--tx3); font-size:var(--fs-xs); display:inline-flex; align-items:center; gap:3px; }
.dw-form input[type="file"] { flex:1; color:var(--tx3); font:var(--fs-sm) var(--sans); }
#dwBody audio { width:100%; margin-top:8px; border-radius:var(--r2); }
.hit a { color:var(--ac); text-decoration:none; }
.hit a:hover { text-decoration:underline; }
.sitem .stools { float:right; margin-left:4px; }
.sitem .stools button { padding:0 5px; border-radius:var(--r1); color:var(--tx3); font-size:10px; background:none; border:none; cursor:pointer; }
.sitem .stools button:hover { color:var(--err); background:var(--bg3); }
.sitem .stools button[data-a="ren"]:hover { color:var(--ac); }
.empty { max-width:560px; margin:9vh auto 0; padding:0 20px; text-align:center; color:var(--tx3); }
.empty .eh-t { font:600 var(--fs-xl)/1.3 var(--sans); color:var(--tx); letter-spacing:-.01em; }
.empty .eh-s { margin-top:6px; font-size:var(--fs-sm); }
.empty .eh-h { margin:22px 0 8px; font:600 var(--fs-xs) var(--sans); text-transform:uppercase;
  letter-spacing:.06em; color:var(--tx3); }
.empty .eh-runs { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.empty .eh-k { font-size:var(--fs-sm); line-height:1.9; }
.empty .eh-k code { font:11.5px var(--mono); background:var(--bg3); padding:1px 6px; border-radius:4px; color:var(--tx2); }
.rc .rfoot { display:flex; gap:var(--sp3); padding:8px 13px; border-top:1px solid var(--ln);
  color:var(--tx3); font:var(--fs-xs) var(--mono); }
.badge { display:inline-block; padding:1px 7px; border-radius:99px; border:1px solid var(--ln2);
  font:var(--fs-xs) var(--mono); color:var(--tx3); }
.badge.team { color:var(--ac); border-color:rgba(106,169,255,.4); }
.badge.expert { color:var(--lane-x); border-color:rgba(125,211,252,.4); }
.badge.degrade { color:var(--warn); border-color:rgba(224,168,58,.4); }

/* 审批接管条（dsh 式：composer 顶部接管） */
#appr { flex:none; width:min(780px,100%); margin:0 auto; padding:0 18px; }
#appr .bar { display:flex; align-items:center; gap:var(--sp3); border:1px solid rgba(224,168,58,.4);
  background:rgba(224,168,58,.07); border-radius:var(--r2); padding:8px 12px; margin-bottom:8px;
  font-size:var(--fs-sm); }
#appr .bar .txt { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
#appr .bar b { color:var(--warn); }
#appr button { padding:4px 10px; border:1px solid var(--ln2); border-radius:var(--r1); font-size:var(--fs-sm); }
#appr button.ok { color:var(--ok); border-color:rgba(62,207,142,.5); }
#appr button.no { color:var(--err); border-color:rgba(239,98,98,.5); }

/* composer */
#comp { flex:none; width:min(780px,100%); margin:0 auto; padding:4px 18px 12px; }
.cbox { border:1px solid var(--ln2); border-radius:var(--r3); background:var(--bg1);
  transition:border-color 140ms var(--ease-out),box-shadow 140ms var(--ease-out); }
.cbox:focus-within { border-color:var(--ac); box-shadow:0 0 0 3px var(--ac-ring); }
.chips { display:flex; align-items:center; gap:6px; padding:8px 10px 0; flex-wrap:wrap; }
.chip { display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border:1px solid var(--ln);
  border-radius:99px; color:var(--tx2); font-size:var(--fs-sm); background:var(--bg2); }
.chip:hover { border-color:var(--ln2); color:var(--tx); }
.chip .k { color:var(--tx3); }
.chip.hot { color:var(--ac); border-color:rgba(106,169,255,.4); background:var(--ac-bg); }
select.chip { appearance:none; -webkit-appearance:none; padding-right:16px;
  background-image:linear-gradient(45deg,transparent 50%,var(--tx3) 50%),linear-gradient(135deg,var(--tx3) 50%,transparent 50%);
  background-position:calc(100% - 10px) 55%,calc(100% - 6px) 55%; background-size:4px 4px;
  background-repeat:no-repeat; }
select.chip option { background:var(--bg2); color:var(--tx); }
#inp { display:block; width:100%; padding:8px 12px; resize:none; font-size:var(--fs-md);
  line-height:1.6; min-height:44px; max-height:190px; }
.cbot { display:flex; align-items:center; gap:var(--sp3); padding:2px 10px 9px; }
#hint { flex:1; color:var(--tx3); font-size:var(--fs-xs); }
#send { padding:6px 16px; border-radius:var(--r2); background:var(--tx); color:#0b0c0e;
  font-weight:600; font-size:var(--fs-base); }
#send:hover { background:#fff; }
#stop { padding:6px 14px; border-radius:var(--r2); border:1px solid rgba(239,98,98,.5);
  color:var(--err); font-size:var(--fs-base); }

/* statusbar：一行化常显（opencode 式） */
#sb { grid-column:1 / 4; grid-row:2; display:flex; align-items:center; gap:var(--sp3);
  border-top:1px solid var(--ln); background:var(--bg1); padding:0 12px;
  font:var(--fs-xs) var(--mono); color:var(--tx3); }
#sb .brand { color:var(--tx2); font-weight:700; }
#sb .seg { cursor:default; }
#sb .seg.click { cursor:pointer; }
#sb .seg.click:hover { color:var(--tx); }
#sb .grow { flex:1; }
#sb .run { color:var(--ac); } #sb .idle { color:var(--tx3); } #sb .errst { color:var(--err); }

@media (max-width:1023px) {
  #app { grid-template-columns:56px 0 1fr; }
  #side { position:fixed; left:56px; top:0; bottom:28px; width:280px; z-index:20;
    transform:translateX(calc(-100% - 60px)); transition:transform 180ms var(--ease-drawer);
    border-right:1px solid var(--ln2); box-shadow:var(--sh);
    padding-top: env(safe-area-inset-top); }
  #side.open { transform:none; }
  #drawer { width:calc(100vw - 56px); max-width:600px; }
  #top { padding:0 10px; }
  #comp { padding:4px 10px 12px; }
  #appr { padding:0 10px; }
  .col { padding:0 10px; }
}
@media (prefers-reduced-motion:reduce) {
  * { transition:none !important; animation:none !important; }
}
</style>
</head>
<body>
<div id="app">
  <div id="drawer" hidden role="dialog" aria-label="面板">
    <div class="dw-head"><span id="dwTitle"></span><span class="grow"></span><button id="dwClose" title="关闭">✕</button></div>
    <div id="dwBody"></div>
  </div>
  <nav id="rail" aria-label="主导航">
    <button class="rb on" id="rbChat" data-sec="chat" title="对话"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.6 9.6 0 0 1-3.2-.5L4 21l1.7-4.2A8.4 8.4 0 1 1 21 11.5z"/></svg></button>
    <button class="rb" id="rbRuns" data-sec="runs" title="运行"><svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg></button>
    <button class="rb" id="rbTasks" data-sec="tasks" title="任务"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></svg></button>
    <button class="rb" id="rbTools" data-sec="tools" title="工具箱"><svg viewBox="0 0 24 24"><path d="M14.7 6.3a4.2 4.2 0 0 0-5.9 5.9L4 17l3 3 4.8-4.8a4.2 4.2 0 0 0 5.9-5.9l-2.4 2.4-2.1-.6-.6-2.1z"/></svg></button>
    <div class="rgrow"></div>
    <button class="rb" id="rbAbout" title="关于"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg></button>
  </nav>
  <aside id="side">
    <div class="sec on" id="secChat">
      <button id="newAsk">＋ 新会话</button>
      <div class="shead">专家 <span class="cnt" id="cntExp"></span></div>
      <div class="slist" id="lstExp"></div>
      <div class="shead">会话 <span class="cnt" id="cntSes"></span></div>
      <div class="slist" id="lstSes" style="max-height:34%"></div>
    </div>
    <div class="sec" id="secTools">
      <div class="shead">工具箱 <span class="cnt" id="cntTools"></span></div>
      <div style="padding:0 8px 6px"><input id="toolFilter" class="toolf" placeholder="过滤面板（如 扫描 / PDF / 记忆）…" autocomplete="off"></div>
      <div class="slist" id="lstTools"></div>
    </div>
    <div class="sec" id="secRuns">
      <div class="shead">运行产物 <span class="cnt" id="cntRuns"></span></div>
      <div class="slist" id="lstRuns"></div>
    </div>
    <div class="sec" id="secTasks">
      <div class="shead">任务队列 <span class="cnt" id="cntTasks"></span></div>
      <div style="padding:0 8px 4px"><input id="taskNew" class="toolf" placeholder="新任务（回车提交到队列）…" autocomplete="off"></div>
      <div style="padding:0 8px 6px; display:flex; gap:6px; align-items:center">
        <input id="taskPrio" class="toolf" type="number" min="0" max="10" value="5" title="优先级 0-10" style="max-width:70px">
        <button class="mini" id="taskGo">▶ 提交任务</button>
      </div>
      <div class="slist" id="lstTasks"></div>
    </div>
  </aside>
  <main id="main">
    <header id="top">
      <span id="crumb">org · console</span>
      <span class="grow"></span>
      <button class="tbtn" id="btnCost" title="用量/成本">用量</button>
    </header>
    <div id="stream"><div class="col" id="streamCol"></div></div>
    <div id="appr" hidden></div>
    <div id="comp">
      <div class="cbox">
        <div class="chips">
          <button class="chip hot" id="chipMode" title="发送车道：团队=监督回路 / 直连=单专家"><span class="k">模式</span><span id="modeTx">团队</span></button>
          <select class="chip" id="chipLane" title="模型车道"></select>
          <button class="chip" id="chipAppr" title="审批：运行中的高危操作在此放行（文件协议同 CLI）"><span class="k">审批</span><span id="apprTx">常规</span></button>
        </div>
        <textarea id="inp" rows="1" placeholder="输入任务 —— Enter 发送 · Shift+Enter 换行 · Esc 停止"></textarea>
        <div class="cbot">
          <span id="hint"></span>
          <button id="stop" hidden>停止</button>
          <button id="send">发送 ↑</button>
        </div>
      </div>
    </div>
  </main>
  <footer id="sb">
    <span class="brand">org</span>
    <span class="seg click" id="sbCtx" title="上下文水位（点击查看用量时间线）">ctx —</span>
    <span class="seg" id="sbTok">tok 0</span>
    <span class="seg" id="sbMode">团队</span>
    <span class="grow"></span>
    <span class="seg" id="sbLane">lane —</span>
    <span class="seg" id="sbState"><span class="idle">idle</span></span>
  </footer>
</div>
<script>
'use strict';
/* ============================================================================
   v5 客户端 —— 从零编写（无框架 · 字符串拼接 · 零外链）
   API 契约（服务器层未动）：
     GET  /api/status /api/runs /api/sessions?expert= /api/session/<e>/<s>
     GET  /api/providers /api/approvals /api/tasks /api/cost?dir=
     POST /api/run-stream {task,model}   SSE: open→start→card*→done/error
     POST /api/ask-stream {expert,question,session,model} SSE: open→(queued?)→start→stage*→log*→done/error
     POST /api/abort {id?}  POST /api/approvals {id,allow,always}
   ========================================================================== */
var $ = function (id) { return document.getElementById(id); };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
  return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"; }); }
function fmtTok(n) { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : String(n); }
function fmtMs(ms) { ms = Number(ms) || 0; return ms >= 1000 ? (ms / 1000).toFixed(1) + "s" : ms + "ms"; }

var VERSION = "${VERSION}"; /* 服务端注入（单一来源 lib/version.ts）—— 客户端展示用 */
var state = {
  experts: [], usages: [], runs: [], sessions: [], tasks: [],
  currentExpert: null, currentSession: null,
  mode: "team", model: "scripted", running: false, ticketId: 0
};

/* ---- 通用 ---- */
function api(url, body) {
  return fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body) } : undefined).then(function (r) { return r.json(); });
}
function ssePost(url, body, onEvent, onEnd) {
  var doneSeen = false;
  fetch(url, { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify(body) })
    .then(function (r) {
      if (!r.ok) {
        return r.json().then(function (e) { throw new Error(e && e.error ? e.error : "HTTP " + r.status); },
          function () { throw new Error("HTTP " + r.status); });
      }
      var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
      function pump() {
        return reader.read().then(function (chunk) {
          if (chunk.done) { if (onEnd) onEnd(doneSeen); return; }
          buf += dec.decode(chunk.value, { stream: true });
          var idx;
          while ((idx = buf.indexOf("\\n\\n")) >= 0) {
            var frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
            var ev = "", data = null;
            frame.split("\\n").forEach(function (l) {
              if (l.indexOf("event:") === 0) ev = l.slice(6).trim();
              else if (l.indexOf("data:") === 0) {
                try { data = JSON.parse(l.slice(5).trim()); } catch (e) { data = null; }
              }
            });
            if (ev === "done") doneSeen = true;
            onEvent(ev, data);
          }
          return pump();
        });
      }
      return pump();
    })
    .catch(function (e) { onEvent("error", { message: String(e && e.message || e) }); if (onEnd) onEnd(doneSeen); });
}

/* ---- 迷你 markdown（段落/粗体/行内码/围栏码块/换行） ---- */
function mdToHtml(src) {
  var out = [], lines = String(src || "").split("\\n"), i = 0;
  function inline(s) {
    s = esc(s);
    s = s.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
    s = s.replace(/\\*\\*([^*]+)\\*\\*/g, "<b>$1</b>");
    return s;
  }
  while (i < lines.length) {
    var l = lines[i];
    if (l.indexOf("\`\`\`") === 0) {
      var body = []; i++;
      while (i < lines.length && lines[i].indexOf("\`\`\`") !== 0) { body.push(lines[i]); i++; }
      i++;
      out.push("<pre>" + esc(body.join("\\n")) + "</pre>");
      continue;
    }
    if (l.trim().length === 0) { i++; continue; }
    var para = [l]; i++;
    while (i < lines.length && lines[i].trim().length > 0 && lines[i].indexOf("\`\`\`") !== 0) {
      para.push(lines[i]); i++;
    }
    out.push("<p>" + para.map(inline).join("<br>") + "</p>");
  }
  return out.join("");
}

/* ---- 事实字典（RunFact.t → 一行渲染） ---- */
function factLine(f) {
  if (!f || !f.t) return null;
  var t = f.t;
  if (t === "mission") return { c: "dim", h: "使命 <b>" + esc(f.mission) + "</b>" };
  if (t === "runStart") return { c: "dim", h: "入口 <code>" + esc(f.entry) + "</code> · 模型 <code>" + esc(f.model) + "</code>" };
  if (t === "route") return { c: "", h: "task#" + f.id + " " + esc(f.role) + " → <code>" + esc(f.route) + ":" + esc(f.channel) + "</code>" };
  if (t === "dispatch") return { c: "", h: "task#" + f.id + " 派单 · " + esc(f.detail) };
  if (t === "review") return { c: f.verdict === "Accept" ? "ok" : (f.verdict === "Revise" ? "warn" : "err"),
    h: "task#" + f.id + " 审查 <b>" + esc(f.verdict) + "</b>" + (f.coverage != null ? " · coverage " + Number(f.coverage).toFixed(2) : "") };
  if (t === "revision") return { c: "warn", h: "task#" + f.id + " 返工 #" + f.attempt + " · " + esc(String(f.remedy || "").slice(0, 120)) };
  if (t === "reroute") return { c: "warn", h: "task#" + f.id + " 重派 · " + esc(f.detail) };
  if (t === "mint") return { c: "ok", h: "铸造专家 <b>" + esc(f.name) + "</b>@" + esc(f.version) + " · eval " + esc(f.eval) };
  if (t === "patch") return { c: "", h: "补丁 · " + esc(f.detail) };
  if (t === "asset") return { c: "ok", h: "资产 <b>" + esc(f.label) + "</b>" };
  if (t === "ctx") return { c: "dim", h: "ctx " + esc(f.expert) + "/" + esc(f.session) + " 轮" + f.turn + " · " + fmtTok(f.ctx) + "/" + fmtTok(f.window) };
  if (t === "drift") return { c: f.alerts > 0 ? "warn" : "dim", h: "评分卡漂移告警 " + f.alerts + (f.detail ? " · " + esc(f.detail) : "") };
  if (t === "mined") return { c: "dim", h: "journal→fixture 基准题 " + f.entries + " 条 · 轨道 " + f.tracks };
  if (t === "crystal") return { c: "dim", h: "固化 " + esc(f.node) + (f.frozen ? "（冻结）" : "（命中 " + esc(f.input) + "）") };
  if (t === "capability") return f.granted ? { c: "dim", h: "能力放行 <code>" + esc(f.capability) + "</code>（" + esc(f.mode) + "）" } : { c: "warn", h: "能力缺席 <code>" + esc(f.capability) + "</code>" };
  if (t === "score") return { c: "dim", h: "评分 " + esc(f.axis) + " · " + esc(f.kind) + " = " + Number(f.value).toFixed(2) };
  if (t === "shadow") return { c: f.agree ? "dim" : "warn", h: "影子对拍 " + esc(f.expert) + "（" + esc(f.candidate) + " vs " + esc(f.baseline) + "）" + (f.agree ? " 一致" : " 分歧") };
  if (t === "notice") return { c: f.tone === "err" ? "err" : (f.tone === "warn" ? "warn" : (f.tone === "ok" ? "ok" : "dim")), h: esc(f.text) };
  if (t === "approval") return { c: "warn", h: "待批准 ⚠ <code>" + esc(f.capability) + "</code> · " + esc(f.action) };
  if (t === "rescue") return { c: f.mode === "degrade" ? "warn" : "lane",
    h: f.mode === "reroute" ? "跨车道救援 → 直连 <b>" + esc(f.expert) + "</b>（评分 " + Number(f.score).toFixed(2) + "）" : "域外任务 · 零消耗降级（重合 " + Number(f.stockScore).toFixed(2) + "）" };
  if (t === "laneDecision") return { c: "lane", h: "判定 <span class='badge " + esc(f.mode) + "'>" + (f.mode === "team" ? "团队直入" : f.mode === "expert" ? "跨车道救援" : "零消耗降级") + "</span> " + esc(String(f.because || "").slice(0, 120)) };
  if (t === "runEnd") return { c: f.ok ? "ok" : "err", h: "运行结束 · ok=" + f.ok + " · " + fmtMs(f.elapsed_ms) };
  if (t === "run_result") return { c: "", h: "运行结果已归集" };
  if (t === "result") return { c: "", h: "汇总完成" };
  if (t === "audio" && f.files && f.files.length) return { c: "ok", h: "音频产物 " + f.files.length + " 件（" + esc(f.files[0].title || "") + "…）" };
  if (t === "clarify") return { c: "dim", h: "澄清 · " + esc(f.q) };
  if (t === "answer") return { c: "dim", h: "回答 · " + esc(String(f.a || "").slice(0, 140)) };
  if (t === "other") return { c: "dim", h: esc(f.name) + " " + esc(f.action) + " · " + esc(String(f.detail || "").slice(0, 120)) };
  if (t === "node") return null; /* 图节点噪声：v1 不渲染 */
  return { c: "dim", h: esc(String(t)) };
}

/* ---- 流渲染 ---- */
var streamEl = $("stream"), streamCol = $("streamCol");
function down(force) {
  var near = streamEl.scrollTop + streamEl.clientHeight > streamEl.scrollHeight - 120;
  if (force || near) streamEl.scrollTop = streamEl.scrollHeight;
}
function clearStream() { streamCol.innerHTML = ""; }
function killHero() { var h = document.getElementById("emptyHero"); if (h) h.remove(); }
function pushMsg(role, inner) {
  killHero();
  var m = document.createElement("div");
  m.className = "msg " + role;
  var who = document.createElement("div");
  who.className = "who";
  who.textContent = role === "user" ? "你" : role === "agent" ? "org" : role;
  var body = document.createElement("div");
  body.className = role === "user" ? "bubble" : "md";
  if (role === "user") body.textContent = inner; else body.innerHTML = inner;
  m.appendChild(who); m.appendChild(body);
  streamCol.appendChild(m); down(false);
  return m;
}
function pushUser(t) { return pushMsg("user", t); }
function pushAgentMd(md) { return pushMsg("agent", mdToHtml(md)); }
function newCard(title) {
  killHero();
  var el = document.createElement("div");
  el.className = "rc";
  el.innerHTML = '<div class="rhead"><span class="ttl">' + esc(title) + '</span><span class="st"></span></div>' +
    '<div class="rbody"></div><div class="rfoot" hidden></div>';
  streamCol.appendChild(el);
  return { el: el, st: el.querySelector(".st"), body: el.querySelector(".rbody"), foot: el.querySelector(".rfoot") };
}
function cardSt(card, text) { card.st.textContent = text; }
function cardFoot(card, text) { card.foot.hidden = false; card.foot.textContent = text; }
/* v5 · S1：任务事实 → 聚合成一行（route/dispatch/review/revision/reroute 按 task# 归组） */
function taskSeg(f) {
  if (f.t === "route") return { c: "", s: "→ " + esc(f.route) + ":" + esc(f.channel) };
  if (f.t === "dispatch") return { c: "", s: "派单 " + esc(short(f.detail, 44)) };
  if (f.t === "review") return { c: f.verdict === "Accept" ? "ok" : (f.verdict === "Revise" ? "warn" : "err"),
    s: esc(f.verdict) + (f.coverage != null ? " " + Number(f.coverage).toFixed(2) : "") };
  if (f.t === "revision") return { c: "warn", s: "返工#" + f.attempt };
  if (f.t === "reroute") return { c: "warn", s: "重派" };
  return null;
}
function appendFact(card, fact) {
  if (!fact || !fact.t) return;
  killHero();
  var seg = taskSeg(fact);
  if (seg && typeof fact.id === "number") {
    card.tasks = card.tasks || {};
    var row = card.tasks[fact.id];
    if (!row) {
      row = document.createElement("div");
      row.className = "fact task";
      row.innerHTML = '<span class="dot">·</span><span><b>task#' + fact.id +
        '</b> <em class="role"></em></span><span class="segs"></span>';
      card.body.appendChild(row);
      card.tasks[fact.id] = row;
    }
    if (fact.role) row.querySelector(".role").textContent = fact.role;
    var sp = document.createElement("span");
    sp.className = "seg" + (seg.c ? " " + seg.c : "");
    sp.innerHTML = seg.s;
    row.querySelector(".segs").appendChild(sp);
    down(false);
    return;
  }
  var line = factLine(fact);
  if (!line) return;
  var row2 = document.createElement("div");
  row2.className = "fact" + (line.c ? " " + line.c : "");
  row2.innerHTML = '<span class="dot">·</span><span>' + line.h + "</span>";
  card.body.appendChild(row2); down(false);
}
function short(s, n) { s = String(s || ""); return s.length > (n || 56) ? s.slice(0, n || 56) + "…" : s; }

/* ---- 侧栏渲染 ---- */
function renderExperts() {
  var el = $("lstExp"); el.innerHTML = "";
  $("cntExp").textContent = String(state.experts.length);
  if (!state.experts.length) { el.innerHTML = '<div class="sempty">注册表为空</div>'; return; }
  state.experts.forEach(function (e) {
    var b = document.createElement("button");
    b.className = "sitem" + (state.currentExpert === e.name ? " on" : "");
    b.innerHTML = esc(e.name) + '<span class="bdg">@' + esc(e.version || "") + (e.retained ? " ★" : "") +
      '</span><br><span class="sub">' + esc(short(e.description || "", 42)) + "</span>";
    b.onclick = function () { selectExpert(e.name); };
    el.appendChild(b);
  });
}
function apiSend(method, url, body) {
  return fetch(url, { method: method, headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined }).then(function (r) { return r.json(); });
}
function renderSessions() {
  var el = $("lstSes"); el.innerHTML = "";
  $("cntSes").textContent = String(state.sessions.length);
  if (!state.sessions.length) { el.innerHTML = '<div class="sempty">该专家暂无会话</div>'; return; }
  state.sessions.forEach(function (s) {
    var name = s.name || s.session || "?";
    var b = document.createElement("div");
    b.className = "sitem" + (state.currentSession === name ? " on" : "");
    b.setAttribute("role", "button");
    b.innerHTML = '<span class="stools">' +
      '<button class="mini" data-a="ren" title="重命名">✎</button>' +
      '<button class="mini" data-a="del" title="删除">✕</button></span>' +
      '<span class="bdg">' + (s.turns != null ? s.turns + " 轮" : "") + "</span>" + esc(name);
    b.onclick = function (ev) {
      var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
      if (a === "ren") { renameSession(name); return; }
      if (a === "del") { deleteSession(name, ev.target); return; }
      openSession(name);
    };
    el.appendChild(b);
  });
}
function renameSession(name) {
  var to = prompt("重命名为：", name);
  if (!to || to === name) return;
  apiSend("PATCH", "/api/session/" + encodeURIComponent(state.currentExpert) + "/" + encodeURIComponent(name), { to: to })
    .then(function (r) {
      if (r && r.ok === false) { hint("重命名失败：" + (r.error || "?")); return; }
      if (state.currentSession === name) state.currentSession = to;
      hint("已重命名 → " + to); loadSessions();
    }).catch(function () { hint("重命名失败（网络）"); });
}
var pendingDel = { name: null, until: 0 };
function deleteSession(name, btn) {
  // 两击确认（嵌入式 webview 的 confirm() 不可靠，S1 改为就地确认）
  var now = Date.now();
  if (pendingDel.name === name && now < pendingDel.until) {
    pendingDel = { name: null, until: 0 };
    if (btn) btn.textContent = "✕";
    apiSend("DELETE", "/api/session/" + encodeURIComponent(state.currentExpert) + "/" + encodeURIComponent(name))
      .then(function (r) {
        if (r && r.ok === false) { hint("删除失败：" + (r.error || "?")); return; }
        if (state.currentSession === name) { state.currentSession = null; crumb(); }
        hint("已删除 " + name); loadSessions();
      }).catch(function () { hint("删除失败（网络）"); });
    return;
  }
  pendingDel = { name: name, until: now + 4000 };
  if (btn) { btn.textContent = "确认?"; btn.style.color = "var(--err)"; }
  hint("再点一次「确认?」删除 " + name + "（4 秒内）");
  setTimeout(function () {
    if (pendingDel.name === name && btn) { btn.textContent = "✕"; btn.style.color = ""; }
  }, 4200);
}
function selectExpert(name) {
  if (isNarrow()) closeSide();
  state.currentExpert = name; state.currentSession = null;
  renderExperts(); loadSessions(); crumb();
}
function openSession(sess) {
  if (isNarrow()) closeSide();
  if (!state.currentExpert) return;
  state.currentSession = sess; renderSessions(); crumb();
  api("/api/session/" + encodeURIComponent(state.currentExpert) + "/" + encodeURIComponent(sess))
    .then(function (r) {
      clearStream();
      var turns = (r && r.turns) || [];
      turns.forEach(function (t) {
        if (t.question) pushUser(t.question);
        if (t.answer) pushAgentMd(t.answer);
      });
      if (!turns.length) renderEmpty();
    });
}
function crumb() {
  $("crumb").innerHTML = "<b>" + esc(state.currentExpert || "未选专家") + "</b>" +
    (state.currentSession ? ' <span class="sub">· ' + esc(state.currentSession) + "</span>" : " · 新会话") +
    " · " + (state.mode === "team" ? "团队" : "直连");
}
/* v5 · S1：空态（品牌 + 最近运行 + 快捷键）—— 流区无内容时展示 */
function renderEmpty() {
  if (document.getElementById("emptyHero")) return;
  if (streamCol.children.length) return;
  var d = document.createElement("div");
  d.className = "empty"; d.id = "emptyHero";
  d.innerHTML = '<div class="eh-t">org · console</div>' +
    '<div class="eh-s">v' + VERSION + ' · 团队模式：直接输入任务派单 · 直连模式：先在左栏选专家</div>' +
    '<div class="eh-h">最近运行</div><div class="eh-runs" id="ehRuns"></div>' +
    '<div class="eh-h">快捷键</div><div class="eh-k"><code>Enter</code> 发送 · ' +
    '<code>Shift+Enter</code> 换行 · <code>Esc</code> 停止运行</div>';
  streamCol.appendChild(d);
  var box = $("ehRuns");
  state.runs.slice(0, 4).forEach(function (r) {
    var b = document.createElement("button");
    b.className = "mini";
    b.textContent = (r.name || r.dir || "?") + (r.elapsed_ms != null ? " · " + fmtMs(r.elapsed_ms) : "");
    b.onclick = function () { replayRun(r.name || r.dir); };
    box.appendChild(b);
  });
  if (!state.runs.length) box.innerHTML = '<span class="sub">暂无运行 —— 输入任务开跑第一轮</span>';
}
function renderRuns() {
  var el = $("lstRuns"); el.innerHTML = "";
  $("cntRuns").textContent = String(state.runs.length);
  state.runs.forEach(function (r) {
    var b = document.createElement("button");
    b.className = "sitem";
    b.innerHTML = esc(r.name || r.dir || "?") + '<span class="bdg">' + (r.elapsed_ms != null ? fmtMs(r.elapsed_ms) : "") + "</span>";
    b.onclick = function () { replayRun(r.name || r.dir); };
    el.appendChild(b);
  });
  if (!state.runs.length) el.innerHTML = '<div class="sempty">暂无运行产物</div>';
}
function replayRun(dir) {
  api("/api/run?dir=" + encodeURIComponent(dir)).then(function (r) {
    clearStream();
    var card = newCard("运行回放 · " + dir);
    var rj = (r && r.run) || {};
    if (rj.task) appendFact(card, { t: "mission", mission: rj.task });
    if (rj.ok != null) appendFact(card, { t: "runEnd", ok: rj.ok, elapsed_ms: rj.elapsed_ms || 0 });
    var rep = (r && r.report) ? String(r.report) : "";
    if (rep) pushAgentMd(rep);
    cardSt(card, "回放");
  });
}
function renderTasks() {
  api("/api/tasks").then(function (r) {
    var list = (r && r.tasks) || [];
    state.tasks = list;
    var el = $("lstTasks"); el.innerHTML = "";
    $("cntTasks").textContent = String(list.length);
    list.forEach(function (t) {
      var b = document.createElement("div");
      b.className = "sitem";
      var st = t.status || t.state || "";
      var goal = (t.spec && t.spec.task) || t.goal || t.id || "?";
      var acts = [];
      if (st === "running") { acts = [["pause", "⏸"], ["cancel", "✕"]]; }
      else if (st === "paused") { acts = [["resume", "▶"], ["cancel", "✕"]]; }
      else if (st === "queued") { acts = [["cancel", "✕"]]; }
      else if (st === "failed" || st === "cancelled") { acts = [["retry", "↻"]]; }
      var btns = "";
      acts.forEach(function (a) {
        btns += '<button class="mini" data-tid="' + esc(String(t.id)) + '" data-act="' + a[0] + '" title="' + a[0] + '">' + a[1] + "</button>";
      });
      b.innerHTML = '<span class="stools">' + btns + '</span><span class="bdg">' + esc(st) +
        (t.priority != null && t.priority !== 5 ? " ·P" + t.priority : "") + "</span>" +
        esc(short(goal, 40));
      var bts = b.querySelectorAll("button[data-act]");
      for (var i = 0; i < bts.length; i++) {
        bts[i].onclick = (function (btn) {
          return function (ev) {
            ev.stopPropagation();
            taskAction(btn.getAttribute("data-tid"), btn.getAttribute("data-act"), btn);
          };
        })(bts[i]);
      }
      el.appendChild(b);
    });
    if (!list.length) el.innerHTML = '<div class="sempty">任务队列为空 —— 上方输入新任务提交</div>';
  });
}
function taskAction(id, action, btn) {
  if (btn) { btn.textContent = "…"; }
  apiSend("POST", "/api/task/" + encodeURIComponent(id), { action: action }).then(function (r) {
    if (r && r.ok === false) { hint("操作失败：" + (r.error || "?")); }
    else { hint("已 " + action + " · " + id); }
    renderTasks();
  }).catch(function () { hint("操作失败（网络）"); renderTasks(); });
}
function submitTaskNow() {
  var text = $("taskNew").value.trim();
  if (!text) { hint("先输入任务内容"); return; }
  var prio = Number($("taskPrio").value);
  api("/api/task/submit", { kind: "run", task: text, priority: (isNaN(prio) ? 5 : prio), model: state.model })
    .then(function (r) {
      if (!r || r.ok === false) { hint("提交失败：" + ((r && r.error) || "?")); return; }
      $("taskNew").value = "";
      hint("已提交 " + ((r.task && r.task.id) || "") + "（队列）");
      renderTasks();
    }).catch(function () { hint("提交失败（网络）"); });
}

/* ---- statusbar ---- */
function renderSb() {
  var ctx = 0, win = 0, billed = 0;
  state.usages.forEach(function (u) {
    ctx += u.context || 0; win += u.window || 0; billed += u.billed || 0;
  });
  $("sbCtx").textContent = "ctx " + (win > 0 ? Math.round(ctx / win * 100) + "%" : "—");
  $("sbTok").textContent = "tok " + fmtTok(billed);
  $("sbMode").textContent = state.mode === "team" ? "团队" : "直连";
  $("sbLane").textContent = "lane " + state.model;
  $("sbState").innerHTML = state.running ? '<span class="run">running</span>' : '<span class="idle">idle</span>';
}

/* ---- 用量卡 ---- */
function showCost() {
  var dir = state.runs.length ? (state.runs[0].name || state.runs[0].dir) : "";
  if (!dir) { hint("暂无运行 —— 先跑一轮再看用量"); return; }
  api("/api/cost?dir=" + encodeURIComponent(dir)).then(function (r) {
    clearStream();
    var card = newCard("用量时间线 · " + dir);
    var calls = (r && r.calls) || [];
    if (r && r.summary) cardFoot(card, String(r.summary).replace(/\\n/g, " · ").slice(0, 200));
    calls.slice(0, 40).forEach(function (c) {
      appendFact(card, { t: "ctx", expert: c.track || "?", session: String(c.chars || 0) + " 字", turn: c.tokens != null ? c.tokens : 0, ctx: c.tokens || 0, window: 0 });
    });
    if (!calls.length) appendFact(card, { t: "notice", tone: "info", text: "本次运行没有模型调用记录（scripted 剧本车道不经过网关）" });
  });
}

/* ---- 审批 ---- */
function refreshApprovals() {
  api("/api/approvals").then(function (r) {
    var pend = (r && r.pending) || [];
    var box = $("appr");
    $("apprTx").textContent = pend.length ? "待批 " + pend.length : "常规";
    $("chipAppr").className = "chip" + (pend.length ? " hot" : "");
    if (!pend.length) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = "";
    pend.forEach(function (p) {
      var d = document.createElement("div"); d.className = "bar";
      d.innerHTML = "<span>⚠ 请求 <b>" + esc(p.capability) + "</b> · " + esc(short(p.action || p.detail || "", 80)) +
        "</span><span class='grow'></span>";
      var b1 = document.createElement("button"); b1.className = "ok"; b1.textContent = "允许一次";
      b1.onclick = function () { decideApproval(p.id, true, false); };
      var b2 = document.createElement("button"); b2.textContent = "本会话允许";
      b2.onclick = function () { decideApproval(p.id, true, true); };
      var b3 = document.createElement("button"); b3.className = "no"; b3.textContent = "拒绝";
      b3.onclick = function () { decideApproval(p.id, false, false); };
      d.appendChild(b1); d.appendChild(b2); d.appendChild(b3);
      box.appendChild(d);
    });
  }).catch(function () { /* 服务离线：静默 */ });
}
function decideApproval(id, allow, always) {
  api("/api/approvals", { id: id, allow: allow, always: always }).then(function () {
    hint(allow ? "已放行 " + id : "已拒绝 " + id);
    refreshApprovals();
  });
}

/* ---- 发送流 ---- */
function setRunning(on) {
  state.running = on;
  $("send").hidden = on; $("stop").hidden = !on; $("inp").disabled = false;
  renderSb();
}
function startTeam(task) {
  pushUser(task);
  var card = newCard("监督回路 · " + short(task, 40));
  cardSt(card, "启动…");
  state.teamCard = card;
  ssePost("/api/run-stream", { task: task, model: state.model }, function (ev, d) {
    if (ev === "open") { state.ticketId = (d && d.ticketId) || 0;
      if (d && d.queued) cardSt(card, "排队中（前一轮运行中）· Esc 可取消"); }
    else if (ev === "start") cardSt(card, "运行中…");
    else if (ev === "card") appendFact(card, d && d.fact);
    else if (ev === "done") {
      cardSt(card, d && d.ok === false ? "异常结束" : "完成");
      if (d) cardFoot(card, "ok=" + (d.ok === false ? "false" : "true") + (d.outDir ? " · " + d.outDir : ""));
      if (d && d.outDir) {
        var dirName = String(d.outDir).split("/").filter(Boolean).pop();
        var rb = document.createElement("button");
        rb.className = "mini"; rb.textContent = "查看回放";
        rb.onclick = function () { replayRun(dirName); };
        card.foot.appendChild(rb);
      }
      loadRuns(); loadStatus();
    } else if (ev === "error") {
      cardSt(card, "失败");
      appendFact(card, { t: "notice", tone: "err", text: (d && d.message) || "引擎失败" });
    }
  }, function (doneSeen) {
    if (!doneSeen) appendFact(card, { t: "notice", tone: "warn", text: "SSE 连接中断（未收到 done）" });
    setRunning(false);
  });
}
function startDirect(q) {
  if (!state.currentExpert) { hint("请先在左栏选择专家（直连模式）"); return; }
  pushUser(q);
  var card = newCard("直连 · " + state.currentExpert);
  cardSt(card, "启动…");
  ssePost("/api/ask-stream", { expert: state.currentExpert, question: q,
    session: state.currentSession || undefined, model: state.model }, function (ev, d) {
    if (ev === "open") { state.ticketId = (d && d.ticketId) || 0; }
    else if (ev === "start") cardSt(card, "生成中…");
    else if (ev === "stage") { if (d && (d.stage || d.text)) cardSt(card, String(d.stage || d.text)); }
    else if (ev === "log") { appendFact(card, { t: "notice", tone: "info", text: String((d && (d.line || d.text)) || "").slice(0, 160) }); }
    else if (ev === "done") {
      cardSt(card, "完成");
      var ans = d && (d.answer != null ? d.answer : "");
      if (ans) pushAgentMd(String(ans));
      if (d) cardFoot(card, (d.tokens != null ? "tokens " + d.tokens + " · " : "") + (d.durationMs != null ? fmtMs(d.durationMs) : ""));
    } else if (ev === "error") {
      cardSt(card, "失败");
      appendFact(card, { t: "notice", tone: "err", text: (d && d.message) || "生成失败" });
    }
  }, function (doneSeen) {
    if (!doneSeen) appendFact(card, { t: "notice", tone: "warn", text: "SSE 连接中断（未收到 done）" });
    setRunning(false); loadStatus();
  });
}
function send() {
  var text = $("inp").value.trim();
  if (!text || state.running) return;
  $("inp").value = ""; autoGrow();
  setRunning(true);
  if (state.mode === "team") startTeam(text); else startDirect(text);
}
function abortRun() {
  api("/api/abort", state.ticketId ? { id: state.ticketId } : {}).then(function () { hint("已请求停止"); });
}
function hint(t) { $("hint").textContent = t || ""; }
function autoGrow() {
  var el = $("inp"); el.style.height = "auto";
  el.style.height = Math.min(190, Math.max(44, el.scrollHeight)) + "px";
}

/* ---- rail / about ---- */
/* v5 · 移动/平板断点（<1024）：侧栏抽屉化 —— rail 再点当前区切换开合 */
function isNarrow() { return !!(window.matchMedia && window.matchMedia("(max-width:1023px)").matches); }
function closeSide() { var side = $("side"); if (side) side.classList.remove("open"); }
function railTap(sec) {
  if (isNarrow() && state.sec === sec && $("side").classList.contains("open")) { closeSide(); return; }
  switchSec(sec);
  if (isNarrow()) $("side").classList.add("open");
}
function switchSec(sec) {
  ["chat", "runs", "tasks", "tools"].forEach(function (s) {
    $("sec" + s.charAt(0).toUpperCase() + s.slice(1)).className = "sec" + (s === sec ? " on" : "");
  });
  ["rbChat", "rbRuns", "rbTasks", "rbTools"].forEach(function (id) {
    $(id).className = "rb" + (id === "rb" + sec.charAt(0).toUpperCase() + sec.slice(1) ? " on" : "");
  });
  state.sec = sec;
  if (sec === "runs") renderRuns();
  if (sec === "tasks") renderTasks();
  if (sec === "tools") renderTools();
}
function showAbout() {
  clearStream();
  var card = newCard("关于 org");
  appendFact(card, { t: "notice", tone: "ok", text: "v" + VERSION + " · Organization Harness · HSL BNF v1.5.0 · 单文件分发（零外链）" });
  appendFact(card, { t: "notice", tone: "info", text: "v5 全新 UI（从零重写）：rail+三栏 · composer 内联 chip · 审批接管 · 一行状态栏" });
  appendFact(card, { t: "notice", tone: "info", text: "更新要点见 CHANGELOG；设计约束：check-ui-tokens（--fs-* 六档 / 色值 token 化）" });
  cardSt(card, "v" + VERSION);
}

/* ---- v5 · S2：工具箱面板框架 + 首批面板 ---- */
var TOOLS = [
  { id: "scan", name: "密钥扫描", sub: "scanSecrets —— 工作区敏感信息扫描（只读）", run: "scanPanel" },
  { id: "symbols", name: "符号索引", sub: "indexSymbols/lookupDef —— 按名查找定义与引用", run: "symbolsPanel" },
  { id: "sbom", name: "软件物料清单", sub: "buildSbom —— SPDX-2.3 组件清单（只读）", run: "sbomPanel" },
  { id: "db", name: "DB 探针", sub: "dbSchema/db-query —— SQLite 表结构与只读查询", run: "dbPanel" },
  { id: "diff", name: "Diff 查看", sub: "diffFiles —— 工作区双文件差异（只读）", run: "diffPanel" },
  { id: "pdf", name: "PDF 阅读", sub: "readPdf —— PDF 文本提取（三层降级链）", run: "pdfPanel" },
  { id: "mcp", name: "MCP 桥", sub: "服务档案 / 工具 / 资源 / 提示词 / 自检（只读面）", run: "mcpPanel" },
  { id: "sast", name: "SAST 扫描", sub: "scanSast —— 多引擎静态安全扫描（ruff→bandit→内置）", run: "sastPanel" },
  { id: "iac", name: "IaC 扫描", sub: "scanIac —— 基础设施即代码检查（HCL/YAML…）", run: "iacPanel" },
  { id: "git", name: "Git 状态", sub: "gitMergeState —— 分支 / 领先落后 / 工作树（只读）", run: "gitPanel" },
  { id: "deps", name: "依赖探测", sub: "probeDepsTools/parseDepsManifest —— 七工具 + 清单摘要", run: "depsPanel" },
  { id: "debug", name: "堆栈分析", sub: "analyzeStackTrace —— 粘贴崩溃文本 → 帧与根因提示", run: "debugPanel" },
  { id: "cloud", name: "云工具链", sub: "cloudProbeAll —— docker / ssh / k8s / terraform 探测", run: "cloudPanel" },
  { id: "retest", name: "重测台账", sub: "retestPlan/flakySummary —— 选择性重跑计划 + flaky 观测", run: "retestPanel" },
  { id: "spawns", name: "派生池", sub: "spawn/pool.json 观测面 —— 子智能体树与统计（含挂孙）", run: "spawnsPanel" },
  { id: "review", name: "审查人推荐", sub: "recommendReviewers —— 按改动文件推荐审查人", run: "reviewPanel" },
  { id: "tracker", name: "工单台账", sub: "issueList —— GitHub issue 只读列取（token 已配）", run: "trackerPanel" },
  { id: "providers", name: "车道与服务", sub: "providerRows/lanes —— 车道表 + 连通测试 + env 发现", run: "providersPanel" },
  { id: "audio", name: "音频工坊", sub: "audioCompose —— 确定性作曲（零模型调用 → 可播放）", run: "audioPanel" },
  { id: "search", name: "语义检索", sub: "semanticSearch —— 工作区语义检索（hits/score/摘要）", run: "searchPanel" },
  { id: "memory", name: "专家记忆", sub: "allMemories —— 运行时记忆库（按专家分组）", run: "memoryPanel" },
  { id: "sched", name: "定时任务", sub: "listSchedules/previewNext —— 计划清单 + cron 预览", run: "schedPanel" },
  { id: "notify", name: "通知中心", sub: "readNotifications —— 未读/全量 + 一键已读", run: "notifyPanel" },
  { id: "collab", name: "协作空间", sub: "collabSummary/threads/feed —— 多人协作线程与动态", run: "collabPanel" },
  { id: "vision", name: "视觉分析", sub: "analyzeImages —— 选图 → 描述/问答（VLM）", run: "visionPanel" },
  { id: "voice", name: "语音工坊", sub: "transcribeAudio / synthesizeSpeech —— 转写 + 朗读", run: "voicePanel" },
  { id: "mobile", name: "移动端", sub: "probeMobile/mobileDevices —— 工具探测 + 设备清单", run: "mobilePanel" },
  { id: "remote", name: "远程 Agent", sub: "probeRemote/remoteHosts —— ssh 工具链 + 主机档案", run: "remotePanel" },
  { id: "plugins", name: "插件", sub: "pluginList —— .org/plugins 清单（只读面）", run: "pluginsPanel" },
  { id: "rbac", name: "RBAC", sub: "loadRbac —— 角色与动作矩阵（只读面）", run: "rbacPanel" },
  { id: "engines", name: "浏览器引擎", sub: "browserEngines —— agent-browser/chromium/chrome 探测", run: "enginesPanel" },
  { id: "snapshot", name: "网页快照", sub: "browserSnapshot —— 输入 URL → 标题/正文/链接（真浏览器）", run: "snapshotPanel" },
];
function renderTools() {
  var el = $("lstTools"); el.innerHTML = "";
  var q = ($("toolFilter").value || "").trim().toLowerCase();
  var list = q ? TOOLS.filter(function (t) {
    return (t.name + " " + t.id + " " + t.sub).toLowerCase().indexOf(q) >= 0;
  }) : TOOLS;
  $("cntTools").textContent = q ? list.length + "/" + TOOLS.length : String(TOOLS.length);
  list.forEach(function (t) {
    var b = document.createElement("button");
    b.className = "tool";
    b.innerHTML = "<b>" + esc(t.name) + "</b><span class='sub'>" + esc(t.sub) + "</span>";
    b.onclick = function () { openDrawer(t.name); window[t.run](); };
    el.appendChild(b);
  });
  var note = document.createElement("div");
  note.className = "dw-meta";
  note.textContent = "更多面板（collab / vision / voice…）S2 续批迁移";
  el.appendChild(note);
}
function openDrawer(title) {
  $("dwTitle").textContent = title;
  $("dwBody").innerHTML = "";
  $("drawer").hidden = false;
}
function closeDrawer() { $("drawer").hidden = true; }
function scanPanel() {
  var body = $("dwBody");
  body.innerHTML = '<button class="mini" id="scanGo">▶ 开始扫描</button><div id="scanOut" style="margin-top:10px"></div>';
  $("scanGo").onclick = function () {
    var out = $("scanOut");
    out.innerHTML = '<div class="dw-meta">扫描中…</div>';
    api("/api/toolbox/scan").then(function (j) {
      if (!j || j.ok === false) { out.innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || "?") + "</div>"; return; }
      var meta = (j.scanned != null ? j.scanned + " 文件" : "") + (j.hits ? " · " + j.hits.length + " 命中" : "") +
        (j.tookMs != null ? " · " + j.tookMs + "ms" : "") + (j.patterns != null ? " · " + j.patterns + " 类模式" : "");
      var h = '<div class="dw-meta">' + esc(meta) + "</div>";
      (j.hits || []).slice(0, 120).forEach(function (x) {
        var sev = (x.severity === "high" || x.severity === "critical") ? "err" : "warn";
        h += '<div class="hit"><span class="sev-' + sev + '">●</span> <span class="f">' + esc(x.file) + ":" + x.line +
          "</span> · " + esc(x.pattern) + " · " + esc(String(x.preview || "").slice(0, 80)) + "</div>";
      });
      if (!(j.hits || []).length) h += '<div class="dw-meta">未发现命中 ✓</div>';
      out.innerHTML = h;
    }).catch(function (e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + "</div>"; });
  };
}
function symbolsPanel() {
  var body = $("dwBody");
  body.innerHTML = '<div class="dw-form"><input id="symIn" placeholder="符号名（如 notice-parser）" autocomplete="off"><button id="symGo">查找</button></div><div id="symOut"></div>';
  function go() {
    var name = $("symIn").value.trim();
    if (!name) return;
    var out = $("symOut");
    out.innerHTML = '<div class="dw-meta">索引中…</div>';
    api("/api/toolbox/symbols?name=" + encodeURIComponent(name)).then(function (j) {
      if (!j || j.ok === false) { out.innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || "?") + "</div>"; return; }
      var h = '<div class="dw-meta">索引 ' + (j.files || 0) + " 文件 · " + (j.symbols || 0) + " 符号</div>";
      h += '<div class="dw-meta">定义（' + ((j.defs || []).length) + "）：</div>";
      (j.defs || []).forEach(function (d) {
        h += '<div class="hit"><span class="f">' + esc(d.file || "?") + ":" + (d.line || "?") + "</span> · " +
          esc(d.kind || d.type || "def") + " <b>" + esc(d.name || name) + "</b></div>";
      });
      if (!(j.defs || []).length) h += '<div class="hit">（无定义命中）</div>';
      h += '<div class="dw-meta">引用（' + ((j.refs || []).length) + "）：</div>";
      (j.refs || []).forEach(function (r) {
        h += '<div class="hit"><span class="f">' + esc(r.file || "?") + ":" + (r.line || "?") + "</span> · " +
          esc(String(r.text || r.preview || "").slice(0, 90)) + "</div>";
      });
      out.innerHTML = h;
    }).catch(function (e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + "</div>"; });
  }
  $("symGo").onclick = go;
  $("symIn").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  $("symIn").focus();
}
function sbomPanel() {
  $("dwBody").innerHTML = '<div class="dw-meta">加载中…</div>';
  api("/api/toolbox/sbom").then(function (j) {
    if (!j || j.ok === false) { $("dwBody").innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || "?") + "</div>"; return; }
    var pk = j.packages || [];
    var h = '<div class="dw-meta">SPDX-2.3 · ' + pk.length + " 组件</div>";
    pk.forEach(function (x) {
      h += '<div class="hit">' + esc(x.scope || "") + " · <b>" + esc(x.name) + "</b>@" + esc(x.version) +
        " · " + esc(x.license || "NOASSERTION") + "</div>";
    });
    if (!pk.length) h += '<div class="dw-meta">（无组件）</div>';
    $("dwBody").innerHTML = h;
  }).catch(function (e) { $("dwBody").innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + "</div>"; });
}
function dbPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="dbFile" placeholder="工作区内的 .db 路径（如 data/app.db）" autocomplete="off"><button id="dbSchemaGo">表结构</button></div>' +
    '<div class="dw-form"><input id="dbSql" placeholder="只读 SQL（SELECT …）" autocomplete="off"><button id="dbQueryGo">查询</button></div>' +
    '<div id="dbOut"></div>';
  function err(e) { $("dbOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + "</div>"; }
  $("dbSchemaGo").onclick = function () {
    var f = $("dbFile").value.trim();
    if (!f) { err("先输入 .db 路径"); return; }
    $("dbOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/toolbox/db?file=" + encodeURIComponent(f)).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = "";
      (j.tables || []).forEach(function (t) {
        h += '<div class="hit"><b>' + esc(t.name) + "</b> · " +
          (t.rowCount == null ? "行数未抽查" : t.rowCount + " 行") + "<br><span class=\\"dw-meta\\">" +
          (t.columns || []).map(function (c) { return esc(c.name); }).join(" · ") + "</span></div>";
      });
      if ((j.indexes || []).length) h += '<div class="dw-meta">索引：' + esc(j.indexes.join(" · ")) + "</div>";
      if ((j.views || []).length) h += '<div class="dw-meta">视图：' + esc(j.views.join(" · ")) + "</div>";
      $("dbOut").innerHTML = h || '<div class="dw-meta">（库为空：无表）</div>';
    }).catch(function (e) { err(String(e)); });
  };
  $("dbQueryGo").onclick = function () {
    var f = $("dbFile").value.trim(), sql = $("dbSql").value.trim();
    if (!f || !sql) { err("file 与 SQL 都要填"); return; }
    $("dbOut").innerHTML = '<div class="dw-meta">查询中…</div>';
    api("/api/toolbox/db-query", { file: f, sql: sql }).then(function (j) {
      if (!j || j.ok === false) { err("[" + ((j && j.kind) || "?") + "] " + ((j && j.error) || "?")); return; }
      var h = '<div class="dw-meta">' + j.row_count + " 行 · " + j.ms + "ms" + (j.truncated ? "（截断）" : "") + "</div>";
      if ((j.columns || []).length) h += '<div class="hit"><b>' + j.columns.map(function (c) { return esc(c); }).join(" | ") + "</b></div>";
      (j.rows || []).forEach(function (row) {
        h += '<div class="hit">' + row.map(function (c) { return esc(c === null ? "NULL" : c); }).join(" | ") + "</div>";
      });
      $("dbOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function diffPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="dfA" placeholder="文件 A（工作区相对路径）" autocomplete="off"><input id="dfB" placeholder="文件 B" autocomplete="off"><button id="dfGo">对比</button></div><div id="dfOut"></div>';
  function err(e) { $("dfOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("dfGo").onclick = function () {
    var a = $("dfA").value.trim(), b = $("dfB").value.trim();
    if (!a || !b) { err("a/b 两个路径都要填"); return; }
    $("dfOut").innerHTML = '<div class="dw-meta">对比中…</div>';
    api("/api/toolbox/diff", { a: a, b: b }).then(function (j) {
      if (!j || j.ok === false) { err(((j && j.kind) ? '[' + j.kind + '] ' : '') + ((j && j.error) || "?")); return; }
      if (j.identical) { $("dfOut").innerHTML = '<div class="dw-meta">两文件一致（无差异）✓</div>'; return; }
      var h = '<div class="dw-meta">' + (j.stats ? esc(j.stats) : ('+' + (j.adds || 0) + ' −' + (j.dels || 0))) +
        (j.truncated ? ' · 截断' : '') + '</div>';
      h += '<pre class="dw-pre">' + esc(String(j.unified || '').slice(0, 60000)) + '</pre>';
      $("dfOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
  $("dfA").focus();
}
function pdfPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="pdfFile" placeholder="工作区相对路径（如 docs/spec.pdf）" autocomplete="off"><input id="pdfPages" placeholder="页帽" style="max-width:90px" autocomplete="off"><button id="pdfGo">读取</button></div><div id="pdfOut"></div>';
  function err(e) { $("pdfOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("pdfGo").onclick = function () {
    var f = $("pdfFile").value.trim();
    if (!f) { err("先输入 PDF 路径"); return; }
    var mp = parseInt($("pdfPages").value, 10);
    $("pdfOut").innerHTML = '<div class="dw-meta">提取中…（pdftotext → uv-pypdf → 诚实失败）</div>';
    api("/api/toolbox/pdfread", { file: f, maxPages: isNaN(mp) ? undefined : mp }).then(function (j) {
      if (!j || j.ok === false) {
        err(((j && j.error) || "?") + ((j && j.hint) ? '（' + j.hint + '）' : ''));
        return;
      }
      var meta = (j.engine || '?') + ' · ' + (j.pages || 0) + ' 页 · ' + String(j.text || '').length + ' 字符' +
        (j.ms != null ? ' · ' + j.ms + 'ms' : '') + (j.hint ? ' · ' + j.hint : '');
      $("pdfOut").innerHTML = '<div class="dw-meta">' + esc(meta) + '</div><pre class="dw-pre">' +
        esc(String(j.text || '').slice(0, 60000)) + '</pre>';
    }).catch(function (e) { err(String(e)); });
  };
  $("pdfFile").focus();
}
function mcpPanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="mcpTabs">' +
    '<button data-a="servers" class="on">服务档案</button><button data-a="tools">工具清单</button>' +
    '<button data-a="resources">资源</button><button data-a="prompts">提示词</button>' +
    '<button data-a="selftest">自检</button></div><div id="mcpOut"></div>';
  var out = $("mcpOut");
  function go(a) {
    var tabs = document.querySelectorAll("#mcpTabs button");
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].getAttribute("data-a") === a ? "on" : "";
    }
    out.innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/mcp?action=" + a).then(function (j) {
      if (!j || j.ok === false) { out.innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || "?") + '</div>'; return; }
      var h = "";
      if (a === "servers") {
        h += '<div class="dw-meta">档案 ' + esc(j.kind || "?") + " · " + ((j.entries || []).length) + " 条目</div>";
        (j.entries || []).forEach(function (e) {
          h += '<div class="hit"><b>' + esc(e.name) + '</b>' + (e.disabled ? "（停用）" : "") + " · " +
            esc(e.command) + " " + esc((e.args || []).join(" ")) + '</div>';
        });
        if (!(j.entries || []).length) {
          h += '<div class="dw-meta">' + esc(j.guidance ? String(j.guidance).slice(0, 220) : "（无 MCP 服务档案）") + '</div>';
        }
        var rt = j.runtimes || [];
        if (rt.length) h += '<div class="dw-meta">宿主：' + rt.map(function (r) { return esc(r.name) + (r.available ? " ✓" : " ⬜"); }).join(" · ") + '</div>';
      } else if (a === "tools") {
        (j.servers || []).forEach(function (x) {
          h += '<div class="dw-meta">' + esc(x.server) + " · " + (x.ok ? ((x.tools || []).length + " 工具") : "不可用") +
            (x.reason ? " · " + esc(String(x.reason).slice(0, 80)) : "") + '</div>';
          (x.tools || []).forEach(function (t) {
            h += '<div class="hit"><b>' + esc(t.name) + '</b> · ' + esc(String(t.description || "").slice(0, 110)) + '</div>';
          });
        });
        if (!(j.servers || []).length) h += '<div class="dw-meta">（无服务）</div>';
      } else if (a === "resources") {
        (j.servers || []).forEach(function (x) {
          h += '<div class="dw-meta">' + esc(x.server) + " · " + ((x.resources || []).length) + " 资源" +
            (x.reason ? " · " + esc(String(x.reason).slice(0, 80)) : "") + '</div>';
          (x.resources || []).forEach(function (rr) {
            h += '<div class="hit"><span class="f">' + esc(rr.uri) + '</span> · ' + esc(rr.name || "") +
              (rr.mimeType ? " · " + esc(rr.mimeType) : "") + '</div>';
          });
        });
      } else if (a === "prompts") {
        (j.prompts || []).forEach(function (pp) {
          h += '<div class="hit">' + esc(pp.server) + " · <b>" + esc(pp.name) + '</b> · ' + esc(String(pp.description || "").slice(0, 110)) + '</div>';
        });
        if (!(j.prompts || []).length) h += '<div class="dw-meta">（无提示词）</div>';
      } else if (a === "selftest") {
        h += '<div class="dw-meta">自检 ' + (j.passed || 0) + "/" + (j.total || 0) + (j.ok ? " ✓" : " ✗") + '</div>';
        (j.checks || []).forEach(function (c) {
          h += '<div class="hit">' + esc(typeof c === "string" ? c : ((c.name || "check") + " " + (c.ok ? "✓" : "✗"))) + '</div>';
        });
      }
      out.innerHTML = h;
    }).catch(function (e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + '</div>'; });
  }
  $("mcpTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a) go(a);
  });
  go("servers");
}
function sastPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="sastTargets" placeholder="目标（逗号分隔，可空 = 全扫描）" autocomplete="off"><button id="sastGo">扫描</button></div><div id="sastOut"></div>';
  function err(e) { $("sastOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("sastGo").onclick = function () {
    var tg = $("sastTargets").value.trim();
    $("sastOut").innerHTML = '<div class="dw-meta">扫描中…（ruff → bandit → 内置规则 降级链）</div>';
    api("/api/govex/sast" + (tg ? "?targets=" + encodeURIComponent(tg) : "")).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">' + (j.scanned || 0) + "/" + (j.files || 0) + " 文件 · " +
        (j.total_findings != null ? j.total_findings : (j.findings || []).length) + " 命中 · " +
        (j.took_ms || 0) + "ms · " + (j.rules || 0) + " 条规则" + (j.truncated ? "（截断）" : "") + '</div>';
      (j.findings || []).forEach(function (f) {
        var sev = String(f.severity || f.level || "").toLowerCase();
        var cls = (sev === "high" || sev === "error" || sev === "critical") ? "err" : "warn";
        h += '<div class="hit"><span class="sev-' + cls + '">●</span> <span class="f">' + esc(f.file || f.path || "?") +
          (f.line != null ? ":" + f.line : "") + '</span> · ' + esc(f.rule || f.rule_id || f.kind || "") +
          " · " + esc(String(f.message || f.text || "").slice(0, 110)) + '</div>';
      });
      if (!(j.findings || []).length) h += '<div class="dw-meta">未发现问题 ✓</div>';
      if (j.engines) {
        var lanes = "";
        if (Array.isArray(j.lanes)) {
          lanes = j.lanes.map(function (l) {
            return typeof l === "string" ? l : (l.name || l.engine || l.id || "?") + (l.available === false ? "（缺席）" : "");
          }).join(" · ");
        } else if (j.lanes && typeof j.lanes === "object") {
          lanes = Object.keys(j.lanes).map(function (k) {
            var v = j.lanes[k];
            return k + ":" + (v === false || v == null ? "✗" : String(v));
          }).join(" · ");
        } else if (j.lanes) { lanes = String(j.lanes); }
        h += '<div class="dw-meta">引擎：ruff ' + (j.engines.ruff ? "✓" : "⬜") +
          " · bandit " + (j.engines.bandit ? "✓" : "⬜") + " · semgrep " + (j.engines.semgrep ? "✓" : "⬜") +
          (lanes ? " · 车道 " + esc(lanes.slice(0, 70)) : "") + '</div>';
      }
      $("sastOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function iacPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="iacGo">▶ 扫描 IaC</button><div id="iacOut" style="margin-top:10px"></div>';
  function err(e) { $("iacOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("iacGo").onclick = function () {
    $("iacOut").innerHTML = '<div class="dw-meta">扫描中…（IaC 规则链）</div>';
    api("/api/govex/iacscan").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">' + (j.scanned || 0) + "/" + (j.files || 0) + " 文件 · " + ((j.hits || []).length) + " 命中" +
        (j.high != null ? "（high " + j.high + "）" : "") + " · " + (j.took_ms || 0) + "ms · " + (j.rules || 0) + " 条规则" +
        (j.truncated ? "（截断）" : "") + '</div>';
      (j.hits || []).forEach(function (x) {
        var cls = String(x.severity) === "high" ? "err" : "warn";
        h += '<div class="hit"><span class="sev-' + cls + '">●</span> <span class="f">' + esc(x.file || "?") +
          (x.line != null ? ":" + x.line : "") + '</span> · ' + esc(x.rule || x.id || "") +
          " · " + esc(String(x.message || x.text || "").slice(0, 110)) + '</div>';
      });
      if (!(j.hits || []).length) h += '<div class="dw-meta">未发现问题 ✓</div>';
      $("iacOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function gitPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="gitGo">▶ 刷新状态</button><div id="gitOut" style="margin-top:10px"></div>';
  function err(e) { $("gitOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function load() {
    $("gitOut").innerHTML = '<div class="dw-meta">读取中…</div>';
    api("/api/govex/gitstate").then(function (j) {
      var st = (j && j.state) || {};
      if (st.degraded) { $("gitOut").innerHTML = '<div class="dw-meta">⚠ ' + esc(String(st.degraded)) + '</div>'; return; }
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">' + esc(st.repo || "") + '</div>';
      h += '<div class="hit">分支 <b>' + esc(st.branch || "?") + '</b>' + (st.upstream ? " · 上游 " + esc(st.upstream) : "") + '</div>';
      h += '<div class="hit">ahead ' + (st.ahead || 0) + " · behind " + (st.behind || 0) +
        (st.diverged ? " · ⚠ 分叉" : "") + " · " + (st.dirty ? "⚑ 有未提交改动" : "干净") +
        " · stash " + (st.stashed || 0) + '</div>';
      $("gitOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  $("gitGo").onclick = load;
  load();
}
function depsPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="depsGo">▶ 探测依赖工具</button><div id="depsOut" style="margin-top:10px"></div>';
  function err(e) { $("depsOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("depsGo").onclick = function () {
    $("depsOut").innerHTML = '<div class="dw-meta">探测中…（uv/pip/poetry/bun/npm/pnpm/cargo）</div>';
    api("/api/govex/deps", { action: "probe" }).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">工具 ' + (j.tools || []).filter(function (t) { return t.available; }).length +
        "/" + ((j.tools || []).length) + " 在场</div>";
      (j.tools || []).forEach(function (t) {
        h += '<div class="hit">' + (t.available ? "✓" : "⬜") + " <b>" + esc(t.name) + '</b>' +
          (t.version ? " · " + esc(String(t.version).slice(0, 60)) : "") +
          (!t.available && t.note ? ' · <span class="dw-meta" style="display:inline">' + esc(String(t.note).slice(0, 70)) + '</span>' : "") + '</div>';
      });
      if (j.manifest) {
        h += '<div class="dw-meta">📦 清单 ' + esc(j.manifest.file) + " · " + esc(j.manifest.kind || "") + " · " +
          (j.manifest.deps || 0) + " 依赖" + (j.manifest.name ? " · " + esc(j.manifest.name) + (j.manifest.version ? "@" + esc(j.manifest.version) : "") : "") + '</div>';
      } else {
        h += '<div class="dw-meta">（工作区未见 package.json / pyproject.toml / Cargo.toml）</div>';
      }
      $("depsOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function debugPanel() {
  $("dwBody").innerHTML = '<textarea class="dw-ta" id="dbgText" placeholder="粘贴崩溃输出全文 —— Traceback / at 帧 / panicked 均可"></textarea>' +
    '<div class="dw-form"><button id="dbgGo">分析</button></div><div id="dbgOut"></div>';
  function err(e) { $("dbgOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("dbgGo").onclick = function () {
    var text = $("dbgText").value;
    if (!text.trim()) { err("先粘贴崩溃文本"); return; }
    $("dbgOut").innerHTML = '<div class="dw-meta">分析中…</div>';
    api("/api/govex/debug", { action: "stack", text: text }).then(function (j) {
      if (!j || j.ok === false) { err((j && (j.error || j.reason)) || "?"); return; }
      var st = j.stats || {};
      var h = '<div class="dw-meta">语言 ' + esc(j.language || "?") + " · 检出 " + esc(j.detected_by || "?") +
        (st.frames != null ? " · 帧 " + st.frames : "") + (st.app_frames != null ? "（应用 " + st.app_frames + "）" : "") +
        (j.truncated ? " · 截断" : "") + '</div>';
      var inner = j.innermost_app_frame;
      if (inner) {
        h += '<div class="hit"><b>最内层应用帧</b> ' + (typeof inner === "string" ? esc(inner) :
          esc(inner.file || "?") + (inner.line != null ? ":" + inner.line : "") + " " + esc(inner.fn || inner.name || "")) + '</div>';
      }
      (j.frames || []).forEach(function (f) {
        h += '<div class="hit">' + (f.app || f.isApp ? "★ " : "  ") + '<span class="f">' + esc(f.file || f.path || "?") +
          (f.line != null ? ":" + f.line : "") + '</span> ' + esc(f.fn || f.func || f.name || "") + '</div>';
      });
      if ((j.hints || []).length) {
        h += '<div class="dw-meta">根因提示：</div>';
        (j.hints || []).forEach(function (x) {
          var xt;
          if (typeof x === "string") { xt = x; }
          else {
            xt = x.title || x.text || x.message || x.hint || "";
            if (x.cause) { xt += " —— " + x.cause; }
            if (!xt) { xt = JSON.stringify(x); }
          }
          h += '<div class="hit">💡 ' + esc(String(xt).slice(0, 200)) + '</div>';
        });
      }
      $("dbgOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function providersPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="pvGo">▶ 刷新车道面</button><div id="pvOut" style="margin-top:10px"></div>';
  function err(e) { $("pvOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function render(j) {
    var lanes = j.lanes || {};
    var names = Object.keys(lanes);
    var h = '<div class="dw-meta">缺省车道 <b>' + esc(j.default_lane || "—") + '</b> · 配置车道 ' + names.length +
      " · 注册表 " + ((j.presets || []).length) + " 家 · env 发现 " + ((j.env || []).length) + '</div>';
    if (j.budget) {
      h += '<div class="dw-meta">预算水位 ' + esc(String(j.budget.used != null ? j.budget.used : JSON.stringify(j.budget)).slice(0, 90)) + '</div>';
    }
    names.forEach(function (n) {
      var l = lanes[n] || {};
      h += '<div class="hit">' + (n === j.default_lane ? "→ " : "  ") + '<b>' + esc(n) + '</b>' +
        " · " + esc(l.provider || "?") + (l.model ? "/" + esc(String(l.model).slice(0, 26)) : "") +
        (l.keys ? " · keys " + l.keys : " · ⚠ 无 key") +
        (l.gateway ? ' · <span class="dw-meta" style="display:inline">' + esc(String(l.gateway).split("://").pop().slice(0, 40)) + '</span>' : "") +
        ' <button class="mini" data-lane="' + esc(n) + '" style="margin-left:6px">测试</button></div>';
    });
    if (!names.length) h += '<div class="dw-meta">（无配置车道 —— org config set lane …）</div>';
    if ((j.env || []).length) {
      h += '<div class="dw-meta">env 键发现：' + (j.env || []).map(function (e) { return esc(e.provider) + "（" + esc(e.envName) + "）"; }).join(" · ") + '</div>';
    }
    $("pvOut").innerHTML = h;
    var btns = $("pvOut").querySelectorAll("button[data-lane]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function () {
        var lane = this.getAttribute("data-lane");
        var self = this;
        self.textContent = "…";
        api("/api/providers/test", { lane: lane }).then(function (r) {
          var res = (r && r.result) || {};
          self.textContent = r && r.ok ? "✓ " + (res.ms != null ? res.ms + "ms" : "ok") : "✗ " + String(res.error || res.kind || "fail").slice(0, 40);
          self.style.color = r && r.ok ? "var(--ok)" : "var(--err)";
        }).catch(function () { self.textContent = "✗ 网络"; self.style.color = "var(--err)"; });
      };
    }
  }
  $("pvGo").onclick = function () {
    $("pvOut").innerHTML = '<div class="dw-meta">读取中…</div>';
    api("/api/providers").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      render(j);
    }).catch(function (e) { err(String(e)); });
  };
  $("pvGo").onclick();
}
function audioPanel() {
  var TIMBRES = ["piano", "strings", "flute", "organ", "harpsichord", "music-box", "guitar", "bell"];
  var PROGS = ["canon", "pop", "epic", "circle", "jazz", "blues", "romance"];
  function opts(arr) { return arr.map(function (x) { return '<option value="' + x + '">' + x + '</option>'; }).join(""); }
  $("dwBody").innerHTML = '<div class="dw-form">' +
    '<select id="adTimbre">' + opts(TIMBRES) + '</select>' +
    '<select id="adProg">' + opts(PROGS) + '</select>' +
    '<select id="adStyle"><option value="arp">arp</option><option value="block">block</option></select>' +
    '<input id="adTempo" placeholder="速度" style="max-width:70px" value="72" autocomplete="off">' +
    '<input id="adTitle" placeholder="标题（可选）" autocomplete="off">' +
    '</div><div class="dw-form" style="align-items:center">' +
    '<label><input type="checkbox" id="adWav" checked> wav</label>' +
    '<label><input type="checkbox" id="adMid"> mid</label>' +
    '<label><input type="checkbox" id="adMp3" checked> mp3</label>' +
    '<label><input type="checkbox" id="adM4a"> m4a</label>' +
    '<button id="adGo" style="margin-left:auto">♪ 作曲</button></div><div id="adOut"></div>';
  function err(e) { $("adOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("adGo").onclick = function () {
    var deliver = [];
    if ($("adWav").checked) deliver.push("wav");
    if ($("adMid").checked) deliver.push("mid");
    if ($("adMp3").checked) deliver.push("mp3");
    if ($("adM4a").checked) deliver.push("m4a");
    var body = {
      timbre: $("adTimbre").value, prog: $("adProg").value, style: $("adStyle").value,
      tempo: Number($("adTempo").value) || 72,
      title: $("adTitle").value.trim() || undefined,
      deliver: deliver,
    };
    $("adOut").innerHTML = '<div class="dw-meta">作曲中…（零模型调用 · 合成直出）</div>';
    api("/api/audio-compose", body).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">《' + esc(j.title || j.name) + "》 · " + esc(j.timbre) + "/" + esc(j.style) + " · " +
        (j.tempo || "") + " BPM · " + (j.durationSec != null ? j.durationSec + "s" : "") + " · " + (j.notes || 0) + " 音符" + '</div>';
      h += '<div class="dw-meta">和声：' + esc((j.chords || []).join(" → ")) + '</div>';
      (j.files || []).forEach(function (f) {
        h += '<div class="hit">📎 <a href="' + esc(f.url) + '" target="_blank" rel="noopener">▶ ' + esc(f.file) + '</a></div>';
      });
      (j.degrade || []).forEach(function (d) { h += '<div class="dw-meta">降级：' + esc(String(d)) + '</div>'; });
      $("adOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function searchPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="sqIn" placeholder="检索词（中文 bigram 友好）" autocomplete="off">' +
    '<input id="sqK" placeholder="k" style="max-width:60px" value="5" autocomplete="off">' +
    '<button id="sqGo">检索</button></div><div id="sqOut"></div>';
  function err(e) { $("sqOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function go() {
    var q = $("sqIn").value.trim();
    if (!q) { err("先输入检索词"); return; }
    $("sqOut").innerHTML = '<div class="dw-meta">检索中…</div>';
    api("/api/search?q=" + encodeURIComponent(q) + "&k=" + (Number($("sqK").value) || 5)).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">' + (j.took_ms || 0) + "ms · 索引 " + (j.total_docs || 0) + " 文档 · 命中 " +
        ((j.hits || []).length) + '</div>';
      (j.hits || []).forEach(function (x) {
        h += '<div class="hit"><b>' + (x.score != null ? Number(x.score).toFixed(2) : "?") + '</b> · <span class="f">' +
          esc(x.path || "?") + '</span> · ' + esc((x.terms || []).join(",")) +
          (x.snippet ? '<br><span class="dw-meta">' + esc(String(x.snippet).slice(0, 170)) + '</span>' : "") + '</div>';
      });
      if (!(j.hits || []).length) h += '<div class="dw-meta">无命中</div>';
      $("sqOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  $("sqGo").onclick = go;
  $("sqIn").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  $("sqIn").focus();
}
function memoryPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="mmGo">▶ 加载记忆库</button><div id="mmOut" style="margin-top:10px"></div>';
  function err(e) { $("mmOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("mmGo").onclick = function () {
    $("mmOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/memory").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var gs = j.groups || [];
      var total = 0;
      gs.forEach(function (g) { total += (g.entries || []).length; });
      var h = '<div class="dw-meta">' + gs.length + " 位专家 · " + total + " 条记忆</div>";
      gs.forEach(function (g) {
        h += '<div class="dw-meta">🧠 <b>' + esc(g.expert) + "</b> · " + ((g.entries || []).length) + " 条</div>";
        (g.entries || []).forEach(function (e2) {
          var ts = e2.ts || e2.date || e2.time || "";
          var txt = e2.text || e2.content || e2.note || e2.title || JSON.stringify(e2);
          h += '<div class="hit">' + (ts ? '<span class="dw-meta">' + esc(String(ts).slice(0, 22)) + "</span> " : "") +
            esc(String(txt).slice(0, 200)) + '</div>';
        });
      });
      if (!gs.length) h += '<div class="dw-meta">（记忆库为空 —— 专家记忆在运行时写入 runtime/memories/）</div>';
      $("mmOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function schedPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="scExpr" placeholder="cron 表达式（如 0 9 * * *）" autocomplete="off"><button id="scPrev">预览</button>' +
    '<button id="scGo" style="margin-left:auto">加载清单</button></div><div id="scOut"></div>';
  function err(e) { $("scOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("scPrev").onclick = function () {
    var expr = $("scExpr").value.trim();
    if (!expr) { err("先输入 cron 表达式"); return; }
    $("scOut").innerHTML = '<div class="dw-meta">计算下一批…</div>';
    api("/api/schedules/preview?expr=" + encodeURIComponent(expr)).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">下一批（3 次）：</div>';
      (j.next || []).forEach(function (d) { h += '<div class="hit">⏰ ' + esc(String(d).replace("T", " ").slice(0, 19)) + '</div>'; });
      $("scOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
  $("scGo").onclick = function () {
    $("scOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/schedules").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var list = j.schedules || [];
      var h = '<div class="dw-meta">共 ' + list.length + " 条计划</div>";
      list.forEach(function (x) {
        var goal = x.goal || x.task || x.command || x.title || JSON.stringify(x).slice(0, 80);
        h += '<div class="hit"><b>' + esc(x.id != null ? "#" + x.id : "·") + '</b> · <code>' + esc(x.expr || "?") + '</code> · ' +
          esc(String(goal).slice(0, 110)) + (x.enabled === false ? " · 停用" : "") + '</div>';
      });
      if (!list.length) h += '<div class="dw-meta">（无计划 —— CLI: org sched add "…" --expr "0 9 * * *"）</div>';
      $("scOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function notifyPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><button id="ntGo">▶ 加载通知</button><button id="ntAll" style="margin-left:auto">全部已读</button></div><div id="ntOut"></div>';
  function err(e) { $("ntOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function load() {
    $("ntOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/notifications").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var ns = j.notifications || [];
      var h = '<div class="dw-meta">未读 ' + (j.unread || 0) + " · 本列表 " + ns.length + " 条</div>";
      ns.forEach(function (n2) {
        var ts = n2.ts || n2.time || n2.at || "";
        var txt = n2.title || n2.text || n2.message || JSON.stringify(n2).slice(0, 90);
        h += '<div class="hit">' + (n2.read ? "·" : "●") + " " +
          (ts ? '<span class="dw-meta">' + esc(String(ts).slice(0, 19)) + "</span> " : "") + esc(String(txt).slice(0, 150)) + '</div>';
      });
      if (!ns.length) h += '<div class="dw-meta">（没有未读通知）</div>';
      $("ntOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  $("ntGo").onclick = load;
  $("ntAll").onclick = function () {
    api("/api/notifications", { action: "read", id: "all" }).then(function () { load(); });
  };
  load();
}
function collabPanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="cbTabs"><button data-a="summary" class="on">总览</button>' +
    '<button data-a="threads">线程</button><button data-a="users">协作者</button></div><div id="cbOut"></div>';
  var out = $("cbOut");
  function err(e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function tab(a) {
    var tabs = document.querySelectorAll("#cbTabs button");
    for (var i = 0; i < tabs.length; i++) { tabs[i].className = tabs[i].getAttribute("data-a") === a ? "on" : ""; }
  }
  function openFeed(id, title) {
    out.innerHTML = '<div class="dw-meta">读取线程…</div>';
    api("/api/govex/collab?action=feed&thread=" + encodeURIComponent(id)).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">🧵 <b>' + esc(title || id) + '</b> · ' + ((j.posts || []).length) + ' 帖' + (j.truncated ? "（截断）" : "") + '</div>';
      (j.posts || []).forEach(function (pp) {
        var pad = "";
        for (var d = 0; d < (pp.depth || 0); d++) { pad += "　"; }
        h += '<div class="hit">' + pad + '<span class="f">#' + (pp.seq || "?") + '</span> <b>' + esc(pp.user || "?") + '</b>' +
          (pp.kind ? " · " + esc(pp.kind) : "") + (pp.at ? ' · <span class="dw-meta" style="display:inline">' + esc(String(pp.at).slice(0, 19)) + "</span>" : "") +
          '<br><span style="white-space:pre-wrap">' + esc(String(pp.text || "").slice(0, 500)) + '</span></div>';
      });
      if (!(j.posts || []).length) h += '<div class="dw-meta">（线程无帖）</div>';
      out.innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  function go(a) {
    tab(a);
    out.innerHTML = '<div class="dw-meta">加载中…</div>';
    if (a === "threads") {
      api("/api/govex/collab?action=threads").then(function (j) {
        if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
        var ts = j.threads || [];
        var h = '<div class="dw-meta">共 ' + ts.length + " 个线程</div>";
        ts.forEach(function (t) {
          var id = t.id || t.thread || t.name || "";
          var title = t.title || t.subject || t.name || id;
          var cnt = t.posts != null ? t.posts : (t.count != null ? t.count : "");
          h += '<div class="hit" data-thread="' + esc(String(id)) + '" style="cursor:pointer">🧵 <b>' + esc(String(title).slice(0, 70)) + '</b>' +
            (cnt !== "" ? " · " + cnt + " 帖" : "") + '</div>';
        });
        if (!ts.length) h += '<div class="dw-meta">（还没有线程 —— CLI: org govex collab post …）</div>';
        out.innerHTML = h;
        var rows = out.querySelectorAll(".hit[data-thread]");
        for (var i = 0; i < rows.length; i++) {
          (function (row) {
            row.onclick = function () { openFeed(row.getAttribute("data-thread"), row.textContent.slice(2, 42)); };
          })(rows[i]);
        }
      }).catch(function (e) { err(String(e)); });
    } else if (a === "users") {
      api("/api/govex/collab?action=users").then(function (j) {
        if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
        var us = j.collaborators || [];
        var h = '<div class="dw-meta">' + us.length + " 位协作者</div>";
        us.forEach(function (u) {
          var name = (typeof u === "string") ? u : (u.name || u.user || u.id || JSON.stringify(u));
          h += '<div class="hit">👤 ' + esc(String(name)) + (u && u.kind ? " · " + esc(u.kind) : "") + '</div>';
        });
        if (!us.length) h += '<div class="dw-meta">（暂无协作者）</div>';
        out.innerHTML = h;
      }).catch(function (e) { err(String(e)); });
    } else {
      api("/api/govex/collab?action=summary").then(function (j) {
        if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
        var h = "";
        var me = j.me || j.whoami || j.current || null;
        if (me) h += '<div class="dw-meta">我：' + esc(typeof me === "string" ? me : (me.name || me.user || JSON.stringify(me))) + '</div>';
        ["threads", "posts", "users", "collaborators", "updated"].forEach(function (k) {
          if (j[k] != null && typeof j[k] !== "object") h += '<div class="dw-meta">' + k + ": " + esc(String(j[k])) + '</div>';
        });
        if (j.summary && typeof j.summary === "object") {
          Object.keys(j.summary).slice(0, 10).forEach(function (k) {
            var v = j.summary[k];
            if (v == null || typeof v === "object") return;
            h += '<div class="dw-meta">' + esc(k) + ": " + esc(String(v)) + '</div>';
          });
        }
        h += '<div class="dw-meta">协作目录：' + esc(j.dir || "runtime/collab/") + '</div>';
        out.innerHTML = h || '<div class="dw-meta">（协作空间为空）</div>';
      }).catch(function (e) { err(String(e)); });
    }
  }
  $("cbTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a) go(a);
  });
  go("summary");
}
function visionPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="vsFile" type="file" accept="image/*"><button id="vsGo">分析</button></div>' +
    '<div class="dw-form"><input id="vsPrompt" placeholder="提问（可选，如：描述这张图 / 图里有什么）" autocomplete="off"></div><div id="vsOut"></div>';
  function err(e) { $("vsOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("vsGo").onclick = function () {
    var f = $("vsFile").files && $("vsFile").files[0];
    if (!f) { err("先选择一张图片（相册/Files）"); return; }
    $("vsOut").innerHTML = '<div class="dw-meta">读图中…</div>';
    var rd = new FileReader();
    rd.onload = function () {
      var b64 = String(rd.result).replace(/^data:[^,]*,/, "");
      $("vsOut").innerHTML = '<div class="dw-meta">分析中…（VLM）</div>';
      api("/api/vision", { image_base64: b64, mime: f.type || undefined, prompt: $("vsPrompt").value.trim() || undefined })
        .then(function (j) {
          if (!j || j.ok === false) { err((j && j.error) || "?（可能未配置视觉服务凭据）"); return; }
          var h = '<div class="dw-meta">' + (j.chars || 0) + " 字符 · " + (j.images || 1) + ' 图</div>' +
            '<pre class="dw-pre">' + esc(String(j.text || "").slice(0, 8000)) + '</pre>';
          $("vsOut").innerHTML = h;
        }).catch(function (e) { err(String(e)); });
    };
    rd.onerror = function () { err("读取文件失败"); };
    rd.readAsDataURL(f);
  };
}
function voicePanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="vcTabs"><button data-a="asr" class="on">录音转写</button><button data-a="tts">朗读合成</button></div><div id="vcOut"></div>';
  var out = $("vcOut");
  function err(e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function tab(a) {
    var ts = document.querySelectorAll("#vcTabs button");
    for (var i = 0; i < ts.length; i++) { ts[i].className = ts[i].getAttribute("data-a") === a ? "on" : ""; }
  }
  function asrView() {
    tab("asr");
    out.innerHTML = '<div class="dw-form"><input id="vcFile" type="file" accept="audio/*"><button id="vcGo">转写</button></div><div id="vcAsrOut"></div>';
    $("vcGo").onclick = function () {
      var f = $("vcFile").files && $("vcFile").files[0];
      if (!f) { $("vcAsrOut").innerHTML = '<div class="dw-meta">先选择音频文件</div>'; return; }
      $("vcAsrOut").innerHTML = '<div class="dw-meta">上传转写中…（ASR）</div>';
      var rd = new FileReader();
      rd.onload = function () {
        api("/api/asr", { audio_base64: rd.result }).then(function (j) {
          if (!j || j.ok === false) { $("vcAsrOut").innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || "?（可能未配置语音服务凭据）") + '</div>'; return; }
          $("vcAsrOut").innerHTML = '<div class="dw-meta">' + (j.chars || 0) + ' 字符</div><pre class="dw-pre">' + esc(String(j.text || "")) + '</pre>';
        }).catch(function (e) { $("vcAsrOut").innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + '</div>'; });
      };
      rd.readAsDataURL(f);
    };
  }
  function ttsView() {
    tab("tts");
    out.innerHTML = '<textarea class="dw-ta" id="ttsText" placeholder="要朗读的文本（≤8192 字）"></textarea>' +
      '<div class="dw-form"><button id="ttsGo">合成朗读</button></div><div id="ttsOut"></div>';
    $("ttsGo").onclick = function () {
      var text = $("ttsText").value.trim();
      if (!text) { $("ttsOut").innerHTML = '<div class="dw-meta">先输入文本</div>'; return; }
      $("ttsOut").innerHTML = '<div class="dw-meta">合成中…（TTS）</div>';
      fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: text }) })
        .then(function (r) {
          if (!r.ok) {
            return r.json().then(function (j) { $("ttsOut").innerHTML = '<div class="dw-meta">失败：' + esc((j && j.error) || ("HTTP " + r.status)) + '</div>'; },
              function () { $("ttsOut").innerHTML = '<div class="dw-meta">失败：HTTP ' + r.status + '</div>'; });
          }
          return r.blob().then(function (b) {
            var url = URL.createObjectURL(b);
            $("ttsOut").innerHTML = '<div class="dw-meta">合成完成 ✓ （' + Math.round(b.size / 1024) + 'KB）</div>';
            var au = document.createElement("audio");
            au.controls = true; au.src = url;
            $("ttsOut").appendChild(au);
          });
        }).catch(function (e) { $("ttsOut").innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + '</div>'; });
    };
  }
  $("vcTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a === "asr") asrView();
    if (a === "tts") ttsView();
  });
  asrView();
}
function mobilePanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="mbTabs"><button data-a="probe" class="on">工具探测</button><button data-a="devices">设备清单</button></div><div id="mbOut"></div>';
  var out = $("mbOut");
  function err(e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function tab(a) {
    var ts = document.querySelectorAll("#mbTabs button");
    for (var i = 0; i < ts.length; i++) { ts[i].className = ts[i].getAttribute("data-a") === a ? "on" : ""; }
  }
  function go(a) {
    tab(a);
    out.innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/mobile?action=" + a).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || (j && j.reason) || "?"); return; }
      var h = "";
      if (a === "probe") {
        var names = ["adb", "aapt", "aapt2", "scrcpy", "ideviceinstaller", "idevice_id", "flutter"];
        var okN = 0;
        names.forEach(function (n2) { if (j[n2] && j[n2].available) okN++; });
        h += '<div class="dw-meta">工具 ' + okN + "/" + names.length + ' 在场 · ' + (j.took_ms || 0) + "ms</div>";
        names.forEach(function (n2) {
          var f = j[n2] || {};
          h += '<div class="hit">' + (f.available ? "✓" : "⬜") + " <b>" + esc(n2) + '</b>' +
            (f.version ? " · " + esc(String(f.version).slice(0, 50)) : "") +
            (!f.available && f.reason ? ' · <span class="dw-meta" style="display:inline">' + esc(String(f.reason).slice(0, 70)) + "</span>" : "") + '</div>';
        });
        if (j.android_home) h += '<div class="dw-meta">ANDROID_HOME: ' + esc(String(j.android_home)) + '</div>';
        if (j.hint) h += '<div class="dw-meta">' + esc(String(j.hint).slice(0, 150)) + '</div>';
      } else {
        var ds = j.devices || [];
        h += '<div class="dw-meta">设备 ' + ds.length + " · ready " + (j.ready || 0) + (j.ios != null ? " · iOS " + j.ios : "") + '</div>';
        ds.forEach(function (d) {
          h += '<div class="hit">📱 ' + esc(typeof d === "string" ? d : (d.id || d.serial || d.name || JSON.stringify(d).slice(0, 80))) + '</div>';
        });
        if (!ds.length) h += '<div class="dw-meta">（无设备 —— ' + esc(String(j.reason || j.hint || "插入设备并允许调试").slice(0, 120)) + "）</div>";
        if (j.hint) h += '<div class="dw-meta">' + esc(String(j.hint).slice(0, 150)) + '</div>';
      }
      out.innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  $("mbTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a) go(a);
  });
  go("probe");
}
function remotePanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="rmTabs"><button data-a="probe" class="on">工具探测</button><button data-a="hosts">主机档案</button></div><div id="rmOut"></div>';
  var out = $("rmOut");
  function err(e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function tab(a) {
    var ts = document.querySelectorAll("#rmTabs button");
    for (var i = 0; i < ts.length; i++) { ts[i].className = ts[i].getAttribute("data-a") === a ? "on" : ""; }
  }
  function go(a) {
    tab(a);
    out.innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/remote?action=" + a).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = "";
      if (a === "probe") {
        var rows = [
          ["ssh", j.ssh ? j.ssh.available : false, j.ssh && j.ssh.version_raw ? j.ssh.version_raw : (j.ssh && j.ssh.open_ssh ? "OpenSSH " + j.ssh.open_ssh.major + "." + j.ssh.open_ssh.minor : "")],
          ["rsync", j.rsync ? j.rsync.available : false, j.rsync && j.rsync.version ? j.rsync.version : ""],
          ["scp", j.scp ? j.scp.available : false, ""],
          ["ssh-keygen", j.ssh_keygen ? j.ssh_keygen.available : false, ""],
        ];
        h += '<div class="dw-meta">工具 ' + rows.filter(function (r) { return r[1]; }).length + "/" + rows.length + " 在场" +
          (j.agent_forwarding != null ? " · agent 转发 " + (j.agent_forwarding ? "✓" : "⬜") : "") + '</div>';
        rows.forEach(function (r) {
          h += '<div class="hit">' + (r[1] ? "✓" : "⬜") + " <b>" + esc(r[0]) + '</b>' + (r[2] ? " · " + esc(String(r[2]).slice(0, 60)) : "") + '</div>';
        });
        if (j.reason) h += '<div class="dw-meta">' + esc(String(j.reason).slice(0, 120)) + '</div>';
        if (j.hint) h += '<div class="dw-meta">' + esc(String(j.hint).slice(0, 150)) + '</div>';
      } else {
        h += '<div class="dw-meta">档案 ' + esc(j.file || "remote-hosts.json") + (j.exists ? "（" + (j.count || 0) + " 台）" : "（未创建）") + '</div>';
        (j.hosts || []).forEach(function (h2) {
          h += '<div class="hit">🖥 <b>' + esc(h2.name || "?") + '</b>' +
            (h2.host ? " · " + esc(h2.host) : "") + (h2.user ? "@" + esc(h2.user) : "") + (h2.port ? ":" + h2.port : "") + '</div>';
        });
        if (!(j.hosts || []).length) h += '<div class="dw-meta">（无主机 —— 在工作区 remote-hosts.json 声明）</div>';
      }
      out.innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  $("rmTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a) go(a);
  });
  go("probe");
}
function pluginsPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="plGo">▶ 加载插件清单</button><div id="plOut" style="margin-top:10px"></div>';
  function err(e) { $("plOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("plGo").onclick = function () {
    $("plOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/plugins").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var ps = j.plugins || [];
      var h = '<div class="dw-meta">目录 ' + esc(j.dir || ".org/plugins") + " · " + ps.length + ' 个插件</div>';
      ps.forEach(function (x) {
        h += '<div class="hit">🔌 <b>' + esc(x.name || "?") + '</b>' + (x.version ? "@" + esc(x.version) : "") +
          (x.path ? " · " + esc(x.path) : "") + (x.description ? '<br><span class="dw-meta">' + esc(String(x.description).slice(0, 100)) + "</span>" : "") + '</div>';
      });
      if (!ps.length) h += '<div class="dw-meta">（无插件 —— CLI: org plugin install <source>）</div>';
      $("plOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function rbacPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="rbGo">▶ 加载角色矩阵</button><div id="rbOut" style="margin-top:10px"></div>';
  function err(e) { $("rbOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("rbGo").onclick = function () {
    $("rbOut").innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/rbac").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">策略 ' + esc(j.policy_file || "（缺省内建）") +
        (j.fallback_reason ? " · 回落：" + esc(String(j.fallback_reason).slice(0, 80)) : "") + '</div>';
      (j.roles || []).forEach(function (r) {
        var bits = [];
        Object.keys(r).forEach(function (k) {
          if (k === "role") return;
          var v = r[k];
          if (v == null) return;
          if (Array.isArray(v)) { if (v.length) bits.push(k + "[" + v.length + "]"); }
          else if (typeof v === "boolean") { bits.push(k + ":" + (v ? "✓" : "✗")); }
          else if (typeof v !== "object") { bits.push(k + ":" + String(v).slice(0, 30)); }
        });
        h += '<div class="hit">🎭 <b>' + esc(r.role || "?") + '</b> · ' + esc(bits.join(" · ").slice(0, 150)) + '</div>';
      });
      if (!(j.roles || []).length) h += '<div class="dw-meta">（无策略角色）</div>';
      $("rbOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function enginesPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="enGo">▶ 探测浏览器引擎</button><div id="enOut" style="margin-top:10px"></div>';
  function err(e) { $("enOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("enGo").onclick = function () {
    $("enOut").innerHTML = '<div class="dw-meta">探测中…</div>';
    api("/api/govex/engines").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = "";
      [["agent-browser", j.agent_browser], ["chromium", j.chromium], ["chrome", j.chrome]].forEach(function (pair) {
        var f = pair[1];
        var avail = (f === true) || (f && f.available === true);
        var ver = (f && (f.version || f.path)) ? String(f.version || f.path).slice(0, 60) : "";
        h += '<div class="hit">' + (avail ? "✓" : "⬜") + " <b>" + esc(pair[0]) + '</b>' + (ver ? " · " + esc(ver) : "") + '</div>';
      });
      if (j.hint) h += '<div class="dw-meta">' + esc(String(j.hint).slice(0, 160)) + '</div>';
      $("enOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function snapshotPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="snUrl" placeholder="https://… （网页 URL）" autocomplete="off"><button id="snGo">抓取快照</button></div><div id="snOut"></div>';
  function err(e, hint) {
    $("snOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>' +
      (hint ? '<div class="dw-meta">' + esc(String(hint).slice(0, 220)) + '</div>' : "");
  }
  function go() {
    var url = $("snUrl").value.trim();
    if (!u7(url)) { err("先输入 http/https URL"); return; }
    $("snOut").innerHTML = '<div class="dw-meta">抓取中…（真浏览器快照）</div>';
    api("/api/govex/browser-snapshot", { url: url }).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?", j && j.hint); return; }
      var h = '<div class="dw-meta">' + esc(j.engine || "?") + " · " + (j.ms || 0) + "ms" +
        (j.title ? " · 《" + esc(String(j.title).slice(0, 60)) + "》" : "") + '</div>';
      if (j.final_url && j.final_url !== j.url) h += '<div class="dw-meta">→ ' + esc(String(j.final_url).slice(0, 90)) + '</div>';
      if ((j.links || []).length) {
        h += '<div class="dw-meta">链接 ' + (j.links.length || 0) + '（前 8）：</div>';
        (j.links || []).slice(0, 8).forEach(function (l) {
          var href = (typeof l === "string") ? l : (l.href || l.url || "");
          var txt = (typeof l === "string") ? l : (l.text || l.href || "");
          h += '<div class="hit">🔗 <a href="' + esc(String(href)) + '" target="_blank" rel="noopener">' + esc(String(txt).slice(0, 70)) + '</a></div>';
        });
      }
      h += '<pre class="dw-pre">' + esc(String(j.text || "").slice(0, 16000)) + '</pre>';
      $("snOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  }
  function u7(u) { return u.indexOf("http://") === 0 || u.indexOf("https://") === 0; }
  $("snGo").onclick = go;
  $("snUrl").addEventListener("keydown", function (e) { if (e.key === "Enter") go(); });
  $("snUrl").focus();
}
function cloudPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="cloudGo">▶ 探测云工具链</button><div id="cloudOut" style="margin-top:10px"></div>';
  function err(e) { $("cloudOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function grp(name, g) {
    if (!g) return "";
    var bits = [g.available ? "✓" : "⬜"];
    if (g.version) bits.push(esc(String(g.version).slice(0, 40)));
    if (g.daemonReachable != null) bits.push("daemon " + (g.daemonReachable ? "通" : "断"));
    if (g.clusterReachable != null) bits.push("cluster " + (g.clusterReachable ? "通" : "断"));
    return '<div class="hit"><b>' + esc(name) + '</b> · ' + bits.join(" · ") + '</div>';
  }
  $("cloudGo").onclick = function () {
    $("cloudOut").innerHTML = '<div class="dw-meta">探测中…（docker/ssh/k8s/terraform + CLI 族）</div>';
    api("/api/govex/cloud?action=probe").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var sm = j.summary || {};
      var h = '<div class="dw-meta">探测 ' + (j.took_ms || 0) + "ms · docker " + (sm.dockerAvailable ? "✓" : "⬜") +
        " · ssh " + (sm.sshAvailable ? "✓" : "⬜") + " · k8s " + (sm.k8sAvailable ? "✓" : "⬜") +
        " · terraform " + (sm.terraformAvailable ? "✓" : "⬜") + '</div>';
      h += grp("docker", j.docker) + grp("ssh", j.ssh) + grp("k8s", j.k8s) + grp("terraform", j.terraform);
      var clis = j.clis || [];
      if (clis.length) {
        h += '<div class="dw-meta">CLI ' + clis.filter(function (c) { return c.available; }).length + "/" + clis.length + '：</div>';
        clis.forEach(function (c) {
          h += '<div class="hit">' + (c.available ? "✓" : "⬜") + " " + esc(c.name || "?") +
            (c.version ? " · " + esc(String(c.version).slice(0, 44)) : "") + '</div>';
        });
      }
      if (j.hint) h += '<div class="dw-meta">' + esc(String(j.hint).slice(0, 160)) + '</div>';
      $("cloudOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function retestPanel() {
  $("dwBody").innerHTML = '<div class="dw-form" id="rtTabs">' +
    '<button data-a="plan" class="on">重跑计划</button><button data-a="flaky">flaky 台账</button></div>' +
    '<div id="rtOut"></div>';
  var out = $("rtOut");
  function go(a) {
    var tabs = document.querySelectorAll("#rtTabs button");
    for (var i = 0; i < tabs.length; i++) { tabs[i].className = tabs[i].getAttribute("data-a") === a ? "on" : ""; }
    out.innerHTML = '<div class="dw-meta">加载中…</div>';
    api("/api/govex/retest?action=" + a).then(function (j) {
      if (!j || j.ok === false) {
        var extra = (j && j.kind === "empty") ? "（发现测试文件 " + (j.discovered || 0) + " 个）" : "";
        out.innerHTML = '<div class="dw-meta">' + esc(((j && j.error) || "?") + extra) + '</div>';
        return;
      }
      var h = "";
      if (a === "plan") {
        var fs = Array.isArray(j.files) ? j.files.length : (j.files || 0);
        h += '<div class="dw-meta">文件 ' + fs + " · 名称模式 " + esc(j.name_pattern || "—") +
          " · flaky 命中 " + (j.flaky_count || 0) + '</div>';
        if (j.command) { h += '<pre class="dw-pre">' + esc(String(j.command)) + '</pre>'; }
        (j.failed_names || []).forEach(function (n) { h += '<div class="hit">↻ ' + esc(String(n)) + '</div>'; });
        if (j.note) { h += '<div class="dw-meta">' + esc(String(j.note)) + '</div>'; }
      } else {
        h += '<div class="dw-meta">运行 ' + (j.runs || 0) + " · 异常 " + (j.bad || 0) + " · flaky " + (j.flaky_count || 0) +
          " · 发现测试文件 " + (j.discovered || 0) + '</div>';
        (j.entries || []).forEach(function (e) {
          h += '<div class="hit">' + (e.flaky ? "⚡" : "·") + " <b>" + esc(e.name || e.key || "?") + '</b> · ' +
            esc(e.file || "") + " · 跑 " + (e.runs || 0) + " 败 " + (e.fails || 0) +
            (Array.isArray(e.history) && e.history.length ? ' · 史 [' + e.history.map(String).join("") + ']' : "") + '</div>';
        });
        if (!(j.entries || []).length) h += '<div class="dw-meta">台账为空（暂无重跑记录）</div>';
      }
      out.innerHTML = h;
    }).catch(function (e) { out.innerHTML = '<div class="dw-meta">失败：' + esc(String(e)) + '</div>'; });
  }
  $("rtTabs").addEventListener("click", function (ev) {
    var a = ev.target && ev.target.getAttribute ? ev.target.getAttribute("data-a") : null;
    if (a) go(a);
  });
  go("plan");
}
function spawnsPanel() {
  $("dwBody").innerHTML = '<button class="mini" id="spawnGo">▶ 刷新派生池</button><div id="spawnOut" style="margin-top:10px"></div>';
  function err(e) { $("spawnOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  function rec(r, depth) {
    var pad = "";
    for (var i = 0; i < depth; i++) { pad += "　"; }
    var h = '<div class="hit">' + pad + (r.ok === false ? "✗" : "⛓") + " <b>" + esc(r.id || r.name || "?") + '</b>' +
      (r.reuse_count ? " · 复用 " + r.reuse_count : "") +
      (r.usage && r.usage.tokens ? " · tok " + r.usage.tokens : "") +
      (r.status ? " · " + esc(String(r.status)) : "") + '</div>';
    (r.children || []).forEach(function (c) { h += rec(c, depth + 1); });
    return h;
  }
  $("spawnGo").onclick = function () {
    $("spawnOut").innerHTML = '<div class="dw-meta">读取中…</div>';
    api("/api/spawns").then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var st = j.stats || {};
      var h = '<div class="dw-meta">共 ' + (st.total || 0) + " · ok " + (st.ok || 0) + " · 败 " + (st.failed || 0) +
        " · 复用命中 " + (st.reuse_hits || 0) + " · tokens " + (st.tokens_total || 0) + '</div>';
      (j.records || []).forEach(function (r) { h += rec(r, 0); });
      if (!(j.records || []).length) h += '<div class="dw-meta">派生池为空（agent_spawn 尚未使用）</div>';
      $("spawnOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function reviewPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="revFiles" placeholder="文件列表（逗号分隔，如 lib/engine.ts, cli/org.ts）" autocomplete="off"><button id="revGo">分析</button></div><div id="revOut"></div>';
  function err(e) { $("revOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>'; }
  $("revGo").onclick = function () {
    var files = $("revFiles").value.split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    if (!files.length) { err("先输入至少一个文件路径"); return; }
    $("revOut").innerHTML = '<div class="dw-meta">分析中…</div>';
    api("/api/toolbox/review", { files: files }).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?"); return; }
      var h = '<div class="dw-meta">' + (j.from_codeowners ? "CODEOWNERS：" + esc(j.codeowners || "?") : "目录启发式（无 CODEOWNERS）") + '</div>';
      (j.reviewers || []).forEach(function (rv) {
        h += '<div class="hit">@' + esc(rv.name || "?") + " · 覆盖 " + (rv.files_covered != null ? rv.files_covered : "?") +
          (rv.reason ? " · " + esc(String(rv.reason).slice(0, 90)) : "") + '</div>';
      });
      if (!(j.reviewers || []).length) h += '<div class="dw-meta">（无推荐）</div>';
      $("revOut").innerHTML = h;
    }).catch(function (e) { err(String(e)); });
  };
}
function trackerPanel() {
  $("dwBody").innerHTML = '<div class="dw-form"><input id="tkRepo" placeholder="仓库 owner/name（空 = 工作区 git 远程）" autocomplete="off">' +
    '<select id="tkState" class="chip" style="flex:none"><option value="open">open</option><option value="closed">closed</option><option value="all">all</option></select>' +
    '<button id="tkGo">列取</button></div><div id="tkOut"></div>';
  function err(e, guidance) {
    $("tkOut").innerHTML = '<div class="dw-meta">失败：' + esc(e) + '</div>' +
      (guidance ? '<div class="dw-meta">' + esc(String(guidance).slice(0, 200)) + '</div>' : "");
  }
  $("tkGo").onclick = function () {
    var repo = $("tkRepo").value.trim();
    var st = $("tkState").value;
    $("tkOut").innerHTML = '<div class="dw-meta">列取中…（GitHub REST）</div>';
    api("/api/govex/tracker?action=list" + (repo ? "&repo=" + encodeURIComponent(repo) : "") + "&state=" + st).then(function (j) {
      if (!j || j.ok === false) { err((j && j.error) || "?", j && j.guidance); return; }
      var h = '<div class="dw-meta">' + esc(j.repo) + " · " + esc(j.state || st) + " · " + (j.count || 0) + " 条 · " + esc(j.token || "") + '</div>';
      (j.issues || []).forEach(function (it) {
        var labels = (it.labels || []).map(function (l) { return l && l.name ? l.name : l; }).filter(Boolean).join(", ");
        h += '<div class="hit" data-num="' + (it.number || "") + '">#' + (it.number || "?") + ' <b>' + esc(String(it.title || "").slice(0, 76)) + '</b>' +
          ' · ' + esc(it.state || "") + (labels ? ' · <span class="dw-meta" style="display:inline">' + esc(labels) + '</span>' : "") + '</div>';
      });
      if (!(j.issues || []).length) h += '<div class="dw-meta">（无工单）</div>';
      $("tkOut").innerHTML = h;
      var rows = $("tkOut").querySelectorAll(".hit[data-num]");
      for (var i = 0; i < rows.length; i++) {
        rows[i].style.cursor = "pointer";
        rows[i].onclick = (function (num) {
          return function () {
            var repo2 = $("tkRepo").value.trim();
            api("/api/govex/tracker?action=get&number=" + num + (repo2 ? "&repo=" + encodeURIComponent(repo2) : "")).then(function (g) {
              if (!g || g.ok === false) { return; }
              var it2 = g.issue || g.data || {};
              var d = '<div class="dw-meta">#' + (it2.number || num) + " · " + esc(it2.state || "") + (it2.comments != null ? " · 评论 " + it2.comments : "") + '</div>';
              d += '<div class="hit"><b>' + esc(String(it2.title || "")) + '</b></div>';
              if (it2.body) { d += '<pre class="dw-pre">' + esc(String(it2.body).slice(0, 1200)) + '</pre>'; }
              var box = document.createElement("div");
              box.innerHTML = d;
              $("tkOut").appendChild(box);
            });
          };
        })(Number(rows[i].getAttribute("data-num")) || 0);
      }
    }).catch(function (e) { err(String(e)); });
  };
}

/* ---- 数据装载 ---- */
function loadStatus() {
  return api("/api/status").then(function (r) {
    if (!r) return;
    state.experts = r.experts || [];
    state.usages = r.usages || [];
    if (r.model) state.model = r.model;
    if (!state.currentExpert && state.experts.length) state.currentExpert = state.experts[0].name;
    renderExperts(); renderSb(); crumb();
    if (state.currentExpert && !state.sessions.length) loadSessions();
  }).catch(function () {});
}
function loadSessions() {
  if (!state.currentExpert) return;
  api("/api/sessions?expert=" + encodeURIComponent(state.currentExpert)).then(function (r) {
    state.sessions = (r && r.sessions) || [];
    renderSessions();
  }).catch(function () {});
}
function loadRuns() {
  api("/api/runs").then(function (r) {
    state.runs = (r && r.runs) || [];
    renderRuns();
    renderEmpty();
  }).catch(function () {});
}
function loadProviders() {
  api("/api/providers").then(function (r) {
    var sel = $("chipLane"); sel.innerHTML = "";
    var names = ["scripted"];
    ((r && r.rows) || []).forEach(function (x) {
      var n = x.name || x.id || x.label;
      if (n && names.indexOf(n) < 0) names.push(n);
    });
    if (names.indexOf(state.model) < 0) names.push(state.model);
    names.forEach(function (n) {
      var o = document.createElement("option"); o.value = n; o.textContent = n;
      if (n === state.model) o.selected = true;
      sel.appendChild(o);
    });
  }).catch(function () {});
}

/* ---- 交互接线 ---- */
$("rbChat").onclick = function () { railTap("chat"); };
$("rbRuns").onclick = function () { railTap("runs"); };
$("rbTasks").onclick = function () { railTap("tasks"); };
$("rbAbout").onclick = function () { showAbout(); };
$("rbTools").onclick = function () { railTap("tools"); };
$("dwClose").onclick = closeDrawer;
$("toolFilter").addEventListener("input", renderTools);
$("taskGo").onclick = submitTaskNow;
$("taskNew").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submitTaskNow(); } });
$("newAsk").onclick = function () { state.currentSession = null; renderSessions(); crumb(); clearStream(); renderEmpty(); hint("新会话"); };
$("chipMode").onclick = function () {
  state.mode = state.mode === "team" ? "direct" : "team";
  $("modeTx").textContent = state.mode === "team" ? "团队" : "直连";
  $("chipMode").className = "chip" + (state.mode === "team" ? " hot" : "");
  crumb(); renderSb();
};
$("chipLane").onchange = function () { state.model = this.value; renderSb(); };
$("chipAppr").onclick = function () { refreshApprovals(); hint("审批队列已刷新"); };
$("send").onclick = send;
$("stop").onclick = abortRun;
$("btnCost").onclick = showCost;
$("sbCtx").onclick = showCost;
$("inp").addEventListener("input", autoGrow);
$("inp").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
});
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;
  if (!$("drawer").hidden) { closeDrawer(); return; }
  if (isNarrow() && $("side").classList.contains("open")) { closeSide(); return; }
  if (state.running) abortRun();
});
document.addEventListener("click", function (ev) {
  if (!isNarrow()) return;
  var side = $("side"), rail = $("rail");
  if (side.classList.contains("open") && !side.contains(ev.target) && !rail.contains(ev.target)) closeSide();
});

/* ---- boot ---- */
loadStatus().then(function () { loadProviders(); });
loadRuns();
renderTools();
refreshApprovals();
setInterval(refreshApprovals, 5000);
setInterval(renderSb, 10000);
setInterval(function () { if (!state.running) loadStatus(); if (state.sec === "tasks") renderTasks(); }, 15000);
</script>
</body>
</html>`;
}
