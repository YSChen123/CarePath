import { useData } from "../lib/context";
import { calculateStats } from "../lib/data";
import type { Question } from "../lib/types";
import type { CSSProperties } from "react";
export default function QuestionStats({ question }: { question: Question }) {
  const d = useData(),
    n = d.survey_responses.length;
  if (question.type === "open") return null;
  const stats = calculateStats(d, question),
    ranking = question.type === "ranking";
  const values = ranking ? stats.average_rank! : stats.counts!;
  const entries = Object.entries(values);
  entries.sort((a, b) => b[1] - a[1]);
  const maximum = Math.max(1, ...entries.map(([, value]) => value));
  const step =
    [1, 2, 3, 5, 10, 20].find((value) => value >= maximum / 4) ||
    Math.ceil(maximum / 4);
  const ceiling = Math.ceil(maximum / step) * step;
  const ticks = Array.from(
    { length: ceiling / step + 1 },
    (_, i) => ceiling - i * step,
  );
  return (
    <figure className="question-stats" data-stat-chart>
      <figcaption>
        总体情况{" "}
        <span>
          {ranking ? "平均名次" : "选择人数"} · n={n}
        </span>
      </figcaption>
      <p>
        {ranking
          ? "按平均名次从高到低排列；名次越小，表示越希望优先看到。"
          : question.type.startsWith("multi")
            ? "按选择人数从高到低排列。多选题，各项人数之和可以超过15。"
            : "按选择人数从高到低排列。人数相同时保留原选项顺序。"}
      </p>
      {entries.length > 5 && (
        <p className="chart-scroll-hint">横向滑动查看全部选项 →</p>
      )}
      <div
        className="chart-scroll"
        role="region"
        aria-label={`${question.id}总体分布柱状图${entries.length > 5 ? "，可横向滚动" : ""}`}
        tabIndex={0}
      >
        <div
          className="chart-canvas"
          style={
            {
              "--columns": entries.length,
              "--column-min": entries.length > 5 ? "92px" : "52px",
            } as CSSProperties
          }
        >
          <div className="chart-y-axis" aria-hidden="true">
            {ticks.map((value) => (
              <span
                key={value}
                style={{ top: `${(1 - value / ceiling) * 100}%` }}
              >
                {value}
              </span>
            ))}
          </div>
          <div className="chart-grid" aria-hidden="true">
            {ticks.map((value) => (
              <i
                key={value}
                style={{ top: `${(1 - value / ceiling) * 100}%` }}
              />
            ))}
          </div>
          <dl className="vertical-bars">
            {entries.map(([label, count]) => (
              <div className="chart-column" data-stat-row key={label}>
                <dt data-stat-label>
                  {question.type === "scale" ? `${label}分` : label}
                </dt>
                <dd
                  style={
                    {
                      "--bar-height": `${(count / ceiling) * 100}%`,
                    } as CSSProperties
                  }
                >
                  <span
                    className="vertical-bar"
                    data-bar={count}
                    aria-hidden="true"
                  />
                  <b data-stat-value>{ranking ? count.toFixed(2) : count}</b>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="caption">仅描述本次作答，不外推至其他就诊者。</p>
    </figure>
  );
}
