import type { Answer, Question, QuestionStats, Seed } from "./types";

const round = (n: number) => Math.round(n * 100) / 100;
export function calculateStats(data: Seed, q: Question): QuestionStats {
  const values = data.survey_responses.map((r) => r.answers[q.id]);
  if (q.type === "open") return { responses: values as string[] };
  if (q.type === "ranking") {
    const first_choice_counts = Object.fromEntries(
      q.options!.map((o) => [o, 0]),
    );
    const average_rank = Object.fromEntries(q.options!.map((o) => [o, 0]));
    for (const list of values as string[][]) {
      first_choice_counts[list[0]]++;
      list.forEach((o, i) => {
        average_rank[o] += i + 1;
      });
    }
    for (const o in average_rank)
      average_rank[o] = round(average_rank[o] / values.length);
    return { first_choice_counts, average_rank };
  }
  const options = q.type === "scale" ? ["1", "2", "3", "4", "5"] : q.options!;
  const counts = Object.fromEntries(options.map((o) => [o, 0]));
  for (const value of values)
    for (const o of Array.isArray(value) ? value : [String(value)]) counts[o]++;
  return q.type === "scale"
    ? {
        counts,
        mean: round(
          (values as number[]).reduce((s, v) => s + v, 0) / values.length,
        ),
      }
    : { counts };
}

export function validateSeed(input: unknown): Seed {
  const d = input as Seed;
  const require = (ok: unknown, reason: string) => {
    if (!ok) throw new Error(reason);
  };
  require(d && typeof d === "object", "研究数据格式异常");
  require(d.project?.team?.length === 3 &&
    typeof d.project.problem === "string", "项目信息不完整");
  require(d.survey_questions?.length === 22 &&
    d.survey_responses?.length === 15 &&
    d.interviews?.length === 4 &&
    d.interview_guide?.length ===
      25, "应包含4份访谈、15份答卷、22道问卷题及25道访谈题");
  require(new Set(d.survey_questions.map((q) => q.id)).size ===
    22, "问卷题号重复");
  d.survey_questions.forEach((q, i) =>
    require(q.id === `Q${i + 1}`, "问卷题号须按Q1–Q22顺序"),
  );
  require(new Set(d.interview_guide.map((q) => q.id)).size ===
    25, "访谈提纲题号重复");
  d.survey_responses.forEach((r, i) => {
    require(r.id === `R${String(i + 1).padStart(2, "0")}`, "答卷编号不匹配");
    require(Object.keys(r.answers).length === 22, `${r.id} 必须有22个回答`);
    for (const q of d.survey_questions) {
      const a = r.answers[q.id];
      if (q.type === "scale")
        require(Number.isInteger(a) &&
          Number(a) >= 1 &&
          Number(a) <= 5, `${r.id} ${q.id} 量表超出1–5`);
      else if (q.type === "open")
        require(typeof a === "string" && a.trim(), `${r.id} ${q.id} 缺少原话`);
      else if (["multi", "multi_max3", "ranking"].includes(q.type)) {
        require(Array.isArray(a) &&
          a.length > 0 &&
          new Set(a).size === a.length &&
          a.every((o) =>
            q.options?.includes(o),
          ), `${r.id} ${q.id} 多选或排序不合法`);
        if (q.type === "ranking")
          require((a as string[]).length === 6, "Q16必须保留完整六项排序");
        if (q.type === "multi_max3")
          require((a as string[]).length <= 3, "Q18最多选三项");
      } else
        require(typeof a === "string" &&
          q.options?.includes(a), `${r.id} ${q.id} 不属于原选项`);
    }
    for (const [id, exclusive] of [
      ["Q8", "没有遇到过以上情况"],
      ["Q17", "我更希望自己查看，不要主动推送"],
    ]) {
      const a = r.answers[id] as string[];
      require(!a.includes(exclusive) || a.length === 1, `${id}互斥选项冲突`);
    }
  });
  d.interviews.forEach((p, i) => {
    require(p.id === `I0${i + 1}`, "访谈编号不匹配");
    const planned = p.turns.filter((t) => t.kind === "planned");
    require(planned.length === 25 &&
      planned.every(
        (t, i) => t.question_id === d.interview_guide[i].id,
      ), "访谈须按原顺序包含25道预设问题");
    require(p.turns.filter((t) => t.kind === "spontaneous_followup").length >=
      8, "访谈缺少即时追问");
    require(p.turns.length % 2 === 0, "访谈轮次不完整");
    p.turns.forEach((t, i) => {
      require(typeof t.text === "string" &&
        t.text.trim() &&
        d.interview_guide.some(
          (q) => q.id === t.question_id && q.section === t.section,
        ), "访谈轮次内容或题号异常");
      require(t.speaker ===
        (i % 2 === 0 ? "interviewer" : "participant"), "访谈发言顺序异常");
      if (i % 2)
        require(t.question_id === p.turns[i - 1].question_id &&
          t.kind ===
            (p.turns[i - 1].kind === "planned"
              ? "answer"
              : "followup_answer"), "访谈问答不配对");
    });
  });
  require(d.survey_summary?.respondent_count === 15, "统计基数应为15");
  for (const q of d.survey_questions) {
    const actual = calculateStats(d, q),
      expected = d.survey_summary.question_stats[q.id];
    require(expected, `${q.id} 缺少统计`);
    for (const key of Object.keys(actual)) {
      const a = actual[key],
        e = expected[key];
      if (a && typeof a === "object" && !Array.isArray(a)) {
        require(e && typeof e === "object", `${q.id} 统计格式异常`);
        for (const o of new Set([...Object.keys(a), ...Object.keys(e!)]))
          require(a[o] ===
            ((e as Record<string, number>)[o] ??
              0), `${q.id} ${o} 统计与答卷不一致`);
      } else
        require(JSON.stringify(a) ===
          JSON.stringify(e), `${q.id} ${key} 与答卷不一致`);
    }
  }
  return d;
}
export function formatAnswer(answer: Answer, separator = " → "): string {
  return Array.isArray(answer) ? answer.join(separator) : String(answer);
}
export function buildCSV(data: Seed): string {
  const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"';
  const rows = [
    ["答卷编号", ...data.survey_questions.map((q) => q.id)],
    ...data.survey_responses.map((r) => [
      r.id,
      ...data.survey_questions.map((q) => formatAnswer(r.answers[q.id], "；")),
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(quote).join(",")).join("\r\n");
}
export function downloadFile(
  content: string,
  filename: string,
  type = "text/plain;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const percent = (count: number) =>
  `${((count / 15) * 100).toFixed(1).replace(".0", "")}%`;
