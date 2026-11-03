import sys,json,base64,io,os
sys.path.insert(0,'/home/claude/naiwa-tower/sr');import sr
from PIL import Image,ImageFilter
d=json.load(open('/home/claude/naiwa-tower/assets/_all.json'))
keys=sys.argv[1].split(',')
for k in keys:
    p=f'/home/claude/naiwa-tower/sr/out/{k}.png'
    if os.path.exists(p) or k not in d: continue
    im=Image.open(io.BytesIO(base64.b64decode(d[k].split(',')[1]))).convert('RGBA')
    sc=340/max(im.size)
    if sc<1: im=im.resize((round(im.width*sc),round(im.height*sc)),Image.LANCZOS)
    pad=10;b=Image.new('RGBA',(im.width+2*pad,im.height+2*pad),(0,0,0,0));b.paste(im,(pad,pad));im=b
    # 背景铺成接近主体的颜色，避免黑边被放大
    rgbim=Image.new('RGB',im.size,(0,0,0));
    o=sr.up(im)
    a=im.getchannel('A');al=Image.merge('RGBA',(a,a,a,Image.new('L',a.size,255)))
    ao=sr.up(al).convert('L')
    o.putalpha(ao)
    s=min(1,640/max(o.size));o=o.resize((round(o.width*s),round(o.height*s)),Image.LANCZOS)
    o.save(p);print(k,flush=True)
