import { Component, useEffect, useState, type ReactNode } from "react";
import { HashRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";
import { DataContext } from "./lib/context";
import { validateSeed } from "./lib/data";
import type { Seed } from "./lib/types";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Research from "./pages/Research";
import Interviews from "./pages/Interviews";
import Survey from "./pages/Survey";
import Team from "./pages/Team";
import Proposal from "./pages/Proposal";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="load-state" role="alert">
        <AlertCircle />
        <h1>页面暂时无法显示</h1>
        <p>请刷新页面重试。原始实验材料不受影响。</p>
        <button className="button" onClick={() => location.reload()}>
          刷新页面
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const [data, setData] = useState<Seed | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch(`${import.meta.env.BASE_URL}data/research.json`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(`数据请求失败（HTTP ${r.status}）`);
        return r.json();
      })
      .then((raw) => setData(validateSeed(raw)))
      .catch((e) => {
        if (e.name !== "AbortError")
          setError(e instanceof Error ? e.message : "无法读取数据");
      });
    return () => controller.abort();
  }, [attempt]);
  if (error)
    return (
      <div className="load-state" role="alert">
        <AlertCircle size={36} />
        <span className="eyebrow">医路同行 · 数据加载提示</span>
        <h1>研究数据暂时无法加载</h1>
        <p>{error}</p>
        <p>
          请确认网站包含 data/research.json，并通过本地服务器或静态托管访问。
        </p>
        <button className="button" onClick={() => setAttempt(attempt + 1)}>
          <RefreshCw size={17} />
          重新加载数据
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="load-state" role="status">
        <LoaderCircle className="spinner" />
        <p>正在加载医路同行研究档案…</p>
      </div>
    );
  return (
    <ErrorBoundary>
      <DataContext.Provider value={data}>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="proposal" element={<Proposal />} />
              <Route path="team" element={<Team />} />
              <Route path="research" element={<Research />}>
                <Route index element={<Navigate to="interviews" replace />} />
                <Route path="interviews" element={<Interviews />} />
                <Route path="survey" element={<Survey />} />
              </Route>
              <Route
                path="interviews"
                element={<Navigate to="/research/interviews" replace />}
              />
              <Route
                path="survey"
                element={<Navigate to="/research/survey" replace />}
              />
              <Route
                path="insights"
                element={<Navigate to="/research/survey" replace />}
              />
              <Route
                path="*"
                element={
                  <div className="load-state">
                    <h1>这个页面还没有记录</h1>
                    <p>可从首页继续浏览项目资料。</p>
                    <Link className="button" to="/">
                      返回首页
                    </Link>
                  </div>
                }
              />
            </Route>
          </Routes>
        </HashRouter>
      </DataContext.Provider>
    </ErrorBoundary>
  );
}
