import json, re, sys, copy

BK='/home/hatch/workspace/the-flat-rate-machine/out/micro-48state-graphs'
PUB='/home/hatch/workspace/the-flat-rate-movers-pages/public'
CANON='https://theflatratemovers.com/#service-industrial-commercial'
D8_ID='https://theflatratemovers.com/#dataset-industrial-commercial-areas-dispatch'
D4_ID='https://theflatratemovers.com/#dataset-industrial-commercial-deployment'

S_D8 = "Workforce deployment coverage \u2014 a separate scope within this service: the Specialized Workforce Labor service deploys teams to jobs in all 48 contiguous United States, quoted per job. That nationwide workforce deployment coverage attaches to the workforce service only; it does not change the branches' 52-area moving footprint above, which governs the moving services."
S_D4 = "Deployment under the service's workforce layer (Specialized Workforce Labor) covers all 48 contiguous United States, quoted per job \u2014 a workforce deployment scope distinct from the branches' 52-area moving footprint."
S_G  = "The service's workforce layer, Specialized Workforce Labor, carries workforce deployment coverage in all 48 contiguous states, quoted per job \u2014 a nationwide workforce scope distinct from the branches' 52-area moving footprint."

def diffs(a,b,path=''):
    out=[]
    if type(a)!=type(b): return [path]
    if isinstance(a,dict):
        if set(a)!=set(b): out.append(path+'<keys>')
        for k in a:
            if k in b: out+=diffs(a[k],b[k],path+'/'+k)
    elif isinstance(a,list):
        if len(a)!=len(b): out.append(path+'<len>')
        for i,(x,y) in enumerate(zip(a,b)): out+=diffs(x,y,f'{path}[{i}]')
    elif a!=b: out.append(path)
    return out

def node_by_id(doc, nid):
    hits=[n for n in doc.get('@graph',[]) if isinstance(n,dict) and n.get('@id')==nid]
    assert len(hits)==1, (nid, len(hits))
    return hits[0]

fails=[]
# --- EDIT 1: dataset file ---
raw=open(PUB+'/datasets-industrial-commercial.json','rb').read()
doc=json.loads(raw); orig=copy.deepcopy(doc)
d8=node_by_id(doc,D8_ID); d4=node_by_id(doc,D4_ID)
assert d8['description'].endswith('The company was founded in June 2010.')
d8['description']=d8['description']+' '+S_D8
d4['description']=d4['description']+' '+S_D4
d=diffs(orig,doc)
print('EDIT1 dataset parsed-diff paths:', d)
if len(d)!=2 or not all('/description' in x for x in d): fails.append('EDIT1 diff gate')
out=json.dumps(doc,indent=2)+'\n'
assert json.loads(out)==doc
open(BK+'/work/datasets-industrial-commercial.json','w').write(out)
open(BK+'/work/ai-data/datasets-industrial-commercial.json','w').write(out)

# --- EDIT 2: graphs ---
for fname,ind,ea,ai_name in [('entity-graph.json',2,False,'entity-graph-full.json'),('best-json-entity-graph.json',1,False,'best-json-entity-graph-full.json')]:
    raw=open(PUB+'/'+fname,'rb').read()
    doc=json.loads(raw); orig=copy.deepcopy(doc)
    n=node_by_id(doc,CANON)
    n['description']=n['description']+' '+S_G
    d=diffs(orig,doc)
    print(f'EDIT2 {fname} parsed-diff paths:', d)
    if len(d)!=1 or '/description' not in d[0]: fails.append('EDIT2 '+fname)
    out=json.dumps(doc,indent=ind,ensure_ascii=ea)+'\n'
    assert json.loads(out)==doc
    open(BK+'/work/'+fname,'w').write(out)
    open(BK+'/work/ai-data/'+ai_name,'w').write(out)

# --- index.html embeds ---
h=open(PUB+'/index.html').read()
blocks=[(m.start(1),m.end(1),m.group(1)) for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', h, re.S)]
def block_parsed(i): return json.loads(blocks[i][2])
# Block 26: dataset embed
b26=blocks[26][2]
assert b26.count('invoice per job. The company was founded in June 2010.')==1
assert b26.count('no minimum team size, minimum hours, or screening claim is published for this service.')==1
esc=lambda s: s.replace('\u2014','\\u2014')
nb26=b26.replace('invoice per job. The company was founded in June 2010."',
                 'invoice per job. The company was founded in June 2010. '+esc(S_D8)+'"')
nb26=nb26.replace('no minimum team size, minimum hours, or screening claim is published for this service."',
                  'no minimum team size, minimum hours, or screening claim is published for this service. '+esc(S_D4)+'"')
p_old=block_parsed(26); p_new=json.loads(nb26)
d=diffs(p_old,p_new); print('EDIT1 embed (block26) parsed-diff paths:', d)
if len(d)!=2 or not all('/description' in x for x in d): fails.append('EDIT1 embed diff gate')
# embed must parse-equal updated dataset file
filedoc=json.load(open(BK+'/work/datasets-industrial-commercial.json'))
print('block26 parse-equals updated dataset file:', p_new==filedoc)
if p_new!=filedoc: fails.append('embed != dataset file')
# Block 0: head graph canonical node
b0=blocks[0][2]
assert b0.count('Residential/Driver Meet $400-$425 per man.')==1
nb0=b0.replace('Residential/Driver Meet $400-$425 per man."',
               'Residential/Driver Meet $400-$425 per man. '+S_G+'"')
p0_old=block_parsed(0); p0_new=json.loads(nb0)
d=diffs(p0_old,p0_new); print('EDIT2 embed (block0) parsed-diff paths:', d)
if len(d)!=1 or '/description' not in d[0]: fails.append('EDIT2 embed diff gate')
# head graph parse-equals updated entity-graph? compare canonical node only + whole doc vs entity graph file
eg=json.load(open(BK+'/work/entity-graph.json'))
print('block0 canonical node == entity-graph canonical node:', node_by_id(p0_new,CANON)==node_by_id(eg,CANON))
if node_by_id(p0_new,CANON)!=node_by_id(eg,CANON): fails.append('head canonical != entity-graph canonical')
# splice back (do block 26 first - later offset)
h2=h[:blocks[26][0]]+nb26+h[blocks[26][1]:]
# recompute block0 offsets unchanged (block0 before block26)
h2=h2[:blocks[0][0]]+nb0+h2[blocks[0][1]:] if False else h2
# careful: after replacing block26 (later in file), block0 offsets still valid
start0,end0,_=blocks[0]
h2=h[:start0]+nb0+h[start0+len(b0):]  # rebuild cleanly from original
# redo: build from original with both replacements, block26 offsets from original (unaffected by block0 len change? block0 is BEFORE block26, so splice block26 first)
h2=h[:blocks[26][0]]+nb26+h[blocks[26][1]:]
h2=h2[:blocks[0][0]]+nb0+h2[blocks[0][1]:]
open(BK+'/work/index.html','w').write(h2)
print('index.html written, delta bytes:', len(h2)-len(h))
if fails:
    print('GATE FAILURES:', fails); sys.exit(1)
print('ALL EDIT GATES PASS')
