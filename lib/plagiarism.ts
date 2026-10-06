// ============================================================================
// lib/plagiarism.ts — 原创性/查重自检（歌曲测试 F3 前置件）
// ----------------------------------------------------------------------------
// 定位：把歌曲生成测试中的查重探针（chk_plag / chk_multi，Python）正式
//       产品化为三端可复用件（CLI `org plag` · 供 Web/TUI 与验收链复用）。
// 算法：纯汉字/字母数字归一后做 7 字滑窗（步长 3），每窗对参考语料全体窗
//       取 LCS 相似度（ratio = 2·LCS/(|a|+|b|)）；≥0.8 记「近逐字」，
//       ≥0.6 记「高度相似」。判定（v0.5.46 收紧）：命中率 > 12% → fail；
//       > 6% 或**存在任一近逐字命中** → borderline；否则 pass。
//       （「不得抄袭」语义下，单句逐字也必须至少警示——pct 会被长文稀释。）
// 纪律：零外联 · 零依赖 · 全内存（文件规模：数十 KB 级为宜）。
// ============================================================================
import * as fs from "./fssafe-fs.ts";
import * as path from "node:path";

export interface PlagHit {
  window: string;
  refWindow: string;
  ratio: number;
}

export interface PlagRefReport {
  name: string;
  /** 命中数（ratio ≥ 0.6） */
  hits: number;
  /** 近逐字数（ratio ≥ 0.8） */
  hit80: number;
  /** 命中率（hits / windows，%） */
  pct: number;
  maxRatio: number;
  /** 代表性命中（按 ratio 降序，≤ 10 条） */
  samples: PlagHit[];
}

export interface PlagReport {
  ok: boolean;
  file: string;
  windows: number;
  refs: PlagRefReport[];
  verdict: "pass" | "borderline" | "fail";
  summary: string;
}

/** 归一：仅保留汉字与字母数字（去空白/标点/其他符号）。 */
function normalize(s: string): string {
  return s.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "");
}

/** 7 字滑窗（步长 3，覆盖面与探针一致）。 */
export function windows7(text: string, step = 3): string[] {
  const t = normalize(text);
  const out: string[] = [];
  for (let i = 0; i + 7 <= t.length; i += step) out.push(t.slice(i, i + 7));
  return out;
}

/** LCS 相似度（2M/(|a|+|b|)，difflib.SequenceMatcher.ratio 同式）。 */
export function ratio(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0 || n === 0) return 0;
  let prev = new Array<number>(n + 1).fill(0);
  let curr = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j]!, curr[j - 1]!);
    }
    const tmp = prev; prev = curr; curr = tmp; curr.fill(0);
  }
  const lcs = prev[n]!;
  return (2 * lcs) / (m + n);
}

export interface PlagOpts {
  /** 命中采样上限（每参考文件，默认 10） */
  sampleCap?: number;
  /** 窗口步长（默认 3） */
  step?: number;
}

/**
 * 对单个样本与一批参考语料做查重，返回结构化报告。
 * 判定：参考文件命中率命中数(≥0.6)/windows；取所有参考中最差项定级。
 */
export function checkPlagiarism(
  sampleFile: string,
  refFiles: string[],
  opts: PlagOpts = {},
): PlagReport {
  const sample = fs.readFileSync(sampleFile, "utf-8");
  const windows = windows7(sample, opts.step ?? 3);
  const report: PlagReport = {
    ok: false, file: sampleFile, windows: windows.length, refs: [],
    verdict: "pass", summary: "",
  };
  if (windows.length === 0) {
    report.summary = "样本归一后无可用 7 字滑窗（文本过短或无非空内容）";
    return report;
  }
  let worst = 0;
  for (const refFile of refFiles) {
    let refText = "";
    try {
      refText = fs.readFileSync(refFile, "utf-8");
    } catch {
      report.refs.push({
        name: path.basename(refFile), hits: 0, hit80: 0, pct: 0, maxRatio: 0,
        samples: [{ window: "(读取失败)", refWindow: "", ratio: 0 }],
      });
      continue;
    }
    const refWindows = windows7(refText, opts.step ?? 3);
    const hits: PlagHit[] = [];
    let maxRatio = 0;
    for (const w of windows) {
      let best = 0, bestRef = "";
      for (const rw of refWindows) {
        const rt = ratio(w, rw);
        if (rt > best) { best = rt; bestRef = rw; }
        if (best === 1) break;
      }
      if (best > maxRatio) maxRatio = best;
      if (best >= 0.6) hits.push({ window: w, refWindow: bestRef, ratio: Math.round(best * 100) / 100 });
    }
    const hit80 = hits.filter((h) => h.ratio >= 0.8).length;
    const pct = (hits.length / windows.length) * 100;
    if (pct > worst) worst = pct;
    hits.sort((a, b) => b.ratio - a.ratio);
    report.refs.push({
      name: path.basename(refFile), hits: hits.length, hit80,
      pct: Math.round(pct * 10) / 10, maxRatio: Math.round(maxRatio * 100) / 100,
      samples: hits.slice(0, opts.sampleCap ?? 10),
    });
  }
  const totalHit80 = report.refs.reduce((n, r) => n + r.hit80, 0);
  report.verdict = worst > 12 ? "fail" : (worst > 6 || totalHit80 > 0) ? "borderline" : "pass";
  report.ok = report.verdict !== "fail";
  const worstRef = report.refs.reduce((a, b) => (b.pct > a.pct ? b : a), report.refs[0]!);
  report.summary = `滑窗 ${windows.length} · 最差「${worstRef.name}」命中率 ${worstRef.pct}%（近逐字共 ${totalHit80}）→ 判定 ${report.verdict}`;
  return report;
}
