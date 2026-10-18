import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ChevronDown, Printer } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useData } from "../lib/context";
import { EmptyState, SearchField } from "../components/Shared";
import { interviewSections } from "../data/originalGuide";
import InterviewDesign from "../components/InterviewDesign";
export default function Interviews() {
  const d = useData(),
    [params, setParams] = useSearchParams(),
    [search, setSearch] = useState("");
  const person =
    d.interviews.find((p) => p.id === params.get("person")) || d.interviews[0];
  const content = useRef<HTMLDivElement>(null),
    term = search.trim().toLowerCase();
  const groups = d.interview_guide
    .map((q) => ({
      q,
      turns: person.turns.filter((t) => t.question_id === q.id),
    }))
    .filter(
      (g) =>
        !term ||
        g.q.id.toLowerCase() === term ||
        g.turns.some((t) => t.text.toLowerCase().includes(term)),
    );
  function expand(open: boolean) {
    content.current
      ?.querySelectorAll<HTMLDetailsElement>(".transcript-section")
      .forEach((el) => {
        el.open = open;
      });
  }
  function select(id: string) {
    setParams({ person: id });
    setSearch("");
  }
  function printInterview() {
    const previousSearch = search;
    flushSync(() => setSearch(""));
    expand(true);
    try {
      window.print();
    } finally {
      setSearch(previousSearch);
    }
  }
  function jump(id: string) {
    const el = document.getElementById(
      "transcript-" + id,
    ) as HTMLDetailsElement | null;
    if (el) {
      el.open = true;
      el.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
  }
  return (
    <div className="research-panel interview-panel">
      <header className="subpage-heading">
        <h2>用户访谈</h2>
        <p>
          我们围绕4名有过独自前往不熟悉医院就诊经历的大学生，记录他们从到院到离院的过程，重点了解哪些步骤最容易拿不准，以及遇到问题后会怎样处理。
        </p>
      </header>
      <InterviewDesign />
      <header className="records-heading" id="records">
        <h3>访谈记录</h3>
        <button className="text-button" onClick={printInterview}>
          <Printer size={16} /> 打印本份访谈
        </button>
      </header>
      <div className="interview-layout">
        <aside className="interview-sidebar">
          <div className="desktop-person-list">
            <h2>选择访谈</h2>
            {d.interviews.map((p) => (
              <button
                key={p.id}
                aria-pressed={p.id === person.id}
                onClick={() => select(p.id)}
              >
                <b>
                  {p.alias}
                  <span>{p.role.match(/（(.+)）/)?.[1]}</span>
                </b>
                <small>{p.scenario}</small>
              </button>
            ))}
          </div>
          <label className="mobile-person-select">
            选择访谈
            <select
              aria-label="选择受访者"
              value={person.id}
              onChange={(e) => select(e.target.value)}
            >
              {d.interviews.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.alias} · {p.role}
                </option>
              ))}
            </select>
          </label>
          <nav className="transcript-toc" aria-label="访谈主题目录">
            <h2>本篇目录</h2>
            {interviewSections.map((s) => (
              <button
                key={s.id}
                disabled={!groups.some((g) => g.q.section === s.id)}
                onClick={() => jump(s.id)}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>
        <div className="transcript" ref={content} key={person.id}>
          <header className="participant-header">
            <p className="participant-id">
              {person.id} · {person.role}
            </p>
            <h2>{person.alias}</h2>
            <p>{person.scenario}</p>
            <dl>
              <div>
                <dt>主要话题</dt>
                <dd>{person.emphasis}</dd>
              </div>
              <div>
                <dt>记录结构</dt>
                <dd>
                  {d.interview_guide.length}个预设问题，
                  {
                    person.turns.filter(
                      (t) => t.kind === "spontaneous_followup",
                    ).length
                  }
                  次即时追问
                </dd>
              </div>
            </dl>
          </header>
          <div className="transcript-toolbar">
            <SearchField
              value={search}
              onChange={(v) => {
                setSearch(v);
                expand(true);
              }}
              label="检索访谈内容"
              placeholder="搜索对话或题号"
            />
            <div>
              <button className="text-button" onClick={() => expand(true)}>
                展开全部主题
              </button>
              <span>／</span>
              <button className="text-button" onClick={() => expand(false)}>
                收起全部主题
              </button>
            </div>
          </div>
          {term && (
            <p className="search-result-count" role="status">
              匹配{groups.length}个问题组，保留相关回答与追问。
            </p>
          )}
          {groups.length ? (
            interviewSections.map((section) => {
              const list = groups.filter((g) => g.q.section === section.id);
              return list.length ? (
                <details
                  open
                  className="transcript-section"
                  id={"transcript-" + section.id}
                  key={section.id}
                >
                  <summary>
                    <h3>{section.title}</h3>
                    <ChevronDown size={18} />
                  </summary>
                  <div>
                    {list.map((g) => (
                      <article className="dialogue-group" key={g.q.id}>
                        {g.turns.map((turn, i) => (
                          <div
                            data-turn
                            data-kind={turn.kind}
                            className={`turn ${turn.speaker} ${turn.kind.includes("followup") ? "followup" : ""}`}
                            key={i}
                          >
                            <div className="turn-label">
                              <span>
                                {turn.speaker === "interviewer"
                                  ? "访谈者"
                                  : person.alias}
                              </span>
                              <small>
                                {turn.kind === "planned"
                                  ? `${turn.question_id} · 提问`
                                  : turn.kind === "spontaneous_followup"
                                    ? "即时追问"
                                    : turn.kind === "followup_answer"
                                      ? "追问回答"
                                      : "回答"}
                              </small>
                            </div>
                            <p data-turn-text>{turn.text}</p>
                          </div>
                        ))}
                      </article>
                    ))}
                  </div>
                </details>
              ) : null;
            })
          ) : (
            <EmptyState onReset={() => setSearch("")} />
          )}
        </div>
      </div>
    </div>
  );
}
