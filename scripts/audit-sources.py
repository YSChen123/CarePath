"""Independent, read-only verification of imported answers against their masters."""
from pathlib import Path
from openpyxl import load_workbook
import hashlib, json, re, subprocess

root=Path(__file__).resolve().parents[2]
site=root/'website'
d=json.loads((site/'public/data/research.json').read_text(encoding='utf-8'))
provenance=json.loads((site/'docs/data-provenance.json').read_text(encoding='utf-8'))
for name, info in provenance['files'].items():
    assert hashlib.sha256((root/name).read_bytes()).hexdigest()==info['sha256'], f'{name} 导入后已变更，请重新导入'
book=root/provenance['survey_master']
wb=load_workbook(book,read_only=True,data_only=True)
rows=list(wb[provenance['worksheet']].values)
header=next(r for r in rows if 'Q1' in r and 'Q22' in r)
rows=[r for r in rows if r and re.fullmatch(r'R\d{2}',str(r[0] or ''))]
assert len(rows)==15
for row,person in zip(rows,d['survey_responses']):
    assert row[0]==person['id']
    for q in d['survey_questions']:
        v=person['answers'][q['id']]
        expected='；'.join(v) if isinstance(v,list) else str(v)
        assert str(row[header.index(q['id'])])==expected,(person['id'],q['id'])
wb.close()
for person,name in zip(d['interviews'],provenance['interview_masters']):
    raw=(root/name).read_text(encoding='utf-8')
    texts=[m.group(2).strip() for m in re.finditer(r'^\*\*([^\n*]+)[：:]\*\*\s*(.*?)(?=\n\s*\n|\Z)',raw,re.M|re.S)]
    assert texts==[t['text'] for t in person['turns']],person['id']
assert sum(len(p['turns']) for p in d['interviews'])==272
assert sum(t['kind']=='spontaneous_followup' for p in d['interviews'] for t in p['turns'])==36
normalize=lambda s:re.sub(r'\s+','',s)
pdftext=next((site/'docs/materials').glob('*202301130286.txt')).read_text(encoding='utf-8')
pdfnorm=normalize(pdftext)
for q in d['survey_questions']:
    assert normalize(q['text']) in pdfnorm,q['id']
    for o in q.get('options') or []: assert normalize(o) in pdfnorm,(q['id'],o)
guide=json.loads(subprocess.check_output(['node','--import','tsx','--input-type=module','-e',"import { originalGuide } from './src/data/originalGuide.ts'; process.stdout.write(JSON.stringify(originalGuide));"],cwd=site,encoding='utf-8'))
for item in guide.values():
    for text in item.values(): assert normalize(text) in pdfnorm,text
sources=[p for p in root.rglob('*') if p.is_file() and 'website' not in p.relative_to(root).parts and not p.name.startswith('~$')]
baseline=json.loads((site/'docs/source-hashes.json').read_text(encoding='utf-8'))
changed=[name for name,h in baseline.items() if hashlib.sha256((root/name).read_bytes()).hexdigest()!=h]
inventory=['# 本轮数据来源比对','','用户已确认当前回答可用，旧来源标记未更新。转换脚本只读取原文件，不回写。','','| 来源 | 数量 | 采用方式 | 旧字段处理 |','| --- | --- | --- | --- |',f'| `{provenance["survey_master"]}` / {provenance["worksheet"]} | 15行×22题 | 问卷主数据 | 忽略旧说明行、数据标识列 |','| `interviews/I01–I04*.md` | 4人、272轮、36次追问 | 访谈主数据，逐字解析问答 | 不将旧管理标题作为正文事实 |','| `data/survey_questions.json`、`interview_guide.json` | 22原题、25提纲 | 原始问题字典，与原PDF核对 | 仅使用问题字段 |','| `data/website_seed.json` 与独立JSON/CSV | 旧聚合副本 | 不参与导入，保留原件 | 不复制至网站 |','| `public/data/research.json` | 4 / 15 / 22 | 本轮生成的网页模型 | 无来源状态等旧内部字段 |','','## 文件盘点（排除依赖与旧截图）','']
for p in sources:
    if p.suffix.lower() in {'.xlsx','.csv','.json','.md'}:
        inventory.append(f'- `{p.relative_to(root)}`：{p.stat().st_size} bytes；mtime={p.stat().st_mtime}。')
inventory+=['', '与首次材料快照相比变动：'+('、'.join(changed) if changed else '无。原PDF、Excel、采集记录未被本轮修改。'), '详细主数据路径、SHA-256与修改时间见 data-provenance.json。']
(site/'docs/data-source-comparison.md').write_text('\n'.join(inventory)+'\n',encoding='utf-8')
print('PASS: 主Excel全部330格、4份Markdown全部272轮、原PDF22题及25道访谈提纲/追问提示一致。')
print(f'PASS: {len(sources)}份原材料盘点；导入后主文件哈希一致。首次快照变动：'+str(changed))
