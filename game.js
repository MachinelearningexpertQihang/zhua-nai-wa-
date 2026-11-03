/* ===================== 奶蛙尖塔 · 主程序 ===================== */
"use strict";
const VER="0.1 试玩版";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const IMG=k=>(window.__NWT_IMG||{})[k]||"";
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let S=null,B=null,busy=false;
let M={wins:0,runs:0,shards:0,tale:0,best:0,seen:{}};
try{Object.assign(M,JSON.parse(localStorage.getItem("nwt-meta")||"{}"))}catch(e){}
const saveMeta=()=>{try{localStorage.setItem("nwt-meta",JSON.stringify(M))}catch(e){}};
const saveRun=()=>{try{if(S)localStorage.setItem("nwt-run",JSON.stringify(S));else localStorage.removeItem("nwt-run")}catch(e){}};
const loadRun=()=>{try{const s=JSON.parse(localStorage.getItem("nwt-run")||"null");return s&&s.v===1?s:null}catch(e){return null}};

/* ---------- 随机数（存档可复现） ---------- */
function rnd(){if(!S)return Math.random();let t=S.rs=(S.rs+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}
const ri=n=>Math.floor(rnd()*n);
const pick=a=>a[ri(a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const has=r=>S&&S.relics.includes(r);

/* ---------- 舞台缩放 / 横屏 ---------- */
function fit(){const W=innerWidth,H=innerHeight,st=$("#stage");const port=H>W*1.05;let s;
 if(port){s=Math.min(W/720,H/1280);st.style.transform=`translate(-50%,-50%) rotate(90deg) scale(${s})`}
 else{s=Math.min(W/1280,H/720);st.style.transform=`translate(-50%,-50%) scale(${s})`}
 document.body.classList.toggle("port",port)}
addEventListener("resize",fit);addEventListener("orientationchange",()=>setTimeout(fit,200));

/* ---------- 音效 ---------- */
function sfx(n){if(!A.ctx||!A.sfx)return;const t=A.ctx.currentTime;
 switch(n){
 case"card":noise({t,dur:.12,vol:.18,f:1800,f2:5000,q:.6});tone({type:"sine",f:520,f2:780,t:t+.02,dur:.12,vol:.07});break;
 case"draw":noise({t,dur:.06,vol:.08,f:3000,q:.8});break;
 case"hit":tone({type:"sine",f:170,f2:55,t,dur:.18,vol:.5});noise({t,dur:.12,vol:.3,f:900,f2:300,q:.7});break;
 case"bighit":tone({type:"sine",f:120,f2:40,t,dur:.35,vol:.6});noise({t,dur:.3,vol:.4,filt:"lowpass",f:1200,f2:200});break;
 case"block":tone({type:"triangle",f:880,t,dur:.18,vol:.12});tone({type:"sine",f:1320,t:t+.04,dur:.25,vol:.08});noise({t,dur:.08,vol:.08,filt:"highpass",f:4000});break;
 case"hurt":tone({type:"sawtooth",f:220,f2:110,t,dur:.22,vol:.15,filt:"lowpass",ff:900});noise({t,dur:.15,vol:.25,f:700});break;
 case"tri":[72,76,79,84,88].forEach((m,i)=>tone({type:"triangle",f:mtof(m),t:t+i*.06,dur:.4,vol:.14}));tone({type:"sine",f:mtof(96),t:t+.32,dur:.6,vol:.06});break;
 case"coin":tone({type:"square",f:988,t,dur:.07,vol:.06});tone({type:"square",f:1319,t:t+.07,dur:.2,vol:.06});break;
 case"heal":[67,71,74,79].forEach((m,i)=>tone({type:"sine",f:mtof(m),t:t+i*.07,dur:.35,vol:.1}));break;
 case"buff":tone({type:"sine",f:440,f2:880,t,dur:.3,vol:.12});tone({type:"triangle",f:660,f2:1320,t:t+.05,dur:.3,vol:.06});break;
 case"debuff":tone({type:"sawtooth",f:500,f2:200,t,dur:.3,vol:.08,filt:"lowpass",ff:1500});break;
 case"click":tone({type:"sine",f:740,t,dur:.06,vol:.08});break;
 case"turn":[60,64,67].forEach((m,i)=>tone({type:"triangle",f:mtof(m+12),t:t+i*.05,dur:.25,vol:.08}));break;
 case"enemy":[57,53].forEach((m,i)=>tone({type:"sawtooth",f:mtof(m),t:t+i*.1,dur:.2,vol:.06,filt:"lowpass",ff:900}));break;
 case"boom":SFX.boom?SFX.boom():tone({type:"sine",f:100,f2:30,t,dur:.5,vol:.6});break;
 case"win":[72,76,79,84].forEach((m,i)=>tone({type:"triangle",f:mtof(m),t:t+i*.12,dur:.5,vol:.14}));break;
 case"lose":[62,61,60,59].forEach((m,i)=>tone({type:"sawtooth",f:mtof(m-12),t:t+i*.3,dur:.35,vol:.12,filt:"lowpass",ff:1000}));break;
 case"relic":[79,83,86,91].forEach((m,i)=>tone({type:"sine",f:mtof(m),t:t+i*.05,dur:.5,vol:.09}));break;
 case"mud":noise({t,dur:.25,vol:.25,filt:"lowpass",f:600,f2:150});tone({type:"sine",f:140,f2:70,t,dur:.2,vol:.2});break;
 }}

/* ---------- 小工具 ---------- */
function toast(h){const d=document.createElement("div");d.innerHTML=h;$("#toast").appendChild(d);setTimeout(()=>d.remove(),2700)}
function show(id){$$(".scr").forEach(s=>s.classList.toggle("on",s.id===id));$("#top").classList.toggle("on",!!S&&!["title","heroSel","ending","none"].includes(id));closeTip()}
function setBg(kind){const b=$("#bg");const fl=[...Array(7)].map((_,i)=>`<i class="ffly" style="left:${8+i*13}%;bottom:${10+(i*37)%24}%;animation-delay:${i*.9}s"></i>`).join("");
 if(kind==="map"){b.className="bgmap";b.innerHTML=`<div class="parch"></div>`;return}
 b.className="";b.innerHTML=sceneSVG(kind)+(kind==="shop"?"":fl)}
function closeTip(){$$(".tipBox").forEach(t=>t.remove())}
function tipAt(el,html){closeTip();const r=rectIn(el),d=document.createElement("div");d.className="tipBox";d.innerHTML=html;$("#stage").appendChild(d);
 let x=r.x+r.w/2-130,y=r.y+r.h+8;x=Math.max(10,Math.min(1010,x));if(y>560)y=r.y-d.offsetHeight-8;d.style.left=x+"px";d.style.top=y+"px";setTimeout(()=>addEventListener("pointerdown",closeTip,{once:true}),10)}
function rectIn(el){const st=$("#stage").getBoundingClientRect(),r=el.getBoundingClientRect(),port=document.body.classList.contains("port");
 const sc=port?st.width/720:st.width/1280;
 if(!port)return{x:(r.left-st.left)/sc,y:(r.top-st.top)/sc,w:r.width/sc,h:r.height/sc};
 // 竖屏旋转了 90°：屏幕 x→舞台 y，屏幕 y→舞台(1280-x)
 return{x:(r.top-st.top)/sc,y:(st.right-r.right)/sc,w:r.height/sc,h:r.width/sc}}
function center(el){const r=rectIn(el);return{x:r.x+r.w/2,y:r.y+r.h/2,top:r.y}}

/* ---------- 卡牌显示 ---------- */
const mk=(id,u=0)=>({id,u,k:S?++S.uid:Math.random()});
function cname(c){return CARDS[c.id].n+(c.u?"+":"")}
function baseCost(c){const D=CARDS[c.id];return c.u&&D.cu!=null?D.cu:D.cost}
function curCost(c){const D=CARDS[c.id];if(D.cost<0)return D.cost;let v=baseCost(c);if(c.tmp!=null)v=c.tmp;if(B&&D.dyn)v+=D.dyn(B);if(B&&B.p.free)v=0;return Math.max(0,v)}
function descHTML(c){const D=CARDS[c.id];const t=D.d(!!c.u);if(!c.u)return esc(t).replace(/(\d+)/g,"<b>$1</b>");
 const base=D.d(false).match(/\d+/g)||[];let i=0;return esc(t).replace(/(\d+)/g,m=>{const o=base[i++];return`<b class="${o!==m?"g":""}">${m}</b>`})}
function cardHTML(c,cls=""){const D=CARDS[c.id],fam=FAM[D.fam];let cost=B&&cls.includes("inhand")?curCost(c):baseCost(c);
 let cc="";if(D.cost===-2)cc="na";else if(B&&cls.includes("inhand")&&D.cost>=0){if(cost<baseCost(c))cc="dn";else if(cost>baseCost(c))cc="upc"}
 const cs=D.cost===-1?"X":cost;
 const extra=[D.exh||(D.exhU&&!c.u)?"消耗":"",D.eth?"虚无":""].filter(Boolean);
 return`<div class="card r-${D.r} t-${D.type}${c.u?" up":""} ${cls}" data-k="${c.k}"><div class="cf"><div class="in"><div class="art"><img src="${IMG(D.img)}" alt=""></div><div class="tpc"><em>${TYPE[D.type].n}</em>${D.fam!=="none"?`<i style="--famc:${fam.c}">${fam.n}</i>`:""}</div><div class="ds"><span>${descHTML(c)}</span></div></div><div class="rib"><span>${esc(cname(c))}</span></div></div><div class="cost ${cc}">${cs}</div><i class="gem"></i><span class="tri">三连！</span></div>`}
function relicHTML(id,extra=""){const R=RELICS[id];return`<div class="rl ${extra}" data-rl="${id}"><img src="${IMG(R.img)}" alt=""></div>`}
function potHTML(id){if(!id)return`<div class="pot"></div>`;return`<div class="pot full" data-pot="${id}"><i class="flask" style="--pc:${POTIONS[id].c}"></i></div>`}
function seeCard(id){if(!M.seen[id]){M.seen[id]=1;saveMeta()}}

/* ---------- 顶栏 ---------- */
function renderTop(){if(!S)return;const t=$("#top");const fl=S.row<0?0:S.row+1;
 t.innerHTML=`<div class="face"><img src="${IMG("n1")}"></div><span class="hpIco">${ICON.heart}</span><div class="hpPill"><i style="width:${S.hp/S.max*100}%"></i><span>${S.hp}/${S.max}</span></div><div class="goldBox">${ICON.coin}${S.gold}</div><div class="pots">${[...Array(S.potSlots)].map((_,i)=>potHTML(S.pots[i])).join("")}</div><div class="relics">${S.relics.map(r=>relicHTML(r)).join("")}</div><div class="floor">泥沼回廊<b>${S.atBoss?"首领":fl?fl+" 层":"入口"}</b></div><button class="tbtn" id="deckBtn">${ICON.deck}${S.deck.length}</button><button class="tbtn" id="setBtn">${ICON.gear}</button>`;
 $$("#top .rl").forEach(e=>e.onclick=ev=>{ev.stopPropagation();const R=RELICS[e.dataset.rl];tipAt(e,`<b>${R.n}</b><p>${R.d}</p>`)});
 $$("#top .pot.full").forEach((e,i)=>e.onclick=ev=>{ev.stopPropagation();potMenu(e,[...$$("#top .pot")].indexOf(e))});
 $("#deckBtn").onclick=()=>viewCards(S.deck,"我的牌组",`共 ${S.deck.length} 张`);
 $("#setBtn").onclick=settings}
function potMenu(el,i){const id=S.pots[i],P=POTIONS[id];const inB=B&&!B.over&&$("#battle").classList.contains("on");const canUse=inB&&!busy&&B.myTurn||id==="pheal";
 tipAt(el,`<b>${P.n}</b><p>${P.d}</p><div style="display:flex;gap:8px;margin-top:10px">${canUse?`<button class="btn sm" id="pUse" style="min-width:90px">使用</button>`:""}<button class="btn sm ghost" id="pDrop" style="min-width:90px">丢掉</button></div>`);
 const u=$("#pUse");if(u)u.onpointerdown=e=>{e.stopPropagation();closeTip();usePotion(i)};
 $("#pDrop").onpointerdown=e=>{e.stopPropagation();closeTip();S.pots.splice(i,1);renderTop();saveRun()}}
function usePotion(i){const id=S.pots[i],P=POTIONS[id];
 if(!B||B.over||!$("#battle").classList.contains("on")){if(id==="pheal"){S.pots.splice(i,1);S.hp=Math.min(S.max,S.hp+20);sfx("heal");toast("回复了 <b>20</b> 生命");renderTop();saveRun()}return}
 if(P.tgt){const al=B.alive();if(al.length===1){S.pots.splice(i,1);P.fx(B,al[0]);afterAction()}else{B.sel={pot:i};hint("点一个敌人使用 "+P.n);renderBattle()}return}
 S.pots.splice(i,1);P.fx(B);sfx("buff");afterAction()}
function settings(){ov(`<div class="modal"><h3>设置</h3><div class="row" style="flex-direction:column;align-items:center;gap:14px"><button class="btn sm ${A.music?"":"ghost"}" id="sMus" style="min-width:240px">音乐：${A.music?"开":"关"}</button><button class="btn sm ${A.sfx?"":"ghost"}" id="sSfx" style="min-width:240px">音效：${A.sfx?"开":"关"}</button><button class="btn sm ghost" id="sCodex" style="min-width:240px">卡牌图鉴</button><button class="btn sm ghost" id="sQuit" style="min-width:240px">保存并回到标题</button><button class="btn sm pink" id="sGive" style="min-width:240px">放弃这次冒险</button><button class="btn sm" id="sClose" style="min-width:240px">继续</button></div></div>`);
 $("#sMus").onclick=()=>{A.music=!A.music;audioSave();settings()};$("#sSfx").onclick=()=>{A.sfx=!A.sfx;audioSave();settings()};
 $("#sCodex").onclick=()=>codex();$("#sClose").onclick=closeOv;
 $("#sQuit").onclick=()=>{saveRun();closeOv();B=null;titleScreen()};
 $("#sGive").onclick=()=>confirmBox("放弃这次冒险？","这一次爬塔的进度会消失。",()=>{closeOv();gameOver(true)})}
function confirmBox(t,p,yes){ov(`<div class="modal"><h3>${t}</h3><p>${p}</p><div class="row"><button class="btn sm ghost" id="cNo" style="color:#5a3a1a">再想想</button><button class="btn sm pink" id="cYes">确定</button></div></div>`);$("#cNo").onclick=closeOv;$("#cYes").onclick=yes}

/* ---------- 浮层 ---------- */
function ov(h){const o=$("#ov");o.innerHTML=h;o.classList.add("on")}
function closeOv(){$("#ov").classList.remove("on");$("#ov").innerHTML=""}
function viewCards(list,title,sub,sort=true){let arr=[...list];if(sort)arr.sort((a,b)=>"SCRELXTK".indexOf(CARDS[a.id].r)-"SCRELXTK".indexOf(CARDS[b.id].r)||a.id.localeCompare(b.id));
 ov(`<div class="ovHead"><span class="ribbon b">${title}</span><small>${sub||""}</small></div><div class="ovGrid">${arr.length?arr.map(c=>cardHTML(c,"mid")).join(""):`<div class="ovEmpty">这里还空空的</div>`}</div><div class="ovFoot"><button class="btn sm" id="ovX">返回</button></div>`);$("#ovX").onclick=closeOv}
/* 选牌：list=牌实例, opts:{title,sub,n,cancel,filter,confirm(c)->html} */
function pickCards(list,opts){return new Promise(res=>{let sel=[];const n=opts.n||1;
 const draw=()=>{ov(`<div class="ovHead"><span class="ribbon b">${opts.title}</span><small>${opts.sub||""}</small></div><div class="ovGrid">${list.length?list.map(c=>cardHTML(c,"mid"+(sel.includes(c)?" pk":""))).join(""):`<div class="ovEmpty">没有可以选的牌</div>`}</div><div class="ovFoot">${opts.cancel!==false?`<button class="btn sm ghost" id="pkX">${opts.cancelTxt||"算了"}</button>`:""}${n>1?`<button class="btn sm" id="pkOk" ${sel.length?"":"disabled"}>确定</button>`:""}</div>`);
  $$("#ov .ovGrid .card").forEach((e,i)=>e.onclick=()=>{const c=list[i];sfx("click");if(n===1){if(opts.confirm){confirmPick(c)}else{closeOv();res([c])}}else{sel.includes(c)?sel.splice(sel.indexOf(c),1):sel.length<n&&sel.push(c);draw()}});
  const x=$("#pkX");if(x)x.onclick=()=>{closeOv();res([])};const ok=$("#pkOk");if(ok)ok.onclick=()=>{closeOv();res(sel)};
  if(!list.length&&opts.cancel===false)setTimeout(()=>{closeOv();res([])},900)};
 const confirmPick=c=>{ov(`<div class="ovHead"><span class="ribbon b">${opts.title}</span><small>确认一下</small></div><div class="cmpRow">${opts.confirm(c)}</div><div class="ovFoot"><button class="btn sm ghost" id="pkB">换一张</button><button class="btn sm" id="pkY">就它了</button></div>`);$("#pkB").onclick=draw;$("#pkY").onclick=()=>{closeOv();res([c])}};
 draw()})}
function codex(){const all=[...POOL_HERO,...POOL_X];let up=false;const d=()=>{const list=all.map(id=>({id,u:up?1:0,k:id}));
 ov(`<div class="ovHead"><span class="ribbon b">卡牌图鉴</span><small>已见过 ${all.filter(i=>M.seen[i]).length} / ${all.length} 张　没见过的牌会显示成剪影</small></div><div class="tabs"><button class="${up?"":"on"}" id="cx0">原版</button><button class="${up?"on":""}" id="cx1">升级后</button></div><div class="ovGrid" style="top:150px">${list.map(c=>M.seen[c.id]?cardHTML(c,"mid"):`<div class="card mid cback"><div class="cf"><div class="in"><b>?</b><small>还没遇到</small></div></div></div>`).join("")}</div><div class="ovFoot"><button class="btn sm" id="ovX">返回</button></div>`);
 $("#cx0").onclick=()=>{up=false;d()};$("#cx1").onclick=()=>{up=true;d()};$("#ovX").onclick=()=>{closeOv();if(S&&$("#top").classList.contains("on"))settings()}};d()}

/* ---------- 对话 ---------- */
function talk(lines){return new Promise(res=>{const T=$("#talk");let i=0;const L=lines.map(l=>({img:l[0],who:l[1],say:l[2],side:l[0]==="n1"?"l":"r"}));
 const left=L.find(l=>l.side==="l"),right=L.find(l=>l.side==="r");
 const step=()=>{if(i>=L.length){T.classList.remove("on");T.onclick=null;res();return}const l=L[i];
  T.innerHTML=`${left?`<div class="pt l ${l.side!=="l"?"dim":""}"><img src="${IMG(l.side==="l"?l.img:left.img)}"></div>`:""}${right?`<div class="pt r ${l.side!=="r"?"dim":""}"><img src="${IMG(l.side==="r"?l.img:(L.slice(0,i+1).reverse().find(x=>x.side==="r")||right).img)}" style="${l.side==="r"?"":""}"></div>`:""}<div class="box"><div class="who ${l.side}">${l.who}</div><div class="say">${esc(l.say)}</div><div class="nx">点一下继续 ▶</div></div>`;
  T.classList.add("on");sfx("click");i++};T.onclick=step;step()})}

/* ===================== 标题 ===================== */
function titleScreen(){B=null;S=null;show("title");setBg("title");playMusic("swing");const sv=loadRun();
 $("#title").innerHTML=`<div class="logo"><h1>${"奶蛙尖塔".split("").map(c=>`<span>${c}</span>`).join("")}</h1><span class="ribbon">满月升起，尖塔归来</span><span class="ver">${VER}</span></div>
 <div class="tmenu">${sv?`<button class="btn" id="tCont">继续冒险<small style="font-size:16px;letter-spacing:0;opacity:.7">　第 ${sv.row+1} 层</small></button>`:""}<button class="btn ${sv?"ghost":""}" id="tNew">${sv?"重新开始":"开始冒险"}</button><div class="sub"><button class="btn sm ghost" id="tCodex">卡牌图鉴</button><button class="btn sm ghost" id="tSet">${A.music?"♪ 音乐开":"♪ 音乐关"}</button></div></div>
 <div class="thero"><img src="${IMG("n1")}"><i class="plat"></i></div><div class="telder"><img src="${IMG("fj")}"><i class="plat stone"></i></div>
 <div class="tmeta"><span>通关 ${M.wins} 次</span><span>记忆碎片 ${M.shards}</span></div>
 <div class="tfoot">点卡牌选中，再点敌人出牌 · 同家族连出三张触发「三连」</div>`;
 const c=$("#tCont");if(c)c.onclick=()=>{S=sv;resume()};
 $("#tNew").onclick=()=>{if(sv)confirmBox("重新开始？","现在的存档会被覆盖。",()=>{closeOv();heroSelect()});else heroSelect()};
 $("#tCodex").onclick=codex;$("#tSet").onclick=()=>{A.music=!A.music;audioSave();titleScreen()}}

const HEROES=[{id:"kungfu",n:"功夫奶蛙",img:"n1",tag:"连击 · 三连",d:"在奶茶泉边练了很多年拳。招式越连越快，最擅长一口气打出一整套。",hp:72,on:1},{id:"angel",n:"天使奶蛙",img:"an",tag:"护盾 · 回复",d:"翅膀一扇，伤口就好了一半。",hp:66},{id:"vamp",n:"吸血鬼奶蛙",img:"vp",tag:"吸血 · 牺牲",d:"古堡里那位很饿的家伙，好像也想爬塔？",hp:80},{id:"big",n:"大肚奶蛙",img:"i5",tag:"肚皮 · 反弹",d:"肚子越大，弹得越远。",hp:80}];
function heroSelect(){show("heroSel");setBg("title");let cur=0;
 $("#heroSel").innerHTML=`<div class="hsTitle"><span class="ribbon b">选择你的奶蛙</span></div><div class="hsRow">${HEROES.map((h,i)=>`<div class="hcard ${h.on?"":"lock"} ${i===0?"on":""}"><div class="pic"><img src="${IMG(h.img)}"></div>${h.on?"":`<span class="lk">敬请期待</span>`}<h3>${h.n}</h3><div class="tag">${h.tag}</div><p>${h.on?h.d:"之后的版本开放"}</p>${h.on?`<div class="hst"><span>${ICON.heart}${h.hp}</span><span>${ICON.coin}99</span><span>茶杯</span></div>`:""}</div>`).join("")}</div><div class="hsGo"><button class="btn ghost" id="hsB">返回</button><button class="btn" id="hsGo">出发！</button></div>`;
 $$(".hcard").forEach((e,i)=>e.onclick=()=>{if(!HEROES[i].on){toast(`${HEROES[i].n}还在路上，<b>之后的版本</b>开放`);return}});
 $("#hsB").onclick=titleScreen;$("#hsGo").onclick=()=>{sfx("click");newRun()}}

/* ===================== 新冒险 ===================== */
async function newRun(){const seed=(Math.random()*2**31)|0;
 S={v:1,seed,rs:seed,uid:0,hp:72,max:72,gold:99,deck:[],relics:["cup"],pots:[],potSlots:2,row:-1,col:-1,path:[],combats:0,elites:0,removeCost:75,stats:{kills:0,played:0,dmg:0,tri:0,gold:0},flags:{},evSeen:[],atBoss:false,cur:null};
 S.deck=STARTER.map(id=>mk(id));S.map=genMap();M.runs++;saveMeta();
 show("none");setBg("title");playMusic("space");
 await talk(STORY.intro);await blessing()}
async function blessing(){const opts=shuffle([
 {t:"最大生命 +10",d:"身体更结实了",f:()=>{S.max+=10;S.hp+=10}},
 {t:"获得一件随机遗物",d:"长老塞给你一个小包裹",f:()=>gainRelic(randRelic("C"))},
 {t:"移除一张「打一下」",d:"去掉一张最普通的牌",f:()=>{const i=S.deck.findIndex(c=>c.id==="strike");if(i>=0)S.deck.splice(i,1)}},
 {t:"获得 100 金币",d:"长老的私房钱",f:()=>{S.gold+=100}},
 {t:"选一张稀有牌",d:"长老教你一招",f:async()=>{const c=offerCards(3,"R",1);await chooseReward(c,"长老教你一招",false)}},
 {t:"获得两瓶药水",d:"奶茶泉的泉水",f:()=>{givePot(randPot());givePot(randPot())}}]).slice(0,3);
 return new Promise(res=>{ov(`<div class="ovHead"><span class="ribbon b">奶蛙长老的祝福</span><small>出发前，选一样带上</small></div><div class="evOpts" style="position:absolute;left:330px;right:200px;top:190px">${opts.map((o,i)=>`<button class="evo" data-i="${i}"><b>${o.t}</b><small>${o.d}</small></button>`).join("")}</div><div style="position:absolute;left:60px;bottom:30px;width:220px;height:260px"><img src="${IMG("fj")}" style="width:100%;height:100%;object-fit:contain"></div><div class="blessSay">塔里很危险，带上这个吧。</div>`);
  $$("#ov .evo").forEach(b=>b.onclick=async()=>{sfx("relic");closeOv();await opts[+b.dataset.i].f();saveRun();openMap();res()})})}
function resume(){setBg("swamp");if(S.cur){const c=S.cur;S.cur=null;enterNode(c.t,true,c)}else openMap()}

/* ===================== 地图 ===================== */
const ROWS=14,COLS=7;
function genMap(){const g=[...Array(ROWS)].map(()=>Array(COLS).fill(null));const edges=new Set();const starts=[];
 for(let i=0;i<6;i++){let c=ri(COLS);if(i<2)while(starts.includes(c))c=ri(COLS);starts.push(c)}
 for(const s of starts){let c=s;for(let r=0;r<ROWS;r++){g[r][c]=g[r][c]||{r,c,t:null,nx:[],jx:ri(16)-8,jy:ri(16)-8};if(r===ROWS-1)break;
  let o=[c-1,c,c+1].filter(x=>x>=0&&x<COLS&&!(x!==c&&edges.has(`${r},${x},${c}`)));const n=pick(o);if(!g[r][c].nx.includes(n))g[r][c].nx.push(n);edges.add(`${r},${c},${n}`);c=n}}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const n=g[r][c];if(!n)continue;
  const par=r?g[r-1].filter(p=>p&&p.nx.includes(c)):[];
  if(r===0)n.t="m";else if(r===6)n.t="t";else if(r===ROWS-1)n.t="r";else{
   for(let k=0;k<20;k++){const w=[["m",45],["q",22],["E",r>=4?12:0],["r",r>=5&&r<=11?12:0],["s",r>=2?9:0]];let tot=w.reduce((a,b)=>a+b[1],0),x=rnd()*tot,t="m";for(const[k2,v]of w){if((x-=v)<0){t=k2;break}}
    if(["E","r","s"].includes(t)&&par.some(p=>p.t===t))continue;if(r===ROWS-2&&t==="r")continue;n.t=t;break}
   if(!n.t)n.t="m"}}
 return g}
const NODE={m:{n:"小怪",ic:"ms"},E:{n:"精英",ic:"m4"},q:{n:"事件",e:"q"},r:{n:"休息",e:"fire"},s:{n:"商店",e:"bag"},t:{n:"宝箱",e:"chest"}};
const mx=r=>104+r*76,my=c=>176+c*72;
function availNodes(){if(S.atBoss)return[];if(S.row<0)return S.map[0].filter(Boolean);if(S.row===ROWS-1)return"boss";const n=S.map[S.row][S.col];return n.nx.map(c=>S.map[S.row+1][c])}
function openMap(){B=null;show("map");setBg("map");renderTop();playMusic("swing");S.cur=null;saveRun();
 const av=availNodes();const svg=$("#mapSvg");let p="";
 for(const row of S.map)for(const n of row){if(!n)continue;for(const c of n.nx){const m=S.map[n.r+1][c];const done=S.path.some((q,i)=>q[0]===n.r&&q[1]===n.c&&S.path[i+1]&&S.path[i+1][1]===c);const nxt=S.row===n.r&&S.col===n.c;
  p+=`<path class="${done?"done":nxt?"next":""}" d="M${mx(n.r)+n.jx} ${my(n.c)+n.jy} L${mx(m.r)+m.jx} ${my(m.c)+m.jy}"/>`}
  if(n.r===ROWS-1){const done=S.atBoss&&S.col===n.c;p+=`<path class="${S.row===n.r&&S.col===n.c?"next":""}" d="M${mx(n.r)+n.jx} ${my(n.c)+n.jy} L1180 400"/>`}}
 svg.innerHTML=p;let h="";
 for(const row of S.map)for(const n of row){if(!n)continue;const T=NODE[n.t];const isAv=Array.isArray(av)&&av.includes(n);const vis=S.path.some(q=>q[0]===n.r&&q[1]===n.c);const past=!isAv&&n.r<=S.row&&!vis;
  h+=`<div class="mn t-${n.t} ${isAv?"av":""} ${vis?"visited":""} ${past?"past":""} ${S.row===n.r&&S.col===n.c?"cur":""}" data-r="${n.r}" data-c="${n.c}" style="left:${mx(n.r)+n.jx}px;top:${my(n.c)+n.jy}px">${T.ic?`<img src="${IMG(T.ic)}">`:ICON[T.e]}</div>`}
 h+=`<div class="mn boss ${av==="boss"?"av":""}" id="bossNode" style="left:1180px;top:400px"><img src="${IMG("xsk")}"><b>沼泽之王</b></div>`;
 h+=`<div class="mapHead"><span class="ribbon">第一层 · 泥沼回廊</span><small>${av==="boss"?"首领就在前面……":"选择下一个房间"}</small></div><div class="legend">${Object.values(NODE).map(t=>`<span>${t.ic?`<img src="${IMG(t.ic)}">`:ICON[t.e]}${t.n}</span>`).join("")}</div>`;
 $("#mapNodes").innerHTML=h;$("#map").style.setProperty("--hero",`url(${IMG("n1")})`);
 $$(".mn.av").forEach(e=>e.onclick=()=>{sfx("click");if(e.id==="bossNode"){S.atBoss=true;enterNode("B")}else{const r=+e.dataset.r,c=+e.dataset.c;S.row=r;S.col=c;S.path.push([r,c]);enterNode(S.map[r][c].t)}});
 $("#mapTip").textContent=S.row<0?"从最左边开始，一路往右爬到首领。":""}

/* ===================== 进入房间 ===================== */
function enterNode(t,resumed,cur){S.cur=cur||{t,rs:S.rs};if(resumed&&cur){S.rs=cur.rs;if(cur.snap){S.hp=cur.snap.hp;S.gold=cur.snap.gold;S.pots=[...cur.snap.pots];S.uid=cur.snap.uid}}saveRun();
 if(t==="m")startCombat("m");else if(t==="E")startCombat("E");else if(t==="B")bossIntro();else if(t==="r")restSite();else if(t==="s")shopScreen();else if(t==="t")treasure();else if(t==="q"){if(rnd()<.12)startCombat("m");else eventScreen()}}
async function bossIntro(){setBg("boss");show("battle");$("#hand").innerHTML="";$("#enemies").innerHTML="";playMusic("boss");await talk(STORY.boss);startCombat("B")}

/* ===================== 战斗 ===================== */
function mkEnemy(id,i){const E=ENEMY[id];const hp=E.hp[0]+ri(E.hp[1]-E.hp[0]+1);return{id,n:E.n,hp,max:hp,block:0,str:0,vuln:0,weak:0,mud:0,turn:0,seed:i,k:"e"+(++S.uid),stolen:0}}
function startCombat(kind){if(S.cur){if(!S.cur.snap)S.cur.snap={hp:S.hp,gold:S.gold,pots:[...S.pots],uid:S.uid};saveRun()}let list;if(kind==="B")list=ENC.boss[0];else if(kind==="E")list=pick(ENC.elite);else list=S.combats<3?pick(ENC.easy):pick(ENC.normal);
 if(kind!=="B")S.combats++;
 B={kind,enemies:list.map(mkEnemy),p:{block:0,energy:0,str:has("star")?1:0,tstr:0,dex:0,vuln:0,weak:0,mud:0,nextAtk:0,borrow:0,retain:0,drawMinus:0,free:0,pw:{}},
  dp:shuffle(S.deck.map(c=>({...c}))),hand:[],disc:[],exh:[],turn:0,combo:0,played:0,fam:{},badge:0,mirror:has("mirror"),over:0,after:[],sel:null,myTurn:false,totalPlayed:0};
 Object.assign(B,API);
 setBg(kind==="B"?"boss":kind==="E"?"elite":["swamp","reed","ruin"][(S.row+3)%3]);show("battle");renderTop();if(kind!=="B")playMusic(kind==="E"?"boss":"tense");
 B.enemies.forEach(e=>e.intent=ENEMY[e.id].ai(e,0));
 renderBattle(true);
 if(has("feather"))B.block(8,1);
 setTimeout(()=>startTurn(),300)}
function relicPulse(id){const e=$(`#top .rl[data-rl="${id}"]`);if(e){e.classList.remove("pulse");void e.offsetWidth;e.classList.add("pulse")}}
async function startTurn(){if(B.over)return;B.turn++;B.combo=0;B.played=0;B.fam={};B.wayUsed=0;B.myTurn=true;const p=B.p;
 B.horseN=0;if(!p.retain&&!p.pw.iron)p.block=0;p.retain=0;
 banner("你的回合");sfx("turn");
 if(p.mud>0){dmgPlayer(p.mud,null,true);p.mud--;sfx("mud");if(S.hp<=0)return lose()}
 p.energy=3+(p.nextEnergy||0)+(p.pw.galaxy||0)+(B.turn===1&&has("lantern")?1:0)+(has("moon")&&B.turn%3===0?1:0);if(B.turn%3===0&&has("moon"))relicPulse("moon");
 let n=5-p.drawMinus+(p.nextDraw||0)+(p.pw.galaxy||0)+(B.turn===1&&has("sand")?2:0);p.drawMinus=0;p.nextEnergy=0;p.nextDraw=0;
 if(p.nextBlock){B.block(p.nextBlock,1);p.nextBlock=0}
 if(p.pw.nine&&S.hp<S.max)B.heal(p.pw.nine);
 if(p.pw.stampede){const v=p.pw.stampede;setTimeout(()=>{B.alive().forEach(e=>B.hit(e,v,1,1));afterAction()},500)}
 if(B.turn===1&&has("pup")){const t=pick(B.alive());if(t){relicPulse("pup");setTimeout(()=>{B.hit(t,6,1,1);afterAction()},600)}}
 await sleep(350);B.draw(n);busy=false;renderBattle();$("#endBtn").classList.remove("wait")}
function banner(t,en){const b=$("#turnBan");b.innerHTML=`<span>${t}</span>`;b.className="";void b.offsetWidth;b.className="on"+(en?" en":"")}
function hint(t){const h=$("#hint");if(t){h.textContent=t;h.classList.add("on")}else h.classList.remove("on")}

/* ---- 战斗渲染 ---- */
function intentHTML(e){const I=e.intent;if(!I||e.hp<=0)return"";const dmg=v=>{let d=v+e.str;if(e.weak>0)d*=.75;if(B.p.vuln>0)d*=1.5;return Math.max(0,Math.floor(d))};
 const ic=k=>ICON[k],x=I.x?`<small>×${I.x}</small>`:"";
 switch(I.k){case"atk":return`<div class="intent atk">${ic("sword")}${dmg(I.v)}${x}${I.s?ic("swirl"):""}</div>`;
 case"def":return`<div class="intent">${ic("shield")}${I.v}${I.s2?ic("up"):""}</div>`;
 case"buff":return`<div class="intent">${ic("up")}<small>蓄力</small></div>`;
 case"debuff":return`<div class="intent">${ic("swirl")}<small>${STAT[I.s].n}</small></div>`;
 case"add":return`<div class="intent">${ic("mud")}<small>扔泥巴</small></div>`;
 case"atkdef":return`<div class="intent atk">${ic("sword")}${dmg(I.v)}${ic("shield")}</div>`;
 case"steal":return`<div class="intent atk">${ic("grab")}${dmg(I.v)}<small>偷钱</small></div>`;
 case"flee":return`<div class="intent">${ic("wind")}<small>想跑</small></div>`;
 case"atkcnt":return`<div class="intent atk">${ic("sword")}${dmg(I.v)}${ic("bomb")}${I.c}</div>`;
 case"boom":return`<div class="intent boom">${ic("boom")}${dmg(I.v)}<small>自爆</small></div>`}return""}
function intentTip(e){const I=e.intent||{};const m={atk:"准备攻击",def:"准备防御",buff:"准备变强",debuff:"准备给你上负面状态",add:"准备往你的弃牌堆扔泥巴块",atkdef:"攻击并防御",steal:"攻击并偷走金币",flee:"准备带着金币逃跑",atkcnt:"攻击，倒计时结束会自爆",boom:"要自爆了！"};return m[I.k]||""}
function stsHTML(o){const a=[];if(o.str)a.push(["str",o.str]);if(o.tstr)a.push(["str",o.tstr,"本回合"]);if(o.dex)a.push(["dex",o.dex]);["vuln","weak","mud","thorn"].forEach(k=>o[k]&&a.push([k,o[k]]));
 return a.map(([k,v,x])=>`<span class="st" style="--sc:${STAT[k].c}">${STAT[k].n}${v}</span>`).join("")+(o.pw?Object.keys(o.pw).map(k=>`<span class="st" style="--sc:#c8901e">${{calm:"定心",way:"修行之道",zone:"心流",noself:"无我",rhythm:"节奏感",stampede:"万马奔腾",iron:"铁公鸡",nine:"九命",galaxy:"银河猫"}[k]}</span>`).join(""):"")}
function hpHTML(hp,max,blk){return`<div class="blkB ${blk?"on":""}">${ICON.shield}<b>${blk||""}</b></div><div class="hpbar ${blk?"blk":""}"><u style="width:${hp/max*100}%"></u><i style="width:${hp/max*100}%"></i><span>${hp}/${max}</span></div>`}
function renderBattle(first){if(!B)return;const p=B.p;
 const pl=$("#player");if(first||!pl.firstChild)pl.innerHTML=`<div class="body"><i class="plat"></i><img src="${IMG("n1")}"></div><div class="hpw"></div><div class="sts"></div>`;
 pl.className="fighter";pl.querySelector(".hpw").innerHTML=hpHTML(S.hp,S.max,p.block);pl.querySelector(".sts").innerHTML=stsHTML(p);
 const en=$("#enemies");if(first)en.innerHTML="";
 B.enemies.forEach(e=>{let el=en.querySelector(`[data-k="${e.k}"]`);const E=ENEMY[e.id];
  if(!el){el=document.createElement("div");el.className="en fighter";el.dataset.k=e.k;el.style.position="relative";el.innerHTML=`<div class="itw"></div><div class="body"><i class="plat ${E.boss||E.elite?"stone":""}"></i><img src="${IMG(E.img)}" style="width:${E.h}px;height:${E.h}px"></div><div class="hpw"></div><div class="ename">${e.n}</div><div class="sts"></div>`;{const idx=B.enemies.indexOf(e);en.insertBefore(el,en.children[idx]||null)}
   el.onclick=()=>clickEnemy(e)}
  if(e.hp<=0&&!el.classList.contains("dead"))el.classList.add(e.fled?"fled":"dead");
  el.querySelector(".itw").innerHTML=intentHTML(e);el.querySelector(".hpw").innerHTML=hpHTML(e.hp,e.max,e.block);el.querySelector(".sts").innerHTML=stsHTML(e);
  el.classList.toggle("tg",!!B.sel&&e.hp>0&&(B.sel.pot!=null||CARDS[(B.hand.find(c=>c.k===B.sel.k)||{id:"strike"}).id].tgt))});
 const eb=$("#energy");eb.innerHTML=`<i class="liq" style="height:${Math.min(1,p.energy/3)*100}%"></i><b>${p.energy}<small>/3</small></b>`;
 $("#drawPile b").textContent=B.dp.length;$("#discPile b").textContent=B.disc.length;$("#exhPile b").textContent=B.exh.length;$("#exhPile").style.display=B.exh.length?"":"none";
 renderFam();renderHand();
 const playable=B.hand.some(c=>{const v=curCost(c);return v>=0&&v<=p.energy&&CARDS[c.id].cost!==-2});$("#endBtn").classList.toggle("nudge",B.myTurn&&!playable)}
function renderFam(){const need=B.p.pw.noself?2:3;const h=["frog","horse","chick","cat"].filter(f=>B.fam[f]||B.hand.some(c=>CARDS[c.id].fam===f)).map(f=>{const n=B.fam[f]||0;return`<span style="--fc:${FAM[f].c}" class="${n===need-1?"hot":""}">${FAM[f].n}<i>${[...Array(need)].map((_,i)=>`<u class="${i<n?"on":""}"></u>`).join("")}</i></span>`}).join("");$("#famBar").innerHTML=h}
function willTri(c){const D=CARDS[c.id];if(D.fam==="none"||D.cost===-2)return false;return(B.fam[D.fam]||0)+1>=(B.p.pw.noself?2:3)}
function layoutHand(){const cards=$$("#hand .card");const n=cards.length;if(!n)return;const W=150,span=Math.min(760,n*124),step=n>1?Math.min(124,(span-W)/(n-1)+0):0,x0=640-((n-1)*step)/2-W/2;
 cards.forEach((el,i)=>{const mid=(n-1)/2,off=i-mid;const sel=B.sel&&el.dataset.k==B.sel.k;const rot=sel?0:off*3.2,y=sel?-150:Math.abs(off)*off*0+Math.pow(Math.abs(off),1.6)*5-6,sc=sel?1.5:1;
  el.style.zIndex=sel?40:10+i;el.style.transform=`translate(${x0+i*step}px,${y-14}px) rotate(${rot}deg) scale(${sc})`})}
function renderHand(){const h=$("#hand");const keys=B.hand.map(c=>String(c.k));
 [...h.children].forEach(el=>{if(!keys.includes(el.dataset.k)&&!el.classList.contains("fly"))el.remove()});
 B.hand.forEach((c,i)=>{let el=h.querySelector(`.card[data-k="${c.k}"]`);const html=cardHTML(c,"inhand");
  if(!el){const t=document.createElement("div");t.innerHTML=html;el=t.firstChild;el.style.transform="translate(40px,80px) scale(.4) rotate(-20deg)";el.style.opacity="0";h.appendChild(el);void el.offsetWidth;el.style.opacity="";
   el.onclick=ev=>{ev.stopPropagation();clickCard(c.k)};el.oncontextmenu=e=>e.preventDefault()}
  else{const t=document.createElement("div");t.innerHTML=html;el.querySelector(".cost").outerHTML=t.firstChild.querySelector(".cost").outerHTML;el.querySelector(".ds").innerHTML=t.firstChild.querySelector(".ds").innerHTML}
  const v=curCost(c),D=CARDS[c.id];el.classList.toggle("na",!B.myTurn||D.cost===-2||(D.cost>=0&&v>B.p.energy));el.classList.toggle("willtri",B.myTurn&&willTri(c)&&!(D.cost>=0&&v>B.p.energy));el.classList.toggle("sel",!!B.sel&&B.sel.k===c.k);h.appendChild(el)});
 layoutHand()}
function clickCard(k){if(busy||!B.myTurn||B.over)return;const c=B.hand.find(x=>x.k===k);if(!c)return;const D=CARDS[c.id];
 if(D.cost===-2){toast(D.type==="cur"?"诅咒牌不能打出":"这张牌不能打出");return}
 const v=curCost(c);if(D.cost>=0&&v>B.p.energy){toast("奶力不够");shakeEl($("#energy"));return}
 if(B.sel&&B.sel.k===k){ // 再点一次
  if(!D.tgt){playCard(c)}else{const al=B.alive();if(al.length===1)playCard(c,al[0]);else hint("点一个敌人")}return}
 B.sel={k};sfx("click");const kw=kwText(c);hint((D.tgt?(B.alive().length===1?"再点一次这张牌，或点敌人":"点一个敌人"):"再点一次打出")+(kw?"　｜　"+kw:""));renderBattle()}
const KW={"保留":"回合结束时不会被弃掉","消耗":"打出后本场战斗移除","连击":"本回合打出的攻击牌数","易伤":"受到的伤害 +50%","虚弱":"造成的伤害 -25%","荆棘":"被攻击时反弹伤害","敏捷":"每层让护盾 +1","三连":"同家族连出 3 张，效果翻倍"};
function kwText(c){const t=CARDS[c.id].d(!!c.u);return Object.keys(KW).filter(k=>t.includes(k)).slice(0,2).map(k=>k+"："+KW[k]).join("　")}
function clickEnemy(e){if(e.hp<=0)return;if(B.sel&&!busy){if(B.sel.pot!=null){const i=B.sel.pot;const id=S.pots[i];B.sel=null;hint();S.pots.splice(i,1);POTIONS[id].fx(B,e);afterAction();return}
  const c=B.hand.find(x=>x.k===B.sel.k);if(c){if(CARDS[c.id].tgt)playCard(c,e);else playCard(c);return}}
 const el=$(`.en[data-k="${e.k}"]`);tipAt(el.querySelector(".body"),`<b>${e.n}</b><p>${intentTip(e)}</p>${["str","vuln","weak","mud"].filter(k=>e[k]).map(k=>`<p>${STAT[k].n} ${e[k]}：${STAT[k].d}</p>`).join("")}`)}
function shakeEl(el){el.animate([{transform:"translateX(0)"},{transform:"translateX(-8px)"},{transform:"translateX(8px)"},{transform:"translateX(0)"}],{duration:260})}
function stageShake(){const s=$("#stage");s.classList.remove("shake");void s.offsetWidth;s.classList.add("shake")}

/* ---- 特效 ---- */
function fnum(x,y,t,cls="",delay=0){setTimeout(()=>{const d=document.createElement("div");d.className="fnum "+cls;d.textContent=t;d.style.left=x+"px";d.style.top=y+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),950)},delay)}
function fxAt(el,cls,delay=0,html=""){if(!el)return;setTimeout(()=>{const c=center(el);const d=document.createElement("div");d.className=cls;d.innerHTML=html;d.style.left=c.x+"px";d.style.top=c.y+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),900)},delay)}
function sparks(x,y,col,n=14){for(let i=0;i<n;i++){const d=document.createElement("i");d.className="spark";const a=Math.random()*Math.PI*2,r=60+Math.random()*90;d.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r}px;--c:${col}`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),850)}}
function anim(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),500)}
const enEl=e=>$(`.en[data-k="${e.k}"]`);
function bubble(el,t){const c=center(el);const d=document.createElement("div");d.className="bubble";d.textContent=t;d.style.left=(c.x-40)+"px";d.style.top=Math.max(70,c.top-50)+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),2500)}

/* ---- 战斗 API（卡牌效果调用） ---- */
const API={
 alive(){return this.enemies.filter(e=>e.hp>0&&!e.fled)},
 hit(t,base,times=1,raw){if(!t||t.hp<=0)t=this.alive()[0];if(!t)return;for(let i=0;i<times;i++){if(t.hp<=0)break;
  let d=base+(raw?0:this.p.str+this.p.tstr+(this.bonus||0));if(!raw&&this.p.weak>0)d*=.75;if(t.vuln>0)d*=1.5;d=Math.max(0,Math.floor(d));dealEnemy(t,d,i)}},
 hitAll(v){this.alive().forEach(e=>this.hit(e,v))},
 block(v,raw){const b=Math.max(0,v+(raw?0:this.p.dex));this.p.block+=b;sfx("block");const el=$("#player .body");fxAt(el,"shieldFx",0,ICON.shield);const c=center(el);fnum(c.x,c.top+40,"+"+b,"blk")},
 draw(n){let last=null;for(let i=0;i<n;i++){if(!this.dp.length){if(!this.disc.length)break;this.dp=shuffle(this.disc);this.disc=[];toast("弃牌堆洗回了抽牌堆")}
  const c=this.dp.pop();if(this.hand.length>=10){this.disc.push(c);toast("手牌满了");continue}last=c;this.hand.push(c);seeCard(c.id);if(c.id==="fret"){this.p.energy=Math.max(0,this.p.energy-1);toast("烦躁……失去 1 点奶力")}}sfx("draw");renderBattle();return last},
 fetchAtk(){const l=this.disc.filter(c=>CARDS[c.id].type==="atk");if(l.length&&this.hand.length<10){const c=pick(l);this.disc.splice(this.disc.indexOf(c),1);this.hand.push(c);toast(`拿回了 <b>${cname(c)}</b>`)}},
 chooseFromDraw(){this.after.push(async()=>{if(!this.dp.length)return;const r=await pickCards([...this.dp],{title:"观星",sub:"选一张放进手里",cancel:false});const c=r[0];if(c&&this.hand.length<10){this.dp.splice(this.dp.indexOf(c),1);this.hand.push(c)}})},
 gainEnergy(n){this.p.energy+=n;anim($("#energy"),"pop");sfx("buff")},
 apply(t,s,v){t[s]=(t[s]||0)+v;const el=t===this.p?$("#player"):enEl(t);if(el){const c=center(el.querySelector(".body"));fnum(c.x,c.top+30,STAT[s].n+"+"+v,"txt")}sfx(s==="str"?"buff":"debuff")},
 heal(v){const h=Math.min(v,S.max-S.hp);S.hp+=h;sfx("heal");const c=center($("#player .body"));fnum(c.x,c.top+20,"+"+h,"heal");renderTop()},
 selfDamage(v){dmgPlayer(v,null,true)},
 gainGold(v){S.gold+=v;S.stats.gold+=v;sfx("coin");const c=center($("#player .body"));fnum(c.x,c.top,"+"+v+" 金币","gold");renderTop()},
 shake(){stageShake()},
 fxBuff(o){anim($("#player"),"buffA");sfx("buff")},
 renderHand(){renderHand()},
 discardHand(){this.disc.push(...this.hand);this.hand=[];renderBattle()},
 chooseDiscard(n){this.after.push(async()=>{if(!this.hand.length)return;const r=await pickCards([...this.hand],{title:"选 1 张弃掉",sub:"",cancel:false});const c=r[0];if(c){this.hand.splice(this.hand.indexOf(c),1);this.disc.push(c)}})},
 chooseFamily(src){this.after.push(async()=>{const fams=new Set(this.hand.map(c=>CARDS[c.id].fam).filter(f=>f!=="none"));const list=this.dp.filter(c=>fams.has(CARDS[c.id].fam));
  if(!list.length){toast("抽牌堆里没有同家族的牌");return}const r=await pickCards(list,{title:"凑齐",sub:"从抽牌堆选一张，放进手里",cancel:false});const c=r[0];if(c&&this.hand.length<10){this.dp.splice(this.dp.indexOf(c),1);this.hand.push(c)}})},
 addRandomRare(){const pool=POOL_HERO.filter(id=>"REL".includes(CARDS[id].r));const c=mk(pick(pool));c.tmp=0;if(this.hand.length<10){this.hand.push(c);seeCard(c.id);toast(`扭出了 <b>${cname(c)}</b>！`)}}};

function dealEnemy(t,d,i=0){const blk=Math.min(t.block,d);t.block-=blk;const loss=d-blk;t.hp=Math.max(0,t.hp-loss);S.stats.dmg+=loss;
 const el=enEl(t);if(el){const c=center(el.querySelector(".body"));setTimeout(()=>{anim(el,"hit");sfx(d>=18?"bighit":"hit");const s=document.createElement("div");s.className="slash";s.style.left=c.x+"px";s.style.top=c.y+"px";$("#fx").appendChild(s);setTimeout(()=>s.remove(),300)},i*120);fnum(c.x+(i%2?18:-18),c.top+30,loss?loss:"格挡",loss?"":"blk",i*120);if(d>=18)setTimeout(stageShake,i*120)}
 if(t.id==="giant"&&!t.enraged&&t.hp>0&&t.hp<=t.max/2){t.enraged=1;t.turn=0;t.intent=ENEMY.giant.ai(t,0);setTimeout(()=>el&&bubble(el,"你惹我生气了！"),300)}
 if(t.id==="king"&&!t.phase2&&t.hp>0&&t.hp<=t.max/2){t.phase2=1;t.turn=0;t.intent=ENEMY.king.ai(t,0);t.block+=10;
  setTimeout(()=>{if(el)bubble(el,"泥巴们……起来！");for(let j=0;j<2;j++){if(B.alive().length>=4)break;const m=mkEnemy("mudling",j);m.intent=ENEMY.mudling.ai(m,0);B.enemies.unshift(m)}renderBattle()},400)}
 if(t.hp<=0)killEnemy(t)}
function killEnemy(t){S.stats.kills++;if(t.stolen){S.gold+=t.stolen;toast(`抢回了 <b>${t.stolen}</b> 金币`);t.stolen=0}
 if(has("cape")){relicPulse("cape");setTimeout(()=>B&&B.heal(3),300)}
 if(t.id==="king")B.enemies.forEach(e=>{if(e.hp>0){e.hp=0}})}
function dmgPlayer(v,src,raw){const p=B.p;let d=v;if(!raw){if(src){d+=src.str;if(src.weak>0)d*=.75}if(p.vuln>0)d*=1.5}d=Math.max(0,Math.floor(d));
 const blk=raw?0:Math.min(p.block,d);p.block-=blk;const loss=d-blk;S.hp=Math.max(0,S.hp-loss);
 const el=$("#player");const c=center(el.querySelector(".body"));anim(el,"hit");sfx(loss?"hurt":"block");fnum(c.x,c.top+30,loss||"格挡",loss?"":"blk");if(loss>=12)stageShake();
 if(S.hp<=0&&has("phoenix")&&!S.flags.phoenix){S.flags.phoenix=1;S.hp=Math.ceil(S.max*.3);relicPulse("phoenix");toast("<b>不死羽</b>燃烧了！你又站了起来");sfx("relic")}
 if(src&&!raw&&p.thorn&&src.hp>0){const t=src;setTimeout(()=>{if(t.hp>0){dealEnemy(t,p.thorn);renderBattle()}},150)}
 renderTop();return loss}

/* ---- 出牌 ---- */
async function playCard(c,target){if(busy)return;const D=CARDS[c.id];let cost=curCost(c),x=0;
 if(D.cost===-1){x=B.p.energy;cost=x}if(cost>B.p.energy)return;
 if(D.tgt&&(!target||target.hp<=0)){const al=B.alive();if(al.length===1)target=al[0];else return}
 busy=true;B.sel=null;hint();B.p.energy-=cost;B.hand.splice(B.hand.indexOf(c),1);
 // 飞出动画
 const el=$(`#hand .card[data-k="${c.k}"]`);if(el){el.classList.add("fly");const tx=target?center(enEl(target)).x-75:560;el.style.transform=`translate(${tx}px,-300px) scale(.6) rotate(0deg)`;el.style.opacity="0";setTimeout(()=>el.remove(),340)}
 sfx("card");S.stats.played++;seeCard(c.id);
 B.bonus=0;if(D.type==="atk"){B.bonus=B.p.nextAtk;B.p.nextAtk=0}
 let tri=false;if(D.fam!=="none"&&D.type!=="cur"&&D.type!=="sts"){B.fam[D.fam]=(B.fam[D.fam]||0)+1;if(B.fam[D.fam]>=(B.p.pw.noself?2:3)){tri=true;B.fam[D.fam]=0}}
 let reps=tri?2:1;if(B.mirror){reps++;B.mirror=false;relicPulse("mirror")}
 if(D.fam==="horse")B.horseN=(B.horseN||0)+1;
 if(D.type==="atk"){B.combo++;if(B.p.borrow)B.block(B.p.borrow,1);if(B.p.echo>0){B.p.echo--;reps++}if(B.combo===3&&B.p.pw.rhythm){B.after.push(async()=>{B.gainEnergy(1);B.draw(B.p.pw.rhythm)})}}
 B.played++;
 if(tri){S.stats.tri++;triBanner(D.fam)}
 await sleep(tri?380:160);
 if(D.type==="atk"){anim($("#player"),"lungeR")}
 for(let r=0;r<reps;r++){if(D.tgt&&(!target||target.hp<=0))target=B.alive()[0];if(D.tgt&&!target)break;D.fx(B,!!c.u,target,c,x);if(r<reps-1)await sleep(260)}
 B.bonus=0;
 if(tri){B.gainEnergy(1);if(B.p.pw.calm)B.block(B.p.pw.calm,1);if(B.p.pw.way&&!B.wayUsed){B.wayUsed=1;B.gainEnergy(1)}if(has("badge")&&!B.badge){B.badge=1;relicPulse("badge");B.draw(2)}}
 if(B.p.pw.zone&&B.played%5===0)B.draw(2*B.p.pw.zone);
 delete c.tmp;
 if(D.type!=="pow"){if(D.exh||(D.exhU&&!c.u)||D.type==="sts")B.exh.push(c);else B.disc.push(c)}
 while(B.after.length){const f=B.after.shift();await f()}
 busy=false;afterAction()}
function triBanner(fam){sfx("tri");const d=document.createElement("div");d.className="triBan";d.innerHTML=`<b>三连！</b><small>${FAM[fam].n}之力：效果翻倍，奶力 +1</small>`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),1000);sparks(640,300,FAM[fam].c,22)}
function afterAction(){renderTop();renderBattle();if(S.hp<=0)return lose();if(!B.alive().length&&!B.over)win()}

/* ---- 回合结束 / 敌人行动 ---- */
$("#endBtn").onclick=()=>endTurn();
$("#drawPile").onclick=()=>B&&viewCards(B.dp,"抽牌堆",`${B.dp.length} 张（顺序是打乱的）`);
$("#discPile").onclick=()=>B&&viewCards(B.disc,"弃牌堆",`${B.disc.length} 张`,false);
$("#exhPile").onclick=()=>B&&viewCards(B.exh,"消耗的牌",`本场战斗不会再回来`,false);
$("#battle").addEventListener("click",e=>{if(B&&B.sel&&!e.target.closest(".card")&&!e.target.closest(".en")){const c=B.hand.find(x=>x.k===B.sel.k);if(c&&!CARDS[c.id].tgt&&e.target.closest("#arena")){playCard(c);return}B.sel=null;hint();renderBattle()}});
async function endTurn(){if(busy||!B||!B.myTurn||B.over)return;busy=true;B.myTurn=false;B.sel=null;hint();$("#endBtn").classList.add("wait");
 const p=B.p;let mud=B.hand.filter(c=>c.id==="mud").length;if(mud){dmgPlayer(mud*2,null,true);toast(`手里的泥巴块弄脏了你，受到 <b>${mud*2}</b> 伤害`);if(S.hp<=0)return lose()}
 const keep=[];for(const c of B.hand){delete c.tmp;if(CARDS[c.id].ret)keep.push(c);else if(CARDS[c.id].eth)B.exh.push(c);else B.disc.push(c)}B.hand=keep;
 p.tstr=0;p.free=0;p.borrow=0;if(p.vuln)p.vuln--;if(p.weak)p.weak--;
 renderBattle();await sleep(300);banner("敌人回合",1);sfx("enemy");await sleep(700);
 for(const e of B.enemies){if(e.hp<=0||e.fled)continue;e.block=0;
  if(e.mud>0){const d=e.mud;e.mud--;dealEnemy(e,d);sfx("mud");renderBattle();await sleep(300);if(e.hp<=0)continue}
  await enemyAct(e);renderBattle();await sleep(420);
  if(e.vuln)e.vuln--;if(e.weak)e.weak--;e.turn++;
  if(S.hp<=0)return lose()}
 if(!B.alive().length)return win();
 B.enemies.forEach(e=>{if(e.hp>0&&!e.fled)e.intent=ENEMY[e.id].ai(e,e.turn)});
 startTurn()}
async function enemyAct(e){const I=e.intent,el=enEl(e);if(!I)return;const atk=async(v,n=1)=>{anim(el,"lungeL");for(let i=0;i<n;i++){dmgPlayer(v,e);renderBattle();await sleep(n>1?200:120);if(S.hp<=0)return}};
 switch(I.k){
 case"atk":await atk(I.v,I.x||1);if(I.s)B.apply(B.p,I.s,I.d||1);break;
 case"def":e.block+=I.v;sfx("block");fxAt(el.querySelector(".body"),"shieldFx",0,ICON.shield);if(I.s2){e[I.s2]+=I.v2}break;
 case"buff":e[I.s]+=I.v;anim(el,"buffA");sfx("buff");bubble(el,pick(["呱！力气来了！","嘿——哈！","我要认真了"]));break;
 case"debuff":B.apply(B.p,I.s,I.v);anim(el,"buffA");break;
 case"add":anim(el,"lungeL");for(let i=0;i<I.n;i++)B.disc.push(mk(I.card));sfx("mud");toast(`${e.n}往你的弃牌堆扔了 <b>${I.n} 张${CARDS[I.card].n}</b>`);break;
 case"atkdef":await atk(I.v);e.block+=I.b;break;
 case"steal":{await atk(I.v);const g=Math.min(S.gold,I.g);S.gold-=g;e.stolen+=g;if(g){const c=center($("#player .body"));fnum(c.x,c.top,"-"+g+" 金币","gold");toast(`${e.n}偷走了 <b>${g}</b> 金币！打败它才能抢回来`)}renderTop();break}
 case"flee":e.fled=1;e.hp=0;bubble(el,"咯咯哒～拜拜！");toast(`${e.n}带着金币跑掉了……`);break;
 case"atkcnt":await atk(I.v);break;
 case"boom":sfx("boom");stageShake();dmgPlayer(I.v,e);e.hp=0;sparks(center(el).x,center(el).y,"#ff9a1f",26);break}}

/* ---- 胜负 ---- */
async function win(){if(B.over)return;B.over=1;busy=true;B.myTurn=false;$("#endBtn").classList.add("wait");sfx("win");
 await sleep(700);
 if(has("cup")){relicPulse("cup");const h=Math.min(6,S.max-S.hp);S.hp+=h}
 let gold=0;if(has("ring"))gold+=8;
 renderTop();
 if(B.kind==="B"){await sleep(400);await talk(STORY.win);return actClear()}
 if(B.kind==="E")S.elites++;
 rewardScreen(B.kind,gold)}
async function lose(){if(B&&B.over===2)return;if(B)B.over=2;busy=true;sfx("lose");await sleep(900);gameOver(false)}
function gameOver(quit){const fl=S.row+1;M.best=Math.max(M.best,fl);saveMeta();const st=S.stats;S=null;saveRun();B=null;show("ending");setBg("title");playMusic("space");
 $("#ending").innerHTML=`<div class="endBox lose"><div class="endImg"><img src="${IMG("hs")}"></div><h1>${quit?"下次再来":"倒下了……"}</h1><p>${quit?"塔还在那里，随时可以再爬。":"功夫奶蛙被抬回了奶茶泉边。<br>长老说：「没关系，塔每次都不一样。」"}</p><div class="endStats"><div><b>${fl}</b><small>到达层数</small></div><div><b>${st.kills}</b><small>击败敌人</small></div><div><b>${st.tri}</b><small>三连次数</small></div><div><b>${st.dmg}</b><small>总伤害</small></div></div><button class="btn" id="eAgain">再爬一次</button> <button class="btn ghost" id="eHome">回到标题</button></div>`;
 $("#eAgain").onclick=heroSelect;$("#eHome").onclick=titleScreen}
async function actClear(){const st=S.stats;M.wins++;M.shards+=1;const tale=ELDER_TALES[Math.min(M.tale,ELDER_TALES.length-1)];M.tale++;saveMeta();const deckN=S.deck.length;S=null;saveRun();B=null;
 show("ending");setBg("title");playMusic("swing");
 $("#ending").innerHTML=`<div class="endBox"><div class="endImg"><img src="${IMG("n1")}"></div><h1>第一层 · 通关</h1><p>沼泽之王醒了过来。泉水，好像涨回了一点点。</p><div class="endStats"><div><b>${st.kills}</b><small>击败敌人</small></div><div><b>${st.tri}</b><small>三连次数</small></div><div><b>${st.dmg}</b><small>总伤害</small></div><div><b>${deckN}</b><small>最终牌组</small></div></div><p style="font-size:20px;color:#ffe7a0">获得记忆碎片 ×1　「${tale}」</p><div class="tbc"><span class="ribbon b">第二层「月夜古堡」未完待续</span></div><div style="margin-top:22px"><button class="btn" id="eAgain">再爬一次</button> <button class="btn ghost" id="eHome">回到标题</button></div></div>`;
 sparks(640,200,"#ffd23f",40);$("#eAgain").onclick=heroSelect;$("#eHome").onclick=titleScreen}

/* ===================== 奖励 ===================== */
function rollRar(kind){const r=rnd();if(kind==="E")return r<.03?"L":r<.15?"E":r<.55?"R":"C";if(kind==="R")return r<.04?"L":r<.2?"E":"R";return r<.01?"L":r<.05?"E":r<.3?"R":"C"}
function offerCards(n,kind,force){const out=[];let guard=0;while(out.length<n&&guard++<200){let id;if(!force&&rnd()<.08)id=pick(POOL_X);else{const rr=rollRar(kind);const pool=POOL_HERO.filter(x=>CARDS[x].r===rr);id=pick(pool)}if(out.some(c=>c.id===id))continue;out.push(mk(id,0))}
 return out}
function chooseReward(cards,title,canSkip=true){return new Promise(res=>{const o=$("#ov");cards.forEach(c=>seeCard(c.id));
 ov(`<div class="pickHead"><span class="ribbon b">${title}</span><small>选一张加入牌组</small></div><div class="pickRow">${cards.map(c=>cardHTML(c,"big")).join("")}</div><div class="pickFoot">${canSkip?`<button class="btn ghost" id="rkSkip">跳过</button>`:""}</div>`);
 $$("#ov .pickRow .card").forEach((e,i)=>e.onclick=()=>{sfx("card");S.deck.push(cards[i]);closeOv();toast(`<b>${cname(cards[i])}</b> 加入了牌组`);renderTop();saveRun();res(cards[i])});
 const sk=$("#rkSkip");if(sk)sk.onclick=()=>{closeOv();res(null)}})}
function randRelic(rar){let pool=RELIC_POOL.filter(r=>!S.relics.includes(r));if(rar){const p2=pool.filter(r=>RELICS[r].r===rar);if(p2.length)pool=p2}return pool.length?pick(pool):null}
function gainRelic(id){if(!id){S.gold+=50;toast("遗物都拿光了，换成 <b>50</b> 金币");return}S.relics.push(id);if(id==="belt")S.potSlots++;sfx("relic");toast(`获得遗物 <b>${RELICS[id].n}</b>：${RELICS[id].d}`);renderTop()}
const randPot=()=>pick(Object.keys(POTIONS));
function givePot(id){if(S.pots.length>=S.potSlots){toast("药水栏满了");return false}S.pots.push(id);renderTop();return true}
function rewardScreen(kind,extraGold){show("reward");setBg("swamp");playMusic("swing");
 const items=[];const gold=(kind==="E"?25+ri(11):10+ri(11))+extraGold;items.push({t:"gold",v:gold});
 if(rnd()<(kind==="E"?.6:.4))items.push({t:"pot",v:randPot()});
 items.push({t:"card",v:offerCards(has("clover")?4:3,kind==="E"?"E":"C")});
 if(kind==="E")items.push({t:"relic",v:randRelic()});
 S.cur=null;saveRun();
 const draw=()=>{$("#reward").innerHTML=`<div class="panel"><div class="phead"><span class="ribbon">胜利！</span></div><div class="psub">${kind==="E"?"精英被打倒了，掉了好东西":"拿上战利品继续前进"}</div><div class="rwList">${items.map((it,i)=>{let ic="",tx="",sm="";
   if(it.t==="gold"){ic=ICON.coin;tx=`${it.v} 金币`}
   if(it.t==="pot"){ic=potHTML(it.v);tx=POTIONS[it.v].n;sm=POTIONS[it.v].d}
   if(it.t==="card"){ic=ICON.deck;tx="选一张卡牌";sm="三选一，也可以跳过"}
   if(it.t==="relic"){ic=relicHTML(it.v);tx=it.v?RELICS[it.v].n:"50 金币";sm=it.v?RELICS[it.v].d:""}
   return`<button class="rwItem ${it.done?"done":""}" data-i="${i}"><span class="ic">${ic}</span>${tx}<small>${sm}</small></button>`}).join("")}</div><div class="foot"><button class="btn" id="rwGo">继续前进 ▶</button></div></div>`;
  $$("#reward .rwItem").forEach(b=>b.onclick=async()=>{const it=items[+b.dataset.i];if(it.done)return;
   if(it.t==="gold"){S.gold+=it.v;S.stats.gold+=it.v;sfx("coin");it.done=1}
   else if(it.t==="pot"){if(givePot(it.v)){sfx("relic");it.done=1}}
   else if(it.t==="relic"){gainRelic(it.v);it.done=1}
   else if(it.t==="card"){const r=await chooseReward(it.v,"选一张卡牌");if(r)it.done=1}
   renderTop();saveRun();draw()});
  $("#rwGo").onclick=()=>{const left=items.filter(i=>!i.done&&i.t!=="card");left.forEach(it=>{if(it.t==="gold"){S.gold+=it.v}if(it.t==="relic")gainRelic(it.v)});openMap()}};
 draw();renderTop()}

/* ===================== 休息 ===================== */
function restSite(){show("rest");setBg("rest");playMusic("home");const heal=Math.floor(S.max*.3)+(has("pot")?10:0);
 const canUp=S.deck.some(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type));
 $("#rest").innerHTML=`<div class="pickHead"><span class="ribbon b">休息点</span><small>篝火噼啪作响，难得能歇一会儿</small></div><div class="restScene"><img src="${IMG("n1")}" style="transform:scaleX(-1)"><div class="camp"><i class="fl"></i><i class="fl b"></i><i class="logs"></i></div><img src="${IMG("fj")}" style="width:180px;height:200px"></div>
 <div class="restOpts"><button class="ropt" id="rHeal"><span class="ic">${ICON.star}</span><b>休息</b><small>回复 ${heal} 生命</small></button><button class="ropt" id="rUp" ${canUp?"":"disabled"}><span class="ic">${ICON.up}</span><b>修炼</b><small>升级一张牌</small></button><button class="ropt" id="rTalk"><span class="ic">${ICON.heart}</span><b>和长老聊天</b><small>听一段往事，回复 ${Math.floor(heal/2)} 生命</small></button></div>`;
 const done=()=>{saveRun();setTimeout(openMap,600)};
 $("#rHeal").onclick=()=>{S.hp=Math.min(S.max,S.hp+heal);sfx("heal");toast(`回复了 <b>${heal}</b> 生命`);renderTop();done()};
 $("#rUp").onclick=async()=>{const r=await upgradePick();if(r)done()};
 $("#rTalk").onclick=async()=>{const t=["长老说，他年轻的时候也爬过这座塔。","「那时候我只想着往上爬，一次都没回头看。」","「后来才知道，最重要的东西……一直在塔底。」","长老抿了一口奶茶，没有再说下去。"];
  await talk([["fj","奶蛙长老",pick(t)],["n1","功夫奶蛙","……长老？"],["fj","奶蛙长老","哈哈，人老了话就多。快睡吧。"]]);S.hp=Math.min(S.max,S.hp+Math.floor(heal/2));sfx("heal");renderTop();done()}}
async function upgradePick(){const list=S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type));
 const r=await pickCards(list,{title:"升级一张牌",sub:"升级后数值更强，有的还会变便宜",confirm:c=>`${cardHTML(c,"big")}<span class="arr">➜</span>${cardHTML({...c,u:1},"big")}`});
 if(r[0]){r[0].u=1;sfx("relic");toast(`<b>${cname(r[0])}</b> 升级了！`);renderTop();return true}return false}

/* ===================== 宝箱 ===================== */
function treasure(){show("reward");setBg("swamp");const id=randRelic(rnd()<.6?"C":"R");const g=20+ri(20);
 $("#reward").innerHTML=`<div class="panel"><div class="phead"><span class="ribbon">宝箱</span></div><div class="psub">藏在泥里的箱子，咔哒一声开了</div><div style="width:110px;height:110px;margin:6px auto 0">${ICON.chest}</div><div class="rwList"><button class="rwItem" id="tkR"><span class="ic">${id?relicHTML(id):""}</span>${id?RELICS[id].n:"空空的"}<small>${id?RELICS[id].d:""}</small></button><button class="rwItem" id="tkG"><span class="ic">${ICON.coin}</span>${g} 金币</button></div><div class="foot"><button class="btn" id="tkGo">继续前进 ▶</button></div></div>`;
 S.cur=null;$("#tkR").onclick=e=>{gainRelic(id);e.currentTarget.classList.add("done");saveRun()};$("#tkG").onclick=e=>{S.gold+=g;sfx("coin");renderTop();e.currentTarget.classList.add("done");saveRun()};
 $("#tkGo").onclick=()=>{if(!$("#tkG").classList.contains("done"))S.gold+=g;if(!$("#tkR").classList.contains("done"))gainRelic(id);openMap()}}

/* ===================== 商店 ===================== */
function shopScreen(){show("shop");setBg("shop");playMusic("country");const off=has("bellr")?.8:1;
 const price=c=>Math.round(({C:50,R:78,E:125,L:190,X:85}[CARDS[c.id].r]||60)*(.9+rnd()*.2)*off);
 if(!S.cur.shop){const cards=[...offerCards(5,"C"),mk(pick(POOL_X))].map(c=>({c,p:price(c)}));cards[ri(5)].sale=1;cards.forEach(x=>{if(x.sale)x.p=Math.round(x.p/2)});
  const relics=[randRelic("C"),randRelic(rnd()<.5?"R":"E")].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(id=>({id,p:Math.round(({C:150,R:220,E:290}[RELICS[id].r])*(.95+rnd()*.1)*off)}));
  const pots=[randPot(),randPot(),randPot()].map(id=>({id,p:Math.round((50+ri(25))*off)}));S.cur.shop={cards,relics,pots,rm:0};saveRun()}
 const sh=S.cur.shop;const says=["随便看看，不买也可以摸摸。","今天的奶茶卖完了，别的都还有。","嘿嘿，这张卡我可是从塔顶捡来的。","钱不够？那就多打几只奶鼠嘛。"];
 const draw=()=>{const pr=(p,sale)=>`<div class="price ${S.gold<p?"no":""} ${sale?"sale":""}">${ICON.coin}${sale?"特价 ":""}${p}</div>`;
  $("#shop").innerHTML=`<div class="shopKeeper"><img src="${IMG("m4")}"></div><div class="shopSay">${pick(says)}</div><div class="shopBoard"><div class="phead"><span class="ribbon">巨无霸杂货铺</span></div>
  <div class="shopCards">${sh.cards.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-c="${i}">${cardHTML(x.c,"")}${pr(x.p,x.sale)}</div>`).join("")}</div>
  <div class="shopRow2">${sh.relics.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-r="${i}">${relicHTML(x.id)}<div class="lbl">${RELICS[x.id].n}</div>${pr(x.p)}</div>`).join("")}${sh.pots.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-p="${i}">${potHTML(x.id)}<div class="lbl">${POTIONS[x.id].n}</div>${pr(x.p)}</div>`).join("")}<div class="shopItem ${sh.rm?"sold":""}" id="shRm"><div class="rmv"><big>✂</big>移除一张牌</div>${pr(S.removeCost)}</div></div>
  <button class="btn sm shopLeave" id="shGo">离开 ▶</button></div>`;
  const buy=(p,f)=>{if(S.gold<p){toast("金币不够");sfx("hurt");return}S.gold-=p;sfx("coin");f();renderTop();saveRun();draw()};
  $$(".shopItem[data-c]").forEach(e=>{const x=sh.cards[+e.dataset.c];e.onclick=()=>buy(x.p,()=>{x.sold=1;S.deck.push(x.c);seeCard(x.c.id);toast(`买下了 <b>${cname(x.c)}</b>`)})});
  $$(".shopItem[data-r]").forEach(e=>{const x=sh.relics[+e.dataset.r];e.onclick=ev=>{tipAt(e,`<b>${RELICS[x.id].n}</b><p>${RELICS[x.id].d}</p><button class="btn sm" id="bR" style="margin-top:8px">买下 ${x.p}</button>`);$("#bR").onpointerdown=q=>{q.stopPropagation();closeTip();buy(x.p,()=>{x.sold=1;gainRelic(x.id)})}}});
  $$(".shopItem[data-p]").forEach(e=>{const x=sh.pots[+e.dataset.p];e.onclick=()=>{tipAt(e,`<b>${POTIONS[x.id].n}</b><p>${POTIONS[x.id].d}</p><button class="btn sm" id="bP" style="margin-top:8px">买下 ${x.p}</button>`);$("#bP").onpointerdown=q=>{q.stopPropagation();closeTip();if(S.pots.length>=S.potSlots){toast("药水栏满了");return}buy(x.p,()=>{x.sold=1;givePot(x.id)})}}});
  $("#shRm").onclick=async()=>{if(S.gold<S.removeCost){toast("金币不够");return}const r=await pickCards(S.deck,{title:"移除一张牌",sub:`花 ${S.removeCost} 金币，让牌组更精简`});if(r[0]){buy(S.removeCost,()=>{S.deck.splice(S.deck.indexOf(r[0]),1);sh.rm=1;S.removeCost+=25;toast(`<b>${cname(r[0])}</b> 被移除了`)})}};
  $("#shGo").onclick=()=>{S.cur=null;openMap()}};draw();renderTop()}

/* ===================== 事件 ===================== */
const EVENTS={
well:{n:"许愿池",img:"c2",t:"泥沼中间有一口亮晶晶的小池子，池底铺满了金币。旁边的牌子上写着：「投币许愿，童叟无欺」。",o:()=>[
 {t:"投 20 金币",d:"<span class='good'>获得一瓶药水，回复 10 生命</span>",ok:S.gold>=20,f:()=>{S.gold-=20;givePot(randPot());S.hp=Math.min(S.max,S.hp+10);return"池水冒了几个泡泡，浮上来一个小瓶子。"}},
 {t:"把一张牌扔进去",d:"<span class='good'>移除一张牌</span>",f:async()=>{const r=await pickCards(S.deck,{title:"扔哪一张？",sub:"它会沉到池底"});if(!r[0])return null;S.deck.splice(S.deck.indexOf(r[0]),1);return`「${cname(r[0])}」咕噜咕噜沉下去了。你觉得轻松了一点。`}},
 {t:"捞几枚金币",d:"<span class='good'>+45 金币</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.gold+=45;S.deck.push(mk("heavy"));return"金币到手了，可是心里沉甸甸的。"}},
 {t:"离开",d:"",f:()=>"你决定不碰这口来路不明的池子。"}]},
pup:{n:"迷路的奶狗",img:"dg",t:"一只浑身是泥的小奶狗蹲在路边，呜呜地叫。它看起来又冷又饿，尾巴却还在拼命摇。",o:()=>[
 {t:"抱起它",d:"<span class='good'>获得遗物「奶狗陪伴」</span>，<span class='bad'>失去 6 生命</span>（它太激动，把你扑进了泥里）",f:()=>{S.hp=Math.max(1,S.hp-6);gainRelic("pup");return"奶狗在你怀里蹭来蹭去。从今天起，你不是一个人爬塔了。"}},
 {t:"分它一点干粮",d:"<span class='good'>回复 8 生命</span>（你也顺便吃了点）",f:()=>{S.hp=Math.min(S.max,S.hp+8);return"奶狗吃得很香，吃完舔了舔你的手，跑进了草丛。"}},
 {t:"给它指个方向",d:"<span class='good'>+25 金币</span>",f:()=>{S.gold+=25;return"奶狗跑走了。过了一会儿又跑回来，嘴里叼着一个小钱袋。"}}]},
egg:{n:"神秘的蛋",img:"eg",t:"一颗比你还大的蛋卡在泥里，蛋壳上画着奇怪的花纹，里面好像有什么在动。",o:()=>[
 {t:"孵一孵",d:"<span class='good'>选一张稀有以上的牌</span>，<span class='bad'>失去 8 生命</span>",ok:S.hp>8,f:async()=>{S.hp-=8;await chooseReward(offerCards(3,"R",1),"蛋里蹦出来的……",false);return"你抱着蛋暖了很久，最后蹦出来的东西让你吃了一惊。"}},
 {t:"扭开它",d:"<span class='good'>获得「扭蛋」×2</span>",f:()=>{S.deck.push(mk("gacha"),mk("gacha"));return"原来是个扭蛋机！里面掉出来两个小扭蛋。"}},
 {t:"卖给路过的商人",d:"<span class='good'>+60 金币</span>",f:()=>{S.gold+=60;return"商人眼睛一亮，掏出一把金币。"}}]},
smith:{n:"铁匠奶蛙",img:"m2",t:"一只挺着大肚子的奶蛙在敲敲打打，火星四溅。「嘿！要不要我帮你把招式敲得更结实点？」",o:()=>[
 {t:"敲一张",d:"<span class='good'>升级一张牌</span>",f:async()=>{const ok=await upgradePick();return ok?"铛铛铛！焕然一新。":null}},
 {t:"多敲几下",d:"<span class='good'>随机升级 2 张牌</span>，<span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:()=>{S.hp-=10;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2);l.forEach(c=>c.u=1);return`敲得太用力，火星烫到了你。升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"算了",d:"",f:()=>"铁匠耸耸肩，继续敲他的锅。"}]},
gamble:{n:"赌徒奶蛙",img:"m3",t:"一只笑得停不下来的奶蛙拦住你：「来来来，猜大小！赢了翻倍，输了……哈哈哈哈哈！」",o:()=>[
 {t:"押 30 金币",d:"一半机会赢 <span class='good'>80 金币</span>",ok:S.gold>=30,f:()=>{S.gold-=30;if(rnd()<.5){S.gold+=80;sfx("coin");return"你赢了！狂笑奶蛙笑得更大声了。"}return"你输了。狂笑奶蛙笑到在地上打滚。"}},
 {t:"押上体力",d:"<span class='bad'>失去 10 生命</span>，一半机会获得 <span class='good'>一件遗物</span>",ok:S.hp>10,f:()=>{S.hp-=10;if(rnd()<.5){gainRelic(randRelic());return"它愿赌服输，从口袋里掏出一样宝贝。"}return"你输了，还被它拍了一巴掌。好疼。"}},
 {t:"不玩",d:"",f:()=>"「哈哈哈，胆小鬼！」笑声在身后响了很久。"}]},
elder:{n:"长老的回忆",img:"fj",t:"雾里浮现出长老的身影。不是真的长老，是一段留在塔里的记忆。它轻轻开口……",o:()=>[
 {t:"静静听完",d:"<span class='good'>回复 15 生命，记忆碎片 +1</span>",f:()=>{S.hp=Math.min(S.max,S.hp+15);M.shards++;saveMeta();return"「"+ELDER_TALES[Math.min(M.tale,ELDER_TALES.length-1)]+"」身影慢慢散开了。"}},
 {t:"向长老请教",d:"<span class='good'>升级一张牌</span>",f:async()=>{const ok=await upgradePick();return ok?"记忆里的长老点了点头：「对，就是这样。」":null}}]},
vamp:{n:"路过的吸血鬼",img:"vp",t:"一只披着斗篷的奶蛙从天上落下来，舔了舔尖牙。「别怕，我只是路过……顺便饿了。」",o:()=>[
 {t:"让它咬一口",d:"<span class='bad'>最大生命 -8</span>，<span class='good'>获得遗物「吸血鬼披风」</span>",f:()=>{S.max-=8;S.hp=Math.min(S.hp,S.max);gainRelic("cape");return"「谢啦！这件披风送你，上面那层见。」它飞走了。"}},
 {t:"请它喝奶茶",d:"<span class='good'>获得「吸血鬼之吻」×2</span>",f:()=>{S.deck.push(mk("kiss"),mk("kiss"));return"「奶茶……好像也不错？」它教了你两招才走。"}},
 {t:"赶快跑",d:"",f:()=>"你跑得飞快。身后传来一句：「上面见哦～」"}]},
};
function eventScreen(){show("event");setBg("event");playMusic("space");
 let pool=Object.keys(EVENTS).filter(k=>!S.evSeen.includes(k));if(!pool.length)pool=Object.keys(EVENTS);if(S.relics.includes("pup"))pool=pool.filter(k=>k!=="pup");
 const id=S.cur.ev||(S.cur.ev=pick(pool));saveRun();const E=EVENTS[id];if(!S.evSeen.includes(id))S.evSeen.push(id);const opts=E.o();
 $("#event").innerHTML=`<div class="evBox"><div class="phead"><span class="ribbon">${E.n}</span></div><div class="evPic"><img src="${IMG(E.img)}"></div><div class="evTxt"><p id="evP">${E.t}</p><div class="evOpts">${opts.map((o,i)=>`<button class="evo" data-i="${i}" ${o.ok===false?"disabled":""}><b>${o.t}</b><small>${o.d}</small></button>`).join("")}</div></div></div>`;
 $$("#event .evo").forEach(b=>b.onclick=async()=>{if(b.dataset.busy)return;b.dataset.busy=1;const r=await opts[+b.dataset.i].f();if(r==null){delete b.dataset.busy;return}sfx("click");renderTop();S.cur=null;saveRun();
  $("#evP").textContent=r;$(".evOpts").innerHTML=`<button class="evo" id="evGo"><b>继续前进</b></button>`;$("#evGo").onclick=openMap})}

/* ===================== 启动 ===================== */
$("#stage").addEventListener("scroll",e=>{e.target.scrollTop=0;e.target.scrollLeft=0});
fit();titleScreen();
window.__dbg={get S(){return S},get B(){return B},startCombat,openMap,enterNode,newRun,win:()=>{B.enemies.forEach(e=>e.hp=0);afterAction()},CARDS};
