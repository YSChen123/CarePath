from pathlib import Path
import csv, json
site=Path(__file__).resolve().parents[1]
data=json.loads((site/'public/data/research.json').read_text(encoding='utf-8'))
path=site/'submission/问卷原始数据.csv'
assert path.read_bytes().startswith(b'\xef\xbb\xbf')
with path.open(encoding='utf-8-sig',newline='') as f:
    rows=list(csv.reader(f))
assert rows[0]==['答卷编号']+[q['id'] for q in data['survey_questions']]
assert len(rows)==16 and all(len(r)==23 for r in rows)
for actual,person in zip(rows[1:],data['survey_responses']):
    expected=[person['id']]+['；'.join(person['answers'][q['id']]) if isinstance(person['answers'][q['id']],list) else str(person['answers'][q['id']]) for q in data['survey_questions']]
    assert actual==expected, person['id']
assert not any(k in rows[0] for k in ['数据状态','data_status','disclaimer','source_type','must_display_notice'])
print('PASS: 导出CSV重新读取：UTF-8 BOM、15行×23列，无内部元数据，全部330格与源模型一致。')
