import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useData } from "../lib/context";
import { formatAnswer } from "../lib/data";
export default function RespondentDialog({
  id,
  onClose,
  onSelect,
}: {
  id: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const d = useData(),
    ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  const person =
    d.survey_responses.find((r) => r.id === id) || d.survey_responses[0];
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [id]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="respondent-title"
      className="respondent-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close.current();
        }
      }}
    >
      <header>
        <div>
          <p>完整答卷</p>
          <h2 id="respondent-title">{person.id}</h2>
        </div>
        <label className="sr-only" htmlFor="dialog-respondent">
          选择答卷
        </label>
        <select
          id="dialog-respondent"
          value={person.id}
          onChange={(e) => onSelect(e.target.value)}
        >
          {d.survey_responses.map((r) => (
            <option key={r.id}>{r.id}</option>
          ))}
        </select>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="关闭完整答卷"
        >
          <X size={22} />
        </button>
      </header>
      <div className="respondent-dialog-body">
        {d.survey_questions.map((q) => (
          <article data-answer key={q.id}>
            <span className="question-id">{q.id}</span>
            <div>
              <h3>{q.text}</h3>
              <p data-answer-id={q.id}>
                {formatAnswer(
                  person.answers[q.id],
                  q.type === "ranking" ? " → " : "；",
                )}
                {q.type === "scale" && (
                  <span className="answer-scale">
                    {" "}
                    / 5
                    {q.scale_anchors?.[String(person.answers[q.id])]
                      ? " · " + q.scale_anchors[String(person.answers[q.id])]
                      : " · 中间程度"}
                  </span>
                )}
              </p>
            </div>
          </article>
        ))}
      </div>
    </dialog>
  );
}
