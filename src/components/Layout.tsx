import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
const links = [
  ["/team", "团队介绍"],
  ["/proposal", "项目提案"],
  ["/research", "数据收集计划"],
];
export default function Layout() {
  const [menu, setMenu] = useState(false);
  const { pathname, search } = useLocation(),
    menuButton = useRef<HTMLButtonElement>(null);
  const section = new URLSearchParams(search).get("section");
  useEffect(() => {
    setMenu(false);
    const name =
      pathname === "/"
        ? "医路同行"
        : pathname.endsWith("/interviews")
          ? "用户访谈"
          : pathname.endsWith("/survey")
            ? "问卷调查"
            : links.find(([p]) => p === pathname)?.[1] || "页面未找到";
    document.title =
      name === "医路同行"
        ? "医路同行 · 第一次独自去医院"
        : `${name} · 医路同行`;
    const frame = requestAnimationFrame(() => {
      const target = section ? document.getElementById(section) : null;
      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: 0, behavior: "instant" });
      document
        .querySelector<HTMLElement>("main")
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, section]);
  useEffect(() => {
    const fn = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu) {
        setMenu(false);
        menuButton.current?.focus();
      }
    };
    addEventListener("keydown", fn);
    return () => removeEventListener("keydown", fn);
  }, [menu]);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        跳至主要内容
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            医路同行<span aria-hidden="true">.</span>
          </Link>
          <button
            ref={menuButton}
            className="menu-button"
            aria-label={menu ? "关闭导航菜单" : "打开导航菜单"}
            aria-expanded={menu}
            aria-controls="primary-nav"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={23} /> : <Menu size={23} />}
          </button>
          <nav
            id="primary-nav"
            aria-label="主导航"
            className={menu ? "open" : ""}
          >
            {links.map(([to, label]) => (
              <NavLink
                to={to}
                end={to !== "/research"}
                key={to}
                onClick={() => setMenu(false)}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <Link className="footer-wordmark" to="/">
            医路同行
          </Link>
          <p className="footer-school">山东大学计算机科学与技术学院</p>
          <div className="footer-links">
            {links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
