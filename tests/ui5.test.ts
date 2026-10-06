// ============================================================================
// tests/ui5.test.ts — UI v5 骨架冒烟（S1）
//   守护 renderV5Page() 的模板完整性：关键锚点 + 核心函数在位 + 体量下限。
//   历史背景：模板转义事故（\\` 截断）曾致页面脚本残缺 —— 本测试即防复发锁。
// ============================================================================
import { describe, test, expect } from "bun:test";
import { renderV5Page } from "../web/ui5/ui.ts";

describe("UI v5 骨架冒烟（ORG_WEB_UI=v5 轨）", () => {
  const page = renderV5Page();

  test("页面组装：DOM 锚点齐备（rail/侧栏/composer/状态栏/审批条）", () => {
    const anchors = [
      'id="app"', 'id="rail"', "rbChat", "rbRuns", "rbTasks", "rbAbout",
      "newAsk", "lstExp", "lstSes", "lstRuns", "lstTasks",
      "chipMode", "chipLane", "chipAppr", "inp", 'id="send"', 'id="stop"',
      "sbCtx", "sbTok", "sbLane", "sbState", 'id="appr"', "streamCol",
      "rbTools", "secTools", "lstTools", "toolFilter", 'id="drawer"', "dwBody", "dwClose",
    ];
    const miss = anchors.filter((k) => !page.includes(k));
    if (miss.length) console.error("缺失锚点:", miss.join(", "));
    expect(miss.length).toBe(0);
  });

  test("脚本完整：SSE 引擎 + 事实字典 + 流程函数在位", () => {
    const fns = [
      "function ssePost", "function factLine", "function taskSeg", "function appendFact",
      "function startTeam", "function startDirect", "function renderEmpty",
      "function renderSessions", "function renameSession", "function deleteSession",
      "function refreshApprovals", "function renderSb", "function replayRun",
      "function renderTools", "function openDrawer", "function closeDrawer",
      "function scanPanel", "function symbolsPanel", "function sbomPanel", "function dbPanel", "function diffPanel", "function pdfPanel", "function mcpPanel", "function sastPanel", "function iacPanel", "function gitPanel", "function depsPanel", "function debugPanel", "function cloudPanel", "function retestPanel", "function spawnsPanel", "function reviewPanel", "function trackerPanel", "function providersPanel", "function audioPanel", "function searchPanel", "function memoryPanel", "function schedPanel", "function notifyPanel", "function collabPanel", "function visionPanel", "function voicePanel",
    ];
    const miss = fns.filter((k) => !page.includes(k));
    if (miss.length) console.error("缺失函数:", miss.join(", "));
    expect(miss.length).toBe(0);
  });

  test("客户端脚本可解析（防模板转义截断 · 2026-10-05 双反斜杠事故锁）", () => {
    const m = page.match(/<script>([\s\S]*)<\/script>/);
    expect(m).not.toBeNull();
    expect(() => new Function(m![1])).not.toThrow();
  });

  test("工具箱注册表对齐：26 卡 · run 指向的函数全部定义", () => {
    const m = page.match(/var TOOLS = \[([\s\S]*?)\];/);
    expect(m).not.toBeNull();
    const runs = m![1].match(/run: "([A-Za-z]+)"/g) || [];
    expect(runs.length).toBe(26);
    for (const r of runs) {
      const fn = r.match(/run: "([A-Za-z]+)"/)![1];
      if (!page.includes("function " + fn)) console.error("缺函数:", fn);
      expect(page.includes("function " + fn)).toBe(true);
    }
  });

  test("API 消费面矩阵：34 端点在手（S3 换轨筹备）", () => {
    const eps = [
      "/api/status", "/api/runs", "/api/run-stream", "/api/ask-stream", "/api/abort",
      "/api/sessions", "/api/session/", "/api/providers", "/api/providers/test",
      "/api/approvals", "/api/audio-compose", 
      "/api/toolbox/scan", "/api/toolbox/symbols", "/api/toolbox/sbom", "/api/toolbox/db",
      "/api/toolbox/diff", "/api/toolbox/pdfread", "/api/toolbox/review",
      "/api/govex/mcp", "/api/govex/sast", "/api/govex/iacscan", "/api/govex/gitstate",
      "/api/govex/deps", "/api/govex/debug", "/api/govex/cloud", "/api/govex/retest",
      "/api/govex/collab", "/api/govex/tracker", "/api/spawns",
      "/api/search", "/api/memory", "/api/schedules", "/api/notifications",
      "/api/vision", "/api/asr", "/api/tts",
    ];
    // 注：音频直通链接（/api/audio?…）由服务端响应动态给出，不在页面字面量中
    const fixed = eps.concat(["/api/cost"]);
    const miss = fixed.filter(function (e) { return !page.includes(e); });
    if (miss.length) console.error("缺端点:", miss.join(", "));
    expect(miss.length).toBe(0);
  });

  test("模板体量 sanity（曾蒸发/截断事故 → 下限防御）", () => {
    expect(page.length).toBeGreaterThan(36000);
    expect(page.includes("org · console")).toBe(true);
    expect(page.trim().endsWith("</html>")).toBe(true);
  });
});
