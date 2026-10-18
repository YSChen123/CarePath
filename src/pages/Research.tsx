import { NavLink, Outlet } from "react-router-dom";
import { PageHeader } from "../components/Shared";
export default function Research() {
  return (
    <div className="container research-page">
      <PageHeader
        title="数据收集计划"
        description="我们通过访谈了解具体的就诊经历，再用问卷梳理常见问题和使用偏好。前者关心一段经历是怎么发生的，后者帮助我们比较不同问题出现的情况。"
      />
      <nav className="research-tabs" aria-label="数据收集子栏目">
        <NavLink to="/research/interviews">
          访谈 <span>4份</span>
        </NavLink>
        <NavLink to="/research/survey">
          问卷调查 <span>15份</span>
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
