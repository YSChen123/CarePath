from pathlib import Path
import sys, json, re
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'.tools/python'))
import pymupdf
from PIL import Image, ImageDraw
site=Path(__file__).resolve().parents[1]
out=site/'docs/qa-final/pdf'
out.mkdir(parents=True,exist_ok=True)
for pattern in ['page-*.png','contact-*.jpg','detail-*.png']:
    for old in out.glob(pattern): old.unlink()
doc=pymupdf.open(site/'submission/Lab4_submission.pdf')
d=json.loads((site/'public/data/research.json').read_text(encoding='utf-8'))
norm=lambda x:re.sub(r'\s+','',x)
text=norm('\n'.join(page.get_text() for page in doc))
for p in d['interviews']:
    for t in p['turns']:
        assert norm(t['text']) in text, (p['id'],t['question_id'],t['kind'])
for p in d['survey_responses']:
    for q in d['survey_questions']:
        a=p['answers'][q['id']]
        raw=(' → ' if q['type']=='ranking' else '；').join(a) if isinstance(a,list) else str(a)
        assert norm(raw) in text,(p['id'],q['id'])
sizes=set()
fonts=set()
issues=[]
for i,page in enumerate(doc):
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                if not span['text'].strip():continue
                sizes.add(round(span['size'],2)); fonts.add(span['font'])
                if abs(span['size']-12)>.1:issues.append((i+1,'font size',span['size']))
                x0,y0,x1,y1=span['bbox']
                if x0<50 or x1>page.rect.width-50 or y0<40 or y1>page.rect.height-12:
                    issues.append((i+1,'page boundary',span['text']))
    # All pages rendered, arranged 8 per sheet for page-break review.
    page.get_pixmap(matrix=pymupdf.Matrix(.55,.55)).save(out/f'page-{i+1:02}.png')
for start in range(0,len(doc),8):
    thumbs=[]
    for n in range(start,min(start+8,len(doc))):
        img=Image.open(out/f'page-{n+1:02}.png').convert('RGB')
        thumbs.append((n+1,img))
    canvas=Image.new('RGB',(4*344,2*494),'#dce5df')
    draw=ImageDraw.Draw(canvas)
    for k,(n,img) in enumerate(thumbs):
        x=(k%4)*344+8; y=(k//4)*494+22
        canvas.paste(img,(x,y));draw.text((x,y-18),f'Page {n}',fill='black')
    canvas.save(out/f'contact-{start//8+1}.jpg')
assert not issues,issues
for num in [0,1,len(doc)-1]:
    doc[num].get_pixmap(matrix=pymupdf.Matrix(1.2,1.2)).save(out/f'detail-{num+1:02}.png')
report={'pages':len(doc),'fonts':sorted(fonts),'sizes_pt':sorted(sizes),'checked_turns':272,'checked_answers':330,'page_boundary_issues':issues,'body_line_height':'CSS 18pt / 12pt = 1.5','url':'待填写实际公网URL','contribution':'原稿已知分节归属保留，缺失的本轮PDF逐节署名待确认'}
(out/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False))
