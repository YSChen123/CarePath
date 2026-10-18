import { QuestionContent, typeLabels } from "./QuestionBank";
import { SearchField, EmptyState } from "./Shared";
import { formatAnswer } from "../lib/data";
import type { Question, Respondent } from "../lib/types";
import QuestionStats from "./QuestionStats";
import { ChevronDown } from "lucide-react";
export default function QuestionReader({
  question,
  respondents,
  search,
  onSearch,
  onPerson,
}: {
  question: Question;
  respondents: Respondent[];
  search: string;
  onSearch: (value: string) => void;
  onPerson: (id: string) => void;
}) {
  const term = search.trim().toLowerCase();
  const people = respondents.filter((r) =>
    (r.id + " " + formatAnswer(r.answers[question.id]))
      .toLowerCase()
      .includes(term),
  );
  return (
    <div className="question-reader">
      <section className="question-definition">
        <p className="question-meta">
          {question.id} <span>／</span> {typeLabels[question.type]}
        </p>
        <h2 data-question-title>{question.text}</h2>
        {question.type !== "open" && (
          <details className="question-options" key={question.id}>
            <summary>
              查看原始选项与作答说明 <ChevronDown size={18} />
            </summary>
            <QuestionContent question={question} />
          </details>
        )}
      </section>
      <QuestionStats question={question} />
      <section className="question-responses">
        <header>
          <h2>
            每位受访者的回答{" "}
            <span>
              {people.length} / {respondents.length}
            </span>
          </h2>
          <SearchField
            value={search}
            onChange={onSearch}
            label="检索本题回答"
            placeholder="搜索回答或编号"
          />
        </header>
        {people.length ? (
          <div className="response-list">
            {people.map((person) => (
              <div data-response key={person.id}>
                <button
                  className="response-id"
                  aria-label={`查看 ${person.id} 完整答卷`}
                  onClick={() => onPerson(person.id)}
                >
                  {person.id}
                </button>
                <p data-response-text>
                  {formatAnswer(
                    person.answers[question.id],
                    question.type === "ranking" ? " → " : "；",
                  )}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState onReset={() => onSearch("")} />
        )}
      </section>
    </div>
  );
}
