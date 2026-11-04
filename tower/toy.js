/* ===================== B站 Toy 平台适配 =====================
   云存档：toy.getCloudStorage / toy.setCloudStorage（抓奶蛙已验证）
   成就全服统计：平台「共享存档」，接口名自动检测；不可用时只显示本地数据
   没有平台（直接打开网页）时全部自动跳过，游戏照常运行 */
const TOY={ok:false,
 async wait(){for(let i=0;i<60&&!window.toy;i++)await new Promise(r=>setTimeout(r,300));this.ok=!!window.toy;
  if(this.ok){try{if(toy.setContainerMode)toy.setContainerMode({orientation:"landscape"})}catch(e){}}return this.ok},
 keys(){const t=window.toy;if(!t)return[];const s=new Set();let o=t;for(let i=0;i<3&&o;i++){try{Object.getOwnPropertyNames(o).forEach(k=>s.add(k))}catch(e){}o=Object.getPrototypeOf(o)}return[...s].filter(k=>{try{return typeof t[k]==="function"&&k!=="constructor"}catch(e){return false}})},
 fn(list,re){const t=window.toy;if(!t)return null;for(const n of list)if(typeof t[n]==="function")return n;return re?this.keys().find(k=>re.test(k))||null:null},
 lim(e){return !!(e&&(e.code===307044||String(e.message||"").indexOf("307044")>=0))},
 timeout(p,ms){return Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error("timeout")),ms))])}};

/* ---------- 云存档 ---------- */
const CLOUD={st:"off",dirty:false,busy:false,last:[],back:0,fail:0,lastUp:0,timer:0,
 has(){return !!(window.toy&&toy.getCloudStorage&&toy.setCloudStorage)},
 pack(){const s=JSON.stringify({v:1,t:Date.now(),m:M,s:S||null}).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));const ch=[];for(let i=0;i<s.length;i+=1000)ch.push(s.slice(i,i+1000));return ch},
 async init(){if(this.st!=="off")return;this.st="wait";
  if(!await TOY.wait()||!this.has()){this.st="none";return}
  try{const r=await TOY.timeout(toy.getCloudStorage(["tw_m"]),8000);const meta=r&&r.tw_m?JSON.parse(r.tw_m):null;
   if(meta&&meta.n&&meta.n<=120){const keys=[...Array(meta.n)].map((_,i)=>"tw_"+i);const r2=await TOY.timeout(toy.getCloudStorage(keys),10000);
    const txt=keys.map(k=>(r2&&r2[k])||"").join("");let o=null;try{o=JSON.parse(txt)}catch(e){}
    if(o&&o.m){this.last=keys.map(k=>(r2&&r2[k])||"");
     const mine=M.t||0,theirs=(o.m&&o.m.t)||0;
     if(theirs>mine+3000){Object.keys(M).forEach(k=>delete M[k]);Object.assign(M,o.m);try{localStorage.setItem("nwt-meta",JSON.stringify(M))}catch(e){}
      if(o.s&&o.s.v===2){try{localStorage.setItem("nwt-run",JSON.stringify(o.s))}catch(e){}}
      if(typeof titleScreen==="function"&&$("#title").classList.contains("on")&&!S)titleScreen();if(typeof toast==="function")toast("已从云端同步你的存档")}}}
   this.st="on";this.mark()}
  catch(e){this.st=TOY.lim(e)?"off":"nologin";if(this.st==="off")setTimeout(()=>this.init(),30000)}},
 mark(){if(this.st!=="on")return;this.dirty=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.up(),Math.max(60000,this.back))},
 async up(force){if(this.st!=="on"||this.busy||!this.dirty)return;if(!force&&Date.now()-this.lastUp<30000){this.mark();return}
  this.busy=true;this.dirty=false;
  try{const ch=this.pack();if(ch.length>120){this.st="big";return}const items={};ch.forEach((c,i)=>{if(this.last[i]!==c)items["tw_"+i]=c});
   items.tw_m=JSON.stringify({v:1,n:ch.length,t:Date.now()});await TOY.timeout(toy.setCloudStorage(items),10000);this.last=ch;this.lastUp=Date.now();this.back=0;this.fail=0}
  catch(e){this.dirty=true;if(TOY.lim(e))this.back=Math.min((this.back||15000)*2,600000);else{this.fail++;this.back=30000*this.fail}if(this.fail>=4)this.st="nologin";else this.mark()}
  finally{this.busy=false}},
 txt(){return{on:"☁ 云存档已开启",wait:"☁ 正在连接云存档",nologin:"☁ 登录 B站 后可开启云存档",big:"☁ 存档太大，暂时只存本地",none:"",off:""}[this.st]||""}};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&CLOUD.dirty)CLOUD.up(true)});
addEventListener("pagehide",()=>{if(CLOUD.dirty)CLOUD.up(true)});

/* ---------- 成就全服统计 ----------
   官方 SDK 的共享存档只在「同一玩家的多个 Toy」之间共享，不跨玩家，排行榜也不返回总人数，
   所以全服百分比暂时做不了；这里保留空实现，成就只记在本地并跟随云存档同步。 */
const GSTAT={detect(){return null},load(){return Promise.resolve(null)},add(){return Promise.resolve()},pct(){return null},txt(){return""}};
