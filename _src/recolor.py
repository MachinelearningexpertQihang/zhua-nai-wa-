"""反派重新上色：把黄色皮肤换成别的颜色，和主角区分开"""
import numpy as np
from PIL import Image
VAR={ # key: (源图, 目标色相°, 饱和度倍数, 亮度倍数)
 "v_ms":("ms",265,.45,.9),"v_pp":("pp",26,.85,.62),"v_m3":("m3",100,.9,.9),"v_ck":("ck",352,1.0,.9),
 "v_m4":("m4",280,.85,.85),"v_xs":("xs",12,1.0,.95),"v_xg":("xg",178,.8,.85),"v_yjx":("yjx",318,.9,.9),"v_xc":("xc",24,.8,.6)}
def rgb2hsv(a):
    r,g,b=a[...,0],a[...,1],a[...,2];mx=a.max(-1);mn=a.min(-1);d=mx-mn
    h=np.zeros_like(mx);m=d>1e-6
    rr=(mx==r)&m;gg=(mx==g)&m&~rr;bb=m&~rr&~gg
    h[rr]=((g-b)[rr]/d[rr])%6;h[gg]=((b-r)[gg]/d[gg])+2;h[bb]=((r-g)[bb]/d[bb])+4;h/=6
    s=np.where(mx>0,d/np.maximum(mx,1e-6),0);return h,s,mx
def hsv2rgb(h,s,v):
    i=np.floor(h*6).astype(int)%6;f=h*6-np.floor(h*6);p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s)
    out=np.zeros(h.shape+(3,))
    for k,(a,b,c) in enumerate([(v,t,p),(q,v,p),(p,v,t),(p,q,v),(t,p,v),(v,p,q)]):
        m=i==k;out[m,0]=a[m];out[m,1]=b[m];out[m,2]=c[m]
    return out
def recolor(img,hue,sm,vm):
    a=np.asarray(img.convert('RGBA')).astype(float)/255;rgb=a[...,:3]
    h,s,v=rgb2hsv(rgb)
    # 黄色区域权重（柔和过渡）
    w=np.clip(1-np.abs(h-.135)/.07,0,1)*np.clip((s-.15)/.2,0,1)
    nh=np.where(w>0,hue/360,h);ns=np.clip(s*sm,0,1);nv=np.clip(v*vm,0,1)
    new=hsv2rgb(nh,ns,nv);w3=w[...,None];out=rgb*(1-w3)+new*w3
    res=np.dstack([out,a[...,3]]);return Image.fromarray((res*255).round().astype(np.uint8),'RGBA')
if __name__=="__main__":
    import sys
    for k,(src,hh,sm,vm) in VAR.items():
        im=recolor(Image.open(f"sr/out/{src}.png"),hh,sm,vm);im.save(f"sr/out/{k}.png");print(k)
