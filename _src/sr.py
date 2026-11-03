import torch,torch.nn as nn,torch.nn.functional as F,numpy as np,io,base64,sys
from PIL import Image
class RDB(nn.Module):
    def __init__(s,f=64,g=32):
        super().__init__()
        s.conv1=nn.Conv2d(f,g,3,1,1);s.conv2=nn.Conv2d(f+g,g,3,1,1);s.conv3=nn.Conv2d(f+2*g,g,3,1,1);s.conv4=nn.Conv2d(f+3*g,g,3,1,1);s.conv5=nn.Conv2d(f+4*g,f,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        x1=s.l(s.conv1(x));x2=s.l(s.conv2(torch.cat((x,x1),1)));x3=s.l(s.conv3(torch.cat((x,x1,x2),1)));x4=s.l(s.conv4(torch.cat((x,x1,x2,x3),1)));x5=s.conv5(torch.cat((x,x1,x2,x3,x4),1));return x5*.2+x
class RRDB(nn.Module):
    def __init__(s,f,g):
        super().__init__();s.rdb1=RDB(f,g);s.rdb2=RDB(f,g);s.rdb3=RDB(f,g)
    def forward(s,x):return s.rdb3(s.rdb2(s.rdb1(x)))*.2+x
class RRDBNet(nn.Module):
    def __init__(s,nb,f=64,g=32):
        super().__init__();s.conv_first=nn.Conv2d(3,f,3,1,1);s.body=nn.Sequential(*[RRDB(f,g) for _ in range(nb)]);s.conv_body=nn.Conv2d(f,f,3,1,1)
        s.conv_up1=nn.Conv2d(f,f,3,1,1);s.conv_up2=nn.Conv2d(f,f,3,1,1);s.conv_hr=nn.Conv2d(f,f,3,1,1);s.conv_last=nn.Conv2d(f,3,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        fe=s.conv_first(x);fe=fe+s.conv_body(s.body(fe))
        fe=s.l(s.conv_up1(F.interpolate(fe,scale_factor=2,mode='nearest')));fe=s.l(s.conv_up2(F.interpolate(fe,scale_factor=2,mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(fe)))
_M={}
def model(name):
    if name not in _M:
        nb=6 if name=='anime6b' else 23;m=RRDBNet(nb);sd=torch.load(f'/home/claude/naiwa-tower/sr/{name}.pth',map_location='cpu');sd=sd.get('params_ema',sd.get('params',sd));m.load_state_dict(sd);m.eval();_M[name]=m
    return _M[name]
torch.set_num_threads(2)
def up(img,name='anime6b'):
    """img: PIL RGBA -> 4x RGBA (alpha upscaled bicubic)"""
    rgb=np.asarray(img.convert('RGB')).astype(np.float32)/255
    t=torch.from_numpy(rgb).permute(2,0,1)[None]
    with torch.no_grad():o=model(name)(t).clamp(0,1)[0].permute(1,2,0).numpy()
    out=Image.fromarray((o*255).round().astype(np.uint8))
    a=img.getchannel('A').resize(out.size,Image.BICUBIC)
    out.putalpha(a);return out
