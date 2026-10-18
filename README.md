# 医路同行

本轮小幅优化：问卷按题查看改为“原题 → 总体竖向柱状图 → 逐人原始回答”。柱子按数值从左到右降序，同值保留原选项顺序；Q16明确标注平均名次越小越优先。原选项可展开查看，Q22继续直接展示原话。全站偏小辅助文字与表格字号已适当调大，回答正文为17px。最新专项截图与字体记录见`docs/qa-survey-update/`。

山东大学计算机科学与技术学院本科生项目网站。首页为医院走廊摄影与项目介绍；顶部仅团队介绍、项目提案、数据收集计划。访谈、问卷属于数据收集计划的二级页面。栏目与主文案按照最终Prompt实现。

## PowerShell安装、启动与构建

Node.js 22.12+或24 LTS；本机验证Node.js 24.15.0。使用`npm.cmd`避免PowerShell执行策略拦截npm.ps1。

```powershell
Set-Location 'C:\Users\chenys\Desktop\lab4\website'
npm.cmd ci
npm.cmd run dev
```

浏览器打开终端显示的Local地址，默认`http://localhost:5173/`。依赖已安装时直接运行`npm.cmd run dev`。停止用Ctrl+C。

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

构建产物为`dist`，生产预览默认`http://localhost:4173/`。不能直接双击HTML通过file协议运行网站。

## 网站结构与修改摘要

| 页面                    | 实际地址                 | 主要内容                                                                          |
| ----------------------- | ------------------------ | --------------------------------------------------------------------------------- |
| 品牌首页                | `/#/`                    | 指定首屏文案、本地摄影主图、两条主入口、一个概述区                                |
| 团队介绍                | `/#/team`                | 学院/本科生身份、三名成员学号、2+2访谈/5+5+5问卷/网站分工、Contribution Statement |
| 项目提案                | `/#/proposal`            | 背景、问题、目标用户、手机方案设想及说明性流程图                                  |
| 数据收集计划 / 访谈     | `/#/research/interviews` | 计划说明、访谈方式、25道原提纲、4份完整访谈、即时追问、目录/检索/打印             |
| 数据收集计划 / 问卷调查 | `/#/research/survey`     | 问卷设计、22道原题与选项、按题统计/原始回答、原始表格/CSV/个人答卷                |

`/#/research`默认进入访谈。可直接访问、刷新或分享子页，例如`/#/research/interviews?person=I03`、`/#/research/survey?view=table&q=Q16`。Hash路由与相对资源路径支持普通静态托管及子目录。

主要重写`App.tsx`、`Layout.tsx`、五个页面和`styles.css`；新增`InterviewDesign`、`Contribution`、`QuestionStats`。首页原复杂流程概念图删除；提案仅保留简单流程示意。原四项导航改为三个一级板块，取消独立访谈/问卷一级入口；移除旧统计组件、旧资料性质文案和公开目录中的旧seed副本。没有增加登录、医院接口或其他空功能。

首页主图保存为`public/assets/hospital-corridor.jpg`，作者Renata Rafa / Pexels；作品与许可见同目录`PHOTO_CREDIT.md`。没有热链或把图片当作本次采集地点。实际参考截图见`docs/references/`；[设计说明](DESIGN_DECISIONS.md)记录取舍。

## 主数据与更新

用户在本轮明确确认：现有回答已经核实可用，仅旧来源标记未更新。网站不再把旧管理字段当成页面事实，原文件保持不变。

- 问卷主源：`..\问卷15份大学生模拟原始数据.xlsx`，工作表`问卷15份原始数据`，只读取答卷编号和Q1–Q22。保留原文件名。
- 访谈主源：`..\interviews\I01–I04*.md`，只解析逐份原始问答，并映射原题号/主题。匿名为受访者01–04，不改写发言。
- 原题字典：`..\data\survey_questions.json`、`interview_guide.json`，与前次实验PDF核对；完整访谈题干及追问提示保存在`src/data/originalGuide.ts`。
- 网站派生模型：`public/data/research.json`；统计从330格原始回答重新计算，不读取旧汇总。
- 来源盘点：[data-source-comparison.md](docs/data-source-comparison.md)；主文件SHA-256与用户确认记录：`docs/data-provenance.json`。

更新原文件后执行以下命令，需要Python及openpyxl：

```powershell
python -m pip install openpyxl
npm.cmd run sync:data
npm.cmd test
python -X utf8 scripts/audit-sources.py
npm.cmd run build
```

转换脚本只读取原Excel/Markdown，绝不以旧JSON回写。写入前验证数量、题号、选项、1–5整数、多选互斥/数量、六项排序、问答配对及统计；有错误即停止，不能自动截断量表值或补造答案。openpyxl可能提示不支持Excel格式扩展；全程只读，不保存原表，哈希核对可验证。

CSV只含`答卷编号,Q1,…,Q22`共23列、15份答卷；UTF-8 BOM，多选/排序分号连接，保留Q22原话，并转义逗号、引号与换行。没有数据状态或内部元数据列。提交目录中的CSV使用与网页同一导出函数，可用独立Python CSV读取器回读验证。

## 实测与视觉证据

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
python -X utf8 -m unittest discover -s tests -p test_import.py
```

可复用本机Chromium，或通过`$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE`指定完整exe路径。E2E自动启动4173端口。手工截图/axe检查需要先在另一个终端启动：

```powershell
npm.cmd run dev -- --port 4173
```

然后执行：

```powershell
node scripts/capture.mjs
node scripts/accessibility.mjs
node scripts/smoke-production.mjs
```

最后一项需要先构建，只提供dist并在`/course/`子目录验证全部路由与本地图片。新版证据全部在`docs/qa-final/`；旧qa、qa-redesign、before-redesign只作历史对照。实际检查1440/1024/768/390/375px，截图为1440与390px。详见[验收记录](docs/verification.md)。没有配置独立lint脚本；执行了TypeScript构建检查。没有实测Safari、Firefox、iOS真机或屏幕阅读器。

## 提交材料与PDF

`submission/`已生成：

- `Lab4_submission.pdf`：52页，英文Times New Roman、中文宋体，正文/标题/表格/页码均12pt，正文18pt行高；含完整记录、原题与贡献声明。
- `Lab4_submission.html`：可编辑、可再次打印的对应正文。
- `访谈完整记录.md`：4份全部问答及追问。
- `问卷原始数据.csv`：15份×23列，已独立回读核对。
- `Lab4_提交内容与格式核对.md`：评分要求与待完成事项。

PDF首页公开URL尚待填写，末尾列出材料未明确的逐节署名；当前是可核对草稿，补齐这两项后再正式提交。已知原始分工与本轮执行分工没有捏造。PDF重生成需要Chromium及tsx（网站开发依赖已包含）：

```powershell
npm.cmd run submission
python -X utf8 scripts/verify-csv.py
```

取得公网URL后，将实际地址赋给`PROJECT_PUBLIC_URL`再运行submission；先在`Contribution.tsx`补齐核实后的逐节署名，重新生成。`verify-submission.py`可用PyMuPDF/Pillow检查字体、全部原文与页界并渲染，优先使用本机`.tools/python`内现有依赖。

## 发布为公网网站

本轮没有公开发布，localhost不等于作业可提交网址。可采用以下步骤：

1. 执行`npm.cmd ci`、`npm.cmd run build`。
2. 打开[Netlify Drop](https://app.netlify.com/drop)，按平台指引上传`website\dist`文件夹。正式长期管理建议使用自己的账号。
3. 仅上传dist，不上传原始Excel、PDF、node_modules、.tools、submission或参考截图。
4. 使用平台实际生成的HTTPS地址，在无痕窗口、手机蜂窝网络核对图片、三个栏目、研究子页、访谈、原表与CSV，确认访问无需团队登录。
5. 将真实URL填入提交材料，核实贡献署名后重新生成PDF。更新站点时重新构建，上传新dist。

依据：[Netlify手动部署说明](https://docs.netlify.com/deploy/create-deploys/)、[Vite静态部署说明](https://vite.dev/guide/static-deploy.html)。没有编造公网地址或写死课程截止日期；以教师最新通知为准。
