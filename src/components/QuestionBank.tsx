import { ChevronDown } from "lucide-react";
import type { Question } from "../lib/types";
import { surveySections } from "../data/originalGuide";
export const typeLabels: Record<string, string> = {
  single: "单选题",
  scale: "5点量表",
  multi: "多选题",
  frequency: "5点频率量表",
  ranking: "六项完整排序",
  multi_max3: "最多选3项",
  open: "开放题",
};
export function QuestionContent({ question: q }: { question: Question }) {
  return (
    <div className="question-content">
      {q.type === "scale" ? (
        <>
          <div className="scale-options">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v}>
                <b>{v}</b>
                <span>{q.scale_anchors?.[String(v)] || "中间程度"}</span>
              </div>
            ))}
          </div>
          <p className="caption">{q.intermediate_anchors_note}</p>
        </>
      ) : q.options ? (
        <ol
          className={
            q.type === "ranking" ? "option-list ranking-options" : "option-list"
          }
        >
          {q.options.map((o, i) => (
            <li key={o}>
              <span>
                {q.type === "ranking"
                  ? String(i + 1).padStart(2, "0")
                  : String.fromCharCode(65 + i)}
              </span>
              {o}
            </li>
          ))}
        </ol>
      ) : (
        <p className="open-question-note">自由填写简短原话，不设置选项。</p>
      )}
      {q.type === "ranking" && (
        <p className="caption">
          从「最想先看到」到「最不重要」，六项全部排序；以上为原选项顺序，不代表回答。
        </p>
      )}
      {q.id === "Q18" && (
        <p className="caption">选择不超过3项。原选项全部保留。</p>
      )}
    </div>
  );
}
export default function QuestionBank({
  questions,
  expanded = false,
}: {
  questions: Question[];
  expanded?: boolean;
}) {
  return (
    <div className="question-bank">
      {surveySections.map((s) => {
        const list = questions.filter((q) => q.section === s.id);
        return list.length ? (
          <section key={s.id} className="question-bank-section">
            <div className="bank-section-heading">
              <span>{s.letter}</span>
              <div>
                <h3>{s.title}</h3>
                <p>
                  {s.range} · {s.description}
                </p>
              </div>
            </div>
            {list.map((q) => (
              <details
                className="question-detail"
                id={`question-${q.id}`}
                key={q.id}
                open={expanded || undefined}
                data-question={q.id}
              >
                <summary>
                  <span className="question-id">{q.id}</span>
                  <div>
                    <span className="question-type">{typeLabels[q.type]}</span>
                    <h4>{q.text}</h4>
                  </div>
                  <ChevronDown size={18} />
                </summary>
                <QuestionContent question={q} />
              </details>
            ))}
          </section>
        ) : null;
      })}
    </div>
  );
}
