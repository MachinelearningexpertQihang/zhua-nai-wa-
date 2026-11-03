"""角色图处理：硬化边缘 + 锐化 + 贴纸描边"""
import json,base64,io,sys
from PIL import Image,ImageFilter,ImageChops
def proc(data_uri, outline=True):
    im=Image.open(io.BytesIO(base64.b64decode(data_uri.split(',')[1]))).convert('RGBA')
    pad=14; W,H=im.size
    big=Image.new('RGBA',(W+pad*2,H+pad*2),(0,0,0,0)); big.paste(im,(pad,pad)); im=big
    # 放大一点再处理，边缘更顺
    im=im.resize((int(im.width*1.25),int(im.height*1.25)),Image.LANCZOS)
    r,g,b,a=im.split()
    # 硬化 alpha：去掉半透明光晕
    a=a.point(lambda v:0 if v<90 else 255 if v>170 else int((v-90)*255/80))
    a=a.filter(ImageFilter.MinFilter(3))  # 收一圈，吃掉白边
    a=a.filter(ImageFilter.GaussianBlur(.7))
    rgb=Image.merge('RGB',(r,g,b)).filter(ImageFilter.UnsharpMask(radius=2.2,percent=140,threshold=2))
    rgb=rgb.filter(ImageFilter.UnsharpMask(radius=.8,percent=60,threshold=1))
    body=Image.merge('RGBA',(*rgb.split(),a))
    if not outline: return body
    hard=a.point(lambda v:255 if v>60 else 0)
    w1=hard.filter(ImageFilter.MaxFilter(11)).filter(ImageFilter.GaussianBlur(.8))   # 白边
    w2=hard.filter(ImageFilter.MaxFilter(17)).filter(ImageFilter.GaussianBlur(.8))  # 深色外线
    out=Image.new('RGBA',body.size,(0,0,0,0))
    out.paste(Image.new('RGBA',body.size,(43,26,58,255)),(0,0),w2)
    out.paste(Image.new('RGBA',body.size,(255,252,240,255)),(0,0),w1)
    out.alpha_composite(body)
    return out
def to_uri(im,q=86):
    buf=io.BytesIO(); im.save(buf,'WEBP',quality=q,method=6); return 'data:image/webp;base64,'+base64.b64encode(buf.getvalue()).decode()
if __name__=='__main__':
    d=json.load(open('/home/claude/naiwa-tower/assets/_all.json'))
    for k in sys.argv[1:]:
        proc(d[k]).save(f'/tmp/claude-0/-home-claude/e4bf23af-1bfe-54b2-8edd-5f9cf2c468ea/scratchpad/proc/{k}.png')
