import { PageHeader } from "../components/Shared";
import { useData } from "../lib/context";
import Contribution from "../components/Contribution";
export default function Team() {
  const d = useData();
  const work = [
    "问卷调查5份；网站设计、开发与页面内容整合",
    "访谈2人并整理访谈记录；问卷调查5份",
    "访谈2人并整理访谈记录；问卷调查5份",
  ];
  return (
    <div className="container team-page">
      <PageHeader
        title="团队介绍"
        description="我们是来自山东大学计算机科学与技术学院的三名本科生，团队名称是“医路同行”。我们关注第一次独自去陌生医院时容易遇到的实际问题，希望从具体的就诊经历出发，把大家真正觉得麻烦的环节梳理清楚。"
      />
      <div className="member-list">
        {d.project.team.map((p) => (
          <div key={p.student_id}>
            <h2>{p.name}</h2>
            <p>{p.student_id}</p>
          </div>
        ))}
      </div>
      <section className="team-work">
        <h2>本次工作分工</h2>
        <table className="work-table">
          <caption className="sr-only">团队三名成员的执行分工</caption>
          <thead>
            <tr>
              <th scope="col">成员</th>
              <th scope="col">工作内容</th>
            </tr>
          </thead>
          <tbody>
            {d.project.team.map((p, i) => (
              <tr key={p.student_id}>
                <th scope="row">{p.name}</th>
                <td>{work[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="caption">研究材料及网站内容由三名成员共同核对。</p>
      </section>
      <Contribution />
    </div>
  );
}
