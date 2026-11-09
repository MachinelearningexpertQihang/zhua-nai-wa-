/* ===================== B站 Toy 平台适配 =====================
   云存档：toy.getCloudStorage / toy.setCloudStorage（抓奶蛙已验证）
   成就全服统计：平台「共享存档」，接口名自动检测；不可用时只显示本地数据
   没有平台（直接打开网页）时全部自动跳过，游戏照常运行 */
const TOY={ok:false,
 async wait(){if(!window.toy&&!document.querySelector('script[src*="toy-sdk"]'))return(this.ok=false);for(let i=0;i<60&&!window.toy;i++)await new Promise(r=>setTimeout(r,300));this.ok=!!window.toy;
  if(this.ok){try{if(toy.setContainerMode)toy.setContainerMode({orientation:"landscape"})}catch(e){}}return this.ok},
 keys(){const t=window.toy;if(!t)return[];const s=new Set();let o=t;for(let i=0;i<3&&o;i++){try{Object.getOwnPropertyNames(o).forEach(k=>s.add(k))}catch(e){}o=Object.getPrototypeOf(o)}return[...s].filter(k=>{try{return typeof t[k]==="function"&&k!=="constructor"}catch(e){return false}})},
 fn(list,re){const t=window.toy;if(!t)return null;for(const n of list)if(typeof t[n]==="function")return n;return re?this.keys().find(k=>re.test(k))||null:null},
 lim(e){return !!(e&&(e.code===307044||String(e.message||"").indexOf("307044")>=0))},
 timeout(p,ms){return Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error("timeout")),ms))])}};

/* ---------- 存档保护 ----------
   1) 进度比较按「进度量」而不是保存时间：新设备 / 缓存被清时的空进度，永远不会盖掉云端
   2) 本地再存一份 IndexedDB 备份：localStorage 被清了也能找回
   3) 云存档连接失败会重试；关键节点几秒内就上传；切后台 / 关闭时立刻上传 */
function nwProg(m){if(!m)return 0;const n=o=>o&&typeof o==="object"?Object.keys(o).length:0;let p=(m.runs||0)*10+(m.deaths||0)*10+(m.wins||0)*50+n(m.got)*2+n(m.ach)*5+n(m.boss)*5+(m.shardsAll||0)+(m.kills||0)/10;try{Object.values(m.mast||{}).forEach(v=>p+=(+v||0)/5)}catch(e){}return Math.round(p)}
const NWB={t:0,
 open(){return new Promise((res,rej)=>{try{const r=indexedDB.open("nwt-backup",1);r.onupgradeneeded=()=>r.result.createObjectStore("kv");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}catch(e){rej(e)}})},
 save(){clearTimeout(this.t);this.t=0;let m=null,s=null;try{m=localStorage.getItem("nwt-meta");s=localStorage.getItem("nwt-run")}catch(e){}if(!m)return;
  this.open().then(db=>{const tx=db.transaction("kv","readwrite");tx.objectStore("kv").put({t:Date.now(),m,s},"s");tx.oncomplete=tx.onerror=()=>db.close()}).catch(()=>{})},
 soon(){if(!this.t)this.t=setTimeout(()=>this.save(),1500)},
 load(){return this.open().then(db=>new Promise(res=>{const tx=db.transaction("kv","readonly");const r=tx.objectStore("kv").get("s");r.onsuccess=()=>{res(r.result||null);db.close()};r.onerror=()=>{res(null);db.close()}})).catch(()=>null)},
 async restore(){const o=await TOY.timeout(this.load(),3000).catch(()=>null);if(!o||!o.m)return false;let bm=null;try{bm=JSON.parse(o.m)}catch(e){return false}
  if(nwProg(bm)<=nwProg(M))return false;
  Object.keys(M).forEach(k=>delete M[k]);Object.assign(M,bm);try{localStorage.setItem("nwt-meta",o.m);if(o.s&&!localStorage.getItem("nwt-run"))localStorage.setItem("nwt-run",o.s)}catch(e){}
  return true}};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().catch(()=>{})}catch(e){}

/* ---------- 云存档 ---------- */
const CLOUD={st:"off",dirty:false,busy:false,last:[],back:0,fail:0,lastUp:0,timer:0,tries:0,pend:null,
 has(){return !!(window.toy&&toy.getCloudStorage&&toy.setCloudStorage)},
 pack(){const s=JSON.stringify({v:1,t:Date.now(),m:M,s:S||null}).replace(/[\u007f-￿]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));const ch=[];for(let i=0;i<s.length;i+=1000)ch.push(s.slice(i,i+1000));return ch},
 idle(){return typeof S==="undefined"||!S},
 async init(){if(this.st!=="off"&&this.st!=="retry")return;this.st="wait";
  try{if(await NWB.restore()&&this.idle()&&typeof titleScreen==="function"&&$("#title").classList.contains("on")){titleScreen();if(typeof toast==="function")toast("已从本机备份找回你的存档")}}catch(e){}
  if(!await TOY.wait()||!this.has()){this.st="none";return}
  let o=null,meta=null;
  try{const r=await TOY.timeout(toy.getCloudStorage(["tw_m"]),8000);meta=r&&r.tw_m?JSON.parse(r.tw_m):null;
   if(meta&&meta.n&&meta.n<=120){const keys=[...Array(meta.n)].map((_,i)=>"tw_"+i);const r2=await TOY.timeout(toy.getCloudStorage(keys),10000);
    const parts=keys.map(k=>(r2&&r2[k])||"");try{o=JSON.parse(parts.join(""))}catch(e){o=null}if(o&&o.m)this.last=parts}}
  catch(e){if(TOY.lim(e)){this.st="off";setTimeout(()=>this.init(),30000);return}
   this.tries++;if(this.tries<5){this.st="retry";setTimeout(()=>{if(this.st==="retry")this.init()},[3000,8000,20000,60000][this.tries-1]);return}this.st="nologin";return}
  this.tries=0;
  if(o&&o.m){const cp=nwProg(o.m),lp=nwProg(M);
   if(cp>lp){if(this.idle())this.apply(o);else{this.pend=o;this.st="ask";this.askLater();return}}
   else if(o.s&&o.s.v===2&&this.idle()){let lr=null;try{lr=JSON.parse(localStorage.getItem("nwt-run")||"null")}catch(e){}
    if(!lr&&cp===lp||lr&&(o.s.ts||0)>(lr.ts||0)+3000){try{localStorage.setItem("nwt-run",JSON.stringify(o.s))}catch(e){}if($("#title").classList.contains("on"))titleScreen()}}}
  this.st="on";this.hot()},
 apply(o){Object.keys(M).forEach(k=>delete M[k]);Object.assign(M,o.m);try{localStorage.setItem("nwt-meta",JSON.stringify(M));if(o.s&&o.s.v===2)localStorage.setItem("nwt-run",JSON.stringify(o.s));else localStorage.removeItem("nwt-run")}catch(e){}
  NWB.save();if(typeof titleScreen==="function"&&$("#title").classList.contains("on"))titleScreen();if(typeof toast==="function")toast("已从云端找回你的存档")},
 askLater(){const go=()=>{if(this.st!=="ask"||!this.pend)return;if(!this.idle()||!$("#title").classList.contains("on")||$("#ov").classList.contains("on")){setTimeout(go,1500);return}
   const o=this.pend;this.pend=null;this.apply(o);this.st="on";this.hot()};go()},
 sched(ms,force){const due=Date.now()+ms;if(this.timer&&this.due<=due)return;clearTimeout(this.timer);this.due=due;this.timer=setTimeout(()=>{this.timer=0;this.up(force)},ms)},
 hot(){if(this.st!=="on")return;this.dirty=true;this.sched(Math.max(2000,this.lastUp+8000-Date.now(),this.back||0),true)},
 mark(){if(this.st!=="on")return;this.dirty=true;this.sched(Math.max(5000,this.lastUp+25000-Date.now(),this.back||0),false)},
 async up(force){if(this.st!=="on"||this.busy||!this.dirty)return;if(!force&&Date.now()-this.lastUp<8000){this.mark();return}
  this.busy=true;this.dirty=false;
  try{const ch=this.pack();if(ch.length>120){this.st="big";return}const items={};ch.forEach((c,i)=>{if(this.last[i]!==c)items["tw_"+i]=c});
   items.tw_m=JSON.stringify({v:1,n:ch.length,t:Date.now(),p:nwProg(M)});await TOY.timeout(toy.setCloudStorage(items),10000);this.last=ch;this.lastUp=Date.now();this.back=0;this.fail=0}
  catch(e){this.dirty=true;if(TOY.lim(e))this.back=Math.min((this.back||15000)*2,600000);else{this.fail++;this.back=15000*this.fail}if(this.fail>=6)this.st="nologin";else this.mark()}
  finally{this.busy=false}},
 txt(){const t=this.lastUp?new Date(this.lastUp):null;return{on:"☁ 云存档已开启"+(t?"　上次同步 "+t.getHours()+":"+String(t.getMinutes()).padStart(2,"0"):""),wait:"☁ 正在连接云存档",retry:"☁ 正在重新连接云存档",ask:"☁ 云端有进度更多的存档，回到主页会自动恢复",nologin:"☁ 登录 B站 后可开启云存档（现在只存在这台设备上）",big:"☁ 存档太大，暂时只存本地",none:"",off:""}[this.st]||""}};
const nwFlush=()=>{try{if(typeof S!=="undefined"&&S&&typeof saveRun==="function")saveRun()}catch(e){}NWB.save();if(CLOUD.dirty)CLOUD.up(true)};
document.addEventListener("visibilitychange",()=>{if(document.hidden)nwFlush();else if(CLOUD.st==="nologin"){CLOUD.st="off";CLOUD.tries=0;CLOUD.fail=0;CLOUD.init()}});
addEventListener("pagehide",nwFlush);

/* ---------- 成就全服统计 ----------
   官方 SDK 的共享存档只在「同一玩家的多个 Toy」之间共享，不跨玩家，排行榜也不返回总人数，
   所以全服百分比暂时做不了；这里保留空实现，成就只记在本地并跟随云存档同步。 */
const GSTAT={detect(){return null},load(){return Promise.resolve(null)},add(){return Promise.resolve()},pct(){return null},txt(){return""}};

/* ---------- 全服排行榜（和抓奶蛙同一套 Toy 接口） ----------
   board 1：爬塔积分；board 2：最痛一击（单次最高伤害） */
const LB={cache:{},
 ok(){return !!(window.toy&&toy.getRankList&&toy.submitScore)},
 BOARDS:{1:{n:"爬塔积分",u:"分",d:"爬得越高、首领打得越多、难度越高，分越高"},2:{n:"最痛一击",u:"点",d:"一局里打出的单次最高伤害"}},
 score(win){if(!S)return 0;const fl=(S.act||0)*(ROWS+1)+Math.max(0,S.row)+1;const mul={easy:.5,normal:1,hard:1.6}[S.diff||"normal"]||1;return Math.round((fl*10+(S.stats.endb||0)*50+(win?300:0))*mul+asc()*80)},
 submit(b,score){score=Math.floor(score||0);if(score<=0)return;M.lbBest=M.lbBest||{};if(score>(M.lbBest[b]||0)){M.lbBest[b]=score;saveMeta()}if(!this.ok())return;toy.submitScore({board:b,score}).then(()=>{for(const k in this.cache)if(k.indexOf(b+"|")===0)delete this.cache[k]}).catch(()=>{})},
 onRunEnd(win){try{this.submit(1,this.score(win));this.submit(2,(S&&S.stats&&S.stats.maxHit)||0)}catch(e){}},
 async get(b,per){const k=b+"|"+per,c=this.cache[k];if(c&&Date.now()-c.t<60000)return c;const o={t:Date.now(),list:[],me:null};
  try{const R=await Promise.all([TOY.timeout(toy.getRankList({board:b,period:per,limit:50}),8000).then(x=>x||[],()=>null),toy.getMyRank?TOY.timeout(toy.getMyRank({board:b,period:per}),8000).catch(()=>null):Promise.resolve(null)]);if(R[0]===null)o.err=1;else o.list=R[0];o.me=R[1]}catch(e){o.err=1}if(!o.err)this.cache[k]=o;return o}};
function cleanName(s){return String(s||"奶蛙").replace(/[<>&"]/g,"").slice(0,12)}
async function rankScreen(){let b=1,per="week";
 const draw=async()=>{const B0=LB.BOARDS[b];ov(`<div class="lbBox"><div class="mgHead"><span class="ribbon b">排行榜</span></div><div class="lbTabs">${Object.entries(LB.BOARDS).map(([k,v])=>`<button class="${+k===b?"on":""}" data-b="${k}">${v.n}</button>`).join("")}<span class="lbSep"></span>${[["week","本周"],["all","总榜"]].map(([k,v])=>`<button class="${k===per?"on":""}" data-p="${k}">${v}</button>`).join("")}</div><p class="lbDesc">${B0.d}</p><div class="lbList" id="lbList"><p class="lbMsg">${LB.ok()?"正在读取全服排名……":"全服排行榜要在 B站 Toy 里打开才能看到。"}</p></div><div class="lbMe">我的最好成绩：<b>${(M.lbBest||{})[b]||0}</b> ${B0.u}</div><div class="ovFoot"><button class="btn sm" id="ovX">返回</button></div></div>`);
  $$("#ov .lbTabs [data-b]").forEach(x=>x.onclick=()=>{b=+x.dataset.b;sfx("click");draw()});$$("#ov .lbTabs [data-p]").forEach(x=>x.onclick=()=>{per=x.dataset.p;sfx("click");draw()});$("#ovX").onclick=closeOv;
  if(!LB.ok())return;const o=await LB.get(b,per);const el=$("#lbList");if(!el)return;
  if(o.err){el.innerHTML=`<p class="lbMsg">全服榜暂时连不上，稍后再试。</p>`;return}
  if(!o.list.length){el.innerHTML=`<p class="lbMsg">还没有人上榜。打一局，你就是第一名。</p>`;return}
  el.innerHTML=o.list.map((r,i)=>{const nm=cleanName(r.nickname),a=r.avatar?(String(r.avatar).indexOf("//")===0?"https:"+r.avatar:r.avatar):"";return`<div class="lbRow ${i<3?"top"+(i+1):""}"><b class="lbR">${r.rank||i+1}</b><span class="lbAv">${a?`<img referrerpolicy="no-referrer" src="${a.replace(/"/g,"")}" onerror="this.remove()">`:nm.slice(0,1)}</span><span class="lbN">${nm}</span><b class="lbS">${r.score} <small>${B0.u}</small></b></div>`}).join("");
  const me=$("#ov .lbMe");if(me&&o.me&&o.me.ranked)me.innerHTML+=`　全服第 <b>${o.me.rank}</b> 名`};
 draw()}
