import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { browserOptions } from "./browser-options.mjs";
import { DataContext } from "../src/lib/context";
import { validateSeed, buildCSV, formatAnswer } from "../src/lib/data";
import {
  introduction,
  originalGuide,
  interviewSections,
} from "../src/data/originalGuide";
import QuestionBank from "../src/components/QuestionBank";
import Contribution from "../src/components/Contribution";
import Team from "../src/pages/Team";
import Proposal from "../src/pages/Proposal";

const d = validateSeed(
  JSON.parse(
    await readFile(
      new URL("../public/data/research.json", import.meta.url),
      "utf8",
    ),
  ),
);
const out = new URL("../submission/", import.meta.url);
await mkdir(out, { recursive: true });
const url = process.env.PROJECT_PUBLIC_URL?.trim();
if (url && !/^https:\/\//.test(url))
  throw new Error("公开网址必须是实际HTTPS地址");
const content = (
  <DataContext.Provider value={d}>
    <MemoryRouter>
      <header className="submission-front">
        <h1>医路同行</h1>
        <p>山东大学计算机科学与技术学院</p>
        <p>陈玉澍 202300130073　张涛 202218130289　依力扎提 202301130286</p>
        <p>
          项目简介：我们关注第一次独自到陌生医院就诊时，不清楚现在做到哪一步、下一步做什么、下一步去哪的问题，希望将分散的信息整理为连续的就诊步骤。
        </p>
        <p className={!url ? "pending" : ""}>
          网站链接：
          {url ||
            "【待填写：网站发布后的实际HTTPS公网地址；localhost不可提交】"}
        </p>
        <p>
          内容：团队介绍、项目提案、数据收集计划、四份完整访谈、问卷原题、十五份原始答卷、贡献声明。
        </p>
      </header>
      <section className="new-page">
        <Team />
      </section>
      <section className="new-page">
        <Proposal />
      </section>
      <section className="new-page">
        <h1>数据收集计划</h1>
        <p>
          我们通过访谈了解具体的就诊经历，再用问卷梳理常见问题和使用偏好。前者关心一段经历是怎么发生的，后者帮助我们比较不同问题出现的情况。
        </p>
        <h2>访谈设计</h2>
        <p>
          采用半结构化访谈。先请受访者回忆最近一次就诊经历，再根据他们提到的具体问题继续追问，尽量弄清当时怎么判断、从哪里找信息、最后怎么解决。
        </p>
        <p>
          访谈对象：有独自到不熟悉医院就诊经历的大学生，共4人。原方案计划每次25–30分钟，不作为实际访谈时长。
        </p>
        <h2>问卷设计</h2>
        <p>
          问卷共22题，包含基本情况、就诊经历和手机辅助偏好三个部分，题型包括单选、多选、5点量表、排序和开放回答。本次整理15份作答，保留原始选项与回答。
        </p>
        <h3>原始访谈提纲</h3>
        <p>{introduction}</p>
        {interviewSections.map((s) => (
          <section key={s.id}>
            <h3>{s.title}</h3>
            {d.interview_guide
              .filter((q) => q.section === s.id)
              .map((q) => (
                <div className="guide-entry" key={q.id}>
                  <p>
                    <b>
                      {q.id}　{originalGuide[q.id].question}
                    </b>
                  </p>
                  {originalGuide[q.id].probes && (
                    <p>可追问：{originalGuide[q.id].probes}</p>
                  )}
                </div>
              ))}
          </section>
        ))}
      </section>
      {d.interviews.map((p) => (
        <section className="new-page interview-document" key={p.id}>
          <h1>
            访谈记录 · {p.alias}（{p.id}）
          </h1>
          <p>
            {p.role}。{p.scenario}
          </p>
          {interviewSections.map((s) => (
            <section key={s.id}>
              <h2>{s.title}</h2>
              {p.turns
                .filter((t) => t.section === s.id)
                .map((t, i) => (
                  <div
                    className={`pdf-turn ${t.kind.includes("followup") ? "followup" : ""}`}
                    key={i}
                  >
                    <p className="speaker">
                      <b>
                        {t.speaker === "interviewer" ? "访谈者" : p.alias}　
                        {t.kind === "spontaneous_followup"
                          ? "即时追问"
                          : t.kind === "followup_answer"
                            ? "追问回答"
                            : t.kind === "planned"
                              ? t.question_id
                              : ""}
                      </b>
                    </p>
                    <p data-original-turn>{t.text}</p>
                  </div>
                ))}
            </section>
          ))}
        </section>
      ))}
      <section className="new-page">
        <h1>原问卷 · 全部22道题</h1>
        <QuestionBank questions={d.survey_questions} expanded />
      </section>
      {d.survey_responses.map((p) => (
        <section className="new-page survey-document" key={p.id}>
          <h1>原始问卷数据 · {p.id}</h1>
          <p>题号对应前文原问卷；Q16按从最想先看到到最不重要保留六项顺序。</p>
          <table>
            <thead>
              <tr>
                <th>题号</th>
                <th>原始回答 · {p.id}</th>
              </tr>
            </thead>
            <tbody>
              {d.survey_questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td data-original-answer>
                    {formatAnswer(
                      p.answers[q.id],
                      q.type === "ranking" ? " → " : "；",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <section className="new-page">
        <Contribution />
        <h2>提交署名待确认字段</h2>
        <p>
          原始项目陈述：Context、Problem、Motivation &amp; Importance、Why
          Smartphone四节的初稿与审阅者待确认。
        </p>
        <p>
          本轮提交PDF：团队介绍、项目提案、数据收集计划、访谈整理、问卷表格各部分的初稿撰写与完善/审阅署名待成员逐项确认。上述已记录的作业2分节归属及本轮执行分工不受影响。
        </p>
        <p>截止时间以教师最新通知为准。</p>
      </section>
    </MemoryRouter>
  </DataContext.Provider>
);
const style = `@page {size:A4;margin:20mm 20mm 22mm;} *{box-sizing:border-box;font-size:12pt!important;line-height:18pt!important;}body{font-family:'Times New Roman','SimSun','Microsoft YaHei',serif;margin:0;color:#142c27;background:white;}h1,h2,h3,h4,h5{font-weight:bold;margin:18pt 0 9pt;break-after:avoid;}p{margin:0 0 9pt;}a{color:inherit;text-decoration:none;} .new-page{break-before:page;} .pending{border:1pt solid #18332f;padding:9pt;font-weight:bold;} .member-list>div{margin:9pt 0;}.member-list h2{margin:0;}table{border-collapse:collapse;width:100%;margin:12pt 0;}th,td{border:.5pt solid #758780;padding:6pt 8pt;text-align:left;vertical-align:top;white-space:pre-wrap;}th{background:#eef3ef;}thead{display:table-header-group;}tr{break-inside:avoid;}.survey-document td,.survey-document th{padding:2pt 8pt;}.survey-document td:first-child,.survey-document th:first-child{width:48pt;white-space:nowrap;}.survey-document h1{margin-top:9pt;}.pdf-turn{break-inside:avoid;margin:12pt 0;}.pdf-turn p{margin:0 0 3pt;}.followup{border-left:1.5pt solid #758780;padding-left:9pt;}.page-next,.sr-only,.question-detail summary>svg,.bank-section-heading>span,.contribution-columns .caption{display:none;}summary{list-style:none;}.question-detail{break-inside:avoid;margin:12pt 0;}.question-detail summary{display:block;}.question-type{display:block;}.question-detail h4{margin:0 0 6pt;}.option-list{list-style:none;padding:0;margin:0;}.option-list li>span{margin-right:9pt;}.scale-options{display:flex;gap:9pt;}.scale-options>div{flex:1;}.scale-options span{display:block;}.bank-section-heading{margin-top:18pt;}.question-id{font-weight:bold;}.proposal-flow{border-block:.5pt solid #758780;padding:9pt 0;margin:12pt 0;}.proposal-flow ol{display:flex;list-style:none;padding:0;gap:9pt;flex-wrap:wrap;}.proposal-flow li:not(:last-child)::after{content:' →';}.guide-entry{break-inside:avoid;}.guide-entry p{margin-bottom:6pt;}.proposal-page .section-label{display:none;}.proposal-section h2{margin-top:12pt;}.proposal-section .caption{break-before:avoid;}.contribution{margin-top:12pt;}.contribution p{margin-bottom:9pt;}`;
const html =
  '<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><title>医路同行 · Lab4提交材料</title><style>' +
  style +
  "</style></head><body>" +
  renderToStaticMarkup(content) +
  "</body></html>";
await writeFile(new URL("Lab4_submission.html", out), html);
await writeFile(new URL("问卷原始数据.csv", out), buildCSV(d));
await writeFile(
  new URL("访谈完整记录.md", out),
  "# 医路同行｜完整访谈记录\n\n" +
    d.interviews
      .map(
        (p) =>
          `## ${p.alias}（${p.id}）\n\n${p.role}。${p.scenario}\n\n` +
          p.turns
            .map(
              (t) =>
                `**${t.speaker === "interviewer" ? "访谈者" : p.alias}${t.kind.includes("followup") ? " · 追问" : ""}：** ${t.text}`,
            )
            .join("\n\n"),
      )
      .join("\n\n"),
);
const browser = await chromium.launch(browserOptions);
try {
  const page = await browser.newPage();
  await page.goto(new URL("Lab4_submission.html", out).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: fileURLToPath(new URL("Lab4_submission.pdf", out)),
    format: "A4",
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate:
      '<div style="font-family:Times New Roman;font-size:12pt;width:100%;text-align:center;color:#18332f"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  console.log(
    "PASS: 已生成PDF、HTML、完整访谈Markdown、23列CSV。" +
      (url ? "已填入所提供公网URL。" : "公网URL与待核对署名已明确标记。"),
  );
} finally {
  await browser.close();
}
