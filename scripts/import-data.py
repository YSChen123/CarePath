"""Read-only import from the user-confirmed Excel and individual Markdown files.
Never reads the legacy website_seed.json, never writes outside website/.
"""
from pathlib import Path
from openpyxl import load_workbook
import hashlib, json, re, subprocess

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'website'
read_json = lambda name: json.loads((ROOT/'data'/name).read_text(encoding='utf-8'))
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    books = [p for p in ROOT.glob('*.xlsx') if not p.name.startswith('~$')]
    if len(books) != 1:
        raise ValueError('请明确唯一主问卷Excel，当前候选：'+str(books))
    book = books[0]
    wb = load_workbook(book, read_only=True, data_only=True)
    matches = []
    for sheet in wb:
        rows = list(sheet.values)
        for pos, row in enumerate(rows):
            if 'Q1' in row and 'Q22' in row:
                matches.append((sheet.title, rows[pos:]))
    if len(matches) != 1:
        raise ValueError('未找到唯一Q1–Q22原始回答工作表')
    sheet_name, rows = matches[0]
    headers = rows[0]
    questions = read_json('survey_questions.json')['questions']
    responses = []
    for row in rows[1:]:
        if not row or not re.fullmatch(r'R\d{2}', str(row[0] or '')):
            continue
        answers = {}
        for q in questions:
            value = row[headers.index(q['id'])]
            if value is None:
                raise ValueError(f'{row[0]} {q["id"]} 缺失')
            if q['type'] in ('multi', 'multi_max3', 'ranking'):
                value = str(value).split('；')
            elif q['type'] == 'scale':
                if isinstance(value, bool) or not re.fullmatch(r'[1-5](?:\.0)?',str(value)):
                    raise ValueError(f'{row[0]} {q["id"]} 必须为1–5整数，未改写原值')
                value = int(value)
            else:
                value = str(value)
            answers[q['id']] = value
        responses.append({'id': str(row[0]), 'answers': answers})
    wb.close()
    assert len(responses) == 15 and len({r['id'] for r in responses}) == 15
    guide = read_json('interview_guide.json')['questions']
    interviews, interview_paths = [], []
    for num in range(1, 5):
        paths = list((ROOT/'interviews').glob(f'I{num:02}*.md'))
        if len(paths) != 1:
            raise ValueError(f'I{num:02}的原始记录不唯一')
        path = paths[0]
        raw = path.read_text(encoding='utf-8')
        # Only bold speaker paragraphs are published. Old administrative headings are not answers.
        entries = re.findall(r'^\*\*([^\n*]+)[：:]\*\*\s*(.*?)(?=\n\s*\n|\Z)', raw, re.M | re.S)
        turns, planned_index, previous = [], -1, None
        for label, text in entries:
            interviewer = label.startswith('访谈者')
            followup = interviewer and '追问' in label
            if interviewer and not followup:
                planned_index += 1
            if planned_index < 0 or planned_index >= len(guide):
                raise ValueError(f'{path.name}无法映射题号')
            q = guide[planned_index]
            kind = ('spontaneous_followup' if followup else 'planned') if interviewer else ('followup_answer' if previous == 'spontaneous_followup' else 'answer')
            turns.append({'speaker': 'interviewer' if interviewer else 'participant', 'kind': kind, 'question_id': q['id'], 'section': q['section'], 'text': text.strip()})
            previous = kind
        assert planned_index == 24 and len(turns) % 2 == 0, path.name
        field = lambda pattern: (re.search(pattern, raw).group(1).strip() if re.search(pattern, raw) else '')
        identity = field(r'用户身份：([^\n]+)')
        age = re.search(r'（(\d+-\d+岁)）$', identity)
        interviews.append({'id': f'I{num:02}', 'alias': f'受访者{num:02}', 'role': identity[:age.start()] if age else identity, 'age_range': age.group(1) if age else '', 'scenario': field(r'情境设定：([^\n]+)'), 'emphasis': field(r'本次侧重：([^\n]+)'), 'turns': turns})
        interview_paths.append(path)
    stats = {}
    for q in questions:
        values = [r['answers'][q['id']] for r in responses]
        if q['type'] == 'open':
            result = {'responses': values}
        elif q['type'] == 'ranking':
            result = {'first_choice_counts': {o: sum(v[0] == o for v in values) for o in q['options']}, 'average_rank': {o: round(sum(v.index(o)+1 for v in values)/len(values), 2) for o in q['options']}}
        else:
            options = [str(i) for i in range(1, 6)] if q['type'] == 'scale' else q['options']
            result = {'counts': {o: sum(o in v if isinstance(v, list) else str(v) == o for v in values) for o in options}}
            if q['type'] == 'scale':
                result['mean'] = round(sum(values)/len(values), 2)
        stats[q['id']] = result
    project = read_json('project.json')
    project = {key: value for key, value in project.items() if key not in ('study_mode', 'source', 'current_study_focus')}
    project['current_study_focus'] = '本次访谈与问卷聚焦有独自就诊经历的大学生，不外推至老年群体。'
    data = {'project': project, 'interview_guide': guide, 'interviews': interviews, 'survey_questions': questions, 'survey_responses': responses, 'survey_summary': {'respondent_count': len(responses), 'question_stats': stats}}
    # Reuse the browser's complete schema/answer checks BEFORE writing any derivative.
    validation = subprocess.run(['node','--import','tsx','--input-type=module','-e',"import {validateSeed} from './src/lib/data.ts'; let raw=''; for await (const chunk of process.stdin) raw+=chunk; validateSeed(JSON.parse(raw));"],input=json.dumps(data,ensure_ascii=False),cwd=SITE,encoding='utf-8',capture_output=True)
    if validation.returncode:
        reason=next((line.strip() for line in validation.stderr.splitlines() if line.startswith('Error:')), '请检查Node运行环境及题号、选项与问答配对')
        raise ValueError('主数据校验未通过，未写入网站：'+reason)
    out = SITE/'public/data'
    out.mkdir(parents=True, exist_ok=True)
    (out/'research.json').write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    paths = [book, *interview_paths, ROOT/'data/survey_questions.json', ROOT/'data/interview_guide.json', ROOT/'data/project.json']
    provenance = {'confirmation': '用户于2026-10-18确认：现有回答已核实可用，仅旧来源标记未更新。', 'survey_master': str(book.relative_to(ROOT)), 'worksheet': sheet_name, 'interview_masters': [str(p.relative_to(ROOT)) for p in interview_paths], 'files': {str(p.relative_to(ROOT)): {'sha256': digest(p), 'modified': p.stat().st_mtime, 'bytes': p.stat().st_size} for p in paths}, 'counts': {'interviews': len(interviews), 'turns': sum(len(p['turns']) for p in interviews), 'questions': len(questions), 'respondents': len(responses), 'answers': sum(len(r['answers']) for r in responses)}, 'legacy_fields': '仅忽略旧管理元数据，原始文件不变。未读取旧website_seed.json来生成记录。'}
    (SITE/'docs/data-provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print('PASS: Excel主表15×22回答、4份Markdown逐字导入，统计重新计算；原文件未修改。')
    print(json.dumps(provenance['counts'], ensure_ascii=False))

if __name__ == '__main__':
    main()
