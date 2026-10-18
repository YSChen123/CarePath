import { ChevronDown } from "lucide-react";
import { useData } from "../lib/context";
import {
  interviewSections,
  introduction,
  originalGuide,
} from "../data/originalGuide";
export default function InterviewDesign() {
  const d = useData();
  return (
    <section className="method-section">
      <h3>访谈方式</h3>
      <div className="method-content">
        <p>
          采用半结构化访谈。先请受访者回忆最近一次就诊经历，再根据他们提到的具体问题继续追问，尽量弄清当时怎么判断、从哪里找信息、最后怎么解决。
        </p>
        <ol className="method-themes">
          <li>就诊过程与容易卡住的步骤</li>
          <li>信息来源、问路及说法不一致的情况</li>
          <li>候诊、等待和临时安排</li>
          <li>手机提醒、信息可信度与隐私顾虑</li>
        </ol>
        <details className="source-expander guide-expander">
          <summary>
            查看完整访谈提纲 <ChevronDown size={18} />
          </summary>
          <div className="expander-body">
            <h4>开场说明</h4>
            <p className="guide-introduction">{introduction}</p>
            {interviewSections.map((s) => (
              <section className="guide-section" key={s.id}>
                <h4>{s.title}</h4>
                {d.interview_guide
                  .filter((q) => q.section === s.id)
                  .map((q) => (
                    <article className="guide-question" key={q.id}>
                      <span className="question-id">{q.id}</span>
                      <div>
                        <h5>{originalGuide[q.id].question}</h5>
                        {originalGuide[q.id].probes && (
                          <p>
                            <b>可追问：</b>
                            {originalGuide[q.id].probes}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
              </section>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
