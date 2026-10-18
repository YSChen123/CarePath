import { PageHeader, TextLink } from "../components/Shared";
export default function Proposal() {
  return (
    <div className="container proposal-page">
      <PageHeader
        title="项目提案"
        description="第一次独自到陌生医院就诊时的流程困惑"
      />
      <p className="proposal-opening">
        对熟悉医院流程的人来说，“做完检查再回来”可能只是一句普通交代；对第一次独自就诊的人来说，后面还有一连串需要自己确认的事情。
      </p>
      <section className="proposal-section">
        <p className="section-label">研究背景</p>
        <div>
          <h2><span className="heading-phrase">看病的流程，</span><span className="heading-phrase">常常要边走边弄明白。</span></h2>
          <p>
            一个人到不熟悉的医院看病，可能要先挂号、报到、候诊，再根据医生的安排缴费、预约检查、等待结果，最后回诊或取药。人在身体不舒服的时候，还得看指示牌、找窗口、翻手机，有时问完路仍然不确定下一步该做什么。
          </p>
        </div>
      </section>
      <section className="proposal-section">
        <p className="section-label">核心问题</p>
        <div>
          <h2><span className="heading-phrase">信息并不少，</span><span className="heading-phrase">难的是把它们连起来。</span></h2>
          <p>
            医院有指示牌、导诊台、纸质单据和线上小程序，但不同环节的信息分散在各处。比如，检查前要先缴费还是先预约？换了楼层需不需要重新取号？检查结果出来后还要不要回原诊室？这些问题看似琐碎，却很容易让人多跑一趟、排错一次队，甚至错过后续安排。
          </p>
          <figure className="proposal-flow">
            <ol>
              {[
                "到院",
                "报到",
                "候诊",
                "缴费/检查",
                "查看结果",
                "回诊/取药",
              ].map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <figcaption>流程仅为说明，具体顺序以医院安排为准</figcaption>
          </figure>
        </div>
      </section>
      <section className="proposal-section">
        <p className="section-label">目标用户</p>
        <div>
          <h2>我们关注哪些人？</h2>
          <p>
            项目主要面向初次独自到陌生医院就诊的年轻人，以及在陌生医院使用自助设备、辨认流程时容易遇到困难的老年人。本次访谈和问卷先聚焦有独自就诊经历的大学生，具体了解他们是怎样找信息、确认步骤和处理临时变化的。
          </p>
        </div>
      </section>
      <section className="proposal-section">
        <p className="section-label">方案设想</p>
        <div>
          <h2>让手机帮忙记住下一步。</h2>
          <p>
            我们希望将就诊安排整理成容易查看的连续步骤：现在做到哪一步、接下来做什么、应该去哪里，都能在需要时找到。到了缴费、检查、结果出来等节点，再提供必要的提醒。手机方便随身查看，也能减少反复翻单据、切换页面和询问窗口的麻烦。
          </p>
          <p className="caption">
            以上为项目的设计设想，不代表已经接入医院业务系统。
          </p>
        </div>
      </section>
      <div className="page-next">
        <TextLink to="/research">查看数据收集计划</TextLink>
      </div>
    </div>
  );
}
