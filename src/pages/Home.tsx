import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
export default function Home() {
  return (
    <div className="container home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="hero-kicker">医路同行</p>
          <h1>
            <span className="hero-line">
              <span>第一次独自</span>
              <span>去医院，</span>
            </span>
            <span className="hero-line">下一步怎么走？</span>
          </h1>
          <p className="hero-description">
            从挂号、候诊到检查、回诊，陌生的就诊流程里总有让人拿不准的下一步。我们希望把分散的信息串起来，让每一步都更清楚。
          </p>
          <div className="hero-actions">
            <Link className="button" to="/proposal">
              了解项目 <ArrowRight size={17} />
            </Link>
            <Link className="text-link" to="/research">
              查看调研资料 <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <figure className="hero-photo">
          <img
            src={`${import.meta.env.BASE_URL}assets/hospital-corridor.jpg`}
            width="1600"
            height="1600"
            alt="自然光照进医院走廊，窗边的扶手沿着通道延伸。"
            fetchPriority="high"
          />
          <figcaption>
            摄影{" "}
            <a
              href="https://www.pexels.com/photo/bright-hospital-corridor-with-windows-37036967/"
              target="_blank"
              rel="noreferrer"
            >
              Renata Rafa / Pexels
            </a>
          </figcaption>
        </figure>
      </section>
      <section className="home-intro">
        <h2>看病不该一直靠猜下一步。</h2>
        <p>
          挂完号要不要报到？做检查前是否需要缴费？结果出来后还要不要回原诊室？对第一次独自就诊的人来说，麻烦往往不在某一个步骤，而在步骤之间的衔接。
        </p>
      </section>
      <nav className="home-directory" aria-label="项目资料入口">
        <Link to="/team">
          认识团队 <ArrowRight size={17} />
        </Link>
        <Link to="/proposal">
          了解项目 <ArrowRight size={17} />
        </Link>
        <Link to="/research">
          查看访谈与问卷 <ArrowRight size={17} />
        </Link>
      </nav>
    </div>
  );
}
