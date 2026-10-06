// ============================================================================
// tests/plagiarism.test.ts — 原创性/查重自检（v0.5.46 · F3 前置件）
//   核心：7 字滑窗 + LCS 相似度；正例命中 / 负例通过 / 边界判定。
// ============================================================================
import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { checkPlagiarism, windows7, ratio } from "../lib/plagiarism.ts";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "plag-"));

describe("plagiarism 查重核心（v0.5.46）", () => {
  test("ratio：完全一致 = 1 · 无交集 < 0.2", () => {
    expect(ratio("abcdefg", "abcdefg")).toBe(1);
    expect(ratio("abcdefg", "zzzzzzz")).toBeLessThan(0.2);
  });

  test("windows7：归一（去标点）+ 步长滑窗", () => {
    const w = windows7("春江潮水连海平，海上明月共潮生。");
    expect(w.length).toBeGreaterThan(0);
    expect(w[0]!.length).toBe(7);
  });

  test("正例：整句抄袭 → 近逐字命中 + 判定不合格", () => {
    const ref = path.join(TMP, "ref.md");
    const smp = path.join(TMP, "smp.md");
    fs.writeFileSync(ref, "浔阳江头夜送客，枫叶荻花秋瑟瑟。主人下马客在船，举酒欲饮无管弦。");
    fs.writeFileSync(smp, "某文如下：浔阳江头夜送客，枫叶荻花秋瑟瑟。主人下马客在船，举酒欲饮无管弦。后接原创内容另行展开。");
    const r = checkPlagiarism(smp, [ref]);
    expect(r.refs[0]!.hit80).toBeGreaterThan(0);
    expect(r.verdict).toBe("fail");
  });

  test("负例：全原创 → 通过", () => {
    const ref = path.join(TMP, "ref2.md");
    const smp = path.join(TMP, "smp2.md");
    fs.writeFileSync(ref, "浔阳江头夜送客，枫叶荻花秋瑟瑟。");
    fs.writeFileSync(smp, "霜落寒江雾未收，客舟孤泊芦花洲。沙头雁过三更后，谁拨冰弦向远楼。一声初起风生水，万籁齐消月近舟。");
    const r = checkPlagiarism(smp, [ref]);
    expect(r.verdict).toBe("pass");
  });

  test("单句借用（长文中一处逐字）→ 至少擦边（不得通过）", () => {
    const ref = path.join(TMP, "ref4.md");
    const smp = path.join(TMP, "smp4.md");
    fs.writeFileSync(ref, "浔阳江头夜送客，枫叶荻花秋瑟瑟。主人下马客在船，举酒欲饮无管弦。");
    fs.writeFileSync(smp, "这是一段完全原创的长文展开，描绘寒江秋夜的孤寂与舟中客的思绪。"
      + "霜落寒江雾未收，客舟孤泊芦花洲。沙头雁过三更后，谁拨冰弦向远楼。"
      + "但其中嵌入了一句：主人下马客在船，举酒欲饮无管弦。其余内容皆为自撰，"
      + "且后续段落继续原创铺陈，谈江月与弦音如何交织出夜色的清冷与深沉。");
    const r = checkPlagiarism(smp, [ref]);
    expect(r.refs[0]!.hit80).toBeGreaterThan(0);
    expect(r.verdict).toBe("borderline");
  });

  test("样本过短：诚实拒绝（无滑窗）", () => {
    const ref = path.join(TMP, "ref3.md");
    const smp = path.join(TMP, "smp3.md");
    fs.writeFileSync(ref, "浔阳江头夜送客。");
    fs.writeFileSync(smp, "太短。");
    const r = checkPlagiarism(smp, [ref]);
    expect(r.windows).toBe(0);
    expect(r.verdict).toBe("pass");
    expect(r.summary).toContain("无可用");
  });
});
