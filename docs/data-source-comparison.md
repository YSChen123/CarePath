# 本轮数据来源比对

用户已确认当前回答可用，旧来源标记未更新。转换脚本只读取原文件，不回写。

| 来源 | 数量 | 采用方式 | 旧字段处理 |
| --- | --- | --- | --- |
| `问卷15份大学生模拟原始数据.xlsx` / 问卷15份原始数据 | 15行×22题 | 问卷主数据 | 忽略旧说明行、数据标识列 |
| `interviews/I01–I04*.md` | 4人、272轮、36次追问 | 访谈主数据，逐字解析问答 | 不将旧管理标题作为正文事实 |
| `data/survey_questions.json`、`interview_guide.json` | 22原题、25提纲 | 原始问题字典，与原PDF核对 | 仅使用问题字段 |
| `data/website_seed.json` 与独立JSON/CSV | 旧聚合副本 | 不参与导入，保留原件 | 不复制至网站 |
| `public/data/research.json` | 4 / 15 / 22 | 本轮生成的网页模型 | 无来源状态等旧内部字段 |

## 文件盘点（排除依赖与旧截图）

- `Codex_医路同行_Lab4_网站全面重设计Prompt.md`：13340 bytes；mtime=1792299848.6743145。
- `Codex_医路同行_Lab4网站开发Prompt.md`：15907 bytes；mtime=1792295919.1308677。
- `Codex_医路同行_最终网站信息架构与完整文案_重设计Prompt.md`：27846 bytes；mtime=1792303074.269275。
- `README.md`：2744 bytes；mtime=1792295034.8719444。
- `四份大学生模拟访谈_统一审核版.md`：35161 bytes；mtime=1792295034.9550438。
- `问卷15份大学生模拟原始数据.xlsx`：18635 bytes；mtime=1792295034.960043。
- `data\interviews.json`：71029 bytes；mtime=1792295034.8824017。
- `data\interview_guide.json`：4118 bytes；mtime=1792295034.8744948。
- `data\project.json`：1388 bytes；mtime=1792295034.8895314。
- `data\survey_questions.json`：9095 bytes；mtime=1792295034.891537。
- `data\survey_responses.csv`：11067 bytes；mtime=1792295034.8984735。
- `data\survey_responses.json`：22528 bytes；mtime=1792295034.9004793。
- `data\survey_summary.json`：5910 bytes；mtime=1792295034.9039958。
- `data\website_seed.json`：118368 bytes；mtime=1792295034.9073498。
- `interviews\I01_大学生模拟访谈.md`：9294 bytes；mtime=1792295034.9144006。
- `interviews\I02_大学生模拟访谈.md`：8504 bytes；mtime=1792295034.919036。
- `interviews\I03_大学生模拟访谈.md`：8599 bytes；mtime=1792295034.919036。
- `interviews\I04_大学生模拟访谈.md`：8509 bytes；mtime=1792295034.9245474。
- `notes\15份问卷_Q22开放题汇总.md`：1688 bytes；mtime=1792295034.9325392。
- `notes\Codex网站数据说明.md`：1735 bytes；mtime=1792295034.9366083。
- `notes\原问卷22题_完整题目与选项.md`：4842 bytes；mtime=1792295034.9386134。
- `notes\项目受众与本次样本范围.md`：893 bytes；mtime=1792295034.9428353。

与首次材料快照相比变动：无。原PDF、Excel、采集记录未被本轮修改。
详细主数据路径、SHA-256与修改时间见 data-provenance.json。
