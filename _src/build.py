#!/usr/bin/env python3
"""奶蛙尖塔 打包：图片分块(<1MB)、字体子集、输出 dist/"""
import json, re, os, sys, shutil, glob, base64, io
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src"); DIST = os.path.join(ROOT, "dist")
FONTDIR = "/tmp/claude-0/-home-claude/e4bf23af-1bfe-54b2-8edd-5f9cf2c468ea/scratchpad/font/x/package/files"
dev = "--dev" in sys.argv

texts = "".join(open(os.path.join(SRC, f), encoding="utf8").read() for f in ["data.js", "game.js", "ui.js", "index.html"])
allimg = json.load(open(os.path.join(ROOT, "assets/_all.json")))
keys = set(re.findall(r'img:"(\w+)"', texts)) | set(re.findall(r'IMG\("(\w+)"\)', texts)) | set(re.findall(r'\["(\w+)","[^"]*",', texts)) | set(re.findall(r'ic:"(\w+)"', texts))
keys = sorted(k for k in keys if k in allimg)
print("images:", len(keys))
sys.path.insert(0, ROOT); import procimg
from PIL import Image
cache_p = os.path.join(ROOT, "assets/_proc2.json")
cache = json.load(open(cache_p)) if os.path.exists(cache_p) else {}
for k in keys:
    srp = os.path.join(ROOT, "sr/out", k + ".png")
    if k in cache and cache[k][0] == os.path.exists(srp): continue
    if os.path.exists(srp): cache[k] = [True, procimg.to_uri(procimg.proc(None, src=Image.open(srp)))]
    else: cache[k] = [False, procimg.to_uri(procimg.proc(allimg[k]))]
    missing_sr = not os.path.exists(srp)
    if missing_sr: print("  (no SR yet)", k)
json.dump(cache, open(cache_p, "w"))
allimg = {k: v[1] for k, v in cache.items()}

def write_imgs(out):
    chunks, cur, size = [], {}, 0
    for k in keys:
        v = allimg[k]
        if size + len(v) > 850_000 and cur:
            chunks.append(cur); cur, size = {}, 0
        cur[k] = v; size += len(v) + len(k) + 6
    if cur: chunks.append(cur)
    names = []
    for i, c in enumerate(chunks):
        n = f"img{i}.js"; names.append(n)
        with open(os.path.join(out, n), "w") as f:
            f.write("window.__NWT_IMG=Object.assign(window.__NWT_IMG||{}," + json.dumps(c, separators=(",", ":")) + ");")
    return names

def build_font(out):
    from fontTools.ttLib import TTFont
    from fontTools import subset
    chars = set(texts) | set("0123456789+-×/%：，。！？「」…（）·、ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ")
    chars = {c for c in chars if ord(c) >= 32}
    faces = []
    remaining = set(chars)
    for fp in sorted(glob.glob(os.path.join(FONTDIR, "*-400-normal.woff2"))):
        f = TTFont(fp); cmap = f.getBestCmap() or {}
        here = {c for c in remaining if ord(c) in cmap}
        if not here: continue
        remaining -= here
        opt = subset.Options(); opt.flavor = "woff2"; opt.layout_features = ["*"]
        sub = subset.Subsetter(opt); sub.populate(unicodes=[ord(c) for c in here]); sub.subset(f)
        buf = io.BytesIO(); f.flavor = "woff2"; f.save(buf)
        rng = ",".join("U+%X" % ord(c) for c in sorted(here))
        faces.append((buf.getvalue(), rng))
    css = "".join("@font-face{font-family:'ZCOOL KuaiLe';font-style:normal;font-weight:400;font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}\n" % (base64.b64encode(b).decode(), r) for b, r in faces)
    open(os.path.join(out, "font.css"), "w").write(css)
    print("font faces:", len(faces), "css KB:", len(css) // 1024, "missing:", "".join(sorted(remaining))[:80])

out = SRC if dev else DIST
if not dev:
    shutil.rmtree(DIST, ignore_errors=True); os.makedirs(DIST)
    for f in ["data.js", "game.js", "music.js", "ui.js", "style.css"]:
        shutil.copy(os.path.join(SRC, f), DIST)
names = write_imgs(out)
html = open(os.path.join(SRC, "index.html"), encoding="utf8").read()
tags = "".join(f'<script src="{n}"></script>' for n in names)
html = re.sub(r'<script src="img\d+\.js"></script>(\s*<script src="img\d+\.js"></script>)*', tags, html)
open(os.path.join(SRC, "index.html"), "w", encoding="utf8").write(html)
if not dev: open(os.path.join(DIST, "index.html"), "w", encoding="utf8").write(html)
if "--nofont" not in sys.argv: build_font(out)
for f in sorted(os.listdir(out)):
    p = os.path.join(out, f)
    if os.path.isfile(p): print(f"  {f:14s} {os.path.getsize(p)//1024:5d} KB")
