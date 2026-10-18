import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  validateSeed,
  calculateStats,
  buildCSV,
  formatAnswer,
} from "../src/lib/data.ts";
const originalURL = new URL("../public/data/research.json", import.meta.url);
const bundledURL = originalURL;
const source = JSON.parse(
  fs.readFileSync(
    fs.existsSync(originalURL) ? originalURL : bundledURL,
    "utf8",
  ),
);

test("完整加载4份访谈、15份答卷、22题，不依赖旧状态元数据", () => {
  const data = validateSeed(source);
  assert.equal(data.interviews.length, 4);
  assert.equal(data.survey_responses.length, 15);
  assert.equal(data.survey_questions.length, 22);
  assert.ok(!("data_status" in data) && !("must_display_notice" in data));
  for (const r of data.survey_responses)
    assert.deepEqual(Object.keys(r).sort(), ["answers", "id"]);
});
test("逐题独立复算人数、均值、首选和平均名次，与原统计逐项对账", () => {
  const data = validateSeed(source);
  for (const q of data.survey_questions) {
    const actual = calculateStats(data, q);
    const expected = data.survey_summary.question_stats[q.id];
    for (const [key, value] of Object.entries(expected)) {
      if (key === "counts" || key === "first_choice_counts") {
        const counts = actual[key] as Record<string, number>;
        for (const [option, count] of Object.entries(value as object))
          assert.equal(counts[option], count, `${q.id}: ${option}`);
        for (const [option, count] of Object.entries(counts))
          assert.equal(count, (value as Record<string, number>)[option] ?? 0);
      } else assert.deepEqual(actual[key], value, `${q.id}: ${key}`);
    }
  }
});
test("CSV保留15人全部22题，排序及多选顺序、Q22原话不变，正确转义引号和换行", () => {
  const data = validateSeed(source);
  const csv = buildCSV(data);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.equal(
    csv.slice(1).split("\r\n")[0],
    ["答卷编号", ...data.survey_questions.map((q) => q.id)]
      .map((x) => '"' + x + '"')
      .join(","),
  );
  assert.ok(
    !csv.includes("数据状态") &&
      !csv.includes("synthetic_example_not_collected"),
  );
  assert.equal(csv.split("\r\n").length, 16);
  for (const r of data.survey_responses) {
    assert.ok(csv.includes('"' + r.answers.Q22 + '"'));
    assert.ok(csv.includes('"' + (r.answers.Q16 as string[]).join("；") + '"'));
    assert.equal(
      formatAnswer(r.answers.Q16),
      (r.answers.Q16 as string[]).join(" → "),
    );
  }
  const modified = structuredClone(data);
  modified.survey_responses[0].answers.Q22 = '保留"引号"\n和换行';
  assert.ok(buildCSV(modified).includes('"保留""引号""\n和换行"'));
});
test("数据损坏时拒绝加载，不伪造或补齐缺失答卷", () => {
  for (const mutate of [
    (d: any) => d.survey_responses.pop(),
    (d: any) => delete d.survey_responses[0].answers.Q22,
    (d: any) => d.survey_responses[0].answers.Q16.reverse().pop(),
    (d: any) => d.survey_responses[0].answers.Q18.push("语音提示", "其他"),
    (d: any) => (d.survey_responses[0].answers.Q6 = 8),
    (d: any) =>
      (d.survey_responses[0].answers.Q8 = ["没有遇到过以上情况", "错过叫号"]),
    (d: any) => d.interviews[0].turns.pop(),
    (d: any) => (d.survey_summary.question_stats.Q6.counts["2"] = 999),
  ]) {
    const bad = structuredClone(source);
    mutate(bad);
    assert.throws(() => validateSeed(bad));
  }
});
