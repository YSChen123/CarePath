import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Download,
  ChevronDown,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../lib/context";
import { buildCSV, downloadFile, formatAnswer } from "../lib/data";
import { EmptyState, SearchField, Tabs } from "../components/Shared";
import { typeLabels } from "../components/QuestionBank";
import QuestionReader from "../components/QuestionReader";
import RespondentDialog from "../components/RespondentDialog";
import QuestionBank from "../components/QuestionBank";
export default function Survey() {
  const d = useData(),
    [params, setParams] = useSearchParams();
  const view = params.get("view") === "table" ? "table" : "question";
  const question =
    d.survey_questions.find((q) => q.id === params.get("q")) ||
    d.survey_questions[0];
  const index = d.survey_questions.indexOf(question);
  const [search, setSearch] = useState(""),
    [downloaded, setDownloaded] = useState(false);
  const [personId, setPersonId] = useState<string | null>(() =>
    params.get("view") === "individual" ? params.get("person") || "R01" : null,
  );
  useEffect(() => {
    setPersonId(
      params.get("view") === "individual"
        ? params.get("person") || "R01"
        : null,
    );
  }, [params]);
  const table = useRef<HTMLDivElement>(null);
  const people = d.survey_responses.filter((p) =>
    (
      p.id +
      " " +
      Object.values(p.answers)
        .map((a) => formatAnswer(a))
        .join(" ")
    )
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  function choose(id: string) {
    setParams({ view, q: id });
    setSearch("");
  }
  function changeView(value: string) {
    setParams({ view: value, q: question.id });
    setSearch("");
  }
  useLayoutEffect(() => {
    if (view !== "table") return;
    const head = table.current?.querySelector<HTMLElement>(
      `th[data-column="${question.id}"]`,
    );
    if (head && table.current)
      table.current.scrollTo({
        left:
          head.offsetLeft -
          (table.current.querySelector<HTMLElement>("th")?.offsetWidth || 88),
        behavior: "instant",
      });
  }, [view, question.id, people.length]);
  return (
    <div className="research-panel survey-panel">
      <header className="subpage-heading">
        <h2>问卷调查</h2>
        <p>
          问卷围绕独自就诊经历、流程中遇到的困难，以及对手机辅助方式的偏好展开。本次共整理15份作答，保留每道题的原始选项与回答。
        </p>
      </header>
      <section className="method-section">
        <h3>问卷设计</h3>
        <div className="method-content">
          <p>
            问卷共22题，包含基本情况、就诊经历和手机辅助偏好三个部分，题型包括单选、多选、5点量表、排序和开放回答。
          </p>
          <ul className="survey-groups">
            <li>基本情况（Q1–Q5）</li>
            <li>陌生医院就诊经历（Q6–Q15）</li>
            <li>手机辅助偏好（Q16–Q22）</li>
          </ul>
          <details className="source-expander">
            <summary>
              查看全部22道题 <ChevronDown size={18} />
            </summary>
            <div className="expander-body">
              <QuestionBank questions={d.survey_questions} />
            </div>
          </details>
        </div>
      </section>
      <header className="records-heading" id="survey-records">
        <h3>{view === "table" ? "原始问卷数据" : "按题查看"}</h3>
        {view === "table" && (
          <div className="export-action">
            <button
              className="button secondary"
              onClick={() => {
                downloadFile(
                  buildCSV(d),
                  "医路同行_问卷原始记录.csv",
                  "text/csv;charset=utf-8",
                );
                setDownloaded(true);
              }}
            >
              <Download size={17} />
              导出 CSV
            </button>
            {downloaded && <span role="status">已导出15份完整答卷</span>}
          </div>
        )}
      </header>
      <Tabs
        value={view}
        onChange={changeView}
        label="问卷查看方式"
        items={[
          { id: "question", label: "按题目查看" },
          { id: "table", label: "原始数据表" },
        ]}
      />
      <div className="survey-toolbar">
        <label className="question-select">
          <span>{view === "table" ? "定位题号" : "选择题目"}</span>
          <select
            aria-label={view === "table" ? "定位题号" : "选择题目"}
            value={question.id}
            onChange={(e) => choose(e.target.value)}
          >
            {d.survey_questions.map((q) => (
              <option key={q.id} value={q.id}>
                {q.id} · {q.text}
              </option>
            ))}
          </select>
        </label>
        {view === "question" ? (
          <div className="question-pager">
            <span>
              {index + 1} / {d.survey_questions.length}
            </span>
            <button
              className="icon-button"
              aria-label="上一题"
              disabled={index === 0}
              onClick={() => choose(d.survey_questions[index - 1].id)}
            >
              <ArrowLeft size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="下一题"
              disabled={index === d.survey_questions.length - 1}
              onClick={() => choose(d.survey_questions[index + 1].id)}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <SearchField
            value={search}
            onChange={setSearch}
            label="检索原始答卷"
            placeholder="搜索编号或回答"
          />
        )}
      </div>
      {view === "question" ? (
        <QuestionReader
          question={question}
          respondents={d.survey_responses}
          search={search}
          onSearch={setSearch}
          onPerson={setPersonId}
        />
      ) : (
        <>
          <div className="table-question">
            <span className="question-id">{question.id}</span>
            <p>
              {question.text}
              <small>{typeLabels[question.type]}</small>
            </p>
            <button
              className="text-button"
              onClick={() => changeView("question")}
            >
              查看原题与选项
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="table-meta">
            <p>横向滚动查看全部题目，编号与表头固定。</p>
            <span role="status">
              {people.length} / {d.survey_responses.length}份记录
            </span>
          </div>
          {people.length ? (
            <div
              className="raw-table-scroll"
              ref={table}
              role="region"
              aria-label="问卷原始数据表，可横向滚动"
              tabIndex={0}
            >
              <table className="raw-table">
                <caption className="sr-only">
                  15份问卷的全部22题原始回答，Q16的箭头保留六项排序。
                </caption>
                <thead>
                  <tr>
                    <th scope="col">编号</th>
                    {d.survey_questions.map((q) => (
                      <th
                        scope="col"
                        key={q.id}
                        data-column={q.id}
                        className={
                          q.id === question.id ? "highlight-column" : ""
                        }
                      >
                        <button onClick={() => choose(q.id)} title={q.text}>
                          {q.id}
                          <small>{typeLabels[q.type]}</small>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        <button
                          onClick={() => setPersonId(p.id)}
                          aria-label={`查看 ${p.id} 完整答卷`}
                        >
                          {p.id}
                          <ArrowUpRight size={12} />
                        </button>
                      </th>
                      {d.survey_questions.map((q) => (
                        <td
                          key={q.id}
                          data-cell={`${p.id}-${q.id}`}
                          className={`${q.id === question.id ? "highlight-column" : ""} ${["ranking", "open"].includes(q.type) ? "wide-cell" : ""}`}
                        >
                          {formatAnswer(
                            p.answers[q.id],
                            q.type === "ranking" ? " → " : "；",
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState onReset={() => setSearch("")} />
          )}
          <p className="table-footnote">
            Q16为完整六项排序；Q18最多三项；Q22保留每位答卷的原始文字。点击编号可阅读完整答卷。
          </p>
        </>
      )}
      {personId && (
        <RespondentDialog
          id={personId}
          onClose={() => setPersonId(null)}
          onSelect={setPersonId}
        />
      )}
    </div>
  );
}
