/* ===================== 奶蛙之塔 · 主程序 ===================== */
"use strict";
const VER="3.0";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
/* 图片：把内嵌的 base64 一次性转成 blob 地址，之后每次渲染只传一个短链接，切页面和出牌都快很多 */
const IMG_CACHE={};
function toBlobURL(u){try{if(!u||u.slice(0,5)!=="data:"||!window.URL||!URL.createObjectURL)return u;const i=u.indexOf(",");const mime=u.slice(5,u.indexOf(";"));const bin=atob(u.slice(i+1));const arr=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)arr[j]=bin.charCodeAt(j);return URL.createObjectURL(new Blob([arr],{type:mime}))}catch(e){return u}}
const IMG=k=>{if(k!=="__mimic"&&IMG_CACHE[k])return IMG_CACHE[k];const u=k==="__mimic"?(typeof MIMIC_URI!=="undefined"?MIMIC_URI:""):(window.__NWT_IMG||{})[k]||"";if(!u)return"";const b=toBlobURL(u);IMG_CACHE[k]=b;return b};
const sleep=ms=>new Promise(r=>setTimeout(r,ms*.72));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let S=null,B=null,busy=false;
let M={wins:0,runs:0,shards:0,tale:0,best:0,seen:{}};
try{Object.assign(M,JSON.parse(localStorage.getItem("nwt-meta")||"{}"))}catch(e){}if(typeof M.pals!=="object"||!M.pals){M.palN=typeof M.pals==="number"?M.pals:0;M.pals={}}
const saveMeta=()=>{M.t=Date.now();try{localStorage.setItem("nwt-meta",JSON.stringify(M))}catch(e){}if(window.CLOUD)CLOUD.mark()};
const saveRun=()=>{if(window.CLOUD)CLOUD.mark();try{if(S)localStorage.setItem("nwt-run",JSON.stringify(S));else localStorage.removeItem("nwt-run")}catch(e){}};
const loadRun=()=>{try{const s=JSON.parse(localStorage.getItem("nwt-run")||"null");return s&&s.v===2?s:null}catch(e){return null}};

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
function show(id){$$(".scr").forEach(s=>s.classList.toggle("on",s.id===id));$("#stage").classList.toggle("inBattle",id==="battle");$("#top").classList.toggle("on",!!S&&!["title","heroSel","ending","none"].includes(id));closeTip()}
function setBg(kind,moon){const b=$("#bg");const fl=[...Array(7)].map((_,i)=>`<i class="ffly" style="left:${8+i*13}%;bottom:${10+(i*37)%24}%;animation-delay:${i*.9}s"></i>`).join("");
 if(kind==="map"){const A=(S&&S.act)||0,T=MAPTH[A]||MAPTH[0];b.className="bgmap ma"+A;b.innerHTML=`<div class="parch"><div class="mPhoto" style="background-image:url(bg/${T.bg}.jpg)"></div><div class="mGrade"></div><div class="mFx">${T.fx()}</div>${T.deco}</div>`;$("#map").className="scr on ma"+A;return}
 const im=BGIMG[kind];if(im){b.className="photoBg";b.innerHTML=`<div class="bgPhoto" style="background-image:url(bg/${im}.jpg)"></div><div class="bgGrade"></div>`+fl;return}
 b.className="";b.innerHTML=sceneSVG(kind,moon)+(kind==="shop"?"":fl)}
const BGIMG={swamp:"forest",reed:"forest",elite:"forest",ruin:"swamp",boss:"swamp",castle:"castle",gate:"gate",boss1:"gate",snowfield:"ice",belltower:"ice",bellE:"ice",bossice:"ice",factory:"gears",pipes:"gears",bossfac:"lava",cosmos:"sky",summit:"sky",boss2:"void",demon:"void",event:"temple"};
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
function cname(c){return(c.g?"金·":"")+CARDS[c.id].n+(c.u&&!c.g?"+":"")}
function baseCost(c){const D=CARDS[c.id];return c.u&&D.cu!=null?D.cu:D.cost}
function curCost(c){const D=CARDS[c.id];if(D.cost<0)return D.cost;let v=baseCost(c);if(c.sh==="cost")v-=1;if(c.tmp!=null)v=c.tmp;if(B&&D.dyn)v+=D.dyn(B);if(B&&B.p.horseFree&&D.fam==="horse")v=0;if(B&&B.p.free)v=0;return Math.max(0,v)}
function liveMod(D){if(!B||!B.p)return null;const p=B.p,sv=[B.curFam,B.curType];B.curFam=D.fam;B.curType=D.type;let wa=0,wb=0;try{wa=B.wxAtk();wb=B.wxBlk()}catch(e){}B.curFam=sv[0];B.curType=sv[1];
 const al=B.alive?B.alive():[];return{atk:wa+(p.str||0)+(p.tstr||0)+(B.bonus||0),weak:p.weak>0,vuln:al.length===1&&al[0].vuln>0,blk:wb+(p.dex||0)}}
function descHTML(c,live){const D=CARDS[c.id];const t=D.d(!!c.u);const base=D.d(false).match(/\d+/g)||[];let i=0;const L=live?liveMod(D):null;
 return esc(t).replace(/(\d+)( 点)?( ?)(伤害|护盾)?/g,(all,m,dian,sp,kind)=>{const o=base[i++];let v=+m;
  if(L&&kind==="伤害"&&D.type==="atk"){v=v+L.atk;if(L.weak)v*=.75;if(L.vuln)v*=1.5;v=Math.max(0,Math.floor(v))}
  else if(L&&kind==="护盾"){v=Math.max(0,v+L.blk)}
  const cls=v>+m?"g":v<+m?"r":(c.u&&o!==m?"g":"");return`<b class="${cls}">${v}</b>${dian||""}${sp}${kind||""}`})}
function cardHTML(c,cls=""){const D=CARDS[c.id],fam=FAM[D.fam];let cost=B&&cls.includes("inhand")?curCost(c):baseCost(c);
 let cc="";if(D.cost===-2)cc="na";else if(B&&cls.includes("inhand")&&D.cost>=0){if(cost<baseCost(c))cc="dn";else if(cost>baseCost(c))cc="upc"}
 const cs=D.cost===-1?"X":cost;
 const extra=[D.exh||(D.exhU&&!c.u)?"消耗":"",D.eth?"虚无":""].filter(Boolean);
 return`<div class="card r-${D.r} t-${D.type}${c.u?" up":""}${c.g?" gold":""}${c.sh?" shiny":""} ${cls}" data-k="${c.k}">${c.sh?`<span class="shtag">闪·${SHINY[c.sh]}</span>`:""}${c.g?`<span class="gtag">效果×2</span>`:""}<div class="cf"><div class="in"><div class="art"><img src="${IMG(D.img)}" alt=""></div><div class="tpc"><em>${TYPE[D.type].n}</em>${D.fam!=="none"?`<i style="--famc:${fam.c}">${fam.n}</i>`:""}</div><div class="ds"><span>${descHTML(c,!!B&&cls.includes("inhand"))}</span></div></div><div class="rib"><span>${esc(cname(c))}</span></div></div><div class="cost ${cc}">${cs}</div><i class="gem"></i><span class="tri">三连！</span></div>`}
function relicHTML(id,extra=""){const R=RELICS[id];return`<div class="rl ${extra}" data-rl="${id}"><img src="${IMG(R.img)}" alt=""></div>`}
function potHTML(id){if(!id)return`<div class="pot"></div>`;return`<div class="pot full" data-pot="${id}"><i class="flask" style="--pc:${POTIONS[id].c}"></i></div>`}
function seeCard(id){if(!M.seen[id]){M.seen[id]=1;saveMeta()}}

/* ---------- 顶栏 ---------- */
function renderTop(){if(S&&S.gold>=500)ach("rich");if(!S)return;const t=$("#top");const fl=S.row<0?0:S.row+1;
 t.innerHTML=`<div class="face"><img src="${IMG(HI())}"></div><div class="lvB" id="lvB"><b>Lv.${S.lv||1}</b><i style="width:${S.lv>=LV_XP.length-1?100:Math.min(100,((S.xp||0)-LV_XP[S.lv||1])/(LV_XP[(S.lv||1)+1]-LV_XP[S.lv||1])*100)}%"></i></div><span class="hpIco">${ICON.heart}</span><div class="hpPill"><i style="width:${S.hp/S.max*100}%"></i><span>${S.hp}/${S.max}</span></div><div class="goldBox">${ICON.coin}${S.gold}</div><div class="pots">${[...Array(S.potSlots)].map((_,i)=>potHTML(S.pots[i])).join("")}</div><div class="relics">${S.relics.map(r=>relicHTML(r)).join("")}</div><div class="floor">${actN().n}<b>${S.atBoss?"首领":fl?fl+"/"+ROWS:"入口"}</b></div>${S.mod&&MODS[S.mod]?`<button class="tbtn modChip" id="modBtn">${MODS[S.mod].n}</button>`:""}<button class="tbtn" id="deckBtn">${ICON.deck}${S.deck.length}</button><button class="tbtn" id="setBtn">${ICON.gear}</button>`;
 $$("#top .rl").forEach(e=>e.onclick=ev=>{ev.stopPropagation();const R=RELICS[e.dataset.rl];tipAt(e,`<b>${R.n}</b><p>${R.d}</p>`)});
 $$("#top .pot.full").forEach((e,i)=>e.onclick=ev=>{ev.stopPropagation();potMenu(e,[...$$("#top .pot")].indexOf(e))});
 {const mb=$("#modBtn");if(mb)mb.onclick=ev=>{ev.stopPropagation();tipAt(mb,`<b>今日塔况：${MODS[S.mod].n}</b><p>${MODS[S.mod].d}</p>`)}}
 $("#deckBtn").onclick=()=>viewCards(S.deck,"我的牌组",`共 ${S.deck.length} 张`);
 $("#setBtn").onclick=settings}
function potMenu(el,i){const id=S.pots[i],P=POTIONS[id];const inB=B&&!B.over&&$("#battle").classList.contains("on");const canUse=inB&&!busy&&B.myTurn||id==="pheal";
 tipAt(el,`<b>${P.n}</b><p>${P.d}</p><div style="display:flex;gap:8px;margin-top:10px">${canUse?`<button class="btn sm" id="pUse" style="min-width:90px">使用</button>`:""}<button class="btn sm ghost" id="pDrop" style="min-width:90px">丢掉</button></div>`);
 const u=$("#pUse");if(u)u.onpointerdown=e=>{e.stopPropagation();closeTip();usePotion(i)};
 $("#pDrop").onpointerdown=e=>{e.stopPropagation();closeTip();S.pots.splice(i,1);renderTop();saveRun()}}
function usePotion(i){const id=S.pots[i],P=POTIONS[id];M.pots=(M.pots||0)+1;if(M.pots>=30)ach("potions");
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
function codex(){let up=false,tab="hero";const tabs={hero:["家族牌",POOL_HERO],x:["无色牌",POOL_X],pal:["伙伴卡",POOL_PAL]};const total=[...POOL_HERO,...POOL_X,...POOL_PAL];const d=()=>{const all=tabs[tab][1];const list=all.map(id=>({id,u:up?1:0,k:id}));
 ov(`<div class="ovHead"><span class="ribbon b">卡牌图鉴</span><small>已见过 ${total.filter(i=>M.seen[i]).length} / ${total.length} 张${tab==="pal"?"　伙伴卡只能在战斗里抓敌人获得":""}</small></div><div class="tabs">${Object.entries(tabs).map(([k,v])=>`<button class="${tab===k?"on":""}" data-t="${k}">${v[0]}</button>`).join("")}<button class="${up?"on":""}" id="cxu" style="margin-left:18px">${up?"升级后":"原版"}</button></div><div class="ovGrid" style="top:150px">${list.map(c=>M.seen[c.id]?cardHTML(c,"mid"):`<div class="card mid cback"><div class="cf"><div class="in"><b>?</b><small>${tab==="pal"?"还没抓到":"还没遇到"}</small></div></div></div>`).join("")}</div><div class="ovFoot"><button class="btn sm" id="ovX">返回</button></div>`);
 $$("#ov .tabs button[data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;d()});$("#cxu").onclick=()=>{up=!up;d()};$("#ovX").onclick=()=>{closeOv();if(S&&$("#top").classList.contains("on"))settings()}};d()}

/* ---------- 对话 ---------- */
function talk(lines){return new Promise(res=>{const T=$("#talk");let i=0;const L=lines.map(l=>({img:l[0]==="n1"?HI():l[0],who:l[0]==="n1"?HN():l[1],say:l[2],side:l[0]==="n1"?"l":"r"}));
 const left=L.find(l=>l.side==="l"),right=L.find(l=>l.side==="r");
 const step=()=>{if(i>=L.length){T.classList.remove("on");T.onclick=null;res();return}const l=L[i];
  T.innerHTML=`${left?`<div class="pt l ${l.side!=="l"?"dim":""}"><img src="${IMG(l.side==="l"?l.img:left.img)}"></div>`:""}${right?`<div class="pt r ${l.side!=="r"?"dim":""}"><img src="${IMG(l.side==="r"?l.img:(L.slice(0,i+1).reverse().find(x=>x.side==="r")||right).img)}" style="${l.side==="r"?"":""}"></div>`:""}<div class="box"><div class="who ${l.side}">${l.who}</div><div class="say">${esc(l.say)}</div><div class="nx">点一下继续 ▶</div></div>${L.length>2?`<button class="tSkip">跳过 ⏭</button>`:""}`;
  const sk=T.querySelector(".tSkip");if(sk)sk.onclick=ev=>{ev.stopPropagation();i=L.length;step()};
  T.classList.add("on");sfx("click");i++};T.onclick=step;step()})}

/* ===================== 标题 ===================== */
function bossCodex(){const ids=Object.keys(BOSS_LORE);const rec=M.boss||{};const got=ids.filter(id=>(rec[id]||{}).k).length;
 ov(`<div class="bcx"><div class="mgHead"><span class="ribbon b">首领图鉴</span><small>已解锁 ${got} / ${ids.length}　打败首领后解锁它的故事</small></div><div class="bcxRow"><div class="bcxGrid">${ids.map(id=>{const k=(rec[id]||{}).k;return`<button class="bcxC ${k?"":"lock"}" data-id="${id}"><img src="${IMG(ENEMY[id].img)}"><span>${k?ENEMY[id].n:"？？？"}</span></button>`}).join("")}</div><div class="bcxD" id="bcxD"><p class="bcxHint">点左边的首领看看</p></div></div><div class="ovFoot"><button class="btn" id="bcxX">关闭</button></div></div>`);
 $$(".bcxC").forEach(b=>b.onclick=()=>{$$(".bcxC").forEach(x=>x.classList.remove("on"));b.classList.add("on");const id=b.dataset.id,L=BOSS_LORE[id],k=(rec[id]||{}).k;sfx("click");
  $("#bcxD").innerHTML=k?`<img src="${IMG(ENEMY[id].img)}"><h3>${ENEMY[id].n}</h3><div class="bt"><b>${L.t}</b>${L.td}</div><div class="lore">${[["初见",L.lore,1],["为什么",L.lore2,2],["阿岳与长老",L.lore3,3]].filter(x=>x[1]).map(([h,l,n])=>k>=n?`<h4>${h}</h4>${l.map(x=>`<p>${x}</p>`).join("")}`:`<h4 class="lk">${h}</h4><p class="sp">再打败它 ${n-k} 次解锁</p>`).join("")}</div><small>击败 ${k} 次</small>`:`<img class="sil" src="${IMG(ENEMY[id].img)}"><h3>？？？</h3><p class="bcxHint">还没有打败过它。</p>`});
 $("#bcxX").onclick=closeOv}
const mlv=id=>((M.up||{})[id]||0);
function earnShards(win){if(!S)return{n:0};const rooms=(S.act||0)*(ROWS+1)+Math.max(0,S.row)+1;
 const n=Math.max(1,Math.floor(rooms/15)+Math.floor((S.stats.endb||0)/2)+(win?3:0)+Math.floor(asc()/3));
 M.shards=(M.shards||0)+n;M.shardsAll=(M.shardsAll||0)+n;saveMeta();return{n}}
function villageTale(){M.seenT=M.seenT||[];const un=VILLAGE_TALES.filter(t=>!M.seenT.includes(t.t));const T=pick(un.length?un:VILLAGE_TALES);if(!M.seenT.includes(T.t))M.seenT.push(T.t);if(VILLAGE_TALES.every(t=>M.seenT.includes(t.t)))ach("tales");saveMeta();return T}
function shardHTML(r){return`<div class="shardRes"><div class="srN">${ICON.star}<b>记忆碎片 +${r.n}</b><small>在主页「长老的小院」换成永久成长</small></div></div>`}
function ach(id){if(!M.ach)M.ach={};if(M.ach[id])return;const A=ACH.find(a=>a.id===id);if(!A)return;M.ach[id]=Date.now();saveMeta();sfx("relic");
 GSTAT.add(["tw_a_"+id]).then(()=>showAch(A));}
const ACHQ=[];function showAch(A){ACHQ.push(A);if(ACHQ.length===1)showAch0(A)}
function showAch0(A){setTimeout(()=>{ACHQ.shift();if(ACHQ.length)showAch0(ACHQ[0])},1900);const p=GSTAT.pct(A.id);const d=document.createElement("div");d.className="achPop";d.innerHTML=`<i>${ICON[A.ic]||WXICON[A.ic]||ICON.star}</i><div><small>成就解锁</small><b>${A.n}</b><span>${A.d}${p!=null?`　·　${GSTAT.txt(A.id)}`:""}</span></div>`;$("#stage").appendChild(d);setTimeout(()=>d.classList.add("out"),1500);setTimeout(()=>d.remove(),2000)}
async function achScreen(){const got=ACH.filter(a=>(M.ach||{})[a.id]).length;
 ov(`<div class="bcx"><div class="mgHead"><span class="ribbon b">成就</span><small>已解锁 ${got} / ${ACH.length}　</small></div><div class="achGrid" id="achGrid"></div><div class="ovFoot"><button class="btn" id="achX">关闭</button></div></div>`);
 const paint=()=>{const g=$("#achGrid");if(!g)return;g.innerHTML=ACH.map(a=>{const t=(M.ach||{})[a.id],p=GSTAT.pct(a.id);const hide=a.hid&&!t;return`<div class="achC ${t?"":"lock"}"><i>${hide?ICON.q:(ICON[a.ic]||WXICON[a.ic]||ICON.star)}</i><div><b>${hide?"？？？":a.n}</b><span>${hide?"隐藏成就":a.d}</span>${p!=null?`<em>${GSTAT.txt(a.id)}</em>`:""}</div></div>`}).join("")};
 paint();$("#achX").onclick=closeOv;if(GSTAT.detect()){await GSTAT.load(true);paint();const s=$("#achSt");if(s)s.textContent=GSTAT.data?`全服 ${GSTAT.data.tw_players||0} 位玩家`:"全服数据暂时读不到"}}
function yardScreen(){
 ov(`<div class="bcx yard"><div class="mgHead"><span class="ribbon b">长老的小院</span><small>记忆碎片 <b id="ydS">${M.shards||0}</b>　每一局不管输赢都会带回一点碎片，走得越远带得越多</small></div><div class="ydBody" id="ydB"></div><div class="ovFoot"><button class="btn" id="ydX">关闭</button></div></div>`);
 $("#ydX").onclick=()=>{closeOv();titleScreen()};
 $("#ydB").innerHTML=`<div class="upGrid">${META.map(u=>{const l=mlv(u.id),mx=l>=u.max,c=mx?0:u.cost(l);return`<div class="upItem ${mx?"max":""}"><div class="uiH"><b>${u.n}</b><span>${"●".repeat(l)}${"○".repeat(u.max-l)}</span></div><p>${u.d(Math.max(1,l))}</p><button class="uiBuy" data-id="${u.id}" ${mx||(M.shards||0)<c?"disabled":""}>${mx?"已满":`${ICON.star}${c}`}</button></div>`}).join("")}</div>`;
 $$(".uiBuy").forEach(b=>b.onclick=()=>{const u=META.find(x=>x.id===b.dataset.id),l=mlv(u.id),c=u.cost(l);if(l>=u.max||(M.shards||0)<c)return;M.shards-=c;M.up=M.up||{};M.up[u.id]=l+1;saveMeta();sfx("relic");yardScreen()})}
function titleScreen(){B=null;S=null;show("title");setBg("title");playMusic("title");const sv=loadRun();
 $("#title").innerHTML=`<div class="logo"><h1>${"奶蛙之塔".split("").map((c,i)=>`<span class="rn rn${i}" data-c="${c}">${c}</span>`).join("")}</h1><div class="tsub"><span class="ribbon">满月升起，尖塔归来</span><span class="ver">${VER}</span></div></div>
 <div class="tmenu">${sv?(()=>{const H=HEROES.find(h=>h.id===sv.hero)||HEROES[0],a=sv.act||0,stp=sv.atBoss?"首领":(sv.row>=0?`第 ${sv.row+1}/${ROWS} 步`:"入口");return`<div class="saveWrap"><button class="saveCard" id="tCont"><div class="svPic"><img src="${IMG(H.img)}" alt=""></div><div class="svInfo"><div class="svT"><b>回到塔里</b><span>${H.n}</span></div><div class="svL">第${"一二三四五"[a]||a+1}层 · ${ACTS[a]?ACTS[a].n:""}　${stp}</div><div class="svS"><span>${ICON.heart}${sv.hp}/${sv.max}</span><span>${ICON.deck}${(sv.deck||[]).length} 张</span><span>${ICON.coin}${sv.gold||0}</span><span>第 ${(sv.asc||0)+1} 周目</span></div></div><i class="svGo">▶</i></button><button class="newLink" id="tNew">重新开始</button></div>`})():`<button class="gbtn" id="tNew"><i class="pl"></i><b>开始冒险</b></button>`}<div class="sub"><button class="gbtn sm" id="tCodex"><b>卡牌图鉴</b></button><button class="gbtn sm" id="tBoss"><b>首领图鉴</b></button><button class="gbtn sm" id="tAch"><b>成就</b></button><button class="gbtn sm" id="tSet"><b>${A.music?"♪ 音乐开":"♪ 音乐关"}</b></button></div></div>
 <div class="tknight"><img src="${IMG("kn")}"></div><div class="thero"><img src="${IMG(HI())}"><i class="plat"></i></div>
 ${window.toy?"":`<button class="zsBtn" id="zsBtn"><img src="zanshang.jpg" alt=""><span>赞赏作者</span></button>`}<button class="yardBtn" id="tYard"><img src="${IMG("m6")}" alt=""><span>长老的小院${(()=>{const n=META.filter(u=>mlv(u.id)<u.max&&(M.shards||0)>=u.cost(mlv(u.id))).length;return n?`<i class="dot"></i>`:""})()}</span><em>${ICON.star}${M.shards||0}</em></button>${M.isekaiMet?`<button class="isePeek" id="tIse"><img src="${IMG("yjx")}"></button>`:""}<div class="cloudSt" id="cloudSt">${CLOUD.txt()}</div><div class="tmeta"><span>通关 <b>${M.wins}</b> 次</span><span>成就 <b>${ACH.filter(a=>(M.ach||{})[a.id]).length}/${ACH.length}</b></span></div>`;
 const c=$("#tCont");if(c)c.onclick=()=>{S=sv;resume()};
 $("#tNew").onclick=()=>{if(sv)confirmBox("重新开始？","现在的存档会被覆盖。",()=>{closeOv();heroSelect()});else heroSelect()};
 $("#tCodex").onclick=codex;$("#tBoss").onclick=bossCodex;$("#tAch").onclick=achScreen;$("#tYard").onclick=()=>yardScreen();if($("#tIse"))$("#tIse").onclick=()=>{sfx("click");toast(pick(["那边的人还在抓奶蛙。我在这边挺好的。","门偶尔还会开。你要是看到了，记得帮我关上。","这边的奶茶比那边甜。","你也是从别的地方来的吧？我看得出来。","别拿网对着我。"]))};{const z=$("#zsBtn");if(z)z.onclick=()=>{sfx("click");ov(`<div class="zsBox"><img src="zanshang.jpg" alt="赞赏码"><p>微信扫一扫，请作者喝杯奶茶</p><button class="btn" id="zsX">关闭</button></div>`);$("#zsX").onclick=closeOv}}$("#tSet").onclick=()=>{A.music=!A.music;audioSave();titleScreen()}}

const HEROES=[{id:"naiwa",n:"奶蛙",img:"nw",tag:"一号主角 · 厚肚皮",d:"奶茶泉边最普通的一只奶蛙，肚皮又软又厚。每场战斗开局自带 6 点护盾，稳稳当当。",hp:80,on:1},{id:"kungfu",n:"功夫奶蛙",img:"n1",tag:"二号主角 · 快手连击",d:"在竹林里练了很多年拳。每场战斗第一回合多抽 2 张，起手就是一整套。初始牌组多一张「奶蛙拳」。",hp:70,on:1},{id:"knight",n:"骑士奶蛙",img:"kn",tag:"三号主角 · 铁甲",d:"开局自带 8 护盾，回合开始护盾只掉一半。护盾越厚，每回合第一拳越疼。",hp:82,on:1},{id:"mage",n:"奶蛙魔法师",img:"m6",tag:"四号主角 · 魔法",d:"还在路上，下一个版本见。",hp:70}];
const ASC=[{n:"标准难度",d:"第一次爬塔"},{n:"敌人生命 +10%",d:""},{n:"首领和精英生命 +12%",d:""},{n:"敌人开场就有 1 点力气",d:""},{n:"最大生命 -6",d:""},{n:"商店涨价 15%",d:""},{n:"精英一定带词缀",d:""},{n:"初始牌组多一张诅咒「沉重」",d:""},{n:"休息处回复减少三分之一",d:""}];
const asc=()=>(S&&S.asc)||0;
const HERO=()=>HEROES.find(h=>h.id===(S&&S.hero))||HEROES[0],HI=()=>HERO().img,HN=()=>HERO().n;
function heroSelect(){show("heroSel");setBg("title");let cur=0;
 $("#heroSel").innerHTML=`<div class="hsTitle"><span class="ribbon b">选择你的奶蛙</span></div><div class="hsRow">${HEROES.map((h,i)=>`<div class="hcard ${h.on?"":"lock"} ${i===0?"on":""}"><div class="pic"><img src="${IMG(h.img)}"></div>${h.on?"":`<span class="lk">敬请期待</span>`}<h3>${h.n}</h3><div class="tag">${h.tag}</div><p>${h.on?h.d:"之后的版本开放"}</p>${h.on?`<div class="hst"><span>${ICON.heart}${h.hp}</span><span>${ICON.coin}99</span><span>茶杯</span></div>`:""}</div>`).join("")}</div><div class="hsGo">${(M.ascMax||0)>0?`<div class="ascSel"><button id="ascL">◀</button><div><b id="ascN"></b><small id="ascD"></small></div><button id="ascR">▶</button></div>`:""}<button class="btn ghost" id="hsB">返回</button><button class="btn" id="hsGo">出发！</button></div>`;
 $$(".hcard").forEach((e,i)=>e.onclick=()=>{if(!HEROES[i].on){toast(`${HEROES[i].n}还在路上，<b>之后的版本</b>开放`);return}cur=i;sfx("click");$$(".hcard").forEach((x,j)=>x.classList.toggle("on",j===i))});
 $("#hsB").onclick=titleScreen;let ac=Math.min(M.ascSel||0,M.ascMax||0);const ascUI=()=>{const n=$("#ascN");if(!n)return;n.textContent=`第 ${ac+1} 周目`;$("#ascD").innerHTML=ac?ASC.slice(1,ac+1).map(x=>x.n).join("　·　"):"标准难度";$("#ascL").disabled=ac<=0;$("#ascR").disabled=ac>=(M.ascMax||0)};
 if($("#ascL")){$("#ascL").onclick=()=>{if(ac>0){ac--;sfx("click");ascUI()}};$("#ascR").onclick=()=>{if(ac<(M.ascMax||0)){ac++;sfx("click");ascUI()}};ascUI()}
 $("#hsGo").onclick=()=>{sfx("click");M.ascSel=ac;saveMeta();newRun(HEROES[cur].id,ac)}}

/* ===================== 新冒险 ===================== */
async function newRun(hero,ascLv){const seed=(Math.random()*2**31)|0;
 S={v:2,seed,rs:seed,uid:0,hp:72,max:72,gold:99,deck:[],relics:["cup"],pots:[],potSlots:2,row:-1,col:-1,path:[],combats:0,elites:0,removeCost:75,stats:{kills:0,played:0,dmg:0,tri:0,gold:0},flags:{},evSeen:[],atBoss:false,cur:null};
 S.hero=["kungfu","knight"].includes(hero)?hero:"naiwa";{const H=HEROES.find(h=>h.id===S.hero);S.hp=S.max=H.hp}
 S.asc=Math.max(0,Math.min(ASC.length-1,ascLv||0));S.mod=pick(Object.keys(MODS).filter(k=>k!==M.lastMod));M.lastMod=S.mod;if(S.mod==="xp"){S.max-=10;S.hp-=10}
 ach("first");S.act=0;S.actCombats=0;S.lv=1;S.xp=0;S.perks={};S.deck=(S.hero==="kungfu"?[...STARTER,"fist"]:S.hero==="knight"?[...STARTER.filter((x,i)=>i!==0),"guard","kn_bash"]:STARTER).map(id=>mk(id));if(asc()>=4){S.max-=6;S.hp=Math.min(S.hp,S.max)}if(asc()>=7)S.deck.push(mk("heavy"));{S.max+=4*mlv("hp");S.hp=S.max;S.gold+=15*mlv("gold");if(mlv("pot")){givePotQuiet(randPot());if(mlv("pot")>=2)S.potSlots++}
  if(mlv("sharp")){shuffle(S.deck.filter(c=>c.id!=="heavy")).slice(0,mlv("sharp")).forEach(c=>c.u=1)}
  if(mlv("pal"))S.deck.push(mk(pick(POOL_PAL)));if(mlv("relic")){const r=randRelic("R");if(r)S.relics.push(r)}}
 S.map=genMap();S.sky=genSky();pickBoss();S.pals={};S.stats.caught=0;S.stats.gold2=0;M.runs++;saveMeta();
 show("none");setBg("title");playMusic("space");
 await talk(M.wins>0&&STORY.intro2?STORY.intro2:STORY.intro);await modIntro();await blessing()}
async function blessing(){const opts=shuffle([
 {t:"最大生命 +10",d:"身体更结实了",f:()=>{S.max+=10;S.hp+=10}},
 {t:"获得一件随机遗物",d:"长老塞给你一个小包裹",f:()=>gainRelic(randRelic("C"))},
 {t:"移除一张「打一下」",d:"去掉一张最普通的牌",f:()=>{const i=S.deck.findIndex(c=>c.id==="strike");if(i>=0)S.deck.splice(i,1)}},
 {t:"获得 100 金币",d:"长老的私房钱",f:()=>{S.gold+=100}},
 {t:"选一张稀有牌",d:"长老教你一招",f:async()=>{const c=offerCards(3,"R",1);await chooseReward(c,"长老教你一招",false)}},
 {t:"获得两瓶药水",d:"奶茶泉的泉水",f:()=>{givePot(randPot());givePot(randPot())}}]).slice(0,3+mlv("bless"));
 return new Promise(res=>{ov(`<div class="ovHead"><span class="ribbon b">奶蛙长老的祝福</span><small>出发前，选一样带上</small></div><div class="evOpts" style="position:absolute;left:330px;right:200px;top:190px">${opts.map((o,i)=>`<button class="evo" data-i="${i}"><b>${o.t}</b><small>${o.d}</small></button>`).join("")}</div><div style="position:absolute;left:60px;bottom:30px;width:220px;height:260px"><img src="${IMG("m6")}" style="width:100%;height:100%;object-fit:contain"></div><div class="blessSay">拿着。用不上就扔了，别跟人说是我给的。</div>`);
  $$("#ov .evo").forEach(b=>b.onclick=async()=>{sfx("relic");closeOv();await opts[+b.dataset.i].f();if(mlv("lv")&&!S.lvPerk){S.lvPerk=1;await levelUp("老练")}saveRun();openMap();res()})})}
function resume(){if(S.act==null)S.act=0;if(!S.boss)pickBoss();if(!S.sky)S.sky=genSky();if(!S.pals)S.pals={};setBg("swamp");if(S.cur){const c=S.cur;S.cur=null;enterNode(c.t,true,c)}else openMap()}

/* ===================== 地图 ===================== */
const MAPTH=(()=>{const R=(n,f)=>Array.from({length:n},(_,i)=>f(i)).join("");const r=(a,b)=>(a+Math.random()*(b-a)).toFixed(1);
 return[
 {bg:"swamp",k:"沼",fx:()=>R(14,i=>`<i class="ff" style="left:${r(2,98)}%;top:${r(10,95)}%;animation-delay:-${r(0,6)}s;animation-duration:${r(4,8)}s"></i>`),
  deco:`<svg class="mDeco reeds" viewBox="0 0 300 220"><g fill="#0c1a0e">${[20,48,70,96,130,160,190].map((x,i)=>`<path d="M${x} 220 Q${x-6} ${120-i*6} ${x+4} ${40+i*9} Q${x+10} ${120-i*6} ${x+8} 220Z"/><ellipse cx="${x+4}" cy="${46+i*9}" rx="6" ry="20"/>`).join("")}</g></svg><svg class="mDeco reeds r2" viewBox="0 0 300 220"><g fill="#0c1a0e">${[30,64,92,140,200,240].map((x,i)=>`<path d="M${x} 220 Q${x-6} ${110-i*5} ${x+4} ${50+i*8} Q${x+10} ${110-i*5} ${x+8} 220Z"/>`).join("")}</g></svg>`},
 {bg:"castle",k:"堡",fx:()=>R(6,i=>`<i class="bat" style="top:${r(5,55)}%;animation-delay:-${r(0,12)}s;animation-duration:${r(9,16)}s"><svg viewBox="0 0 40 16"><path d="M20 6 Q14 0 2 4 Q8 6 6 12 Q12 8 16 12 Q18 8 20 10 Q22 8 24 12 Q28 8 34 12 Q32 6 38 4 Q26 0 20 6Z" fill="#0d0d0d"/></svg></i>`),
  deco:`<div class="mDeco moonBig"></div><svg class="mDeco rose" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="#0d0d0d"/>${R(12,i=>`<path d="M100 100 L${100+88*Math.cos(i*Math.PI/6)} ${100+88*Math.sin(i*Math.PI/6)} A88 88 0 0 1 ${100+88*Math.cos((i+1)*Math.PI/6)} ${100+88*Math.sin((i+1)*Math.PI/6)}Z" fill="${["#e5191c","#5b1a7a","#c8a23a"][i%3]}" opacity=".85" stroke="#0d0d0d" stroke-width="6"/>`)}<circle cx="100" cy="100" r="22" fill="#e5191c" stroke="#0d0d0d" stroke-width="6"/></svg>`},
 {bg:"ice",k:"冰",fx:()=>R(30,i=>`<i class="sn" style="left:${r(0,100)}%;width:${r(2,6)}px;height:${r(2,6)}px;animation-delay:-${r(0,10)}s;animation-duration:${r(6,12)}s"></i>`),
  deco:`<svg class="mDeco bell" viewBox="0 0 120 140"><path d="M60 8 Q64 8 64 16 Q100 24 100 80 L112 112 L8 112 L20 80 Q20 24 56 16 Q56 8 60 8Z" fill="#0d0d0d"/><circle cx="60" cy="122" r="12" fill="#0d0d0d"/><path d="M30 104 L90 104" stroke="#fff" stroke-width="4"/></svg>`},
 {bg:"gears",k:"沸",fx:()=>R(8,i=>`<i class="st" style="left:${r(3,97)}%;animation-delay:-${r(0,7)}s;animation-duration:${r(5,9)}s"></i>`),
  deco:`<svg class="mDeco gear g1" viewBox="0 0 100 100"><path fill="#0d0d0d" d="${R(12,i=>{const a=i*Math.PI/6,b=a+.2,c=a+.32,d=a+.52;return(i?"L":"M")+(50+40*Math.cos(a))+" "+(50+40*Math.sin(a))+"L"+(50+48*Math.cos(b))+" "+(50+48*Math.sin(b))+"L"+(50+48*Math.cos(c))+" "+(50+48*Math.sin(c))+"L"+(50+40*Math.cos(d))+" "+(50+40*Math.sin(d))})}Z"/><circle cx="50" cy="50" r="14" fill="#e5191c"/></svg><svg class="mDeco gear g2" viewBox="0 0 100 100"><path fill="#0d0d0d" d="${R(10,i=>{const a=i*Math.PI/5,b=a+.25,c=a+.4,d=a+.62;return(i?"L":"M")+(50+38*Math.cos(a))+" "+(50+38*Math.sin(a))+"L"+(50+48*Math.cos(b))+" "+(50+48*Math.sin(b))+"L"+(50+48*Math.cos(c))+" "+(50+48*Math.sin(c))+"L"+(50+38*Math.cos(d))+" "+(50+38*Math.sin(d))})}Z"/><circle cx="50" cy="50" r="12" fill="#fff"/></svg><div class="mDeco pipe"></div>`},
 {bg:"sky",k:"星",fx:()=>R(36,i=>`<i class="tw" style="left:${r(0,100)}%;top:${r(0,100)}%;animation-delay:-${r(0,4)}s"></i>`),
  deco:``}
 ]})();
const LEGI={m:["laugh","butler","snowchick","teacup","starfrog"],E:["swampbear","knight2","icefrog","furnaceegg","imp"]};
const ROWS=9,COLS=7;const actN=()=>ACTS[S.act||0];const curBoss=()=>S.boss||ACTS[S.act||0].boss;const bossAlt=()=>curBoss()!==ACTS[S.act||0].boss;const pickBoss=()=>{const bl=ENCS[S.act||0].bosses.map(x=>x[0]);const last=(M.lastBoss||{})[S.act||0];const fresh=bl.filter(b=>b!==last);const unk=bl.filter(b=>!((M.boss||{})[b]||{}).k);S.boss=asc()>=1&&unk.length&&rnd()<.75?pick(unk):pick(fresh.length&&rnd()<.75?fresh:bl);M.lastBoss=M.lastBoss||{};M.lastBoss[S.act||0]=S.boss;if(S.act===1&&S.flags&&(S.flags.vampTea||S.flags.vampBit))S.boss="count";{const gl=(ENCS[S.act||0].guards||ENCS[S.act||0].bosses.map(x=>x[0])).filter(b=>b!==S.boss);const gu=gl.filter(b=>!((M.boss||{})[b]||{}).k);S.guard=asc()>=1&&gu.length&&rnd()<.75?pick(gu):pick(gl)}};
function genMap(){const g=[...Array(ROWS)].map(()=>Array(COLS).fill(null));const edges=new Set();const starts=[];
 for(let i=0;i<5;i++){let c=ri(COLS);if(i<2)while(starts.includes(c))c=ri(COLS);starts.push(c)}
 for(const s of starts){let c=s;for(let r=0;r<ROWS;r++){g[r][c]=g[r][c]||{r,c,t:null,nx:[],jx:ri(16)-8,jy:ri(16)-8};if(r===ROWS-1)break;
  let o=[c-1,c,c+1].filter(x=>x>=0&&x<COLS&&!(x!==c&&edges.has(`${r},${x},${c}`)));const n=pick(o);if(!g[r][c].nx.includes(n))g[r][c].nx.push(n);edges.add(`${r},${c},${n}`);c=n}}
 for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const n=g[r][c];if(!n)continue;
  const par=r?g[r-1].filter(p=>p&&p.nx.includes(c)):[];
  if(r===0)n.t="m";else if(r===2)n.t="t";else if(r===ROWS-1)n.t="r";else{
   for(let k=0;k<20;k++){const w=[["m",36],["q",27],["E",r>=2?12:0],["r",(r===3||r===6)?14:0],["s",r>=1?12:0],["t",r>=1&&r!==3?8:0]];let tot=w.reduce((a,b)=>a+b[1],0),x=rnd()*tot,t="m";for(const[k2,v]of w){if((x-=v)<0){t=k2;break}}
    if(["E","r","s","t"].includes(t)&&par.some(p=>p.t===t))continue;if(r===ROWS-2&&t==="r")continue;n.t=t;break}
   if(!n.t)n.t="m"}}
 {const G4=g[4].filter(Boolean);if(G4.length){const nx=[...new Set(G4.flatMap(n=>n.nx))];const mc=Math.floor(COLS/2);g[4]=Array(COLS).fill(null);g[4][mc]={r:4,c:mc,t:"K",nx,jx:0,jy:0};g[3].forEach(n=>{if(n)n.nx=[mc]})}}
 {const all=g.flat().filter(Boolean);if(!all.some(n=>n.t==="s")){const c=all.filter(n=>n.r===2||n.r===6);if(c.length)pick(c).t="s"}}
 return g}
function genSky(){const off=ri(4);const fm=S.mod==="full",rn=S.mod==="rain";const bs=[{moon:"full",wx:"rain"},{moon:"wane",wx:"storm"},{moon:"new",wx:"snow"},{moon:"wax",wx:"fog"},{moon:"full",wx:"clear"}][S.act||0];const wxp=S.act===2?["snow","snow","snow","fog","clear","storm"]:S.act===3?["fog","fog","clear","rain","storm"]:WX_POOL;return[...Array(ROWS+1)].map((_,r)=>{const k=r===ROWS?{...bs}:{moon:MOON_CYCLE[(r+off)%4],wx:r===0?(S.act===2?"snow":"clear"):pick(wxp)};if(fm)k.moon="full";if(rn)k.wx="rain";return k})}
const NODE={m:{n:"小怪",ic:"e_v_ms"},E:{n:"精英",ic:"e_v_m4"},q:{n:"事件",e:"q"},r:{n:"休息",e:"fire"},s:{n:"商店",e:"bag"},t:{n:"宝箱",e:"chest"},K:{n:"守关首领",e:"skull"}};
const mx=r=>140+r*Math.round(900/(ROWS-1)),my=c=>172+c*70;
function availNodes(){if(S.atBoss)return[];if(S.row<0)return S.map[0].filter(Boolean);if(S.row===ROWS-1)return"boss";const n=S.map[S.row][S.col];return n.nx.map(c=>S.map[S.row+1][c])}
function openMap(){B=null;show("map");setBg("map");renderTop();playMusic("swing");S.cur=null;saveRun();
 const av=availNodes();const svg=$("#mapSvg");let p="";
 for(const row of S.map)for(const n of row){if(!n)continue;for(const c of n.nx){const m=S.map[n.r+1][c];const done=S.path.some((q,i)=>q[0]===n.r&&q[1]===n.c&&S.path[i+1]&&S.path[i+1][1]===c);const nxt=S.row===n.r&&S.col===n.c;
  p+=`<path class="${done?"done":nxt?"next":""}" d="M${mx(n.r)+n.jx} ${my(n.c)+n.jy} L${mx(m.r)+m.jx} ${my(m.c)+m.jy}"/>`}
  if(n.r===ROWS-1){const done=S.atBoss&&S.col===n.c;p+=`<path class="${S.row===n.r&&S.col===n.c?"next":""}" d="M${mx(n.r)+n.jx} ${my(n.c)+n.jy} L1180 400"/>`}}
 svg.innerHTML=p;let h="";
 for(const row of S.map)for(const n of row){if(!n)continue;const T=NODE[n.t];if((n.t==="m"||n.t==="E")&&!n.grp){const P=ENCS[S.act||0];n.grp=[...(n.t==="E"?pick(P.elite):n.r<((S.act||0)?1:2)?pick(P.easy):pick(P.normal))]}const gi=n.grp&&ENEMY[n.grp[0]]?ENEMY[n.grp[0]].img:null;const isAv=Array.isArray(av)&&av.includes(n);const vis=S.path.some(q=>q[0]===n.r&&q[1]===n.c);const past=!isAv&&n.r<=S.row&&!vis;
  h+=`<div class="mn t-${n.t} ${isAv?"av":""} ${vis?"visited":""} ${past?"past":""} ${S.row===n.r&&S.col===n.c?"cur":""}" data-r="${n.r}" data-c="${n.c}" style="left:${mx(n.r)+n.jx}px;top:${my(n.c)+n.jy}px">${n.t==="K"&&S.guard&&ENEMY[S.guard]?`<img class="sil" src="${IMG(ENEMY[S.guard].img)}"><b>？？？</b>`:gi?`<img src="${IMG(gi)}">`:T.ic?`<img src="${IMG(T.ic)}">`:ICON[T.e]}</div>`}
 h+=`<div class="mn boss ${av==="boss"?"av":""}" id="bossNode" style="left:1180px;top:400px"><img class="sil" src="${IMG(ENEMY[curBoss()].img)}"><b>？？？</b></div>`;
 for(let r=0;r<=ROWS;r++){const k=S.sky[r];h+=`<div class="skyCol ${r===S.row+1?"nx":""}" data-r="${r}" style="left:${r===ROWS?1180:mx(r)}px">${moonSVG(k.moon)}${WXICON[k.wx]}</div>`}
 h+=`<div class="mapHead"><span class="ribbon">第${"一二三四五"[S.act]}层 · ${actN().n}</span><small>${av==="boss"?"首领就在前面":"选择下一个房间"}</small></div><div class="legend">${Object.entries(NODE).map(([k,t])=>{const L=LEGI[k]&&ENEMY[LEGI[k][S.act||0]];const ic=L?L.img:t.ic;return`<span>${ic?`<img src="${IMG(ic)}">`:ICON[t.e]}${t.n}</span>`}).join("")}</div>`;
 $("#mapNodes").innerHTML=h;$("#map").style.setProperty("--hero",`url(${IMG(HI())})`);
 $$(".mn.av").forEach(e=>e.onclick=()=>{sfx("click");if(e.id==="bossNode"){S.atBoss=true;enterNode("B")}else{const r=+e.dataset.r,c=+e.dataset.c;S.row=r;S.col=c;S.path.push([r,c]);S.pendGrp=S.map[r][c].grp||null;enterNode(S.map[r][c].t)}});
 $$(".skyCol").forEach(e=>e.onclick=()=>{const k=S.sky[+e.dataset.r];tipAt(e,`<b>${MOON[k.moon].n} · ${WX[k.wx].n}</b><p>${MOON[k.moon].d}</p><p>${WX[k.wx].d}</p>`)});
 $("#mapTip").textContent=S.row<0?"往右爬，过守关首领，打最终首领。":"点顶上的月亮可以查看那一层的月相和天气。"}

/* ===================== 进入房间 ===================== */
function enterNode(t,resumed,cur){S.cur=cur||{t,rs:S.rs};if(resumed&&cur){S.rs=cur.rs;if(cur.snap){S.hp=cur.snap.hp;S.gold=cur.snap.gold;S.pots=[...cur.snap.pots];S.uid=cur.snap.uid}}saveRun();
 if(t==="m")startCombat("m");else if(t==="E")startCombat("E");else if(t==="B")bossIntro();else if(t==="K")guardIntro();else if(t==="F")startCombat("F");else if(t==="r")restSite();else if(t==="s")shopScreen();else if(t==="t")treasure();else if(t==="q"){const r=rnd();if(r<.1)startCombat("m");else if(r<.2)shopScreen("caravan");else eventScreen()}}
const OLDS={king:"boss0",snakeking:"boss0b",count:"boss1",buddha:"boss1b",iceking:"boss2",snowking:"boss2b",lavagiant:"boss3",pearlqueen:"boss3b",shadow:"boss4",cosmicegg:"boss4b"},OLDW={king:"win0",snakeking:"win0b",count:"win1",buddha:"win1b",iceking:"win2",snowking:"win2b",lavagiant:"win3",pearlqueen:"win3b"};
function bossLines(id,w){return(w?STORY["bw_"+id]||STORY[OLDW[id]]:STORY["bs_"+id]||STORY[OLDS[id]])||[]}
async function guardIntro(){if(!S.guard){const gl=(ENCS[S.act||0].guards||ENCS[S.act||0].bosses.map(x=>x[0])).filter(b=>b!==S.boss);S.guard=pick(gl);saveRun()}const gid=S.guard;setBg(battleBg("B"));show("battle");$("#hand").innerHTML="";$("#enemies").innerHTML="";playMusic("boss");banner("守关首领",1);await sleep(600);const L=bossLines(gid);if(L.length)await talk(L);const Lr=BOSS_LORE[gid]||{};toast(`守关首领 <b>${ENEMY[gid].n}</b>　<b>${Lr.t||""}</b>：${Lr.td||""}`);startCombat("K")}
async function bossIntro(){setBg(battleBg("B"));show("battle");$("#hand").innerHTML="";$("#enemies").innerHTML="";playMusic("final");const bid=curBoss(),L0=STORY["bs_"+bid]||STORY["boss"+S.act+(bossAlt()?"b":"")];const met=(M.boss||{})[bid];const extra=met&&met.k?[[L0[0][0],ENEMY[bid].n,pick(["又是你。上次你也是这么说的。","我们见过吧？你的脸好熟。","你又来了。这次能走多远？","你还记得上次的事吗？我记得。"])]]:[];await talk([...L0,...extra]);toast(`首领特性 <b>${(BOSS_LORE[bid]||{}).t||""}</b>：${(BOSS_LORE[bid]||{}).td||""}`);startCombat("B")}

/* ===================== 战斗 ===================== */
function mkEnemy(id,i){const E=ENEMY[id];let hp=E.hp[0]+ri(E.hp[1]-E.hp[0]+1);if(id==="mimic"||id==="goldfrog")hp+=(S.act||0)*22;if(!S.act&&(S.combats||0)<=2&&!E.boss&&!E.elite)hp=Math.round(hp*.85);hp=Math.round(hp*(1+.12*(S.act||0))*(1+.025*Math.max(0,S.row||0))*(E.elite?1.15:1)*(E.boss?1.32:1));if(asc()>=1)hp=Math.round(hp*1.1);if(asc()>=2&&(E.boss||E.elite))hp=Math.round(hp*1.12);if(S.mod==="fat")hp=Math.round(hp*1.25);if(S.mod==="chain")hp=Math.round(hp*1.1);return{id,n:E.n,hp,max:hp,block:0,str:(S.mod==="full"?1:0)+(asc()>=3?1:0)+[0,1,2,3,6][S.act||0]+((S.row||0)>=ROWS-2&&!E.boss?1:0)+(id==="mimic"?(S.act||0)*2:0),vuln:0,weak:0,mud:0,turn:0,seed:i,k:"e"+(++S.uid),stolen:0}}
function battleBg(kind){const a=S.act||0;if(kind==="F")return"demon";if(kind==="B"||kind==="K")return["boss","boss1","bossice","bossfac","boss2"][a];if(kind==="E")return["elite","gate","bellE","pipes","summit"][a];return actN().bgs[(S.row+3)%3]}
function startCombat(kind){{const bt=$("#battle");bt.classList.toggle("bossFight",kind==="B"||kind==="F"||kind==="K");bt.classList.toggle("finalFight",kind==="B"||kind==="F");if(kind==="B"||kind==="F"||kind==="K")setTimeout(()=>{stageShake();sfx("boom")},700)}if(kind==="m"&&(S.actCombats||0)>=2&&rnd()<(S.mod==="gold"?.2:.07))kind="G";if(S.cur){if(!S.cur.snap)S.cur.snap={hp:S.hp,gold:S.gold,pots:[...S.pots],uid:S.uid};saveRun()}let list;if(kind==="F")list=["demon"];else if(kind==="M")list=["mimic"];else if(kind==="G")list=["goldfrog"];else if(kind==="B")list=[curBoss()];else if(kind==="K")list=[S.guard||curBoss()];else if((kind==="E"||kind==="m")&&S.pendGrp&&S.pendGrp.every(k=>ENEMY[k]))list=S.pendGrp;else if(kind==="E")list=pick(ENCS[S.act].elite);else list=(S.actCombats||0)<(S.act?1:2)?pick(ENCS[S.act].easy):pick(ENCS[S.act].normal);S.pendGrp=null;S.actCombats=(S.actCombats||0)+(kind==="m"?1:0);
 if(kind!=="B")S.combats++;
 B={kind,enemies:list.map(mkEnemy),p:{block:0,energy:0,str:has("star")?1:0,tstr:0,dex:0,vuln:0,weak:0,mud:0,nextAtk:0,borrow:0,retain:0,drawMinus:0,free:0,pw:{}},
  dp:shuffle(S.deck.map(c=>({...c}))),hand:[],disc:[],exh:[],turn:0,combo:0,played:0,fam:{},pool:[],poolCap:7,catchLeft:1+(has("net")?1:0),caught:[],badge:0,extraGold:0,mirror:has("mirror"),over:0,after:[],sel:null,myTurn:false,totalPlayed:0};
 if(kind==="K")B.enemies.forEach(e=>{e.max=e.hp=Math.round(e.max*.7);e.guard=1});
 Object.assign(B,API);{const k=S.sky[S.atBoss?ROWS:Math.max(0,S.row)];B.moon=k.moon;B.wx=k.wx;if(has("moonmirror"))B.moon="full";B.poolCap+=perk("cap");if(has("snakeskin"))B.p.dex+=1;B.p.str+=perk("str");for(let i=0;i<perk("rb")+(has("rbegg")?1:0);i++)B.pool.push({f:"any",ice:0});if(S.mod==="tiny")B.poolCap=5+perk("cap")+(has("pondstone")?1:0);if(S.mod==="pal")B.catchLeft++;if(S.mod==="calm")B.p.block+=5;if(B.moon==="new")B.poolCap--;if(has("snowglobe"))B.wx="snow";if(has("stablekey"))B.p.horseFree=1;if(has("eggbasket")){B.pool.push({f:"chick",ice:0});B.p.block+=5};if(has("pondstone"))B.poolCap++}
 setBg(battleBg(kind),B.moon);renderSky();show("battle");renderTop();if(kind==="F"||kind==="B")playMusic("final");else if(kind==="K")playMusic("boss");else playMusic(kind==="E"?"elite":"battle");
 {const f=S.flags,E0=B.enemies[0];
  if(f.pupFriend&&!f.pupPaid&&S.act>=2&&(kind==="m"||kind==="E")){f.pupPaid=1;B.dogPack=2;ach("puppy");B.introTalk=[["dg","小奶狗","汪汪！是你！上次的恩情，我带朋友们来还了！"],["n1","功夫奶蛙","是那只小奶狗！还带来了一整群！"]]}
  if(kind==="B"&&E0.id==="count"&&f.vampTea){ach("teatime");E0.waitTurns=3;B.introTalk=[["vp","月夜伯爵","咦？你是，上次请我喝奶茶的那个小家伙？"],["vp","月夜伯爵","我这个人恩怨分明。先让你三回合，我把这杯茶喝完。"]]}
  else if(kind==="B"&&E0.id==="count"&&f.vampBit){E0.str+=2;B.introTalk=[["vp","月夜伯爵","你的血，我还记得那个味道。"],["vp","月夜伯爵","这一次，我要喝个够。（力气 +2）"]]}
  if(kind==="B"&&S.act===ACTS.length-1&&f.snowFriend){ach("snowhelp");B.introTalk=(B.introTalk||[]).concat([["egl","雪人","（从星星中间滚了过来）上次你扶我站起来，这次换我来挡一下！"]]);B.introFx=()=>{B.block(25,1)}}
  if(kind==="F"&&f.kingFriend){ach("mudcannon");B.introTalk=[["xsk","沼泽之王","呱！"+HN()+"，我来还人情了！看我的泥巴大炮！"]];B.introFx=()=>{B.apply(E0,"mud",12);B.apply(E0,"weak",2);sfx("mud")}}}
 if(kind==="E"){const af=pick(Object.keys(AFFIX));if((asc()>=6||rnd()<.7+.075*(S.act||0)))B.enemies.forEach(e=>applyAffix(e,af));if(kind==="E"&&has("eyepatch"))B.enemies.forEach(e=>e.vuln=(e.vuln||0)+2)}
 if(!has("snowglobe")&&S.mod!=="calm"&&kind!=="F"&&rnd()<.3)B.wxShift={turn:2+ri(2),to:pick(Object.keys(WX).filter(w=>w!==B.wx))};
 if(kind==="G")B.introTalk=[["n1","功夫奶蛙","那、那是，金色的奶蛙？！"],["n1","功夫奶蛙","传说三回合内打倒它，就能拿到一大笔金币！"]];
 B.enemies.forEach(e=>e.intent=e.waitTurns>0?{k:"wait"}:ENEMY[e.id].ai(e,0));
 renderBattle(true);
 if(has("feather"))B.block(8,1);
 setTimeout(async()=>{if(!B)return;if(!M.tut){M.tut=1;saveMeta();await tutorial()}if(!B)return;if(B.introTalk){await talk(B.introTalk);B.introTalk=null}if(B.introFx)B.introFx();if(rnd()<.3)heroSay(pick(HERO_LINE.start));startTurn()},300)}
function tutorial(){return new Promise(res=>{ov(`<div class="modal" style="max-width:820px;text-align:left"><h3 style="text-align:center">奶蛙池怎么玩</h3><p>1. 打出的每张家族牌，都会往上方的<b>奶蛙池</b>里放一只奶蛙，它会自动排到同家族旁边。</p><p>2. <b>3 只相邻的同家族</b>就会消除：这张牌效果翻倍，再触发一次<b>家族爆发</b>。</p><p>3. 消除后后面的奶蛙会往前补位，补位又凑成 3 只就继续消，这就是<b>连锁</b>。每多一环，爆发翻一倍，还多给 1 点奶力。</p><p>4. 敌人会往池里<b>丢泥巴</b>把你的奶蛙隔开、<b>冻住</b>奶蛙、甚至<b>吸走</b>奶蛙。泥巴凑够 3 块也会消掉，常常能顺势连锁。池子满 7 格会溢出受伤。</p><p>5. 敌人血量低于 35% 时可以<b>抓</b>回去当伙伴卡；每层的<b>月相天气</b>在左上角；集齐 3 张同名牌会合成<b>金卡</b>。</p><div class="row"><button class="btn" id="tutOk">开打！</button></div></div>`);$("#tutOk").onclick=()=>{closeOv();res()}})}
function relicPulse(id){const e=$(`#top .rl[data-rl="${id}"]`);if(e){e.classList.remove("pulse");void e.offsetWidth;e.classList.add("pulse")}}
async function startTurn(){if(B.over)return;B.turn++;B.combo=0;B.hitStreak=0;B.palTurn=0;B.played=0;B.fam={};B.wayUsed=0;B.myTurn=true;const p=B.p;
 B.horseN=0;B.fogUsed=0;B.chainsTurn=0;B.comboUsed=0;{let th=0;B.pool.forEach(x=>{if(x.ice){x.ice--;if(!x.ice)th++}});if(th){toast(`池里有 ${th} 只奶蛙解冻了`);B.poolResolve()}}p.noOverflow=0;if(!p.retain&&!p.pw.iron)p.block=(B.wx==="snow"||S.hero==="knight")?Math.floor(p.block/2):0;if(B.turn===1&&S.hero==="naiwa")p.block+=6;if(B.turn===1&&S.hero==="knight")p.block+=8;B.knAtk=0;if(B.turn===1&&has("spikeshell")){p.block+=8;relicPulse("spikeshell")}if(B.turn===1){if(has("ironpot"))p.str=(p.str||0)+1;if(has("frogcharm")){B.poolInsert("frog");B.poolInsert("frog");B.poolResolve()}}if(has("bigspoon")&&!p.block)p.block+=4;if(has("snowglobe"))B.pool.forEach(x=>x.ice=0);if(has("darkmirror")){S.hp=Math.max(1,S.hp-1);p.tstr=(p.tstr||0)+2}B.horseRope=0;B.catBell=0;B.played5=0;{const W=p.pw2||{};if(W.shield)B.block(W.shield);if(W.tstr)p.tstr=(p.tstr||0)+W.tstr;if(W.heal)B.heal(W.heal);if(W.frogwall){for(let i=0;i<W.frogwall;i++)B.poolInsert("frog");B.poolResolve();B.poolOverflow()}if(W.vuln){const al=B.alive();if(al.length)B.apply(pick(al),"vuln",W.vuln)}};p.retain=0;
 banner("你的回合");sfx("turn");
 if(B.wxShift&&B.turn===B.wxShift.turn){weatherShift();await sleep(600);if(!B||B.over)return}
 if(p.mud>0){dmgPlayer(p.mud*(B.wx==="rain"?2:1),null,true);p.mud--;sfx("mud");if(S.hp<=0)return lose()}
 if(p.burn>0){const bd=p.burn*(B.wx==="rain"?1:1);dmgPlayer(bd,null,true);toast(`烫伤发作，受到 <b>${bd}</b> 伤害`);p.burn--;sfx("hit");if(S.hp<=0)return lose()}
 p.energy=3+(B.turn===1?perk("en"):0)+(p.nextEnergy||0)+(p.pw.galaxy||0)+(B.turn===1&&has("lantern")?1:0)+(B.turn===1&&has("warhorn")?1:0)+(has("moon")&&B.turn%3===0?1:0);if(B.turn%3===0&&has("moon"))relicPulse("moon");
 let n=5+(B.turn===1?perk("dr"):0)-p.drawMinus+(p.nextDraw||0)+(p.pw.galaxy||0)+(B.turn===1&&has("sand")?2:0)+(B.turn===1&&S.hero==="kungfu"?2:0)+((p.pw2||{}).draw||0)+(B.turn===1&&has("littlecrown")?2:0);p.drawMinus=0;p.nextEnergy=0;p.nextDraw=0;
 if(p.nextBlock){B.block(p.nextBlock,1);p.nextBlock=0}
 if(p.pw.rooster)B.block(p.pw.rooster,1);
 if(B.wx==="storm"){const al=[null,...B.alive()],t=pick(al);setTimeout(()=>{if(!B||B.over)return;lightning();if(t){dealEnemy(t,5);renderBattle();if(!B.alive().length)win()}else{dmgPlayer(5,null,true);if(S.hp<=0)lose()}},700)}
 if(p.pw.nine&&S.hp<S.max)B.heal(p.pw.nine);
 if(p.pw.stampede){const v=p.pw.stampede;setTimeout(()=>{B.alive().forEach(e=>B.hit(e,v,1,1));afterAction()},500)}
 if(B.dogPack>0){B.dogPack--;setTimeout(()=>{if(!B||B.over)return;toast("奶狗群冲了上来！");say($("#player .body"),"汪汪汪！","hero");B.alive().forEach(e=>B.hit(e,8,1,1));sfx("bighit");afterAction()},800)}
 if(B.turn===1&&has("pup")){const t=pick(B.alive());if(t){relicPulse("pup");setTimeout(()=>{if(!B||B.over)return;B.hit(t,6,1,1);afterAction()},600)}}
 await sleep(350);if(!B||B.over)return;B.draw(n);
 if(p.pw.stallion)p.horseFree=1;
 if(p.pw.dawn)B.alive().forEach(e=>B.apply(e,"weak",1));
 if(has("belltoken")&&B.turn%3===0){relicPulse("belltoken");B.alive().forEach(e=>B.apply(e,"weak",2))}
 if(p.pw.owl)B.draw(p.pw.owl);
 if(B.wx==="wind"&&B.pool.length>1){await sleep(300);if(!B||B.over)return;toast("一阵大风把池子吹乱了！");B.poolShuffle()}
 busy=false;renderBattle();$("#endBtn").classList.remove("wait")}
function lightning(){const d=document.createElement("div");d.className="flash";$("#fx").appendChild(d);setTimeout(()=>d.remove(),600);sfx("bighit");stageShake()}
function banner(t,en){const b=$("#turnBan");b.innerHTML=`<span>${t}</span>`;b.className="";void b.offsetWidth;b.className="on"+(en?" en":"")}
function hint(t){const h=$("#hint");if(t){h.textContent=t;h.classList.add("on")}else h.classList.remove("on")}

/* ---- 战斗渲染 ---- */
function intentHTML(e){const I=e.intent;if(!I||e.hp<=0)return"";const ph=I.pool?`<span class="pIc">${{junk:ICON.mud,freeze:WXICON.snow,suck:ICON.grab,shuffle:WXICON.wind,eat:ICON.boom,boil:WXICON.storm}[I.pool.t]}</span>`:"";return intentHTML0(e,I).replace(/<\/div>$/,ph+"</div>")}
function intentHTML0(e,I){const dmg=v=>{if(B.wx==="fog"||e.fogged)return"?";let d=v+e.str;if(e.weak>0)d*=.75;if(B.p.vuln>0)d*=1.5;return Math.max(0,Math.floor(d))};
 const ic=k=>ICON[k],x=I.x?`<small>×${I.x}</small>`:"";
 switch(I.k){case"stun":return`<div class="intent">${ic("swirl")}<small>晕了</small></div>`;case"charge":return`<div class="intent chg">${ic("up")}<small>蓄力！</small></div>`;case"atk":return`<div class="intent atk ${I.ult?"ult":""}${I.pierce?" prc":""}">${ic("sword")}${dmg(I.v)}${x}${I.s?ic("swirl"):""}${I.ult?`<small class="ultN">${I.ult}</small>`:I.pierce?`<small class="ultN">破防</small>`:""}</div>`;
 case"def":return`<div class="intent">${ic("shield")}${I.v}${I.s2?ic("up"):""}</div>`;
 case"buff":return`<div class="intent">${ic("up")}<small>蓄力</small></div>`;
 case"debuff":return`<div class="intent">${ic("swirl")}<small>${STAT[I.s].n}</small></div>`;
 case"add":return`<div class="intent">${ic("mud")}<small>扔泥巴</small></div>`;
 case"atkdef":return`<div class="intent atk">${ic("sword")}${dmg(I.v)}${ic("shield")}</div>`;
 case"steal":return`<div class="intent atk">${ic("grab")}${dmg(I.v)}<small>偷钱</small></div>`;
 case"flee":return`<div class="intent">${ic("wind")}<small>想跑</small></div>`;
 case"wait":return`<div class="intent">${ic("heart")}<small>喝奶茶中</small></div>`;case"call":return`<div class="intent">${ic("up")}<small>倒茶</small></div>`;
 case"atkcnt":return`<div class="intent atk">${ic("sword")}${dmg(I.v)}${ic("bomb")}${I.c}</div>`;
 case"boom":return`<div class="intent boom">${ic("boom")}${dmg(I.v)}<small>自爆</small></div>`}return""}
function intentTip(e){const I=e.intent||{};const E=ENEMY[e.id];const extra=(I.pool?" "+{junk:"，还会往你的池子丢泥巴",freeze:"，还会冻住你池里的奶蛙",suck:"，还会吸走你池里的奶蛙",shuffle:"，还会搅乱你的池子",eat:"，还会一口吞掉你整个池子",boil:"，还会把你池里的奶蛙煮成泥巴"}[I.pool.t]:"")+(E.pd?"<br>特性："+E.pd:"")+(E.boss&&BOSS_LORE[e.id]?`<br><b>${BOSS_LORE[e.id].t}</b>：${BOSS_LORE[e.id].td}`:"");return intentTip0(I)+extra+(e.af?`<br>词缀：<b>${AFFIX[e.af].n}</b>${AFFIX[e.af].d}`:"")}
function intentTip0(I){const m={wait:"在喝奶茶，这回合不会攻击",stun:"晕过去了，这回合不会行动",charge:"正在蓄力！下回合会放出大招，提前准备好护盾",call:"准备倒出一只新的奶茶杯（场上最多 4 个敌人）",atk:"准备攻击",def:"准备防御",buff:"准备变强",debuff:"准备给你上负面状态",add:"准备往你的弃牌堆扔泥巴块",atkdef:"攻击并防御",steal:"攻击并偷走金币",flee:"准备带着金币逃跑",atkcnt:"攻击，倒计时结束会自爆",boom:"要自爆了！"};return m[I.k]||""}
function stsHTML(o){const a=[];if(o.str)a.push(["str",o.str]);if(o.tstr)a.push(["str",o.tstr,"本回合"]);if(o.dex)a.push(["dex",o.dex]);["vuln","weak","mud","burn","thorn","mirror"].forEach(k=>o[k]&&a.push([k,o[k]]));
 return a.map(([k,v,x])=>`<span class="st" style="--sc:${STAT[k].c}">${STAT[k].n}${v}</span>`).join("")+(o.pw?Object.keys(o.pw).map(k=>`<span class="st" style="--sc:#c8901e">${{calm:"定心",way:"修行之道",zone:"心流",noself:"三连只需2",reso:"蛙鸣共振",stallion:"千里马",dawn:"金鸡报晓",rebirth:"凤凰涅槃",owl:"夜猫子",momentum:"一鼓作气",ninering:"九连环",rhythm:"节奏感",stampede:"万马奔腾",iron:"铁公鸡",nine:"九命",galaxy:"银河猫"}[k]}</span>`).join(""):"")}
function hpHTML(hp,max,blk){return`<div class="blkB ${blk?"on":""}">${ICON.shield}<b>${blk||""}</b></div><div class="hpbar ${blk?"blk":""}"><u style="width:${hp/max*100}%"></u><i style="width:${hp/max*100}%"></i><span>${hp}/${max}</span></div>`}
function renderBattle(first){if(!B)return;const p=B.p;
 const pl=$("#player");if(first||!pl.firstChild)pl.innerHTML=`<div class="body"><i class="plat"></i><img src="${IMG(HI())}"></div><div class="hpw"></div><div class="sts"></div>`;
 pl.className="fighter";pl.querySelector(".hpw").innerHTML=hpHTML(S.hp,S.max,p.block);pl.querySelector(".sts").innerHTML=stsHTML(p);
 const en=$("#enemies");if(first)en.innerHTML="";
 B.enemies.forEach(e=>{let el=en.querySelector(`[data-k="${e.k}"]`);const E=ENEMY[e.id];
  if(!el){el=document.createElement("div");el.className="en fighter"+(E.boss?" bossEn"+(e.guard?" guardEn":" finalEn"):"");el.dataset.k=e.k;el.style.position="relative";el.innerHTML=`<div class="itw"></div><div class="body"><i class="plat ${E.boss||E.elite?"stone":""}"></i><img src="${IMG(E.img)}" style="width:${Math.round(E.h*(e.big?1.15:1)*(E.boss?(e.guard?Math.min(1.2,320/E.h):Math.min(1.5,398/E.h)):1))}px;height:${Math.round(E.h*(e.big?1.15:1)*(E.boss?(e.guard?Math.min(1.2,320/E.h):Math.min(1.5,398/E.h)):1))}px"></div><div class="hpw"></div><div class="ename">${e.n}</div>${E.boss&&BOSS_LORE[e.id]?`<div class="btrait">${BOSS_LORE[e.id].t}</div>`:""}<div class="sts"></div>`;{const idx=B.enemies.indexOf(e);en.insertBefore(el,en.children[idx]||null)}
   el.onclick=()=>clickEnemy(e);const cb=document.createElement("button");cb.className="catchBtn";cb.innerHTML=`${ICON.net}<span>抓</span>`;cb.onclick=ev=>{ev.stopPropagation();catchEnemy(e)};el.querySelector(".body").appendChild(cb)}
  el.classList.toggle("canCatch",canCatch(e));el.classList.toggle("hasAf",!!e.af);el.classList.toggle("goldf",e.id==="goldfrog");
  if(e.hp<=0&&!el.classList.contains("dead"))el.classList.add(e.fled?"fled":"dead");
  el.querySelector(".itw").innerHTML=intentHTML(e);el.querySelector(".hpw").innerHTML=hpHTML(e.hp,e.max,e.block);el.querySelector(".sts").innerHTML=stsHTML(e)+(e.id==="cosmicegg"?`<span class="eCnt">孵化 ${e.cnt==null?6:e.cnt}</span>`:"")+(e.id==="boilerdragon"?`<span class="eCnt">热度 ${e.heat||0}/3</span>`:"")+(e.fogged?`<span class="eCnt">雾中</span>`:"")+(e.id==="rockfrog"?`<span class="eCnt">岩甲 ${e.armor==null?6:e.armor}</span>`:"")+(e.id==="fallen"&&e.mode?`<span class="eCnt">${e.mode==="holy"?"圣光":"魔焰"}</span>`:"")+(e.id==="fourhead"?`<span class="eCnt">醒着 ${Math.max(1,Math.ceil(e.hp/e.max*4))} 个头</span>`:"");
  el.classList.toggle("tg",!!B.sel&&e.hp>0&&(B.sel.pot!=null||CARDS[(B.hand.find(c=>c.k===B.sel.k)||{id:"strike"}).id].tgt))});
 const eb=$("#energy");eb.innerHTML=`<i class="liq" style="height:${Math.min(1,p.energy/3)*100}%"></i><b>${p.energy}<small>/3</small></b>`;
 $("#drawPile b").textContent=B.dp.length;$("#discPile b").textContent=B.disc.length;$("#exhPile b").textContent=B.exh.length;$("#exhPile").style.display=B.exh.length?"":"none";
 renderFam();renderHand();
 const playable=B.hand.some(c=>{const v=curCost(c);return v>=0&&v<=p.energy&&CARDS[c.id].cost!==-2});$("#endBtn").classList.toggle("nudge",B.myTurn&&!playable)}
function renderFam(){renderPool();renderSky()}
function renderFamOld(){const need=B.p.pw.noself?2:3;const h=["frog","horse","chick","cat"].filter(f=>B.fam[f]||B.hand.some(c=>CARDS[c.id].fam===f)).map(f=>{const n=B.fam[f]||0;return`<span style="--fc:${FAM[f].c}" class="${n===need-1?"hot":""}">${FAM[f].n}<i>${[...Array(need)].map((_,i)=>`<u class="${i<n?"on":""}"></u>`).join("")}</i></span>`}).join("");$("#famBar").innerHTML=h}
function willTri(c){const D=CARDS[c.id];if(D.fam==="none"||D.cost===-2||D.type==="cur"||D.type==="sts")return false;const save=B.pool.map(x=>({...x}));B.poolInsert(D.fam);const r=findRun(B.pool,B.poolNeed());B.pool=save;return!!r&&r.f===D.fam}
const TOKEN={frog:"i5",horse:"hr",chick:"ck",cat:"ct",pal:"dg",mud:"pp",any:"hrr"};
function renderPool(){if(B&&B.pool){if(B.pool.filter(x=>x.f==="mud").length>=5)ach("mudbath");if(B.pool.filter(x=>x.ice).length>=4)ach("frozen4")}const el=$("#pool");if(!B){el.innerHTML="";return}const need=B.poolNeed(),P=B.pool;const hot=new Set();
 for(let i=0;i<P.length;){let j=i;while(j<P.length&&P[j].f===P[i].f&&!P[j].ice)j++;if(j===i){i++;continue}if(j-i===need-1&&P[i].f!=="mud")for(let k=i;k<j;k++)hot.add(k);i=j}
 let h=`<b class="plbl">奶蛙池<small>${P.length}/${B.poolCap}</small></b><div class="slots">`;
 for(let i=0;i<B.poolCap;i++){const t=P[i];h+=t?`<span class="tok ${hot.has(i)?"hot":""} ${t.f==="mud"?"mudt":""} ${t.f==="any"?"anyt":""} ${t.ice?"ice":""}" style="--fc:${(FAM[t.f]||{c:"#fff"}).c}"><img src="${IMG(TOKEN[t.f])}">${t.ice?`<i>${t.ice}</i>`:""}</span>`:`<span class="tok empty ${i>=B.poolCap-1&&P.length>=B.poolCap-1?"warn":""}"></span>`}
 el.innerHTML=h+`</div><span class="prule">${need} 只相邻就消除</span>`;el.classList.toggle("danger",P.length>=B.poolCap-1)}
function renderSky(){if(!B)return;$("#skyBar").innerHTML=`<button class="skyPill" data-k="m">${moonSVG(B.moon)}<span>${MOON[B.moon].n}</span></button><button class="skyPill" data-k="w">${WXICON[B.wx]}<span>${WX[B.wx].n}</span></button>`;
 $$("#skyBar .skyPill").forEach(b=>b.onclick=ev=>{ev.stopPropagation();const m=b.dataset.k==="m";tipAt(b,m?`<b>${MOON[B.moon].n}</b><p>${MOON[B.moon].d}</p>`:`<b>${WX[B.wx].n}</b><p>${WX[B.wx].d}</p>`)});
 const w=$("#wxfx");w.className="wx-"+B.wx}
function layoutHand(){const cards=$$("#hand .card");const n=cards.length;if(!n)return;const W=150,span=Math.min(760,n*124),step=n>1?Math.min(124,(span-W)/(n-1)+0):0,x0=640-((n-1)*step)/2-W/2;
 $("#battle").classList.toggle("aim",!!B.sel);
 cards.forEach((el,i)=>{const mid=(n-1)/2,off=i-mid;const sel=B.sel&&el.dataset.k==B.sel.k;const rot=sel?0:off*3.2,y=sel?-96:Math.abs(off)*off*0+Math.pow(Math.abs(off),1.6)*5-6,sc=sel?1.25:1;
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
 const el=$(`.en[data-k="${e.k}"]`);tipAt(el.querySelector(".body"),`<b>${e.n}</b><p>${intentTip(e)}</p>${["str","vuln","weak","mud","burn"].filter(k=>e[k]).map(k=>`<p>${STAT[k].n} ${e[k]}：${STAT[k].d}</p>`).join("")}`)}
function shakeEl(el){el.animate([{transform:"translateX(0)"},{transform:"translateX(-8px)"},{transform:"translateX(8px)"},{transform:"translateX(0)"}],{duration:260})}
function stageShake(){const s=$("#stage");s.classList.remove("shake");void s.offsetWidth;s.classList.add("shake")}

/* ---- 特效 ---- */
function fnum(x,y,t,cls="",delay=0){setTimeout(()=>{const d=document.createElement("div");d.className="fnum "+cls;d.textContent=t;d.style.left=x+"px";d.style.top=y+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),950)},delay)}
function fxAt(el,cls,delay=0,html=""){if(!el)return;setTimeout(()=>{const c=center(el);const d=document.createElement("div");d.className=cls;d.innerHTML=html;d.style.left=c.x+"px";d.style.top=c.y+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),900)},delay)}
function sparks(x,y,col,n=14){for(let i=0;i<n;i++){const d=document.createElement("i");d.className="spark";const a=Math.random()*Math.PI*2,r=60+Math.random()*90;d.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r}px;--c:${col}`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),850)}}
function hitFx(x,y,big,blocked,fam){const F=$("#fx");
 if(B&&B.curType){B.hitStreak=(B.hitStreak||0)+1;if(B.hitStreak>=2){let cb=$("#comboCt");if(!cb){cb=document.createElement("div");cb.id="comboCt";F.appendChild(cb)}cb.innerHTML=`<b>${B.hitStreak}</b><small>连击</small>`;cb.style.setProperty("--k",Math.min(1.6,1+B.hitStreak*.06));cb.classList.remove("pop");void cb.offsetWidth;cb.classList.add("pop");clearTimeout(cb._t);cb._t=setTimeout(()=>cb.remove(),1400)}}
 {const o=document.createElement("div");o.className="ono"+(big?" big":"")+(blocked?" blk":"");o.textContent=blocked?pick(["叮！","铛！"]):big?pick(["砰！！","轰！！","嘭！！"]):pick(["啪！","咚！","嘿！","哒！"]);o.style.cssText=`left:${x+(Math.random()*80-40)}px;top:${y-70-Math.random()*30}px;--r:${Math.random()*24-12}deg`;F.appendChild(o);setTimeout(()=>o.remove(),620)}
 if(big&&!blocked){const fl=document.createElement("div");fl.className="flashW";F.appendChild(fl);setTimeout(()=>fl.remove(),220);const ar=$("#arena");if(ar){ar.classList.remove("punch");void ar.offsetWidth;ar.classList.add("punch")}}const add=(cls,html,st,ms)=>{const d=document.createElement("div");d.className=cls;d.innerHTML=html||"";d.style.cssText=`left:${x}px;top:${y}px;${st||""}`;F.appendChild(d);setTimeout(()=>d.remove(),ms)};
 const rot=-40+Math.random()*30;const col=blocked?"#8fd4ff":big?"#ffd23f":"#fff6d8";
 add("slash2",`<svg viewBox="0 0 300 80" width="${big?340:270}" height="80"><path d="M6 64 Q150 -14 294 22" fill="none" stroke="#2a1a33" stroke-width="22" stroke-linecap="round"/><path d="M6 64 Q150 -14 294 22" fill="none" stroke="${col}" stroke-width="13" stroke-linecap="round"/><path d="M40 52 Q150 0 260 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,`--r:${rot}deg`,320);
 add("burst"+(big?" big":""),`<svg viewBox="-50 -50 100 100" width="${big?190:130}" height="${big?190:130}"><path d="M0 -46 L10 -14 L44 -18 L16 2 L34 34 L0 16 L-34 34 L-16 2 L-44 -18 L-10 -14 Z" fill="${col}" stroke="#2a1a33" stroke-width="5" stroke-linejoin="round"/><circle r="11" fill="#fff"/></svg>`,"",340);
 const n=big?10:6;for(let k=0;k<n;k++){const ang=Math.random()*Math.PI*2,dist=(big?110:70)+Math.random()*50;add("shard",`<i style="background:${k%3?col:"#fff"}"></i>`,`--dx:${Math.cos(ang)*dist}px;--dy:${Math.sin(ang)*dist-20}px;--s:${.6+Math.random()*.8}`,520)}
 if(big){add("ring","","",420)}
 if(blocked)return;
 if(fam==="cat")add("claw",`<svg viewBox="0 0 160 160" width="170" height="170">${[0,1,2].map(k=>`<path d="M${30+k*34} 20 Q${50+k*34} 80 ${40+k*34} 145" fill="none" stroke="#2a1a33" stroke-width="15" stroke-linecap="round"/><path d="M${30+k*34} 20 Q${50+k*34} 80 ${40+k*34} 145" fill="none" stroke="#ff8fb1" stroke-width="8" stroke-linecap="round"/>`).join("")}</svg>`,"",420);
 if(fam==="chick")for(let k=0;k<6;k++)add("fth",`<i></i>`,`--dx:${Math.random()*160-80}px;--dy:${40+Math.random()*80}px;--r:${Math.random()*360}deg;animation-delay:${k*30}ms`,900);
 if(fam==="horse")for(let k=0;k<5;k++)add("dust",`<i></i>`,`--dx:${(k-2)*40}px;--s:${.7+Math.random()*.7}`,620);
 if(fam==="frog")for(let k=0;k<7;k++){const a=-Math.PI/2+(Math.random()-.5)*2.2;add("drop",`<i></i>`,`--dx:${Math.cos(a)*90}px;--dy:${Math.sin(a)*90}px`,600)}
 if(fam==="pal")add("star5",`<svg viewBox="-50 -50 100 100" width="120" height="120"><path d="M0 -44 L12 -14 L44 -12 L18 8 L28 40 L0 22 L-28 40 L-18 8 L-44 -12 L-12 -14 Z" fill="#b392ff" stroke="#2a1a33" stroke-width="5"/></svg>`,"",500)}
function anim(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),500)}
const enEl=e=>$(`.en[data-k="${e.k}"]`);
function say(el,t,cls){if(!el||!t)return;const c=center(el);const d=document.createElement("div");d.className="bubble "+(cls||"");d.textContent=t;let x=c.x-40;x=Math.max(10,Math.min(1280-d.textContent.length*21-40,x));d.style.left=x+"px";d.style.top=Math.max(70,c.top-56)+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),2500)}
function heroSay(t,force){if(!B||!t)return;const now=Date.now();if(!force&&B.lastHeroSay&&now-B.lastHeroSay<1800)return;B.lastHeroSay=now;say($("#player .body"),t,"hero")}
function eLine(e,kind){const L=(ELINE[e.id]||{})[kind];return pick(L&&L.length?L:GLINE[kind])}
function bubble(el,t){const c=center(el);const d=document.createElement("div");d.className="bubble";d.textContent=t;d.style.left=(c.x-40)+"px";d.style.top=Math.max(70,c.top-50)+"px";$("#fx").appendChild(d);setTimeout(()=>d.remove(),2500)}

/* ---- 战斗 API（卡牌效果调用） ---- */
const API={
 alive(){return this.enemies.filter(e=>e.hp>0&&!e.fled)},
 hit(t,base,times=1,raw){if(!t||t.hp<=0)t=this.alive()[0];if(!t)return;if(!raw)base+=this.wxAtk()+(this.shinyPow||0);for(let i=0;i<times;i++){if(t.hp<=0)break;
  let d=base+(raw?0:this.p.str+this.p.tstr+(this.bonus||0));if(!raw&&this.p.weak>0)d*=.75;if(t.vuln>0)d*=1.5;d=Math.max(0,Math.floor(d));dealEnemy(t,d,i)}},
 hitAll(v){this.alive().forEach(e=>this.hit(e,v))},
 block(v,raw){const b=Math.max(0,v+(raw?0:this.p.dex+this.wxBlk()+(this.shinyPow||0)));this.p.block+=b;sfx("block");const el=$("#player .body");fxAt(el,"shieldFx",0,ICON.shield);const c=center(el);fnum(c.x,c.top+40,"+"+b,"blk")},
 draw(n){let last=null;for(let i=0;i<n;i++){if(!this.dp.length){if(!this.disc.length)break;this.dp=shuffle(this.disc);this.disc=[];toast("弃牌堆洗回了抽牌堆")}
  const c=this.dp.pop();if(this.hand.length>=10){this.disc.push(c);toast("手牌满了");continue}last=c;this.hand.push(c);seeCard(c.id);if(c.id==="fret"){this.p.energy=Math.max(0,this.p.energy-1);toast("烦躁，失去 1 点奶力")}}sfx("draw");renderBattle();return last},
 wxAtk(){if(!this.curFam)return 0;return(this.moon==="wax"&&this.curType==="atk"?1:0)+(this.wx==="rain"&&this.curFam==="frog"?2:0)+(this.wx==="wind"&&this.curFam==="horse"?3:0)},
 wxBlk(){if(!this.curFam)return 0;return(this.moon==="wane"?2:0)+(this.wx==="snow"&&this.curFam==="chick"?3:0)},
 poolNeed(){return(this.p.pw.noself||this.moon==="full")?2:3},
 poolCount(f){return this.pool.filter(x=>x.f===f&&!x.ice).length},
 poolInsert(f){const tok={f,ice:0},P=this.pool;
  if(f==="mud"){P.splice(ri(P.length+1),0,tok);return}
  if(f==="any"){for(let i=P.length;i>=0;i--){const t=[...P];t.splice(i,0,tok);if(findRun(t,this.poolNeed())){P.splice(i,0,tok);return}}P.push(tok);return}
  let last=-1;P.forEach((x,i)=>{if((x.f===f||x.f==="any")&&!x.ice)last=i});if(last<0)P.push(tok);else P.splice(last+1,0,tok)},
 poolAdd(f){this.poolInsert(f);const r=this.poolResolve();this.poolOverflow();renderPool();return r},
 poolResolve(){let lv=0,first=null,run;while((run=findRun(this.pool,this.poolNeed()))){lv++;this.pool.splice(run.i,run.n);if(!first)first=run.f;renderPool();this.poolFx(run.f,lv,run.n)}if(lv>=2){chainBanner(lv);heroSay(pick(HERO_LINE.chain[Math.min(lv,6)]),1);this.chainsTurn=(this.chainsTurn||0)+1;if(has("shadowcloak")){relicPulse("shadowcloak");this.alive().forEach(e=>this.hit(e,6,1,1))}if(this.p.pw.momentum){this.p.str+=this.p.pw.momentum;this.fxBuff(this.p)}if(this.p.pw.ninering){this.draw(2*this.p.pw.ninering);this.gainEnergy(this.p.pw.ninering)}if(perk("chain"))this.block(6*perk("chain"),1);if(has("chainbell")){relicPulse("chainbell");this.block(6,1)}}return first},
 poolOverflow(){if(this.pool.length<=this.poolCap)return;const out=this.pool.splice(0,3);
  if(this.p.noOverflow||has("tidecharm"))toast("池子溢出了，但你没有受伤！");else{toast("池子溢出了！受到 <b>6</b> 伤害，最前面的 3 只被挤了出去");dmgPlayer(6,null,true)}
  sfx("hurt");const pl=$("#pool");pl.classList.remove("spill");void pl.offsetWidth;pl.classList.add("spill");this.poolResolve()},
 poolFx(f,lv=1,n=3){const pc=center($("#pool"));sparks(pc.x,pc.y,(FAM[f]||{c:"#fff"}).c,10+lv*6);
  if(f==="mud"){toast("泥巴被清掉了");sfx("mud");if(S.mod==="mud"){this.block(8,1);this.gainEnergy(1)}return}
  S.stats.tri++;this.elims=(this.elims||0)+1;if(has("combo")&&!this.comboUsed){this.comboUsed=1;relicPulse("combo");this.draw(1)}S.stats.chain=Math.max(S.stats.chain||0,lv);if(lv>=4)ach("chain4");if(lv>=6)ach("chain6");if(lv===1)triBanner(f);else sfx("tri");const p=this.p,mul={frog:"frogB",horse:"horseB",chick:"chickB",cat:"catB"}[f],k=lv*(1+.5*(mul?perk(mul):0))*(S.mod==="chain"&&lv>=2?1.5:1);if(has("goldpot")){S.gold+=2;renderTop()}
  if(f==="frog"){const kk=has("frogcrown")?k*2:k;if(p.pw.reso)this.alive().forEach(e=>this.hit(e,p.pw.reso,1,1));for(let i=0;i<Math.round(3*kk);i++){const t=pick(this.alive());if(t)this.hit(t,3,1,1)}}
  else if(f==="horse")this.alive().forEach(e=>this.hit(e,Math.round(5*k),1,1));
  else if(f==="chick")this.block(Math.round(6*k),1);
  else if(f==="cat"){this.heal(Math.round(3*k));this.draw(Math.max(1,Math.floor(k)))}
  else if(f==="pal"){const t=pick(this.alive());if(t)this.hit(t,8*k,1,1)}
  else if(f==="any")this.gainEnergy(1);
  if(lv>=2)this.gainEnergy(1);
  if(p.pw.pond)this.heal(p.pw.pond);if(p.pw.calm)this.block(p.pw.calm,1);if(p.pw.way&&!this.wayUsed){this.wayUsed=1;this.gainEnergy(1)}
  if(this.moon==="new")this.gainEnergy(1);if(S.mod==="tiny")this.gainEnergy(1);
  if(has("badge")&&!this.badge){this.badge=1;relicPulse("badge");this.draw(2)}
  const mir=this.alive().filter(e=>e.mirror>0);mir.forEach(e=>{setTimeout(()=>{if(!B||B.over)return;const el=enEl(e);if(el){anim(el,"lungeL");bubble(el,"你会的，我也会！")}dmgPlayer(e.mirror*lv,null,true);renderBattle();if(S.hp<=0)lose()},300)})},
 poolPop(n){for(let i=0;i<n;i++)this.pool.pop();renderPool()},
 poolClear(){const n=this.pool.length;this.pool=[];renderPool();return n},
 poolConvert(a,b,max=99){let n=0;this.pool.forEach(x=>{if(x.f===a&&n<max){x.f=b;x.ice=0;n++}});this.poolResolve();renderPool()},
 poolForce(){const c={};this.pool.forEach(x=>{if(!x.ice)c[x.f]=(c[x.f]||0)+1});const f=Object.keys(c).sort((a,b)=>c[b]-c[a])[0];if(!f){toast("池子是空的");return}
  this.pool=this.pool.filter(x=>!(x.f===f&&!x.ice));this.poolFx(f==="mud"?"frog":f,1);this.poolResolve();renderPool()},
 poolSort(){const ord=["frog","horse","chick","cat","pal","any","mud"];this.pool.sort((a,b)=>ord.indexOf(a.f)-ord.indexOf(b.f));this.poolResolve();renderPool()},
 poolNudge(){if(this.pool.length>1)this.pool.unshift(this.pool.pop());this.poolResolve();renderPool()},
 poolShuffle(){shuffle(this.pool);this.poolResolve();renderPool()},
 poolThaw(){let n=0;this.pool.forEach(x=>{if(x.ice){x.ice=0;n++}});this.poolResolve();renderPool();return n},
 poolCleanse(){this.pool=this.pool.filter(x=>x.f!=="mud");this.pool.forEach(x=>x.ice=0);this.poolResolve();renderPool()},
 poolEnemy(P,e){const el=enEl(e);
  if(P.t==="junk"){if(has("mudboots"))this.block(4,1);for(let i=0;i<P.n+(S.mod==="mud"&&!e.af?1:0);i++)this.poolInsert("mud");toast(`${e.n}往你的池子里丢了 <b>${P.n} 块泥巴</b>`);sfx("mud");this.poolResolve();this.poolOverflow()}
  else if(P.t==="boil"){const l=shuffle(this.pool.filter(x=>!x.ice&&x.f!=="mud")).slice(0,P.n);l.forEach(x=>x.f="mud");if(l.length){M.boiled=(M.boiled||0)+l.length;if(M.boiled>=10)ach("boiled");toast(`${e.n}把池里的 <b>${l.length} 只</b>奶蛙煮成了泥巴！`);sfx("mud");this.poolResolve()}}
  else if(P.t==="freeze"){const l=shuffle(this.pool.filter(x=>!x.ice&&x.f!=="mud")).slice(0,P.n);l.forEach(x=>x.ice=has("icepick")?1:2);if(l.length)toast(`${e.n}冻住了池里的 <b>${l.length} 只</b>奶蛙（2 回合）`);sfx("debuff")}
  else if(P.t==="suck"){let k=0;for(let i=0;i<P.n&&this.pool.length;i++){const idx=Math.floor(this.pool.length/2);this.pool.splice(idx,1);k++}if(k){e.hp=Math.min(e.max,e.hp+P.h*k);toast(`${e.n}吸走了池里的 <b>${k} 只</b>奶蛙，回复了 ${P.h*k} 生命`);if(el){const c=center(el.querySelector(".body"));fnum(c.x,c.top+20,"+"+P.h*k,"heal")}sfx("heal");this.poolResolve()}}
  else if(P.t==="eat"){const n=this.pool.length;if(n>=3)ach("eaten");this.pool=[];if(n){e.str=(e.str||0)+Math.floor(n/2);e.hp=Math.min(e.max,e.hp+n*3);toast(`${e.n}一口吞掉了你整个池子（${n} 只）！力气 +${Math.floor(n/2)}`);if(el)bubble(el,"嗷呜，好吃！");sfx("boom")}}
 else if(P.t==="shuffle"){shuffle(this.pool);toast(`${e.n}把你的池子搅乱了！`);sfx("debuff");this.poolResolve()}
  renderPool()},
 setWx(w){this.wx=w;renderSky();toast(`天气变成了 <b>${WX[w].n}</b>：${WX[w].d}`)},
 setMoon(m){this.moon=m;this.poolCap=m==="new"?6:7;renderSky();setBg(battleBg(this.kind),m);toast(`月亮变成了 <b>${MOON[m].n}</b>：${MOON[m].d}`);renderPool()},
 drawFam(f){const c=[...this.dp].reverse().find(x=>CARDS[x.id].fam===f);if(c&&this.hand.length<10){this.dp.splice(this.dp.indexOf(c),1);this.hand.push(c);renderBattle()}else this.draw(1)},
 fetchAtk(){const l=this.disc.filter(c=>CARDS[c.id].type==="atk");if(l.length&&this.hand.length<10){const c=pick(l);this.disc.splice(this.disc.indexOf(c),1);this.hand.push(c);toast(`拿回了 <b>${cname(c)}</b>`)}},
 chooseFromDraw(){this.after.push(async()=>{if(!this.dp.length)return;const r=await pickCards([...this.dp],{title:"观星",sub:"选一张放进手里",cancel:false});const c=r[0];if(c&&this.hand.length<10){this.dp.splice(this.dp.indexOf(c),1);this.hand.push(c)}})},
 gainEnergy(n){this.p.energy+=n;anim($("#energy"),"pop");sfx("buff")},
 apply(t,s,v){t[s]=(t[s]||0)+v;const el=t===this.p?$("#player"):enEl(t);if(el){const c=center(el.querySelector(".body"));fnum(c.x,c.top+30,STAT[s].n+"+"+v,"txt")}sfx(s==="str"?"buff":"debuff")},
 heal(v){const h=Math.min(v,S.max-S.hp);S.hp+=h;if(h<=0)return;sfx("heal");const c=center($("#player .body"));fnum(c.x,c.top+20,"+"+h,"heal");renderTop()},
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

function bossGuard(t,d){const id=t.id;
 if(id==="king"){const m=B.pool.filter(x=>x.f==="mud").length;if(m)d=Math.max(0,d-2*m)}
 if(id==="buddha"&&d<=5){fxSay(t,"金身！");return 0}
 if(id==="pearlqueen"&&B.alive().some(x=>x.id==="teacup"))d=Math.ceil(d/2);
 if(id==="fogwhite"&&t.fogged)d=Math.ceil(d/2);
 if(id==="rockfrog"){if(t.armor==null)t.armor=6;if(t.armor>0&&d>0){d=Math.max(0,d-4);t.armor--;if(!t.armor)setTimeout(()=>{const el=enEl(t);if(el)say(el.querySelector(".body"),"石甲全碎了")},200)}}
 if(id==="shadow"&&rnd()<.25){fxSay(t,"闪开了");return 0}
 if(id==="lavagiant"&&B.curType==="atk"&&B.lavaLock!==B.cardSeq){B.lavaLock=B.cardSeq;setTimeout(()=>{if(B&&!B.over){B.apply(B.p,"burn",1)}},150)}
 return d}
function fxSay(t,s){const el=enEl(t);if(el){const c=center(el.querySelector(".body"));fnum(c.x,c.top+20,s,"txt")}}
function bossAfterHit(t,d,loss){const id=t.id;
 if(id==="snakeking"&&t.hp>0){t.shed=(t.shed||0)+loss;if(t.shed>=40){t.shed-=40;t.weak=0;t.vuln=0;t.mud=0;t.burn=0;t.block+=15;setTimeout(()=>{const el=enEl(t);if(el)say(el.querySelector(".body"),"蜕皮");renderBattle()},300)}}
 if(id==="buddha"&&d>=20&&t.hp>0&&!(t.stunCD>0)){t.stunCD=3;t.intent={k:"stun"};setTimeout(()=>{const el=enEl(t);if(el)say(el.querySelector(".body"),"金身裂了一道缝");renderBattle()},300)}
 if(id==="demon"&&t.hp<=0&&!t.revived){t.revived=1;ach("notover");t.hp=Math.round(t.max*.35);t.block=0;setTimeout(()=>{const el=enEl(t);banner("还没完",1);stageShake();if(el)say(el.querySelector(".body"),"塔顶不能没有人。");renderBattle()},400)}}
function dealEnemy(t,d,i=0){if(ENEMY[t.id].boss&&has("bossbane")&&B.curType)d=Math.round(d*1.25);if(ENEMY[t.id].boss)d=bossGuard(t,d);if(has("lavastone")&&B.curType==="atk"&&t.hp>0)t.burn=(t.burn||0)+1;const blk=Math.min(t.block,d);t.block-=blk;const loss=d-blk;t.hp=Math.max(0,t.hp-loss);S.stats.dmg+=loss;if(B&&B.curType){S.stats.maxHit=Math.max(S.stats.maxHit||0,loss);if(loss>=50)ach("hit50");if(loss>=100)ach("hit100")}if(ENEMY[t.id].boss)bossAfterHit(t,d,loss);if(t.thorn&&B.curType==="atk"&&loss>=0&&!B.thornLock){B.thornLock=1;setTimeout(()=>{if(B){B.thornLock=0;dmgPlayer(t.thorn,null,true);if(S.hp<=0)lose()}},120)}
 if(t.af==="split"&&!t.splitDone&&t.hp>0&&t.hp<=t.max/2){t.splitDone=1;setTimeout(()=>{if(!B||B.over||B.alive().length>=4)return;const m=mkEnemy(t.id,9);m.n="分身·"+ENEMY[t.id].n;m.max=Math.ceil(t.max*.4);m.hp=m.max;m.intent=ENEMY[t.id].ai(m,0);B.enemies.push(m);const el2=enEl(t);if(el2)say(el2.querySelector(".body"),"分身术！");renderBattle()},400)}
 if(ENEMY[t.id].boss&&!t.guard&&t.hp>0&&!t.rage&&t.hp<=t.max*.25){t.rage=1;t.str=(t.str||0)+3;setTimeout(()=>{const el2=enEl(t);if(el2){say(el2.querySelector(".body"),"我，生气了！！");anim(el2,"buffA")}toast(`${t.n}<b>狂暴了</b>：力气 +3`)},500)}
 if(t.hp>0&&!t.lowSaid&&t.hp<=t.max*.3){t.lowSaid=1;setTimeout(()=>{const el2=enEl(t);if(el2&&t.hp>0)say(el2.querySelector(".body"),eLine(t,"l"))},350)}
 const el=enEl(t);if(el){const c=center(el.querySelector(".body"));setTimeout(()=>{anim(el,"hit");sfx(d>=18?"bighit":"hit");hitFx(c.x+(Math.random()*30-15),c.y+(Math.random()*30-15),d>=18,!loss,B&&B.curType?B.curFam:null)},i*120);fnum(c.x+(i%2?18:-18),c.top+30,loss?loss:"格挡",loss?"":"blk",i*120);if(d>=18)setTimeout(stageShake,i*120)}
 if(t.id==="giant"&&!t.enraged&&t.hp>0&&t.hp<=t.max/2){t.enraged=1;t.turn=0;t.intent=ENEMY.giant.ai(t,0);setTimeout(()=>el&&bubble(el,"你惹我生气了！"),300)}
if((ENEMY[t.id].flee||t.timid)&&t.hp>0&&t.hp<=t.max/2){t.fled=1;t.hp=0;if(t.timid)B.lootRelic=1;setTimeout(()=>{if(el)bubble(el,t.timid?"我、我把宝贝留下，饶了我吧！":"不错嘛，我们塔顶见。");renderBattle();if(B&&!B.alive().length)win()},200);return}
 if(ENEMY[t.id].boss&&t.id!=="king"&&!t.phase2&&t.hp>0&&t.hp<=t.max/2){t.phase2=1;t.turn=0;t.intent=ENEMY[t.id].ai(t,0);t.block+=15;{const sm={snakeking:["snakelet","snakelet"],cosmicegg:["starchick","starchick"],pearlqueen:["teacup","teacup"]}[t.id];if(sm)setTimeout(()=>{sm.forEach((id,j)=>{if(B.alive().length>=4)return;const m=mkEnemy(id,j);m.intent=ENEMY[id].ai(m,0);B.enemies.unshift(m)});renderBattle()},500)}setTimeout(()=>el&&bubble(el,({count:"我的血，还不够！",snakeking:"孩子们，出来咬他！",buddha:"金身，开光！",cosmicegg:"咔嚓，要孵出来了！",pearlqueen:"满上！一口气倒两杯！",lavagiant:"火，给我烧得更旺！"}[t.id]||"现在，轮到我了。")),300)}
 if(t.id==="king"&&!t.phase2&&t.hp>0&&t.hp<=t.max/2){t.phase2=1;t.turn=0;t.intent=ENEMY.king.ai(t,0);t.block+=10;
  setTimeout(()=>{if(el)bubble(el,"泥巴们，起来！");for(let j=0;j<2;j++){if(B.alive().length>=4)break;const m=mkEnemy("mudling",j);m.intent=ENEMY.mudling.ai(m,0);B.enemies.unshift(m)}renderBattle()},400)}
 if(t.hp<=0)killEnemy(t)}
function canCatch(e){if(!e)return false;const E=ENEMY[e.id];return!!B&&B.myTurn&&!busy&&e.hp>0&&!e.fled&&!E.boss&&E.pal&&B.catchLeft>0&&e.hp<=Math.ceil(e.max*(has("otherball")&&!B.ballUsed?.5:.35))}
async function catchEnemy(e){try{await catchEnemy0(e)}catch(err){console.log("catch err",err)}finally{busy=false;try{afterAction()}catch(x){}}}
async function catchEnemy0(e){if(!canCatch(e))return;const cc=S.mod==="pal"||(has("otherball")&&!B.ballUsed)?0:1;if(B.p.energy<cc){toast("抓它需要 1 点奶力");shakeEl($("#energy"));return}
 const ball=has("otherball")&&!B.ballUsed;busy=true;if(ball){B.ballUsed=1;if(e.hp>Math.ceil(e.max*.35)||cc)toast("另一个世界的奶蛙球发光了")}else B.p.energy-=cc;B.catchLeft--;if(e.id==="isekaiX")ach("isekai2");const el=enEl(e);const c=center(el.querySelector(".body"));
 const n=document.createElement("div");n.className="netFx";n.innerHTML=ICON.net;n.style.left=c.x+"px";n.style.top=c.y+"px";$("#fx").appendChild(n);sfx("buff");
 await sleep(500);e.hp=0;e.caught=1;el.classList.add("caught");n.remove();sparks(c.x,c.y,"#b392ff",18);sfx("relic");
 const pal=ENEMY[e.id].pal;B.caught.push(pal);S.stats.caught++;if(S.stats.caught>=5)ach("pals5");M.palN=(M.palN||0)+1;if(M.palN>=20)ach("pals");if(typeof M.pals!=="object"||!M.pals)M.pals={};M.pals[pal]=1;seeCard(pal);saveMeta();
 if(e.stolen){S.gold+=e.stolen;toast(`拿回了 <b>${e.stolen}</b> 金币`);e.stolen=0}
 toast(`抓到了 <b>${e.n}</b>！战斗结束后，伙伴卡「${CARDS[pal].n}」会加入牌组`);
 await sleep(500)}
function killEnemy(t){S.stats.kills++;if(ENEMY[t.id].boss&&!t.guard)S.stats.endb=(S.stats.endb||0)+1;if(ENEMY[t.id].boss)S.stats.bosses=(S.stats.bosses||0)+1;M.kills=(M.kills||0)+1;if(M.kills>=100)ach("kill100");if(M.kills>=1000)ach("kill1000");if(t.id==="demon")ach("demon");if(t.guard)ach("guard");if(t.id==="mimic")ach("mimic");if(t.id==="goldfrog")ach("goldfrog");if(has("vampfang"))S.hp=Math.min(S.max,S.hp+4);if(ENEMY[t.id].boss&&BOSS_LORE[t.id]){M.boss=M.boss||{};const r=M.boss[t.id]=M.boss[t.id]||{};r.k=(r.k||0)+1;saveMeta();if(Object.keys(BOSS_LORE).every(k=>(M.boss[k]||{}).k))ach("allboss")}if(has("pearlbag"))B.extraGold+=8;if(t.af==="rich"){B.extraGold+=60;toast("富有的敌人掉了 <b>60</b> 金币")}if(t.af==="glitter")B.shinyLoot=1;if(t.id==="goldfrog"){B.goldKill=1;toast("打倒了<b>金色奶蛙</b>！金币哗啦啦地掉了一地")}B.alive().forEach(a=>{if(a.af==="vengeful"&&a!==t){a.str+=3;const el2=enEl(a);if(el2)say(el2.querySelector(".body"),"你竟敢！（力气 +3）")}});if(rnd()<.3)setTimeout(()=>heroSay(pick(HERO_LINE.kill)),500);if(t.stolen){S.gold+=t.stolen;toast(`抢回了 <b>${t.stolen}</b> 金币`);t.stolen=0}
 if(has("cape")){relicPulse("cape");setTimeout(()=>B&&B.heal(3),300)}
 if(t.id==="king")B.enemies.forEach(e=>{if(e.hp>0){e.hp=0}})}
const ULT={king:{n:"泥巴海啸",m:1.5,s:"mud",d:4},snakeking:{n:"万蛇噬咬",m:.5,x:4},count:{n:"血月之吻",m:1.7,s:"weak",d:2},buddha:{n:"金刚掌",m:1.6,p:1},iceking:{n:"冰河时代",m:1.5,s:"weak",d:2},snowking:{n:"超级雪球",m:2},lavagiant:{n:"火山爆发",m:1.5,s:"burn",d:5},pearlqueen:{n:"滚烫满壶",m:.6,x:3,s:"burn",d:3},shadow:{n:"影分身连斩",m:.45,x:5},cosmicegg:{n:"超新星",m:2.2},rockfrog:{n:"落石",m:1.6},fallen:{n:"审判之光",m:1.5,s:"weak",d:2},thunderking:{n:"天雷",m:1.7,p:1},fourhead:{n:"四重奏",m:.4,x:4},abyssdragon:{n:"深渊之口",m:1.8,s:"vuln",d:2},fogwhite:{n:"白雾吞没",m:1.6,s:"weak",d:2},witch:{n:"厄运诅咒",m:1.4,s:"vuln",d:3},bloodbeast:{n:"撕咬",m:.55,x:4},boilerdragon:{n:"锅炉爆燃",m:1.6,s:"burn",d:6},tophat:{n:"最后的魔术",m:2,p:1},demon:{n:"大魔王之锅",m:2,p:1},_:{n:"全力一击",m:1.8}};
function maxAtk(e){let m=10;for(let i=0;i<8;i++){const I=ENEMY[e.id].ai(e,i);if(I&&(I.k==="atk"||I.k==="atkdef"))m=Math.max(m,I.v)}return m}
function PW(B,k,v){B.p.pw2=B.p.pw2||{};B.p.pw2[k]=(B.p.pw2[k]||0)+v}
function nextIntent(e,t){const E=ENEMY[e.id];if(e.waitTurns>0)return{k:"wait"};if(e.intent&&e.intent.k==="stun"&&e.stunCD===3){e.stunCD=2;return{k:"stun"}}if(!E.boss)return E.ai(e,t);
 if(e.charging){e.charging=0;e.sinceUlt=0;const u=ULT[e.id]||ULT._;return{k:"atk",v:Math.round(maxAtk(e)*u.m),x:u.x||1,ult:u.n,pierce:u.p,s:u.s,d:u.d}}
 e.sinceUlt=(e.sinceUlt||0)+1;
 if(!e.guard&&t>=2&&e.sinceUlt>=3&&rnd()<.6){e.charging=1;return{k:"charge"}}
 if(B&&B.p.block>=14&&rnd()<.5)return{k:"atk",v:Math.round(maxAtk(e)*.75),pierce:1};
 if(rnd()<.16)return pick([{k:"debuff",s:"vuln",v:2},{k:"debuff",s:"weak",v:2},{k:"debuff",s:"burn",v:4}]);
 let I,n=0;do{I=E.ai(e,t+Math.floor(rnd()*8))}while(n++<6&&e.lastI&&JSON.stringify(I)===e.lastI);e.lastI=JSON.stringify(I);return I}
function dmgPlayer(v,src,raw){const p=B.p;let d=v;if(!raw){if(src){d+=src.str;if(src.weak>0)d*=.75}if(p.vuln>0)d*=1.5}d=Math.max(0,Math.floor(d));
 const blk=raw?0:B._pierce?0:Math.min(p.block,d);B._lastSrc=src;if(B._pierce&&p.block){p.block=0;toast("护盾被打穿了！")}p.block-=blk;const loss=d-blk;S.hp=Math.max(0,S.hp-loss);if(loss>0&&B)B.hurt=1;if(src&&has("thornvest")&&src.hp>0&&!raw){setTimeout(()=>{if(B&&!B.over&&src.hp>0)dealEnemy(src,3)},80)}if(loss>0&&B)B.enemies.forEach(x=>{if(x.id==="bloodbeast"&&x.hp>0)x.str=(x.str||0)+1});if(src&&src.id==="count"&&loss>0&&src.hp>0){src.hp=Math.min(src.max,src.hp+loss)}
 const el=$("#player");const c=center(el.querySelector(".body"));anim(el,"hit");sfx(loss?"hurt":"block");fnum(c.x,c.top+30,loss||"格挡",loss?"":"blk");if(loss>=12)stageShake();
 if(S.hp<=0&&B.p.pw.rebirth&&!B.rebirthUsed){B.rebirthUsed=1;S.hp=Math.ceil(S.max*.5);toast("<b>凤凰涅槃</b>！你从火里站了起来");sfx("relic")}
 if(S.hp<=0&&has("phoenix")&&!S.flags.phoenix){S.flags.phoenix=1;S.hp=Math.ceil(S.max*.3);relicPulse("phoenix");toast("<b>不死羽</b>燃烧了！你又站了起来");sfx("relic")}
 if(src&&!raw&&p.thorn&&src.hp>0){const t=src;setTimeout(()=>{if(t.hp>0){dealEnemy(t,p.thorn);renderBattle()}},150)}
 if(src&&src.af==="vamp"&&loss>0&&src.hp>0){const h=Math.ceil(loss/2);src.hp=Math.min(src.max,src.hp+h)}
 if(loss>0&&S.hp<=0)S.stats.killer=src?src.n:(B.lastSrc||"");
 if(loss>=15&&S.hp>0&&rnd()<.5)heroSay(pick(HERO_LINE.big));
 if(S.hp>0&&S.hp<=S.max*.25&&!B.heroLow){B.heroLow=1;heroSay(pick(HERO_LINE.low),1)}
 renderTop();return loss}

/* ---- 出牌 ---- */
async function playCard(c,target){if(busy)return;const D=CARDS[c.id];let cost=curCost(c),x=0;
 if(D.cost===-1){x=B.p.energy;cost=x}if(cost>B.p.energy)return;
 if(D.tgt&&(!target||target.hp<=0)){const al=B.alive();if(al.length===1)target=al[0];else return}
 busy=true;B.sel=null;hint();B.p.energy-=cost;B.hand.splice(B.hand.indexOf(c),1);
 // 飞出动画
 const el=$(`#hand .card[data-k="${c.k}"]`);if(el){el.classList.add("fly");const tx=target?center(enEl(target)).x-75:560;el.style.transform=`translate(${tx}px,-300px) scale(.6) rotate(0deg)`;el.style.opacity="0";setTimeout(()=>el.remove(),340)}
 sfx("card");S.stats.played++;if(D.fam==="pal"){B.palTurn=(B.palTurn||0)+1;if(B.palTurn>=3)ach("pal3")}if(B.played>=11)ach("rush");if(has("horserope")&&D.fam==="horse"&&!B.horseRope){B.horseRope=1;B.after.push(async()=>B.draw(1))}if(has("catbell")&&D.fam==="cat"&&!B.catBell){B.catBell=1;const al=B.alive();if(al.length)B.apply(pick(al),"vuln",1)}if(has("duster")&&D.fam==="chick"){S.dust=(S.dust||0)+1;if(S.dust%3===0)B.heal(3)}if(has("metronome")&&B.played===4)B.gainEnergy(1);if(has("bellclock")&&B.played===2){relicPulse("bellclock");B.after.push(async()=>B.draw(1))}seeCard(c.id);
 B.bonus=0;if(D.type==="atk"){B.bonus=B.p.nextAtk;B.p.nextAtk=0;if(S.hero==="knight"&&!B.knAtk){B.knAtk=1;B.bonus+=Math.min(10,Math.floor(B.p.block/4))}}
 B.cardSeq=(B.cardSeq||0)+1;B.curFam=D.fam;B.curType=D.type;B.shinyPow=c.sh==="pow"?4:0;if(c.sh==="draw")B.after.push(async()=>B.draw(1));if(D.fam==="horse"&&B.p.horseFree)B.p.horseFree=0;
 if(D.fam==="horse"&&B.p.pw.blood){B.p.tstr+=B.p.pw.blood}
 if(D.fam==="pal"&&PAL_LINE[c.id])heroSay(pick(PAL_LINE[c.id]),1);else if(c.g&&rnd()<.5)heroSay(pick(HERO_LINE.golden));
 if(D.fam==="pal"&&has("palcollar"))B.after.push(async()=>B.draw(1));
 let tri=false;if(D.fam!=="none"&&D.type!=="cur"&&D.type!=="sts"){if(B.poolAdd(D.fam)===D.fam)tri=true}else if(c.id==="mud")B.poolAdd("mud");
 if(B.wx==="fog"&&D.fam==="cat"&&!B.fogUsed){B.fogUsed=1;B.after.push(async()=>B.draw(1))}
 let reps=tri?2:1;if(c.g)reps++;if(B.mirror){reps++;B.mirror=false;relicPulse("mirror")}
 if(D.fam==="horse")B.horseN=(B.horseN||0)+1;
 if(D.type==="atk"){B.combo++;if(B.combo>=8)ach("combo8");if(B.p.borrow)B.block(B.p.borrow,1);if(B.p.echo>0){B.p.echo--;reps++}if(B.combo===3&&B.p.pw.rhythm){B.after.push(async()=>{B.gainEnergy(1);B.draw(B.p.pw.rhythm)})}}
 B.played++;
 await sleep(tri?380:160);
 if(D.type==="atk"){anim($("#player"),"lungeR")}
 for(let r=0;r<reps;r++){if(D.tgt&&(!target||target.hp<=0))target=B.alive()[0];if(D.tgt&&!target)break;D.fx(B,!!c.u,target,c,x);if(r<reps-1)await sleep(260)}
 B.bonus=0;
 if(B.p.pw.zone&&B.played%5===0)B.draw(2*B.p.pw.zone);
 delete c.tmp;B.curFam=null;B.curType=null;B.shinyPow=0;
 if(D.type!=="pow"){if(D.exh||(D.exhU&&!c.u)||D.type==="sts")B.exh.push(c);else B.disc.push(c)}
 while(B.after.length){const f=B.after.shift();await f()}
 busy=false;afterAction()}
function findRun(P,need){for(let i=0;i<P.length;i++){let f=null,j=i;while(j<P.length){const t=P[j];if(t.ice&&!has("warmscarf"))break;if(t.f==="any"){if(f==="mud")break;j++;continue}if(f===null){if(t.f==="mud"&&j>i)break;f=t.f;j++;continue}if(t.f===f){j++;continue}break}
  const n=j-i;if(n>=need&&!(f==="mud"&&P.slice(i,j).some(x=>x.f==="any")))return{i,n,f:f||"any"}}return null}
function chainBanner(lv){const d=document.createElement("div");d.className="triBan chain";d.innerHTML=`<b>${["","","二","三","四","五","六"][Math.min(lv,6)]}连锁！</b><small>爆发 ×${lv}，奶力 +1</small>`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),1200);sparks(640,260,"#f7c948",36);stageShake()}
function triBanner(fam){sfx("tri");const d=document.createElement("div");d.className="triBan";d.innerHTML=`<b>消除！</b><small>${(FAM[fam]||{n:"彩虹"}).n}爆发：${({frog:"乱拳 3×3",horse:"群踏 5",chick:"护盾 +6",cat:"回复 3，抽 1",pal:"伙伴出击 8",any:"奶力 +1"}[fam]||"")}</small>`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),1000);sparks(640,300,(FAM[fam]||{c:"#ffd200"}).c,22)}
function afterAction(){renderTop();renderBattle();if(S.hp<=0)return lose();if(!B.alive().length&&!B.over)win()}

/* ---- 回合结束 / 敌人行动 ---- */
$("#endBtn").onclick=()=>endTurn();
$("#drawPile").onclick=()=>B&&viewCards(B.dp,"抽牌堆",`${B.dp.length} 张（顺序是打乱的）`);
$("#discPile").onclick=()=>B&&viewCards(B.disc,"弃牌堆",`${B.disc.length} 张`,false);
$("#exhPile").onclick=()=>B&&viewCards(B.exh,"消耗的牌",`本场战斗不会再回来`,false);
$("#battle").addEventListener("click",e=>{if(B&&B.sel&&!e.target.closest(".card")&&!e.target.closest(".en")){const c=B.hand.find(x=>x.k===B.sel.k);if(c&&!CARDS[c.id].tgt&&e.target.closest("#arena")){playCard(c);return}B.sel=null;hint();renderBattle()}});
async function endTurn(){if(busy||!B||!B.myTurn||B.over)return;busy=true;B.myTurn=false;B.sel=null;hint();$("#endBtn").classList.add("wait");
 if(has("sugarcube")&&B.p.energy>0){B.p.block+=B.p.energy*3}
 const p=B.p;let mud=B.hand.filter(c=>c.id==="mud").length*(B.wx==="rain"?2:1);if(mud){dmgPlayer(mud*2,null,true);toast(`手里的泥巴块弄脏了你，受到 <b>${mud*2}</b> 伤害`);if(S.hp<=0)return lose()}
 const keep=[];for(const c of B.hand){delete c.tmp;if(CARDS[c.id].ret||c.sh==="ret")keep.push(c);else if(CARDS[c.id].eth)B.exh.push(c);else B.disc.push(c)}B.hand=keep;
 if(p.pw.owl){dmgPlayer(p.pw.owl,null,true);if(S.hp<=0)return lose()}
 p.tstr=0;p.free=0;p.borrow=0;if(p.vuln)p.vuln--;if(p.weak)p.weak--;
 renderBattle();await sleep(300);banner("敌人回合",1);sfx("enemy");await sleep(700);
 for(const e of B.enemies){if(e.hp<=0||e.fled)continue;e.block=e.id==="iceking"?Math.floor(e.block/2):0;if(e.af==="tough")e.block+=8;
  if(e.mud>0){const d=e.mud*(B.wx==="rain"?2:1);e.mud--;dealEnemy(e,d);sfx("mud");renderBattle();await sleep(300);if(e.hp<=0){ach("mudkill");continue}}
  if(e.burn>0){const d=e.burn;e.burn--;dealEnemy(e,d);sfx("hit");renderBattle();await sleep(260);if(e.hp<=0){ach("burnkill");continue}}
  if(e.id==="snowking"){e.str=(e.str||0)+1;e.grow=(e.grow||0)+1;const el=enEl(e);if(el){const bd=el.querySelector(".body");bd.style.transform=`scale(${Math.min(1.35,1+e.grow*.04)})`;bd.style.transformOrigin="50% 100%"}}
  if(e.id==="iceking"){const l=B.pool.filter(x=>!x.ice&&x.f!=="mud");if(l.length){pick(l).ice=2;renderPool()}}
  if(e.id==="buddha"&&e.stunCD>0)e.stunCD--;
  if(e.id==="timefrog"&&e.turn%3===2){const back=B.disc.splice(-2,2);B.dp.push(...back);say(enEl(e).querySelector(".body"),"时间倒流");toast(`${e.n}拨回了时钟：${back.length} 张牌回到抽牌堆`);await enemyAct(e);renderBattle();await sleep(300)}
  if(e.id==="plague"){B.apply(B.p,"mud",2);await sleep(200)}
  if(e.id==="fallen"){e.mode=e.mode==="holy"?"dark":"holy";const el=enEl(e);if(e.mode==="holy"){e.hp=Math.min(e.max,e.hp+Math.round(e.max*.06));B.apply(B.p,"weak",1);if(el)say(el.querySelector(".body"),"愿你平安")}else{e.str=(e.str||0)+2;if(el)say(el.querySelector(".body"),"（翅膀张开了）")}renderBattle();await sleep(250)}
  if(e.id==="thunderking"){lightning();dmgPlayer(5,null,true);toast("落雷：受到 <b>5</b> 伤害");renderBattle();await sleep(350);if(S.hp<=0)return lose()}
  if(e.id==="abyssdragon"&&B.disc.length){const c=B.disc.pop();B.exh.push(c);e.hp=Math.min(e.max,e.hp+6);toast(`${e.n}吞掉了你的「${cname(c)}」`);renderBattle();await sleep(250)}
  if(e.id==="fogwhite"){e.fogged=e.turn%2===1;if(e.fogged)say(enEl(e).querySelector(".body"),"（躲进了雾里）")}
  if(e.id==="witch"){B.dp.splice(ri(B.dp.length+1),0,mk("heavy"));toast(`${e.n}往你的抽牌堆塞了一张<b>诅咒</b>`)}
  if(e.id==="tophat"&&B.dp.length){const i=ri(B.dp.length),c=B.dp.splice(i,1)[0];B.exh.push(c);B.magicN=(B.magicN||0)+1;if(B.magicN>=5)ach("magic");toast(`${e.n}把你的「${cname(c)}」<b>变没了</b>`)}
  if(e.id==="boilerdragon"){e.heat=(e.heat||0)+1;if(e.heat>=3){e.heat=0;banner("喷火",1);B.apply(B.p,"burn",6);await sleep(400)}}
  if(e.id==="cosmicegg"){e.cnt=(e.cnt==null?6:e.cnt)-1;if(e.cnt<=0){e.cnt=6;banner("孵化爆发",1);stageShake();await sleep(400);dmgPlayer(26+(S.act||0)*4,e);renderBattle();await sleep(500);if(S.hp<=0)return lose()}}
  await enemyAct(e);renderBattle();await sleep(420);
  if(e.id==="fourhead"&&e.hp>0&&S.hp>0){const heads=Math.max(1,Math.ceil(e.hp/e.max*4));for(let k=1;k<heads&&e.hp>0&&S.hp>0;k++){e.intent=ENEMY.fourhead.ai(e,e.turn+k*2+1);await enemyAct(e);renderBattle();await sleep(380)}if(S.hp<=0)return lose()}
  if(e.af==="swift"&&e.turn===0&&e.hp>0&&S.hp>0){say(enEl(e).querySelector(".body"),"再来一次！");e.intent=ENEMY[e.id].ai(e,1);await enemyAct(e);renderBattle();await sleep(420)}
  if(e.hp>0&&S.hp>0&&e.af){const P={sticky:{t:"junk",n:1},greedy:{t:"suck",n:1,h:6},frosty:{t:"freeze",n:1}}[e.af];if(P){B.poolEnemy(P,e);await sleep(250)}if(e.af==="mocking"){B.apply(B.p,"weak",1);await sleep(200)}}
  if(e.vuln)e.vuln--;if(e.weak)e.weak--;e.turn++;
  if(S.hp<=0)return lose()}
 if(!B.alive().length)return win();
 B.enemies.forEach(e=>{if(e.hp>0&&!e.fled)e.intent=nextIntent(e,e.turn)});
 startTurn()}
async function enemyAct(e){const I=e.intent,el=enEl(e);if(!I)return;{const sp=!!I.pool||["def","buff","debuff","add"].includes(I.k);if(I.k!=="flee"&&I.k!=="boom"&&I.k!=="wait"&&rnd()<(sp?.8:.5))say(el.querySelector(".body"),eLine(e,sp?"s":"a"))}const atk=async(v,n=1)=>{anim(el,"lungeL");for(let i=0;i<n;i++){dmgPlayer(v,e);renderBattle();await sleep(n>1?200:120);if(S.hp<=0)return}};
 switch(I.k){
 case"atk":if(I.ult){banner(I.ult,1);stageShake();await sleep(500)}B._pierce=!!I.pierce;await atk(I.v,I.x||1);B._pierce=0;if(I.s)B.apply(B.p,I.s,I.d||1);break;
 case"stun":say(el.querySelector(".body"),"头好晕");break;
 case"charge":e.block+=10+(S.act||0)*4;sfx("buff");anim(el,"buffA");say(el.querySelector(".body"),pick(["要来了","深呼吸","看好了！","我要认真了！"]));fxAt(el.querySelector(".body"),"shieldFx",0,ICON.shield);break;
 case"def":e.block+=I.v;sfx("block");fxAt(el.querySelector(".body"),"shieldFx",0,ICON.shield);if(I.s2){e[I.s2]=(e[I.s2]||0)+I.v2}break;
 case"buff":e[I.s]=(e[I.s]||0)+I.v;anim(el,"buffA");sfx("buff");bubble(el,I.s==="mirror"?"让我看看你会什么":pick(["呱！力气来了！","嘿，哈！","我要认真了"]));break;
 case"debuff":B.apply(B.p,I.s,I.v);anim(el,"buffA");break;
 case"add":anim(el,"lungeL");for(let i=0;i<I.n;i++)B.disc.push(mk(I.card));sfx("mud");toast(`${e.n}往你的弃牌堆扔了 <b>${I.n} 张${CARDS[I.card].n}</b>`);break;
 case"atkdef":await atk(I.v);e.block+=I.b;break;
 case"steal":{await atk(I.v);const g=Math.min(S.gold,I.g);S.gold-=g;e.stolen+=g;if(g){const c=center($("#player .body"));fnum(c.x,c.top,"-"+g+" 金币","gold");toast(`${e.n}偷走了 <b>${g}</b> 金币！打败它才能抢回来`)}renderTop();break}
 case"flee":e.fled=1;e.hp=0;bubble(el,e.id==="goldfrog"?"拜拜～金子都是我的！":"咯咯哒～拜拜！");if(e.id==="goldfrog")ach("ranaway");toast(e.id==="goldfrog"?"金色奶蛙一溜烟跑掉了":`${e.n}带着金币跑掉了`);break;
 case"atkcnt":await atk(I.v);break;
 case"call":{anim(el,"buffA");if(B.alive().length<4){const m=mkEnemy(I.id,B.enemies.length+1);m.intent=ENEMY[I.id].ai(m,0);B.enemies.push(m);sfx("buff");say(el.querySelector(".body"),pick(["咕嘟咕嘟，出来吧！","再来一杯！","趁热喝！"]));toast(`${e.n}倒出了一只<b>${ENEMY[I.id].n}</b>`)}else{e.block+=12;sfx("block");say(el.querySelector(".body"),"杯子太多了，先歇会儿")}}break;case"wait":e.waitTurns--;say(el.querySelector(".body"),e.waitTurns>0?"（慢慢地喝着奶茶）":"好了，茶喝完了。");break;
 case"boom":sfx("boom");stageShake();dmgPlayer(I.v,e);e.hp=0;sparks(center(el).x,center(el).y,"#ff9a1f",26);break}
 if(I.pool&&e.hp>0&&S.hp>0){await sleep(250);B.poolEnemy(I.pool,e)}}

/* ---- 胜负 ---- */
async function win(){if(B.over)return;B.over=1;if(B.turn<=1)ach("oneturn");if(B.turn>=20)ach("longfight");if(S.hp<=3)ach("onehp");if(["B","K","F"].includes(B.kind)&&!B.hurt)ach("flawless");busy=true;B.myTurn=false;$("#endBtn").classList.add("wait");sfx("win");
 await sleep(700);
 if(has("cup")){relicPulse("cup");const h=Math.min(6,S.max-S.hp);S.hp+=h}if(has("teacan"))S.hp=Math.min(S.max,S.hp+4);
 if(perk("regen"))S.hp=Math.min(S.max,S.hp+4*perk("regen"));
 if(has("trophy")&&B.kind!=="m"){S.max+=5;S.hp+=5;relicPulse("trophy")}
 let gold=0;if(has("ring"))gold+=8;if(has("goldegg"))gold+=10;if(has("fullbonus")&&S.hp>=S.max)gold+=15;
 renderTop();
 for(const id of B.caught)addCard(mk(id));
 {const xp=({m:1,E:3,B:4,F:0,M:3,G:2,K:4}[B.kind]||0)+B.caught.length;if(xp){toast(`获得 <b>${xp}</b> 点经验`);await gainXP(xp)}}
 if(B.kind==="B"&&curBoss()==="king")S.flags.kingFriend=1;
 if(B.kind==="B"&&S.act===ACTS.length-1){await sleep(400);await talk(STORY.demon);S.hp=Math.min(S.max,S.hp+20);toast("不知道谁在台阶上放了一杯奶茶：回复 <b>20</b> 生命");S.cur={t:"F",rs:S.rs};saveRun();return startCombat("F")}
 if(B.kind==="B"||B.kind==="F"){await sleep(400);{const bw=B.kind==="B"&&STORY["bw_"+curBoss()];await talk(bw||STORY["win"+S.act+(B.kind==="B"&&bossAlt()?"b":"")])}return actClear()}
 if(B.kind==="K"){const wl=bossLines(S.guard,1);if(wl.length){await sleep(300);await talk(wl)}const h=Math.round(S.max*.2);S.hp=Math.min(S.max,S.hp+h);toast(`守关首领倒下了：回复 <b>${h}</b> 生命`)}
 if(B.kind==="E")S.elites++;
 rewardScreen(B.kind,gold+B.extraGold,B.caught)}
async function lose(){if(B&&B.over===2)return;if(B)B.over=2;busy=true;sfx("lose");await sleep(900);gameOver(false)}
function gameOver(quit){setTimeout(()=>CLOUD.up(true),500);const heroName=HN(),heroImg=HI();if(!quit&&S){if(!(S.act||0))ach("oops");M.deaths=(M.deaths||0)+1;if(M.deaths>=10)ach("stubborn")}const fl=(S.act||0)*(ROWS+1)+S.row+1+(S.atBoss?1:0);M.best=Math.max(M.best,fl);const SR=earnShards(false);saveMeta();const st=S.stats;const roast=quit?[]:elderRoast(st,{gold:S.gold,deck:S.deck.length,golds:S.deck.filter(c=>c.g).length,pots:S.pots.length,killer:st.killer,rooms:fl});S=null;saveRun();B=null;show("ending");setBg("title");playMusic("space");
 const fails=["塔还在那里，它不着急。","你被抬下山的时候，天已经亮了。","村里有人给你留了一碗粥，已经凉了，你还是喝完了。","长老看了你很久，说：回来就好。"];
 $("#ending").innerHTML=`<div class="winWrap lose"><div class="winHero"><div class="winMoon"></div><img src="${IMG("hs")}"><i class="winStone"></i></div>
 <div class="winScroll"><div class="wsHead"><h1>${quit?"下山":"倒下了"}</h1><div class="wsSeal">${heroName}<br>${fl} 步</div></div>
 <p class="wsLead">${quit?"塔还在那里，随时可以再爬。":heroName+"被抬回了村里。长老什么也没问。"+pick(fails)}</p>
 <div class="wsStats"><div><b>${fl}/${ACTS.length*(ROWS+1)}</b><small>走过的房间</small></div><div><b>${st.kills}</b><small>击败敌人</small></div><div><b>${st.endb||0}</b><small>层末首领</small></div><div><b>${st.chain||0}</b><small>最长连锁</small></div><div><b>${st.maxHit||0}</b><small>单次最高伤害</small></div></div>
 ${roast.length?`<div class="wsQuote"><img src="${IMG("m6")}"><div>${roast.map(t=>`<p>「${t}」</p>`).join("")}</div></div>`:""}
 <div class="wsFoot"><div class="wsShard">${ICON.star}<span>记忆碎片</span><b>+${SR.n}</b></div><div class="wsBtns"><button class="wsBtn red" id="eAgain">再爬一次</button><button class="wsBtn" id="eHome">回到主页</button></div></div></div></div>`;
 $("#eAgain").onclick=heroSelect;$("#eHome").onclick=titleScreen}
async function actClear(){setTimeout(()=>CLOUD.up(true),1500);if((S.act||0)<ACTS.length-1){const a=S.act,ob=curBoss();S.act++;if(S.act>=2)ach("act3");pickBoss();S.row=-1;S.col=-1;S.path=[];S.atBoss=false;S.actCombats=0;S.cur=null;S.map=genMap();S.sky=genSky();
  const heal=Math.floor((S.max-S.hp)*.5);S.hp+=heal;saveRun();B=null;show("ending");setBg(["castle","snowfield","factory","cosmos"][a]);playMusic("title");
  $("#ending").innerHTML=`<div class="endBox"><div class="endImg"><img src="${IMG(ENEMY[ob].img)}"></div><h1>第${"一二三四"[a]}层 · 通关</h1><p>${ENEMY[ob].n}倒下的时候没有出声。往上的楼梯就在它身后，一直都在。</p><p style="font-size:20px;color:#ffe7a0">休整一下：回复 ${heal} 生命</p><div class="tbc"><span class="ribbon b">下一层：${ACTS[a+1].n}</span></div><div style="margin-top:22px"><button class="btn" id="eNext">继续往上爬 ▶</button></div></div>`;
  sparks(640,200,"#ffd23f",30);$("#eNext").onclick=async()=>{show("none");await talk(STORY["act"+S.act]);openMap()};return}
 const st=S.stats;const roast=elderRoast(st,{win:1,gold:S.gold,deck:S.deck.length,golds:S.deck.filter(c=>c.g).length,pots:S.pots.length});ach("win");ach("win_"+(S.hero||"naiwa"));if(["naiwa","kungfu","knight"].every(h=>(M.ach||{})["win_"+h]))ach("trinity");if(!(S.stats.caught||0))ach("lonewolf");if(S.flags&&S.flags.doll)ach("seven");if(asc()>=1)ach("asc2");if(asc()>=3)ach("asc4");if(asc()>=7)ach("asc8");if(S.deck.length<=12)ach("slim");if(S.hp<10)ach("close");const endImg=HI(),ascNow=asc(),ascUp=ascNow>=(M.ascMax||0)&&ascNow<ASC.length-1;const SR=earnShards(true);M.wins++;if(ascUp)M.ascMax=ascNow+1;saveMeta();const deckN=S.deck.length;S=null;saveRun();B=null;
 show("ending");setBg("title");playMusic("title");
 const T=(()=>{M.warmI=((M.warmI||0)+1);saveMeta();return WARM_TALES[(M.warmI-1)%WARM_TALES.length]})(),heroN=(HEROES.find(h=>h.img===endImg)||{}).n||"奶蛙",ascT=ascNow?`第 ${ascNow+1} 周目`:"";
 $("#ending").innerHTML=`<div class="winWrap"><div class="winHero"><div class="winMoon"></div><img src="${IMG(endImg)}"><i class="winStone"></i></div>
 <div class="winScroll"><div class="wsHead"><h1>登顶</h1><div class="wsSeal">${heroN}<br>${ascT||"首登"}</div></div>
 <p class="wsLead">你下山的时候，山脚下的泉水已经开始往回流了，水声一路跟着你，像是在送你回家。村口站着好些人，远远看见你，有人先喊了一声你的名字，接着大家都跑了过来。长老没有一起回来，他说塔上总得有人守着，让你替他看看村子。你走到半路回头望了一眼，塔顶亮着一盏小小的灯。</p>
 ${ascUp?`<p class="wsAsc">解锁「第 ${ascNow+2} 周目」　${ASC[ascNow+1].n}</p>`:""}
 <div class="wsStats"><div><b>${st.kills}</b><small>击败敌人</small></div><div><b>${st.endb||0}</b><small>层末首领</small></div><div><b>${st.chain||0}</b><small>最长连锁</small></div><div><b>${st.maxHit||0}</b><small>单次最高伤害</small></div><div><b>${deckN}</b><small>最终牌组</small></div></div>
 <div class="wsQuote"><img src="${IMG("m6")}"><div>${roast.map(t=>`<p>「${t}」</p>`).join("")}</div></div>
 <div class="wsTale"><em>后来 · ${T.t}</em><p>${T.l.join("")}</p></div>
 <div class="wsFoot"><div class="wsShard">${ICON.star}<span>记忆碎片</span><b>+${SR.n}</b></div><div class="wsBtns"><button class="wsBtn red" id="eAgain">再爬一次</button><button class="wsBtn" id="eHome">回到主页</button></div></div></div></div>`;
 sparks(640,200,"#ffd23f",40);$("#eAgain").onclick=heroSelect;$("#eHome").onclick=titleScreen}

/* ===================== 等级 / 天赋 ===================== */
const LV_XP=[0,0,2,4,7,11,16,22,29,37,46,56];
const perk=id=>(S&&S.perks&&S.perks[id])||0;
const PERKS={
 hp:{n:"强身",ic:"heart",max:9,d:"最大生命 +8，并回复 8",f:()=>{S.max+=8;S.hp=Math.min(S.max,S.hp+8)}},
 en:{n:"先手",ic:"star",max:2,d:"每场战斗第一回合多 1 点奶力"},
 dr:{n:"眼疾手快",ic:"deck",max:2,d:"每场战斗第一回合多抽 1 张"},
 cap:{n:"大池子",ic:"q",max:2,d:"奶蛙池 +1 格，更不容易溢出"},
 frogB:{n:"奶蛙拳意",ic:"sword",max:3,d:"奶蛙爆发伤害 +50%"},
 horseB:{n:"奶马奔雷",ic:"wind",max:3,d:"奶马爆发伤害 +50%"},
 chickB:{n:"奶鸡铁壁",ic:"shield",max:3,d:"奶鸡爆发护盾 +50%"},
 catB:{n:"奶猫回春",ic:"heart",max:3,d:"奶猫爆发回复与抽牌 +50%"},
 rb:{n:"彩虹开局",ic:"star",max:2,d:"每场战斗开始，池里先放 1 只彩虹奶蛙"},
 str:{n:"蛙力",ic:"up",max:3,d:"每场战斗开始力气 +1"},
 regen:{n:"喝口奶茶",ic:"heart",max:3,d:"每场战斗结束回复 4 生命"},
 gold:{n:"招财",ic:"coin",max:2,d:"战斗获得的金币 +40%"},
 chain:{n:"连锁大师",ic:"boom",max:2,d:"每次连锁额外获得 6 护盾"},
 upg:{n:"顿悟",ic:"up",max:5,d:"立刻随机升级 2 张牌",f:()=>{shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2).forEach((c,i,arr)=>{c.u=1;if(i===arr.length-1)upFx(arr);toast(`<b>${cname(c)}</b> 升级了！`)})}},
};
async function gainXP(n){if(!S.lv){S.lv=1;S.xp=0;S.perks={}}if(has("xpbook"))n=Math.ceil(n*1.5);if(S.mod==="xp")n*=2;S.xp+=n;renderTop();
 while(S.lv<LV_XP.length-1&&S.xp>=LV_XP[S.lv+1]){S.lv++;S.hp=Math.min(S.max,S.hp+5);renderTop();await levelUp()}saveRun()}
function levelUp(title){return new Promise(res=>{sfx("win");const ids=shuffle(Object.keys(PERKS).filter(k=>perk(k)<PERKS[k].max)).slice(0,3);
 ov(`<div class="lvWrap"><div class="lvRays"></div><div class="lvSlash"></div><div class="lvUp"><i>LEVEL UP</i><b>${title||"等级提升！"}</b><small>${title?"":"<em>Lv."+S.lv+"</em>　生命 +5　"}选一个天赋，这一局一直有效</small></div><div class="perkRow">${ids.map((k,i)=>{const P=PERKS[k];return`<button class="perk" data-k="${k}"><u>0${i+1}</u><span class="pi">${ICON[P.ic]||""}</span><b>${P.n}</b><p>${P.d}</p><small>${perk(k)?"已有 "+perk(k)+" 级":"NEW · 新天赋"}</small></button>`}).join("")}</div></div>`);
 sparks(640,140,"#f7c948",34);
 $$("#ov .perk").forEach(b=>b.onclick=()=>{const k=b.dataset.k;S.perks[k]=(S.perks[k]||0)+1;if(PERKS[k].f)PERKS[k].f();sfx("relic");closeOv();toast(`获得天赋 <b>${PERKS[k].n}</b>`);renderTop();saveRun();res()})})}

/* ===================== 奖励 ===================== */
function rollRar(kind){const r=rnd();if(kind==="E")return r<.03?"L":r<.15?"E":r<.55?"R":"C";if(kind==="R")return r<.04?"L":r<.2?"E":"R";return r<.01?"L":r<.05?"E":r<.3?"R":"C"}
function offerCards(n,kind,force,shinyFirst){const out=[];let guard=0;while(out.length<n&&guard++<200){let id;if(!force&&rnd()<.08)id=pick(POOL_X);else{const rr=rollRar(kind);const pool=POOL_HERO.filter(x=>CARDS[x].r===rr&&(!CARDS[x].hero||CARDS[x].hero===(S&&S.hero)));id=pick(pool)}if(out.some(c=>c.id===id))continue;out.push(mk(id,0))}
 out.forEach((c,i)=>rollShiny(c,shinyFirst&&i===0));return out}
function addCard(c){S.deck.push(c);if(S.deck.filter(x=>x.g).length>=3)ach("gold3");if(S.deck.filter(x=>CARDS[x.id].type==="cur").length>=5)ach("curse5");if(c.g)ach("goldcard");if(c.sh)ach("shiny");seeCard(c.id);const D=CARDS[c.id];if("SKTG".includes(D.r)||c.g)return false;
 const same=S.deck.filter(x=>x.id===c.id&&!x.g);if(same.length<3)return false;
 same.slice(0,3).forEach(x=>S.deck.splice(S.deck.indexOf(x),1));const g={id:c.id,u:1,g:1,k:++S.uid};S.deck.push(g);mergeFx(g);return true}
function upFx(cards){cards=(cards||[]).filter(Boolean).slice(0,3);if(!cards.length)return;sfx("relic");setTimeout(()=>sfx("tri"),420);
 const d=document.createElement("div");d.className="upFx";
 d.innerHTML=`<div class="upRays"></div><div class="upRow">${cards.map((c,i)=>`<div class="upC" style="--i:${i}"><div class="upOld">${cardHTML({id:c.id,u:0,g:c.g,k:"uo"+i},"mid")}</div><div class="upNew">${cardHTML(c,"mid")}</div><div class="upFlash"></div>${[...Array(10)].map((_,k)=>`<i class="upSp" style="--a:${k*36}deg;--d:${(k%3)*40}ms"></i>`).join("")}</div>`).join("")}</div><div class="upT"><b>升级！</b><small>${cards.map(cname).join("、")}</small></div>`;
 $("#stage").appendChild(d);setTimeout(()=>d.classList.add("out"),1900);setTimeout(()=>d.remove(),2400)}
function mergeFx(g){sfx("tri");const d=document.createElement("div");d.className="mergeFx";d.innerHTML=`<div class="m3">${[0,1,2].map(i=>`<div class="mc mc${i}">${cardHTML({id:g.id,u:0,k:"m"+i},"mid")}</div>`).join("")}</div><div class="mg">${cardHTML(g,"big")}</div><div class="mt"><b>三合一！</b><small>获得金卡「${cname(g)}」，效果触发两次</small></div>`;$("#stage").appendChild(d);
 d.onclick=()=>d.remove();setTimeout(()=>d.remove(),3200);setTimeout(()=>sparks(640,330,"#f7c948",30),900)}
function mergeTag(id){if(!S)return"";const D=CARDS[id];if("SKTG".includes(D.r))return"";const n=S.deck.filter(x=>x.id===id&&!x.g).length;return n===2?`<span class="mtag hot">拿了就合成金卡！</span>`:n===1?`<span class="mtag">已有 1 张 · 集齐 3 张合成</span>`:""}
function chooseReward(cards,title,canSkip=true){return new Promise(res=>{const o=$("#ov");cards.forEach(c=>seeCard(c.id));
 ov(`<div class="pickHead"><span class="ribbon b">${title}</span><small>选一张加入牌组</small></div><div class="pickRow">${cards.map(c=>`<div class="pkw">${cardHTML(c,"big")}${mergeTag(c.id)}</div>`).join("")}</div><div class="pickFoot">${canSkip?`<button class="btn ghost" id="rkSkip">跳过</button>`:""}</div>`);
 $$("#ov .pickRow .card").forEach((e,i)=>e.onclick=()=>{sfx("card");closeOv();if(!addCard(cards[i]))toast(`<b>${cname(cards[i])}</b> 加入了牌组`);renderTop();saveRun();res(cards[i])});
 const sk=$("#rkSkip");if(sk)sk.onclick=()=>{closeOv();res(null)}})}
function randRelic(rar){let pool=RELIC_POOL.filter(r=>!S.relics.includes(r));if(rar){const p2=pool.filter(r=>RELICS[r].r===rar);if(p2.length)pool=p2}return pool.length?pick(pool):null}
function gainRelic(id){if(!id){S.gold+=50;toast("遗物都拿光了，换成 <b>50</b> 金币");return}S.relics.push(id);if(id==="milktank"||id==="heartstone"){S.max+=12;S.hp+=12}if(id==="belt")S.potSlots++;sfx("relic");toast(`获得遗物 <b>${RELICS[id].n}</b>：${RELICS[id].d}`);renderTop()}
const randPot=()=>pick(Object.keys(POTIONS));
function givePotQuiet(id){if(S.pots.length<S.potSlots)S.pots.push(id)}
function givePot(id){if(S.pots.length>=S.potSlots){toast("药水栏满了");return false}S.pots.push(id);renderTop();return true}
function rewardScreen(kind,extraGold,caught=[]){show("reward");setBg(actN().bgs[0]);playMusic("swing");
 const items=[];const gold=Math.round((has("goldtooth")&&kind==="E"?1.4:1)*(((kind==="E"||kind==="M"||kind==="K")?25+ri(11):10+ri(11))*(kind==="M"?2:kind==="K"?1.6:1)+extraGold+(B&&B.goldKill?90+S.act*30:0))*(1+.4*perk("gold"))*(S.mod==="fat"?2:1));items.push({t:"gold",v:gold});
 if(kind==="M"||rnd()<(kind==="E"?.6:.4))items.push({t:"pot",v:randPot()});
caught.forEach(id=>items.push({t:"pal",v:id,done:0,auto:1}));
 items.push({t:"card",v:offerCards(has("clover")?4:3,(kind==="E"||kind==="M"||kind==="K"||S.combats<=1)?"E":"C",0,S.combats<=1||B&&B.shinyLoot)});
 if(kind==="E"||kind==="M"||kind==="K")items.push({t:"relic",v:randRelic(kind==="K"||S.isekaiFight?"R":undefined)});S.isekaiFight=0;if(kind==="M")items.push({t:"relic",v:randRelic("R")});if(B&&B.lootRelic)items.push({t:"relic",v:randRelic()});
 S.cur=null;saveRun();
 const draw=()=>{$("#reward").innerHTML=`<div class="panel"><div class="phead"><span class="ribbon">胜利！</span></div><div class="psub">${kind==="K"?"守关首领倒下了，前面的路开了":kind==="E"?"精英被打倒了，掉了好东西":"拿上战利品继续前进"}</div><div class="rwList">${items.map((it,i)=>{let ic="",tx="",sm="";
   if(it.t==="gold"){ic=ICON.coin;tx=`${it.v} 金币`}
   if(it.t==="pot"){ic=potHTML(it.v);tx=POTIONS[it.v].n;sm=POTIONS[it.v].d}
   if(it.t==="card"){ic=ICON.deck;tx="选一张卡牌";sm="三选一，也可以跳过"}
   if(it.t==="pal"){ic=ICON.net;tx=`抓到伙伴：${CARDS[it.v].n}`;sm="已经加入牌组"}
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
function restSite(){show("rest");setBg("rest");playMusic("home");const heal=Math.floor(S.max*(.27-.025*(S.act||0)+(has("oldmap")?.15:0)+.05*mlv("rest"))*(asc()>=8?2/3:1))+(has("pot")?10:0);
 const canUp=S.deck.some(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type));
 $("#rest").innerHTML=`<div class="pickHead"><span class="ribbon b">休息点</span><small>火烧得很安静。你坐了一会儿，想起村里的晚饭。</small></div><div class="restScene"><img src="${IMG(HI())}" style="transform:scaleX(-1)"><div class="camp"><i class="fl"></i><i class="fl b"></i><i class="logs"></i></div><img src="${IMG("m6")}" style="width:180px;height:200px"></div>
 <div class="restOpts"><button class="ropt" id="rHeal"><span class="ic">${ICON.star}</span><b>休息</b><small>回复 ${heal} 生命</small></button><button class="ropt" id="rUp" ${canUp?"":"disabled"}><span class="ic">${ICON.up}</span><b>修炼</b><small>升级一张牌</small></button><button class="ropt" id="rTalk"><span class="ic">${ICON.heart}</span><b>和长老聊天</b><small>听一段往事，回复 ${Math.floor(heal/2)} 生命</small></button></div>`;
 const done=()=>{saveRun();setTimeout(openMap,600)};
 $("#rHeal").onclick=()=>{S.hp=Math.min(S.max,S.hp+heal);sfx("heal");toast(`回复了 <b>${heal}</b> 生命`);renderTop();done()};
 $("#rUp").onclick=async()=>{const r=await upgradePick();if(r)done()};
 $("#rTalk").onclick=async()=>{const t=["长老说，他年轻的时候也爬过这座塔。","「那时候我只想着往上爬，一次都没回头看。」","「后来才知道，最重要的东西，一直在塔底。」","长老抿了一口奶茶，没有再说下去。"];
  await talk([["m6","奶蛙长老",pick(t)],["n1","功夫奶蛙","，长老？"],["m6","奶蛙长老","哈哈，人老了话就多。快睡吧。"]]);S.hp=Math.min(S.max,S.hp+Math.floor(heal/2));sfx("heal");renderTop();done()}}
async function upgradePick(){const list=S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type));
 const r=await pickCards(list,{title:"升级一张牌",sub:"升级后数值更强，有的还会变便宜",confirm:c=>`${cardHTML(c,"big")}<span class="arr">➜</span>${cardHTML({...c,u:1},"big")}`});
 if(r[0]){r[0].u=1;upFx([r[0]]);renderTop();return true}return false}

/* ===================== 宝箱 ===================== */
function treasure(){if(S.cur&&S.cur.mimic){S.cur.mimic=2;saveRun();return startCombat("M")}
 if(S.cur&&!S.flags.goldChest&&S.cur.mimicRoll==null)S.cur.mimicRoll=rnd()<.18?1:0;
 if(S.cur&&S.cur.mimicRoll===1){ach("bitten");show("reward");setBg(actN().bgs[0]);$("#reward").innerHTML=`<div class="panel"><div class="phead"><span class="ribbon">宝箱</span></div><div class="psub">一个看起来很普通的箱子，是吗？</div><div class="chestBig" id="mimicChest">${ICON.chest}</div><div class="foot"><button class="btn" id="mOpen">打开宝箱</button></div></div>`;
  $("#mOpen").onclick=async()=>{const c=$("#mimicChest");c.classList.add("bite");sfx("hurt");stageShake();await sleep(500);S.hp=Math.max(1,S.hp-5);renderTop();toast("宝箱，咬人了！是<b>宝箱怪</b>！打赢它能拿双倍宝物");S.cur.mimic=1;saveRun();await sleep(700);startCombat("M")};return}
 show("reward");setBg(actN().bgs[0]);const r=rnd();let tier=r<.1||S.flags.goldChest?2:r<.42?1:0;S.flags.goldChest=0;
 const T=[{n:"小宝箱",d:"藏在角落的小箱子，咔哒一声开了",rel:"C",g:[20,40]},{n:"大宝箱",d:"沉甸甸的大箱子，里面闪着光",rel:"R",g:[40,70],pot:1},{n:"金宝箱",d:"金光闪闪！传说中的金宝箱！",rel:"E",g:[60,100],gold:1}][tier];
 const id=randRelic(T.rel);const gd=T.g[0]+ri(T.g[1]-T.g[0]);const items=[{t:"relic",v:id},{t:"gold",v:gd}];if(T.pot)items.push({t:"pot",v:randPot()});if(T.gold)items.push({t:"goldcard"});
 S.cur=null;saveRun();sfx(tier?"relic":"coin");
 const draw=()=>{$("#reward").innerHTML=`<div class="panel"><div class="phead"><span class="ribbon">${T.n}</span></div><div class="psub">${T.d}</div><div class="chestBig t${tier}">${ICON.chest}</div><div class="rwList">${items.map((it,i)=>{let ic="",tx="",sm="";
   if(it.t==="relic"){ic=it.v?relicHTML(it.v):"";tx=it.v?RELICS[it.v].n:"50 金币";sm=it.v?RELICS[it.v].d:""}
   if(it.t==="gold"){ic=ICON.coin;tx=it.v+" 金币"}
   if(it.t==="pot"){ic=potHTML(it.v);tx=POTIONS[it.v].n;sm=POTIONS[it.v].d}
   if(it.t==="goldcard"){ic=ICON.star;tx="挑一张金卡";sm="三选一，直接变成金卡（效果触发两次）"}
   return`<button class="rwItem ${it.done?"done":""}" data-i="${i}"><span class="ic">${ic}</span>${tx}<small>${sm}</small></button>`}).join("")}</div><div class="foot"><button class="btn" id="tkGo">继续前进 ▶</button></div></div>`;
  $$("#reward .rwItem").forEach(b=>b.onclick=async()=>{const it=items[+b.dataset.i];if(it.done)return;
   if(it.t==="relic")gainRelic(it.v);if(it.t==="gold"){S.gold+=it.v;sfx("coin")}if(it.t==="pot"&&!givePot(it.v))return;
   if(it.t==="goldcard"){const cs=offerCards(3,"R",1);cs.forEach(c=>{c.u=1;c.g=1});const r=await chooseReward(cs,"挑一张金卡");if(!r)return}
   it.done=1;renderTop();saveRun();draw()});
  $("#tkGo").onclick=()=>{items.forEach(it=>{if(it.done)return;if(it.t==="relic")gainRelic(it.v);if(it.t==="gold")S.gold+=it.v});openMap()}};draw();renderTop()}

/* ===================== 商店 ===================== */
function shopScreen(mode){if(S&&S.gold<=0)ach("broke");show("shop");setBg("shop");playMusic("country");const cv=mode==="caravan"||(S.cur.shop&&S.cur.shop.caravan);const off=((has("bellr")?.8:1)*(has("coupon")?.8:1))*(S.mod==="sale"?.7:1)*(S.mod==="gold"?1.2:1)*(cv?.85:1)*(1-.06*mlv("shop"));
 const price=c=>Math.round(({C:50,R:78,E:125,L:190,X:85}[CARDS[c.id].r]||60)*(.9+rnd()*.2)*off*(asc()>=5?1.15:1));
 if(!S.cur.shop&&cv){const cards=offerCards(4,"C",0,1).map(c=>({c,p:price(c)}));const relics=[randRelic("C"),randRelic("R")].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(id=>({id,p:Math.round(({C:150,R:220,E:290}[RELICS[id].r])*off)}));const pots=[randPot(),randPot()].map(id=>({id,p:Math.round(55*off)}));S.cur.shop={cards,relics,pots,rm:1,up:1,cp:1,caravan:1};saveRun()}
 if(!S.cur.shop){if(has("piggy")){S.gold+=30;toast("存钱罐叮当一响：<b>+30</b> 金币")}const cards=[...offerCards(5,"C"),mk(pick(POOL_X))].map(c=>({c,p:price(c)}));cards[ri(5)].sale=1;cards.forEach(x=>{if(x.sale)x.p=Math.round(x.p/2)});
  const relics=[randRelic("C"),randRelic(rnd()<.5?"R":"E")].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(id=>({id,p:Math.round(({C:150,R:220,E:290}[RELICS[id].r])*(.95+rnd()*.1)*off)}));
  const pots=[randPot(),randPot(),randPot()].map(id=>({id,p:Math.round((50+ri(25))*off)}));S.cur.shop={cards,relics,pots,rm:0,up:0,cp:0};saveRun()}
 const sh=S.cur.shop;const shopMood=()=>{const gc=S.deck.filter(c=>c.g).length;if(sh.caravan)return pick(SHOP_LINE.caravan);if(S.gold<50)return pick(SHOP_LINE.broke);if(gc>=2&&rnd()<.6)return pick(SHOP_LINE.gold);if(S.gold>=300)return pick(SHOP_LINE.rich);if(S.deck.length>=28&&rnd()<.5)return pick(SHOP_LINE.fat);if(S.deck.length<=12&&rnd()<.5)return pick(SHOP_LINE.thin);return pick(SHOP_LINE.idle)};let sayNow=shopMood();const shopSay=t=>{sayNow=t;const e=$(".shopSay");if(e){e.textContent=t;e.classList.remove("pop");void e.offsetWidth;e.classList.add("pop")}};
 const draw=()=>{const pr=(p,sale)=>`<div class="price ${S.gold<p?"no":""} ${sale?"sale":""}">${ICON.coin}${sale?"特价 ":""}${p}</div>`;
  $("#shop").innerHTML=`<div class="shopKeeper"><img src="${IMG(sh.caravan?"hrcc":"m4")}"></div><div class="shopSay">${sayNow}</div><div class="shopBoard"><div class="phead"><span class="ribbon">${sh.caravan?"流浪奶马商队":"巨无霸杂货铺"}</span></div>
  <div class="shopCards">${sh.cards.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-c="${i}">${cardHTML(x.c,"")}${pr(x.p,x.sale)}${mergeTag(x.c.id)}</div>`).join("")}</div>
  <div class="shopRow2">${sh.relics.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-r="${i}">${relicHTML(x.id)}<div class="lbl">${RELICS[x.id].n}</div>${pr(x.p)}</div>`).join("")}${sh.pots.map((x,i)=>`<div class="shopItem ${x.sold?"sold":""}" data-p="${i}">${potHTML(x.id)}<div class="lbl">${POTIONS[x.id].n}</div>${pr(x.p)}</div>`).join("")}${sh.caravan?"":`<div class="shopItem ${sh.rm?"sold":""}" id="shRm"><div class="rmv"><big>✂</big>移除一张牌</div>${pr(S.removeCost)}</div><div class="shopItem ${sh.up?"sold":""}" id="shUp"><div class="rmv"><big>⬆</big>升级一张牌</div>${pr(svc(70))}</div><div class="shopItem ${sh.cp?"sold":""}" id="shCp"><div class="rmv"><big>⧉</big>复制一张牌<small>凑三合一</small></div>${pr(svc(95))}`}</div></div>
  <button class="btn sm shopLeave" id="shGo">离开 ▶</button></div>`;
  const buy=(p,f)=>{if(S.gold<p){shopSay(pick(SHOP_LINE.nomoney));sfx("hurt");return}S.gold-=p;sfx("coin");sayNow=pick(SHOP_LINE.thanks);f();renderTop();saveRun();draw()};
  $$(".shopItem[data-c]").forEach(e=>{const x=sh.cards[+e.dataset.c];e.onclick=()=>buy(x.p,()=>{x.sold=1;if(addCard(x.c))return;toast(`买下了 <b>${cname(x.c)}</b>`)})});
  $$(".shopItem[data-r]").forEach(e=>{const x=sh.relics[+e.dataset.r];e.onclick=ev=>{tipAt(e,`<b>${RELICS[x.id].n}</b><p>${RELICS[x.id].d}</p><button class="btn sm" id="bR" style="margin-top:8px">买下 ${x.p}</button>`);$("#bR").onpointerdown=q=>{q.stopPropagation();closeTip();buy(x.p,()=>{x.sold=1;gainRelic(x.id)})}}});
  $$(".shopItem[data-p]").forEach(e=>{const x=sh.pots[+e.dataset.p];e.onclick=()=>{tipAt(e,`<b>${POTIONS[x.id].n}</b><p>${POTIONS[x.id].d}</p><button class="btn sm" id="bP" style="margin-top:8px">买下 ${x.p}</button>`);$("#bP").onpointerdown=q=>{q.stopPropagation();closeTip();if(S.pots.length>=S.potSlots){toast("药水栏满了");return}buy(x.p,()=>{x.sold=1;givePot(x.id)})}}});
  if($("#shRm"))$("#shRm").onclick=async()=>{if(S.gold<S.removeCost){shopSay(pick(SHOP_LINE.nomoney));return}const r=await pickCards(S.deck,{title:"移除一张牌",sub:`花 ${S.removeCost} 金币，让牌组更精简`});if(r[0]){buy(S.removeCost,()=>{S.deck.splice(S.deck.indexOf(r[0]),1);sh.rm=1;S.removeCost+=25;toast(`<b>${cname(r[0])}</b> 被移除了`)})}};
  if($("#shUp"))$("#shUp").onclick=async()=>{if(S.gold<svc(70)){shopSay(pick(SHOP_LINE.nomoney));return}const ok=await upgradePick();if(ok){S.gold-=svc(70);sh.up=1;sfx("coin");renderTop();saveRun();draw()}};
  if($("#shCp"))$("#shCp").onclick=async()=>{if(S.gold<svc(95)){shopSay(pick(SHOP_LINE.nomoney));return}const list=S.deck.filter(c=>!c.g&&!"SKT".includes(CARDS[c.id].r));const r=await pickCards(list,{title:"复制一张牌",sub:"同名牌集齐 3 张会自动合成金卡"});if(r[0]){S.gold-=svc(95);sh.cp=1;sfx("coin");if(!addCard({id:r[0].id,u:r[0].u,k:++S.uid}))toast(`复制了 <b>${cname(r[0])}</b>`);renderTop();saveRun();draw()}};
  $("#shGo").onclick=()=>{S.cur=null;openMap()}};const svc=p=>Math.round(p*off*(has("vipcard")?.5:1));draw();renderTop()}

/* ===================== 随机性：今日塔况 / 精英词缀 / 闪卡 ===================== */
const MODS={
full:{n:"满月之夜",d:"每一层都是满月（三连只需 2 只），但敌人力气 +1"},
fat:{n:"胖胖塔",d:"敌人都变胖了：生命 +25%，但战斗金币翻倍"},
tiny:{n:"小池子",d:"奶蛙池只有 5 格，但每次消除多给 1 点奶力"},
rain:{n:"暴雨季",d:"每一层都在下雨：泥巴伤害翻倍，奶蛙牌伤害 +2"},
sale:{n:"大甩卖",d:"商店里的东西全部七折"},
xp:{n:"修行日",d:"获得的经验翻倍，但最大生命 -10"},
shiny:{n:"闪卡潮",d:"闪卡出现的几率变成 4 倍"},
pal:{n:"伙伴节",d:"每场战斗可以多抓 1 只，抓捕不花奶力"},
chain:{n:"连锁狂热",d:"连锁爆发再 ×1.5，但敌人生命 +10%"},
mud:{n:"泥巴季",d:"敌人更爱丢泥巴，但泥巴消除时给 8 护盾和 1 点奶力"},
calm:{n:"风平浪静",d:"战斗中不会天气突变，每场战斗开始获得 5 护盾"},
gold:{n:"黄金之塔",d:"金色奶蛙出现得更频繁，但商店贵 20%"}};
const AFFIX={
angry:{n:"暴躁的",d:"力气 +3"},
sticky:{n:"黏糊糊的",d:"每回合往你池里丢 1 块泥巴"},
timid:{n:"胆小的",d:"半血就逃跑，但会丢下一件遗物"},
tough:{n:"坚硬的",d:"每回合获得 8 护盾"},
greedy:{n:"贪吃的",d:"每回合吸走你池里 1 只奶蛙，回复 6 生命"},
frosty:{n:"冰冷的",d:"每回合冻住你池里 1 只奶蛙"},
huge:{n:"巨大的",d:"生命 +40%，个头也更大"},
swift:{n:"迅捷的",d:"第一回合会行动两次"},
vamp:{n:"吸血的",d:"打中你时，回复一半伤害的生命"},
spiky:{n:"带刺的",d:"你每次用攻击打中它，自己受到 3 伤害"},
mocking:{n:"狂笑的",d:"每回合让你虚弱 1"},
split:{n:"会分身的",d:"血量过半时分裂出一个分身"},
rich:{n:"富有的",d:"打倒它额外掉 60 金币"},
vengeful:{n:"复仇的",d:"同伴倒下时，力气 +3"},
copycat:{n:"学人精",d:"你每消除一次，它就打你 2 下"},
glitter:{n:"闪耀的",d:"打倒后的卡牌奖励里，必有一张闪卡"}};
const SHINY={draw:"打出后抽 1",cost:"费用 -1",pow:"效果 +4",ret:"保留"};
function rollShiny(c,force){const D=CARDS[c.id];if("SKTP".includes(D.r)&&!force)return c;const rate=.07*(S&&S.mod==="shiny"?4:1);if(!force&&rnd()>=rate)return c;
 const ok=["draw"];if(D.cost>0)ok.push("cost");if(D.type==="atk"||D.type==="skl")ok.push("pow");if(!D.ret&&D.type!=="pow")ok.push("ret");c.sh=pick(ok);return c}
function applyAffix(e,af){const A=AFFIX[af];e.af=af;e.n=A.n+e.n;
 if(af==="angry")e.str+=3;if(af==="huge"){e.max=Math.round(e.max*1.4);e.hp=e.max;e.big=1}if(af==="spiky")e.thorn=3;if(af==="copycat")e.mirror=2;if(af==="timid")e.timid=1}
function modIntro(){return new Promise(res=>{const keys=Object.keys(MODS);let i=0;const M0=MODS[S.mod];
 ov(`<div class="mg"><div class="mgHead"><span class="ribbon b">今日塔况</span><small>每一局的塔，都不太一样</small></div><div class="modCard" id="modCard"><b>？</b><p></p></div><div class="ovFoot"><button class="btn" id="modOk" disabled>知道了</button></div></div>`);
 const card=$("#modCard");let n=0;const spin=()=>{if(!document.contains(card))return;const k=keys[i++%keys.length];card.querySelector("b").textContent=MODS[k].n;sfx("click");if(++n<14)setTimeout(spin,60+n*12);else{card.querySelector("b").textContent=M0.n;card.querySelector("p").textContent=M0.d;card.classList.add("done");sfx("relic");const ok=$("#modOk");if(ok)ok.disabled=false}};spin();
 $("#modOk").onclick=()=>{closeOv();res()}})}
function weatherShift(){ach("wxshift");const w=B.wxShift.to;B.wxShift=null;B.wx=w;renderSky();const pill=$$("#skyBar .skyPill")[1];if(pill){pill.classList.remove("flash");void pill.offsetWidth;pill.classList.add("flash")}
 const d=document.createElement("div");d.className="triBan wxBan";d.innerHTML=`<b>天气突变！</b><small>${WX[w].n}：${WX[w].d}</small>`;$("#fx").appendChild(d);setTimeout(()=>d.remove(),2200);
 if(w==="storm")lightning();sfx("buff");setTimeout(()=>heroSay(HERO_LINE.weather[w],1),900)}

/* ===================== 小游戏 ===================== */
const RPS=[["rock","石头","✊"],["scissors","剪刀","✌️"],["paper","布","✋"]];
function rpsGame(stake){return new Promise(res=>{let round=0;
 const play=()=>{round++;ov(`<div class="mg"><div class="mgHead"><span class="ribbon b">猜拳！</span><small>${stake}${round>1?"　平局，再来一次！":""}</small></div><div class="rpsFoe"><img src="${IMG("m3")}"><div class="rpsHand" id="foeHand">？</div></div><div class="rpsRow">${RPS.map((r,i)=>`<button class="rpsBtn" data-i="${i}"><big>${r[2]}</big>${r[1]}</button>`).join("")}</div></div>`);
  $$("#ov .rpsBtn").forEach(b=>b.onclick=async()=>{$$("#ov .rpsBtn").forEach(x=>x.disabled=true);b.classList.add("pk");const me=+b.dataset.i,foe=Math.floor(Math.random()*3);sfx("click");
   const fh=$("#foeHand");for(let k=0;k<8;k++){fh.textContent=RPS[k%3][2];await sleep(70)}fh.textContent=RPS[foe][2];fh.classList.add("show");
   const r=me===foe?"tie":((me+1)%3===foe?"win":"lose");await sleep(500);
   if(r==="tie"&&round<4){sfx("click");return play()}
   const fin=r==="tie"?"lose":r;sfx(fin==="win"?"win":"hurt");
   $("#ov .mg").insertAdjacentHTML("beforeend",`<div class="mgRes ${fin}">${fin==="win"?"你赢了！":"你输了"}</div><div class="ovFoot"><button class="btn" id="mgOk">好</button></div>`);
   say($("#ov .rpsFoe img"),fin==="win"?"哈，哈哈，这把不算！":"哈哈哈哈哈！你出的什么呀！");
   if(fin==="win")ach("rpswin");$("#mgOk").onclick=()=>{closeOv();res(fin)}})};play()})}
function memoryGame(){return new Promise(res=>{const imgs=["i5","hr","ck","ct","dg","sn"];const deck=shuffle([...imgs,...imgs].map((k,i)=>({k,i})));let open=[],found=0,miss=0,lock=true;const MAXMISS=5;
 ov(`<div class="mg"><div class="mgHead"><span class="ribbon b">记忆翻牌</span><small id="memInfo">记住它们的位置，</small></div><div class="memGrid">${deck.map((c,i)=>`<button class="memC up" data-i="${i}"><i class="f"><img src="${IMG(c.k)}"></i><i class="b">?</i></button>`).join("")}</div></div>`);
 const info=()=>{const mi=$("#memInfo");if(mi)mi.textContent=`找到 ${found}/6 对　还能失误 ${MAXMISS-miss} 次`};
 setTimeout(()=>{$$("#ov .memC").forEach(e=>e.classList.remove("up"));lock=false;info()},2200);
 const end=()=>{lock=true;sfx(found===6?"win":"click");$("#ov .mg").insertAdjacentHTML("beforeend",`<div class="mgRes ${found===6?"win":""}">${found===6?"全部找到了！":`找到了 ${found} 对`}</div><div class="ovFoot"><button class="btn" id="mgOk">好</button></div>`);if(found===6)ach("memory");$("#mgOk").onclick=()=>{closeOv();res(found)}};
 $$("#ov .memC").forEach(b=>b.onclick=async()=>{if(lock||b.classList.contains("up"))return;b.classList.add("up");sfx("click");open.push(b);
  if(open.length<2)return;lock=true;const [x,y]=open;open=[];
  if(deck[+x.dataset.i].k===deck[+y.dataset.i].k){found++;x.classList.add("ok");y.classList.add("ok");sfx("coin");info();lock=false;if(found===6)end()}
  else{miss++;info();await sleep(700);x.classList.remove("up");y.classList.remove("up");lock=false;if(miss>=MAXMISS)end()}})})}
function clawGame(tries){return new Promise(res=>{const W=720;const kinds=[["relic","遗物",ICON.star],["card","卡牌",ICON.deck],["gold","金币",ICON.coin],["pot","药水",ICON.heart],["mud","泥巴",ICON.mud]];
 const prizes=[0,1,2,3,4].map(i=>({t:kinds[i],x:70+i*140+Math.floor(Math.random()*40-20)}));shuffle(prizes).forEach((p,i)=>p.x=70+i*140+Math.floor(Math.random()*30-15));
 let x=40,dir=1,left=tries,got=[],busyC=false,raf,last=performance.now();
 ov(`<div class="mg"><div class="mgHead"><span class="ribbon b">抓娃娃机</span><small id="clawInfo">还能抓 ${left} 次，看准了再下爪！</small></div><div class="clawBox"><div class="clawRail"></div><div class="claw" id="claw"><i class="rope"></i><i class="hook">${ICON.grab}</i></div><div class="prizes">${prizes.map((p,i)=>`<div class="prize p-${p.t[0]}" data-i="${i}" style="left:${p.x-38}px">${p.t[2]}<small>${p.t[1]}</small></div>`).join("")}</div></div><div class="ovFoot"><button class="btn pink" id="clawGo">下爪！</button></div></div>`);
 const claw=$("#claw");const tick=t=>{const dt=Math.min(50,t-last);last=t;if(!busyC){x+=dir*.42*dt;if(x>W-40){x=W-40;dir=-1}if(x<40){x=40;dir=1}claw.style.left=(x-30)+"px"}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);
 $("#clawGo").onclick=async()=>{if(busyC||left<=0)return;busyC=true;left--;sfx("click");claw.classList.add("down");await sleep(650);
  let hit=null,bi=-1;prizes.forEach((p,i)=>{if(p.taken)return;if(Math.abs(p.x-x)<=34&&(hit===null||Math.abs(p.x-x)<Math.abs(hit.x-x))){hit=p;bi=i}});
  const slip=hit&&Math.abs(hit.x-x)>22&&Math.random()<.5;
  if(hit&&!slip){hit.taken=1;const el=$(`#ov .prize[data-i="${bi}"]`);el.classList.add("grab");got.push(hit.t[0]);sfx(hit.t[0]==="mud"?"mud":"relic")}else sfx("hurt");
  claw.classList.remove("down");await sleep(650);
  $("#clawInfo").textContent=hit&&!slip?`抓到了「${hit.t[1]}」！${left?"还能抓 "+left+" 次":""}`:(slip?"抓到了，又滑掉了！":"什么都没抓到")+(left?` 还能抓 ${left} 次`:"");
  busyC=false;if(left<=0){cancelAnimationFrame(raf);$("#clawGo").outerHTML=`<button class="btn" id="mgOk">收下</button>`;$("#mgOk").onclick=()=>{closeOv();res(got)}}};
})}
function clawReward(got){if(got.includes("relic"))ach("clawprize");const s=[];got.forEach(t=>{if(t==="relic"){const r=randRelic();gainRelic(r);s.push(r?RELICS[r].n:"50 金币")}if(t==="card"){const c=offerCards(1,"R",1)[0];addCard(c);s.push(cname(c))}if(t==="gold"){S.gold+=45;s.push("45 金币")}if(t==="pot"){givePot(randPot());s.push("药水")}if(t==="mud"){addCard(mk("mud"));s.push("一块泥巴")}});return s.length?"收获："+s.join("、")+"。":"一样都没抓到，机器在嘲笑你。"}

/* ===================== 事件 ===================== */
const EVENTS={
well:{n:"许愿池",img:"c2",t:"泥沼中间有一口亮晶晶的小池子，池底铺满了金币。旁边的牌子上写着：「投币许愿，童叟无欺」。",o:()=>[
 {t:"投 20 金币",d:"<span class='good'>获得一瓶药水，回复 10 生命</span>",ok:S.gold>=20,f:()=>{S.gold-=20;givePot(randPot());S.hp=Math.min(S.max,S.hp+10);return"池水冒了几个泡泡，浮上来一个小瓶子。"}},
 {t:"把一张牌扔进去",d:"<span class='good'>移除一张牌</span>",f:async()=>{const r=await pickCards(S.deck,{title:"扔哪一张？",sub:"它会沉到池底"});if(!r[0])return null;S.deck.splice(S.deck.indexOf(r[0]),1);return`「${cname(r[0])}」咕噜咕噜沉下去了。你觉得轻松了一点。`}},
 {t:"捞几枚金币",d:"<span class='good'>+45 金币</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.gold+=45;addCard(mk("heavy"));return"金币到手了，可是心里沉甸甸的。"}},
 {t:"离开",d:"",f:()=>"你决定不碰这口来路不明的池子。"}]},
pup:{n:"迷路的奶狗",img:"dg",t:"一只浑身是泥的小奶狗蹲在路边，呜呜地叫。它看起来又冷又饿，尾巴却还在拼命摇。",o:()=>[
 {t:"抱起它",cf:"pupFriend",d:"<span class='good'>获得遗物「奶狗陪伴」</span>，<span class='bad'>失去 6 生命</span>（它太激动，把你扑进了泥里）",f:()=>{S.hp=Math.max(1,S.hp-6);gainRelic("pup");return"奶狗在你怀里蹭来蹭去。从今天起，你不是一个人爬塔了。"}},
 {t:"分它一点干粮",cf:"pupFriend",d:"<span class='good'>回复 8 生命</span>（你也顺便吃了点）",f:()=>{S.hp=Math.min(S.max,S.hp+8);return"奶狗吃得很香，吃完舔了舔你的手，跑进了草丛。"}},
 {t:"给它指个方向",d:"<span class='good'>+25 金币</span>",f:()=>{S.gold+=25;return"奶狗跑走了。过了一会儿又跑回来，嘴里叼着一个小钱袋。"}}]},
egg:{n:"神秘的蛋",img:"eg",t:"一颗比你还大的蛋卡在泥里，蛋壳上画着奇怪的花纹，里面好像有什么在动。",o:()=>[
 {t:"孵一孵",d:"<span class='good'>选一张稀有以上的牌</span>，<span class='bad'>失去 8 生命</span>",ok:S.hp>8,f:async()=>{S.hp-=8;await chooseReward(offerCards(3,"R",1),"蛋里蹦出来的",false);return"你抱着蛋暖了很久，最后蹦出来的东西让你吃了一惊。"}},
 {t:"扭开它",d:"<span class='good'>获得「扭蛋」×2</span>",f:()=>{addCard(mk("gacha"));addCard(mk("gacha"));return"原来是个扭蛋机！里面掉出来两个小扭蛋。"}},
 {t:"卖给路过的商人",d:"<span class='good'>+60 金币</span>",f:()=>{S.gold+=60;return"商人眼睛一亮，掏出一把金币。"}}]},
smith:{n:"铁匠奶蛙",img:"m2",t:"一只挺着大肚子的奶蛙在敲敲打打，火星四溅。「嘿！要不要我帮你把招式敲得更结实点？」",o:()=>[
 {t:"敲一张",d:"<span class='good'>升级一张牌</span>",f:async()=>{const ok=await upgradePick();return ok?"铛铛铛！焕然一新。":null}},
 {t:"多敲几下",d:"<span class='good'>随机升级 2 张牌</span>，<span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:()=>{S.hp-=10;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2);l.forEach(c=>c.u=1);upFx(l);return`敲得太用力，火星烫到了你。升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"算了",d:"",f:()=>"铁匠耸耸肩，继续敲他的锅。"}]},
gamble:{n:"赌徒奶蛙",img:"m3",t:"一只笑得停不下来的奶蛙拦住你：「来来来，猜大小！赢了翻倍，输了，哈哈哈哈哈！」",o:()=>[
 {t:"押 30 金币",d:"一半机会赢 <span class='good'>80 金币</span>",ok:S.gold>=30,f:()=>{S.gold-=30;if(rnd()<.5){S.gold+=80;sfx("coin");return"你赢了！狂笑奶蛙笑得更大声了。"}return"你输了。狂笑奶蛙笑到在地上打滚。"}},
 {t:"押上体力",d:"<span class='bad'>失去 10 生命</span>，一半机会获得 <span class='good'>一件遗物</span>",ok:S.hp>10,f:()=>{S.hp-=10;if(rnd()<.5){gainRelic(randRelic());return"它愿赌服输，从口袋里掏出一样宝贝。"}return"你输了，还被它拍了一巴掌。好疼。"}},
 {t:"不玩",d:"",f:()=>"「哈哈哈，胆小鬼！」笑声在身后响了很久。"}]},
elder:{n:"长老的回忆",img:"m6",t:"雾里浮现出长老的身影。不是真的长老，是一段留在塔里的记忆。它轻轻开口",o:()=>[
 {t:"静静听完",d:"<span class='good'>回复 15 生命，记忆碎片 +1</span>",f:()=>{S.hp=Math.min(S.max,S.hp+15);M.shards=(M.shards||0)+1;M.shardsAll=(M.shardsAll||0)+1;saveMeta();const T=villageTale();return"「"+T.l.join("")+"」身影慢慢散开了。"}},
 {t:"向长老请教",d:"<span class='good'>升级一张牌</span>",f:async()=>{const ok=await upgradePick();return ok?"记忆里的长老点了点头：「对，就是这样。」":null}}]},
teashop:{n:"奶茶摊",img:"ctm",t:"路边支着一个小小的奶茶摊，老板是一只打瞌睡的奶猫。锅里的奶茶咕嘟咕嘟冒着泡。",o:()=>[
 {t:"来一大杯",d:"<span class='good'>回满生命</span>，花 35 金币",ok:S.gold>=35,f:()=>{S.gold-=35;S.hp=S.max;sfx("heal");return"一口气喝完，浑身都暖起来了。"}},
 {t:"来一小杯",d:"<span class='good'>回复 15 生命</span>，花 12 金币",ok:S.gold>=12,f:()=>{S.gold-=12;S.hp=Math.min(S.max,S.hp+15);sfx("heal");return"甜甜的，刚刚好。"}},
 {t:"帮老板看摊",d:"<span class='good'>+3 经验，+20 金币</span>",f:async()=>{S.gold+=20;await gainXP(3);return"你帮奶猫卖了一下午奶茶，学到了不少招呼客人的本事。"}}]},
gachamachine:{n:"扭蛋机",img:"egj",t:"一台锈迹斑斑的扭蛋机，玻璃罩里塞满了五颜六色的蛋。投币口上写着：「保证不坑」。",o:()=>[
 {t:"投 40 金币",d:"<span class='good'>随机一张稀有以上的牌</span>，有机会直接是金卡",ok:S.gold>=40,f:()=>{S.gold-=40;const c=offerCards(1,"R",1)[0];if(rnd()<.2){c.u=1;c.g=1}addCard(c);sfx("relic");return`咔哒！扭出了「${cname(c)}」！`}},
 {t:"投 90 金币",d:"<span class='good'>随机一件遗物</span>",ok:S.gold>=90,f:()=>{S.gold-=90;gainRelic(randRelic());return"扭蛋里滚出来一件闪闪发光的宝贝。"}},
 {t:"拍一拍机器",d:"一半机会掉出 <span class='good'>30 金币</span>，一半机会 <span class='bad'>被夹手 6 生命</span>",f:()=>{if(rnd()<.5){S.gold+=30;sfx("coin");return"哗啦啦，机器吐出一把金币！"}S.hp=Math.max(1,S.hp-6);return"哎哟！手被夹了一下。"}}]},
dummy:{n:"训练木桩",img:"i3",t:"一根被打得坑坑洼洼的木桩立在空地上，旁边刻着：「练到天亮，天下无敌」。",o:()=>[
 {t:"认真练一招",d:"<span class='good'>升级一张牌</span>",f:async()=>{const ok=await upgradePick();return ok?"这一招，你已经练到骨子里了。":null}},
 {t:"练到天亮",d:"<span class='good'>随机升级 3 张牌，+2 经验</span>，<span class='bad'>失去 12 生命</span>",ok:S.hp>12,f:async()=>{S.hp-=12;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,3);l.forEach(c=>c.u=1);upFx(l);await gainXP(2);return`天亮了，木桩也碎了。升级了：${l.map(cname).join("、")||"没有"}。`}}]},
spring:{n:"池塘泉眼",img:"c6",t:"一汪清澈的小泉眼，水面上漂着几只发光的奶蛙。泉水好像在回应你心里的奶蛙池。",o:()=>[
 {t:"喝一口",d:"<span class='good'>最大生命 +6</span>",f:()=>{S.max+=6;S.hp+=6;sfx("heal");return"泉水甜甜的，你觉得身体更结实了。"}},
 {t:"许个愿",d:"<span class='good'>这一局奶蛙池永久 +1 格</span>",f:()=>{S.perks=S.perks||{};S.perks.cap=(S.perks.cap||0)+1;sfx("relic");return"泉水泛起涟漪，你心里的池子变宽了。"}},
 {t:"捞彩虹",d:"<span class='good'>获得「彩虹奶蛙」×2</span>",f:()=>{addCard(mk("rainbow"));addCard(mk("rainbow"));return"两只彩虹奶蛙跳进了你的口袋。"}}]},
merchant:{n:"流浪商人",img:"xg",t:"一只戴着高帽子的奶蛙推着小车走过来：「先生，要不要做点小生意？」",o:()=>[
 {t:"以旧换新",d:"<span class='good'>移除一张牌，换一张同家族的稀有以上的牌</span>",f:async()=>{const r=await pickCards(S.deck.filter(c=>!"SKT".includes(CARDS[c.id].r)&&CARDS[c.id].fam!=="none"&&CARDS[c.id].fam!=="pal"),{title:"拿哪张去换？",sub:"会换成同家族的稀有以上的牌"});if(!r[0])return null;const fam=CARDS[r[0].id].fam;S.deck.splice(S.deck.indexOf(r[0]),1);const pool=POOL_HERO.filter(x=>CARDS[x].fam===fam&&"REL".includes(CARDS[x].r));const c=mk(pick(pool));addCard(c);return`「${cname(r[0])}」换成了「${cname(c)}」。`}},
 {t:"买张藏宝图",d:"花 50 金币，<span class='good'>下一个宝箱一定是金宝箱</span>",ok:S.gold>=50,f:()=>{S.gold-=50;S.flags.goldChest=1;return"商人眨眨眼：「顺着地图走，准没错。」"}},
 {t:"不了谢谢",d:"",f:()=>"商人摘下帽子鞠了个躬，推着小车走远了。"}]},
claw:{n:"抓娃娃机",img:"ega",t:"一台亮着彩灯的抓娃娃机，里面躺着各种奇怪的宝贝。抓奶蛙的手艺，这下派上用场了。爪子会来回移动，看准时机按下去！",o:()=>[
 {t:"抓一次",d:"花 20 金币，抓 1 次",ok:S.gold>=20,f:async()=>{S.gold-=20;renderTop();return clawReward(await clawGame(1))}},
 {t:"连抓三次",d:"花 50 金币，抓 3 次",ok:S.gold>=50,f:async()=>{S.gold-=50;renderTop();return clawReward(await clawGame(3))}},
 {t:"算了",d:"",f:()=>"你决定把手艺留给真正的奶蛙。"}]},
rpsfrog:{n:"猜拳奶蛙",img:"m3",t:"狂笑奶蛙拦住了你：「哈哈哈！来猜拳！赢了有奖，输了，哈哈哈哈！」",o:()=>[
 {t:"押 30 金币",d:"赢了拿 <span class='good'>80 金币</span>（平局再来）",ok:S.gold>=30,f:async()=>{S.gold-=30;renderTop();const r=await rpsGame("押了 30 金币");if(r==="win"){S.gold+=80;return"它笑不出来了，乖乖掏出 80 金币。"}return"它笑到在地上打滚，你的 30 金币没了。"}},
 {t:"押上体力",d:"赢了 <span class='good'>拿一件遗物</span>，输了 <span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:async()=>{const r=await rpsGame("押上了 10 生命");if(r==="win"){gainRelic(randRelic());return"「愿赌服输！」它从口袋里掏出一样宝贝。"}S.hp-=10;return"它一巴掌拍在你脑门上：「哈哈哈，再来啊！」"}},
 {t:"不玩",d:"",f:()=>"「哈哈哈，胆小鬼！」"}]},
memory:{n:"管家的记忆游戏",img:"xg",t:"管家奶蛙摆出十二张卡片：「请记住它们的位置，先生。找到几对，我就奖励您几份。」",o:()=>[
 {t:"玩一局",d:"每找到 1 对 <span class='good'>+12 金币</span>，全部找到再送 <span class='good'>一件遗物</span>",f:async()=>{const n=await memoryGame();S.gold+=n*12;if(n===6){gainRelic(randRelic("C"));return`全部找到！获得 ${n*12} 金币和一件遗物。管家鼓起了掌。`}return`找到 ${n} 对，获得 ${n*12} 金币。`}},
 {t:"加注玩（30 金币）",d:"每对 <span class='good'>+25 金币</span>，全部找到送 <span class='good'>稀有遗物</span>",ok:S.gold>=30,f:async()=>{S.gold-=30;renderTop();const n=await memoryGame();S.gold+=n*25;if(n===6){gainRelic(randRelic("R"));return`全部找到！获得 ${n*25} 金币和一件稀有遗物。`}return`找到 ${n} 对，获得 ${n*25} 金币。`}},
 {t:"不玩",d:"",f:()=>"管家优雅地收起了卡片。"}]},
gallery:{n:"古堡画廊",img:"ml",act:1,t:"长长的走廊里挂满了画，每一幅画里都是一只奶蛙，它们的眼睛好像跟着你转。",o:()=>[
 {t:"仔细欣赏",d:"<span class='good'>+4 经验</span>",f:async()=>{await gainXP(4);return"看着看着，你好像领悟了什么。"}},
 {t:"偷一幅",d:"<span class='good'>+90 金币</span>，<span class='bad'>获得诅咒「烦躁」</span>",f:()=>{S.gold+=90;addCard(mk("fret"));return"画里的奶蛙瞪了你一眼。你心里有点发毛。"}},
 {t:"离开",d:"",f:()=>"你快步走出画廊，背后好像有谁在笑。"}]},
altar:{n:"星空祭坛",img:"ckf",act:4,t:"星星围成一圈，中间是一座发光的祭坛。祭坛上刻着：「献出一点自己，换来一点永恒」。",o:()=>[
 {t:"献出 10 最大生命",d:"<span class='good'>选一张牌，直接变成金卡</span>",ok:S.max>20,f:async()=>{const r=await pickCards(S.deck.filter(c=>!c.g&&!"SKT".includes(CARDS[c.id].r)),{title:"哪张牌变成金卡？",sub:"效果会触发两次"});if(!r[0])return null;S.max-=10;S.hp=Math.min(S.hp,S.max);r[0].u=1;r[0].g=1;sfx("tri");return`「${cname(r[0])}」闪闪发光！`}},
 {t:"献出 60 金币",d:"<span class='good'>+6 经验</span>",ok:S.gold>=60,f:async()=>{S.gold-=60;await gainXP(6);return"星光落在你身上，你变强了。"}},
 {t:"离开",d:"",f:()=>"星星眨了眨眼，没有挽留你。"}]},
dojo:{n:"长老道场",img:"fj",t:"雾里浮现出一座小小的道场，长老的影子坐在中间：「来，陪老头子过两招。」",o:()=>[
 {t:"切磋一下",d:"<span class='good'>立刻选一个天赋</span>，<span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:async()=>{S.hp-=10;await levelUp("长老指点");return"「不错，比我年轻时强。」"}},
 {t:"坐下喝茶",d:"<span class='good'>回复 20 生命</span>",f:()=>{S.hp=Math.min(S.max,S.hp+20);sfx("heal");return"茶很苦，心很静。"}}]},
snakehole:{n:"蛇洞",img:"sna",act:0,t:"泥地里有个黑漆漆的洞，里面传来嘶嘶声，还有金币反光的亮点。",o:()=>[
 {t:"伸手去掏",d:"<span class='good'>+60 金币</span>，一半机会 <span class='bad'>被咬失去 8 生命</span>",f:()=>{S.gold+=60;if(rnd()<.5){S.hp=Math.max(1,S.hp-8);return"掏到了金币，也被咬了一口。"}return"小蛇睡着了，你顺利拿到了金币。"}},
 {t:"引它出来",d:"<span class='good'>获得伙伴卡「小蛇」</span>",f:()=>{addCard(mk("p_snk"));return"一条小蛇爬出来，缠在你手腕上不走了。"}},
 {t:"离开",d:"",f:()=>"你绕开了蛇洞。"}]},
chinashop:{n:"瓷器店",img:"cki",act:1,t:"古堡角落有一间瓷器店，架子上摆满了奶鸡形状的花瓶。老板不在，只有一块牌子：「打碎照价赔偿」。",o:()=>[
 {t:"买一只花瓶",d:"花 45 金币，<span class='good'>获得伙伴卡「瓷器奶鸡」×2</span>",ok:S.gold>=45,f:()=>{S.gold-=45;addCard(mk("p_china"));addCard(mk("p_china"));return"花瓶里竟然住着两只小奶鸡。"}},
 {t:"在店里练拳",d:"<span class='good'>升级 2 张随机牌</span>，<span class='bad'>赔偿 30 金币</span>",ok:S.gold>=30,f:()=>{S.gold-=30;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2);l.forEach(c=>c.u=1);upFx(l);return`哐啷！碎了一地。不过你的招式更利索了：${l.map(cname).join("、")}。`}},
 {t:"轻手轻脚离开",d:"",f:()=>"你屏住呼吸，一只花瓶都没碰到。"}]},
meteor:{n:"流星雨",img:"nx",act:4,t:"星空突然亮了起来，一颗颗流星从你身边划过。据说对着流星许愿，愿望就会实现。",o:()=>[
 {t:"许愿变强",d:"<span class='good'>立刻选一个天赋</span>",f:async()=>{await levelUp("流星的祝福");return"一颗流星落进了你的心里。"}},
 {t:"许愿发财",d:"<span class='good'>+120 金币</span>",f:()=>{S.gold+=120;sfx("coin");return"流星化成了金币，叮叮当当落了一地。"}},
 {t:"接住一颗",d:"<span class='good'>获得一件稀有遗物</span>，<span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:()=>{S.hp-=10;gainRelic(randRelic("R"));return"好烫！但你抓住了它。"}}]},
belltower:{n:"敲钟",img:"egsk",act:2,t:"钟楼顶上挂着一口大钟，旁边挂着一根木槌。传说敲响它，会听见过去的自己。",o:()=>[
 {t:"轻轻敲一下",d:"<span class='good'>+4 经验</span>",f:async()=>{await gainXP(4);return"当，钟声里，你好像听见了长老年轻时的笑声。"}},
 {t:"使劲敲十下",d:"<span class='good'>随机升级 3 张牌</span>，<span class='bad'>失去 8 生命（耳朵好疼）</span>",ok:S.hp>8,f:()=>{S.hp-=8;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,3);l.forEach(c=>c.u=1);upFx(l);return`当当当当，升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"捂着耳朵离开",d:"",f:()=>"你决定保护好自己的耳朵。"}]},
snowman:{n:"雪人",img:"egl",act:2,t:"雪地里站着一个歪歪扭扭的雪人，鼻子是一根胡萝卜，眼睛是两颗奶茶珍珠。",o:()=>[
 {t:"帮它扶正",cf:"snowFriend",d:"<span class='good'>获得伙伴卡「雪蛋」×2</span>",f:()=>{addCard(mk("p_egl"));addCard(mk("p_egl"));return"雪人眨了眨眼，从肚子里滚出两颗雪蛋送给你。"}},
 {t:"拿走胡萝卜",d:"<span class='good'>+50 金币</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.gold+=50;addCard(mk("heavy"));return"胡萝卜里藏着金币。可是雪人看你的眼神好伤心。"}},
 {t:"一起堆雪人",d:"<span class='good'>回复 12 生命，+2 经验</span>",f:async()=>{S.hp=Math.min(S.max,S.hp+12);await gainXP(2);return"你堆了一个"+HN()+"雪人，开心得不得了。"}}]},
teatest:{n:"试喝员招聘",img:"cty",act:3,t:"流水线旁贴着一张告示：「招试喝员，喝多少都行，喝完别投诉」。一排刚煮好的奶茶冒着热气。",o:()=>[
 {t:"喝一杯",d:"<span class='good'>回复 15 生命</span>",f:()=>{S.hp=Math.min(S.max,S.hp+15);return"甜度刚好，温度刚好。你觉得自己又能爬十层。"}},
 {t:"一口气喝完一排",d:"<span class='good'>最大生命 +6，回满生命</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.max+=6;S.hp=S.max;addCard(mk("heavy"));return"你打了一个长长的奶嗝。肚子好重"}},
 {t:"偷偷装一瓶",d:"<span class='good'>获得 2 瓶药水</span>",f:()=>{givePot(randPot());givePot(randPot());return"你把奶茶灌进小瓶子里，揣进了怀里。"}}]},
boiler:{n:"失控的锅炉",img:"dgy",act:3,t:"一口大锅炉咕嘟咕嘟乱响，压力表的指针已经转到了红色。旁边的阀门烫得发红。",o:()=>[
 {t:"拧紧阀门",d:"<span class='good'>随机升级 2 张牌，+3 经验</span>，<span class='bad'>失去 8 生命（烫手）</span>",ok:S.hp>8,f:async()=>{S.hp-=8;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2);l.forEach(c=>c.u=1);upFx(l);await gainXP(3);return`嘶，好烫！锅炉安静了下来。升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"捡锅炉下面的金币",d:"<span class='good'>+70 金币</span>，一半机会 <span class='bad'>失去 12 生命</span>",f:()=>{S.gold+=70;sfx("coin");if(rnd()<.5){S.hp=Math.max(1,S.hp-12);return"砰！锅炉喷了你一脸蒸汽，不过钱到手了。"}return"你趁它不注意，把金币全捡走了。"}},
 {t:"赶紧跑",d:"",f:()=>"你跑得飞快，身后传来一声闷响。"}]},
library:{n:"古卷书架",img:"m6",t:"一排落满灰尘的书架，最上面压着一本发光的秘籍。",o:()=>[
 {t:"翻开秘籍",d:"<span class='good'>从 3 张稀有牌里选 1 张</span>",f:async()=>{await chooseReward(offerCards(3,"E",1),"秘籍里写着",false);return"你把招式记在了心里。"}},
 {t:"把书都读一遍",d:"<span class='good'>+5 经验</span>，<span class='bad'>失去 10 生命（熬夜）</span>",ok:S.hp>10,f:async()=>{S.hp-=10;await gainXP(5);return"天亮了，你的眼睛红红的，但脑子里全是招式。"}},
 {t:"不看了",d:"",f:()=>"书架上的灰尘呛得你直咳嗽。"}]},
cursechest:{n:"诅咒宝箱",img:"cki",t:"一只宝箱被铁链缠着，锁上贴着一张符：「打开的人，会背上一点霉运」。",o:()=>[
 {t:"撕掉符咒打开",d:"<span class='good'>获得一件稀有遗物</span>，<span class='bad'>获得诅咒「沉重」×2</span>",f:()=>{gainRelic(randRelic("R"));addCard(mk("heavy"));addCard(mk("heavy"));return"宝箱里闪闪发光。你的口袋突然变得好重。"}},
 {t:"小心地撬一条缝",d:"<span class='good'>+60 金币</span>，<span class='bad'>失去 8 生命</span>",ok:S.hp>8,f:()=>{S.hp-=8;S.gold+=60;sfx("coin");return"缝里夹出来一把金币，铁链弹了你一下。"}},
 {t:"不碰它",d:"",f:()=>"有些东西，还是不要碰比较好。"}]},
dummy:{n:"训练木桩",img:"n3",t:"空地上立着一排木桩，上面密密麻麻全是拳印。",o:()=>[
 {t:"打一百拳",d:"<span class='good'>随机升级 2 张牌</span>，<span class='bad'>失去 7 生命</span>",ok:S.hp>7,f:()=>{S.hp-=7;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,2);l.forEach(c=>c.u=1);upFx(l);return`拳头肿了，但升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"对着木桩冥想",d:"<span class='good'>+3 经验，回复 8 生命</span>",f:async()=>{S.hp=Math.min(S.max,S.hp+8);await gainXP(3);return"你和木桩对视了一个下午，好像明白了什么。"}}]},
lantern:{n:"熄掉的灯",img:"ct",act:0,t:"沼泽边的木桩上挂着一盏灯，灯芯还是湿的。",o:()=>[
 {t:"把它点亮",d:"<span class='good'>+4 经验</span>",f:async()=>{await gainXP(4);return"灯亮了一会儿。远处好像有谁朝这边挥了挥手。"}},
 {t:"倒出灯油",d:"<span class='good'>+45 金币</span>",f:()=>{S.gold+=45;sfx("coin");return"灯油卖了个好价钱。"}},
 {t:"别碰它",d:"",f:()=>"你走过去的时候，灯晃了一下。"}]},
nametags:{n:"一堆木牌",img:"m2",act:0,t:"路边堆着很多小木牌，每块上面都刻着一个名字。",o:()=>[
 {t:"翻一翻",d:"<span class='good'>+3 经验</span>",f:async()=>{await gainXP(3);return"你没找到小七的名字。也可能是还没翻完。"}},
 {t:"刻上自己的名字",d:"<span class='good'>最大生命 +6</span>",f:()=>{S.max+=6;S.hp+=6;return"刻完以后，你觉得自己结实了一点。"}},
 {t:"走开",d:"",f:()=>"木牌太多了。"}]},
portraitroom:{n:"画像室",img:"fbcc",act:1,t:"一间只挂着画的房间。角落有一个空画框，下面写着今天的日期。",o:()=>[
 {t:"站到画框前面",d:"<span class='good'>获得一件稀有遗物</span>，<span class='bad'>最大生命 -6</span>",f:()=>{S.max=Math.max(20,S.max-6);S.hp=Math.min(S.hp,S.max);gainRelic(randRelic("R"));return"画框里映出了你。你赶紧走开，口袋里多了个东西。"}},
 {t:"把画框砸了",d:"<span class='good'>+35 金币</span>",f:()=>{S.gold+=35;sfx("coin");return"砸碎以后，隔壁房间有人叹了口气。"}},
 {t:"离开",d:"",f:()=>"门在你身后自己关上了。"}]},
teaparty:{n:"茶会",img:"ctp",act:1,t:"长桌边坐满了客人，都低着头，没有人说话。主位空着。",o:()=>[
 {t:"坐下喝一杯",d:"<span class='good'>回满生命</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.hp=S.max;addCard(mk("heavy"));return"茶很好喝。你走的时候，没有人抬头。"}},
 {t:"拿走桌上的点心",d:"<span class='good'>获得 2 瓶药水</span>",f:()=>{givePot(randPot());givePot(randPot());return"点心是热的。"}},
 {t:"离开",d:"",f:()=>"你轻轻把门带上了。"}]},
frozenline:{n:"冰里的队伍",img:"c7",act:2,t:"冰层下面，一排奶蛙排着队，都朝着同一个方向。",o:()=>[
 {t:"敲敲冰",d:"<span class='good'>+5 经验</span>，<span class='bad'>失去 5 生命</span>",ok:S.hp>5,f:async()=>{S.hp-=5;await gainXP(5);return"最前面那只好像动了一下。应该是看错了。"}},
 {t:"顺着它们的方向走",d:"<span class='good'>下一个宝箱一定是金宝箱</span>",f:()=>{S.flags.goldChest=1;return"它们看的方向，确实有东西。"}},
 {t:"离开",d:"",f:()=>"你没有回头。"}]},
bellrope:{n:"钟绳",img:"egsk",act:2,t:"一根绳子从上面垂下来。拉一下，钟就会响。",o:()=>[
 {t:"拉一下",d:"<span class='good'>随机升级 1 张牌</span>",f:()=>{const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,1);l.forEach(c=>c.u=1);upFx(l);return`钟响了。村里应该听得见。升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"拉很多下",d:"<span class='good'>随机升级 3 张牌</span>，<span class='bad'>失去 10 生命</span>",ok:S.hp>10,f:()=>{S.hp-=10;const l=shuffle(S.deck.filter(c=>!c.u&&!["cur","sts"].includes(CARDS[c.id].type))).slice(0,3);l.forEach(c=>c.u=1);upFx(l);return`钟一直响。你停下来以后，它又自己响了一下。升级了：${l.map(cname).join("、")||"没有"}。`}},
 {t:"别拉",d:"",f:()=>"绳子自己晃了晃。"}]},
warehouse:{n:"仓库",img:"cty",act:3,t:"奶茶厂的仓库，门没有锁。里面很暖和，堆满了麻袋。",o:()=>[
 {t:"翻麻袋",d:"<span class='good'>+80 金币</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{S.gold+=80;addCard(mk("heavy"));sfx("coin");return"麻袋里有金币，也有别的东西。你没细看。"}},
 {t:"拿一袋珍珠",d:"<span class='good'>获得遗物「珍珠袋」</span>",f:()=>{if(!has("pearlbag"))gainRelic("pearlbag");else S.gold+=40;return"珍珠圆圆的，有点软。"}},
 {t:"关上门",d:"",f:()=>"门关上以后，里面好像有什么在动。"}]},
conveyor:{n:"传送带",img:"cup",act:3,t:"传送带一直往上走，上面是一个个封好的杯子。",o:()=>[
 {t:"喝一杯",d:"<span class='good'>最大生命 +8</span>，<span class='bad'>获得诅咒「沉重」</span>",f:()=>{ach("sweet");S.max+=8;S.hp+=8;addCard(mk("heavy"));return"很甜。你不太想知道为什么这么甜。"}},
 {t:"关掉传送带",d:"<span class='good'>+4 经验</span>，<span class='bad'>失去 6 生命</span>",ok:S.hp>6,f:async()=>{S.hp-=6;await gainXP(4);return"整个工厂安静了几秒，然后又响了起来。"}},
 {t:"离开",d:"",f:()=>"杯子一个接一个往上走。"}]},
starmap:{n:"星图",img:"egf",act:4,t:"地上画着一张星图，有些星星被划掉了。",o:()=>[
 {t:"研究星图",d:"<span class='good'>从 3 张稀有牌里选 1 张</span>",f:async()=>{await chooseReward(offerCards(3,"E",1),"星图上画着招式",false);return"你记住了几颗星星的位置。"}},
 {t:"划掉一颗",d:"<span class='good'>获得一件稀有遗物</span>",f:()=>{gainRelic(randRelic("R"));return"你划掉的那颗，好像正好在村子上面。"}},
 {t:"离开",d:"",f:()=>"星星还在闪。"}]},
isekaigate:{n:"异世界之门",img:"yjx",rare:1,t:"墙上裂开一道缝，透出很亮的光。光里探出来一个猫耳朵、穿女仆装的家伙，左右看了看，小声问你：「这里……不是那个大家拿着网到处抓奶蛙的地方吧？」看你一脸疑惑，它解释：「我原来也是只奶蛙。去了一趟异世界，回来就变成这样了。在那边被抓了好多次，今天门开了，我就跑过来了。」",o:()=>[
 {t:"帮它回去",d:"<span class='good'>获得遗物「另一个世界的奶蛙球」</span>，<span class='bad'>花 30 金币修门</span>",ok:S.gold>=30,f:()=>{S.gold-=30;if(!has("otherball"))gainRelic("otherball");else S.gold+=60;return"你帮它把门撑开。它钻回去之前，塞给你一个圆圆的球：「那边的人就是用这个抓我的。送你吧，我用不上了。」光一下子合上了。"}},
 {t:"让它跟着你",d:"<span class='good'>伙伴卡「异世界传送」和 1 张异世界招式加入牌组</span>，<span class='bad'>失去 6 生命</span>",ok:S.hp>6,f:()=>{S.hp-=6;addCard(mk("p_yjx"));addCard(mk(pick(["x_reborn","x_rules","x_otherside","x_tray","x_nekoimpact"])));return"它想了想：「反正回去也是被抓，我先跟你走一段。」它跳下来的时候踩了你一脚，又塞给你一张它那边的招式。"}},
 {t:"把它抓了",d:"<span class='bad'>和它打一场</span>，<span class='good'>赢了有稀有遗物；抓住它有隐藏成就</span>",f:async()=>{await talk([["yjx","异世界奶蛙","……"],["yjx","异世界奶蛙","怎么到哪都一样啊。"]]);S.cur={t:"E",rs:S.rs};S.pendGrp=["isekaiX"];S.isekaiFight=1;startCombat("E");return null}}]},
emptychair:{n:"空王座",img:"bx",act:4,t:"塔顶边上立着一张旧王座，靠背上刻着很多名字。",o:()=>[
 {t:"坐一会儿",d:"<span class='good'>回复 20 生命，+3 经验</span>",f:async()=>{S.hp=Math.min(S.max,S.hp+20);await gainXP(3);return"王座是温的，坐上去就不想起来。你赶紧站了起来。"}},
 {t:"看看那些名字",d:"<span class='good'>立刻选一个天赋</span>",f:async()=>{await levelUp("靠背上的名字");return"最上面的名字已经磨平了。最下面那个还很新。"}},
 {t:"离开",d:"",f:()=>"你走开以后，王座还在原地，靠背上好像多了一道划痕。"}]},
candykid:{n:"卖糖的小奶鼠",img:"msj",t:"路边有一只小奶鼠在卖糖，一块 10 金币。",o:()=>[
 {t:"买一块",d:"<span class='good'>回复 10 生命</span>，花 10 金币",ok:S.gold>=10,f:()=>{S.gold-=10;S.hp=Math.min(S.max,S.hp+10);return"糖很甜。"}},
 {t:"全买了",d:"<span class='good'>获得遗物「方糖」</span>，花 40 金币",ok:S.gold>=40,f:()=>{S.gold-=40;if(!has("sugarcube"))gainRelic("sugarcube");else S.hp=S.max;return"它数钱数了很久。"}},
 {t:"问它爸妈在哪",d:"<span class='good'>+2 经验</span>",f:async()=>{await gainXP(2);return"它说爸妈去塔顶上班了，很快就回来。"}}]},
mirrorpond:{n:"镜子一样的水",img:"bnl",t:"水面很平，映出来的你在笑。你没有笑。",o:()=>[
 {t:"盯着看",d:"<span class='good'>从 3 张牌里选 1 张</span>",f:async()=>{await chooseReward(offerCards(3,"C"),"水里的你在比划招式",false);return"水里的你先转身走了。"}},
 {t:"扔块石头",d:"<span class='good'>+30 金币</span>，<span class='bad'>失去 3 生命</span>",ok:S.hp>3,f:()=>{S.hp-=3;S.gold+=30;return"水花溅起来，打湿了你。水底有几枚硬币。"}},
 {t:"走开",d:"",f:()=>"你走了几步，水里的你没有跟上。"}]},
oldclimber:{n:"老登山者",img:"m5",t:"一只很老的奶蛙坐在台阶上，说他爬了一辈子。",o:()=>[
 {t:"听他说",d:"<span class='good'>+4 经验</span>",f:async()=>{await gainXP(4);return"他说他第一次来的时候，塔只有三层。"}},
 {t:"给他 30 金币",d:"<span class='good'>获得一件遗物</span>",ok:S.gold>=30,f:()=>{S.gold-=30;gainRelic(randRelic("C"));return"他从怀里掏出一个旧东西给你，说用不上了。"}},
 {t:"问他为什么不下山",d:"",f:()=>"他想了很久，说忘了下山的路怎么走。"}]},
cupgame:{n:"猜杯子",img:"dg",t:"一只奶狗摆了三个杯子，说猜中有奖。押 30 金币。",o:()=>[
 {t:"押 30 金币",d:"三分之一机会拿回 <span class='good'>110 金币</span>",ok:S.gold>=30,f:()=>{S.gold-=30;if(rnd()<1/3){S.gold+=110;sfx("coin");return"猜中了！奶狗的笑容僵了一下。"}return"杯子下面是空的。三个都是。"}},
 {t:"掀翻桌子",d:"<span class='good'>+25 金币</span>，<span class='bad'>失去 6 生命</span>",ok:S.hp>6,f:()=>{S.hp-=6;S.gold+=25;return"奶狗咬了你一口，跑了。地上掉了些钱。"}},
 {t:"不玩",d:"",f:()=>"奶狗冲你笑了笑。"}]},
ragdoll:{n:"布娃娃",img:"n2",t:"路上掉着一个布娃娃，缝的是一只小奶蛙，背后绣着一个「七」字。",o:()=>[
 {t:"带上它",d:"<span class='good'>最大生命 +6，回复 6 生命</span>",f:()=>{S.max+=6;S.hp=Math.min(S.max,S.hp+12);S.flags.doll=1;return"抱着它，好像没那么怕了。"}},
 {t:"放回原处",d:"<span class='good'>+3 经验</span>",f:async()=>{await gainXP(3);return"也许它的主人会回来找。"}}]},
fishing:{n:"钓鱼",img:"c3",t:"一根钓竿插在池塘边，主人不知去哪了。水面下有东西在游来游去。",o:()=>[
 {t:"钓一杆",d:"随机：金币、药水、卡牌，或者，一块泥巴",f:()=>{const r=rnd();if(r<.3){S.gold+=40;return"钓上来一个钱袋！+40 金币"}if(r<.55){givePot(randPot());return"钓上来一瓶药水。"}if(r<.85){const c=offerCards(1,"C")[0];addCard(c);return`钓上来一张卡：「${cname(c)}」。`}addCard(mk("mud"));return"钓上来一块泥巴，它粘在你的牌组里了。"}},
 {t:"钓到天黑",d:"<span class='good'>钓三次</span>，<span class='bad'>失去 6 生命（着凉了）</span>",ok:S.hp>6,f:()=>{S.hp-=6;let s=[];for(let i=0;i<3;i++){const r=rnd();if(r<.4){S.gold+=30;s.push("30 金币")}else if(r<.7){givePot(randPot());s.push("药水")}else{const c=offerCards(1,"C")[0];addCard(c);s.push(cname(c))}}return"收获："+s.join("、")+"。"}},
 {t:"不钓了",d:"",f:()=>"你把钓竿插回原处。"}]},
horserace:{n:"奶马赛跑",img:"hrg",t:"一群奶马在空地上比赛跑步，旁边围着一圈下注的观众。",o:()=>[
 {t:"押 30 金币",d:"一半机会赢 <span class='good'>80 金币</span>",ok:S.gold>=30,f:()=>{S.gold-=30;if(rnd()<.5){S.gold+=80;sfx("coin");return"你押的那匹奶马冲过了终点！"}return"你押的那匹跑到一半停下来吃草了。"}},
 {t:"自己上场",d:"<span class='good'>+3 经验，升级一张奶马牌</span>，<span class='bad'>失去 6 生命</span>",ok:S.hp>6,f:async()=>{S.hp-=6;await gainXP(3);const l=S.deck.filter(c=>!c.u&&CARDS[c.id].fam==="horse");if(l.length){const c=pick(l);c.u=1;upFx([c]);return`你跑赢了奶马！「${cname(c)}」升级了。`}return"你跑赢了奶马，大家都看呆了。"}},
 {t:"在旁边看",d:"",f:()=>"真热闹。"}]},
fortune:{n:"占卜奶猫",img:"ctf",t:"一只披着星星斗篷的奶猫坐在水晶球后面：「喵，让我看看你的命运。」",o:()=>[
 {t:"算一卦（20 金币）",d:"随机：<span class='good'>一个天赋</span>，或 <span class='bad'>失去 6 生命</span>",ok:S.gold>=20,f:async()=>{S.gold-=20;if(rnd()<.6){await levelUp("好运来了");return"「喵～你会越来越强。」"}S.hp=Math.max(1,S.hp-6);return"「喵，今天不宜出门。」水晶球砸到了你的脚。"}},
 {t:"问问前路",d:"<span class='good'>下一个宝箱一定是金宝箱</span>",f:()=>{S.flags.goldChest=1;return"「往前走，金光在等你。」"}},
 {t:"不信这个",d:"",f:()=>"奶猫耸耸肩，继续盯着水晶球。"}]},
wedding:{n:"奶蛙婚礼",img:"xb",t:"一场热闹的奶蛙婚礼正在举行，新娘穿着白纱，宾客们端着奶茶碰杯。",o:()=>[
 {t:"送份礼（30 金币）",d:"<span class='good'>回复 15 生命，获得一件普通遗物</span>",ok:S.gold>=30,f:()=>{S.gold-=30;S.hp=Math.min(S.max,S.hp+15);gainRelic(randRelic("C"));return"新娘笑着回赠了你一件小礼物。"}},
 {t:"抢捧花",d:"<span class='good'>获得伙伴卡「新娘捧花」</span>",f:()=>{addCard(mk("p_xb"));return"你一跃而起，接住了捧花！全场欢呼。"}},
 {t:"蹭一顿饭",d:"<span class='good'>最大生命 +5</span>",f:()=>{S.max+=5;S.hp+=5;return"喜宴真好吃，你吃得肚子圆滚滚。"}}]},
vamp:{n:"路过的吸血鬼",img:"vp",act:0,t:"一只披着斗篷的奶蛙从天上落下来，舔了舔尖牙。「别怕，我只是路过，顺便饿了。」",o:()=>[
 {t:"让它咬一口",cf:"vampBit",d:"<span class='bad'>最大生命 -8</span>，<span class='good'>获得遗物「吸血鬼披风」</span>",f:()=>{S.max-=8;S.hp=Math.min(S.hp,S.max);gainRelic("cape");return"「谢啦！这件披风送你，上面那层见。」它飞走了。"}},
 {t:"请它喝奶茶",cf:"vampTea",d:"<span class='good'>获得「吸血鬼之吻」×2</span>",f:()=>{addCard(mk("kiss"));addCard(mk("kiss"));return"「奶茶，好像也不错？」它教了你两招才走。"}},
 {t:"赶快跑",d:"",f:()=>"你跑得飞快。身后传来一句：「上面见哦～」"}]},
};
function eventScreen(){show("event");setBg("event");playMusic("space");
 let pool=Object.keys(EVENTS).filter(k=>!EVENTS[k].rare&&!S.evSeen.includes(k)&&(EVENTS[k].act==null||EVENTS[k].act===S.act));if(!pool.length)pool=Object.keys(EVENTS).filter(k=>!EVENTS[k].rare);if(S.relics.includes("pup"))pool=pool.filter(k=>k!=="pup");
 if(!S.cur.ev&&(S.act||0)>=1&&!S.flags.isekai&&rnd()<.04){S.cur.ev="isekaigate";S.flags.isekai=1}const id=S.cur.ev||(S.cur.ev=pick(pool));if(id==="isekaigate"){ach("isekai");M.isekaiMet=1;saveMeta()}saveRun();const E=EVENTS[id];if(!S.evSeen.includes(id))S.evSeen.push(id);const opts=E.o();
 $("#event").innerHTML=`<div class="evBox"><div class="phead"><span class="ribbon">${E.n}</span></div><div class="evPic"><img src="${IMG(E.img)}"></div><div class="evTxt"><p id="evP">${E.t}</p><div class="evOpts">${opts.map((o,i)=>`<button class="evo" data-i="${i}" ${o.ok===false?"disabled":""}><b>${o.t}</b><small>${o.d}</small></button>`).join("")}</div></div></div>`;
 $$("#event .evo").forEach(b=>b.onclick=async()=>{if(b.dataset.busy)return;b.dataset.busy=1;const op=opts[+b.dataset.i];const r=await op.f();if(r==null){delete b.dataset.busy;return}if(op.cf){S.flags[op.cf]=1}sfx("click");renderTop();S.cur=null;saveRun();
  $("#evP").textContent=r;$(".evOpts").innerHTML=`<button class="evo" id="evGo"><b>继续前进</b></button>`;$("#evGo").onclick=openMap})}

/* ===================== 启动 ===================== */
$("#stage").addEventListener("scroll",e=>{e.target.scrollTop=0;e.target.scrollLeft=0});
fit();titleScreen();
/* 防卡死：任何报错都不该让游戏永远停住 */
let busySince=0;setInterval(()=>{if(!busy){busySince=0;return}if(!busySince){busySince=Date.now();return}
 const talking=$("#talk").classList.contains("on")||$("#ov").classList.contains("on");
 if(!talking&&Date.now()-busySince>8000){busy=false;busySince=0;try{if(B&&!B.over){if(!B.alive().length)win();else{B.myTurn=true;$("#endBtn").classList.remove("wait");renderBattle()}}}catch(e){}}},1000);
addEventListener("error",()=>{setTimeout(()=>{if(busy&&!$("#talk").classList.contains("on")&&!$("#ov").classList.contains("on")){busy=false;try{if(B&&!B.over&&!B.alive().length)win();else if(B&&!B.over){B.myTurn=true;renderBattle()}}catch(e){}}},1500)});
addEventListener("unhandledrejection",()=>{setTimeout(()=>{if(busy&&!$("#talk").classList.contains("on")&&!$("#ov").classList.contains("on")){busy=false;try{if(B&&!B.over&&!B.alive().length)win();else if(B&&!B.over){B.myTurn=true;renderBattle()}}catch(e){}}},1500)});CLOUD.init().then(()=>{const c=$("#cloudSt");if(c)c.textContent=CLOUD.txt()});
window.__dbg={get S(){return S},get B(){return B},startCombat,openMap,enterNode,newRun,win:()=>{B.enemies.forEach(e=>e.hp=0);afterAction()},CARDS};
