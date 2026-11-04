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
 pack(){const s=JSON.stringify({v:1,t:Date.now(),m:M,s:S||null});const ch=[];for(let i=0;i<s.length;i+=1000)ch.push(s.slice(i,i+1000));return ch},
 async init(){if(this.st!=="off")return;this.st="wait";
  if(!await TOY.wait()||!this.has()){this.st="none";return}
  try{const r=await TOY.timeout(toy.getCloudStorage(["tw_m"]),8000);const meta=r&&r.tw_m?JSON.parse(r.tw_m):null;
   if(meta&&meta.n&&meta.n<200){const keys=[...Array(meta.n)].map((_,i)=>"tw_"+i);const r2=await TOY.timeout(toy.getCloudStorage(keys),10000);
    const txt=keys.map(k=>(r2&&r2[k])||"").join("");let o=null;try{o=JSON.parse(txt)}catch(e){}
    if(o&&o.m){this.last=keys.map(k=>(r2&&r2[k])||"");
     const mine=M.t||0,theirs=(o.m&&o.m.t)||0;
     if(theirs>mine+3000){Object.keys(M).forEach(k=>delete M[k]);Object.assign(M,o.m);try{localStorage.setItem("nwt-meta",JSON.stringify(M))}catch(e){}
      if(o.s&&o.s.v===2){try{localStorage.setItem("nwt-run",JSON.stringify(o.s))}catch(e){}}
      if(typeof titleScreen==="function"&&$("#title").classList.contains("on")&&!S)titleScreen();if(typeof toast==="function")toast("已从云端同步你的存档")}}}
   this.st="on";this.mark();GSTAT.load();if(!M.counted&&GSTAT.detect()){M.counted=1;saveMeta();GSTAT.add(["tw_players"])}}
  catch(e){this.st=TOY.lim(e)?"off":"nologin";if(this.st==="off")setTimeout(()=>this.init(),30000)}},
 mark(){if(this.st!=="on")return;this.dirty=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.up(),Math.max(12000,this.back))},
 async up(force){if(this.st!=="on"||this.busy||!this.dirty)return;if(!force&&Date.now()-this.lastUp<10000){this.mark();return}
  this.busy=true;this.dirty=false;
  try{const ch=this.pack();if(ch.length>180){this.st="big";return}const items={};ch.forEach((c,i)=>{if(this.last[i]!==c)items["tw_"+i]=c});
   items.tw_m=JSON.stringify({v:1,n:ch.length,t:Date.now()});await TOY.timeout(toy.setCloudStorage(items),10000);this.last=ch;this.lastUp=Date.now();this.back=0;this.fail=0}
  catch(e){this.dirty=true;if(TOY.lim(e))this.back=Math.min((this.back||15000)*2,600000);else{this.fail++;this.back=30000*this.fail}if(this.fail>=4)this.st="nologin";else this.mark()}
  finally{this.busy=false}},
 txt(){return{on:"☁ 云存档已开启",wait:"☁ 正在连接云存档",nologin:"☁ 登录 B站 后可开启云存档",big:"☁ 存档太大，暂时只存本地",none:"",off:""}[this.st]||""}};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&CLOUD.dirty)CLOUD.up(true)});
addEventListener("pagehide",()=>{if(CLOUD.dirty)CLOUD.up(true)});

/* ---------- 成就全服统计（共享存档） ---------- */
const GSTAT={data:null,t:0,api:null,
 detect(){if(this.api!==null)return this.api;if(!window.toy)return null;
  const get=TOY.fn(["getSharedStorage","getShareStorage","getSharedCloudStorage","getGlobalStorage","getPublicStorage"],/^get.*(shar|global|public)/i);
  const inc=TOY.fn(["incrSharedStorage","incrementSharedStorage","incSharedStorage","addSharedStorage","incrShareStorage","increaseSharedStorage"],/(incr|inc|add|increase).*(shar|global|public)/i);
  const set=TOY.fn(["setSharedStorage","setShareStorage","setSharedCloudStorage","setGlobalStorage","setPublicStorage"],/^set.*(shar|global|public)/i);
  this.api=get?{get,inc,set}:false;return this.api},
 keys(){return["tw_players",...ACH.map(a=>"tw_a_"+a.id)]},
 async load(force){const A=this.detect();if(!A)return null;if(!force&&this.data&&Date.now()-this.t<120000)return this.data;
  try{let r=null;try{r=await TOY.timeout(toy[A.get](this.keys()),8000)}catch(e){r=await TOY.timeout(toy[A.get]({keys:this.keys()}),8000)}
   const o={};if(r)for(const k in r){const v=r[k];o[k]=typeof v==="object"&&v?Number(v.value||0):Number(v||0)}this.data=o;this.t=Date.now();return o}catch(e){return null}},
 async add(keys){const A=this.detect();if(!A)return;
  for(const k of keys){try{
   if(A.inc){try{await TOY.timeout(toy[A.inc]({key:k,value:1}),8000)}catch(e){await TOY.timeout(toy[A.inc](k,1),8000)}}
   else if(A.set){const d=(await this.load(true))||{};const items={};items[k]=String((d[k]||0)+1);await TOY.timeout(toy[A.set](items),8000)}
   if(this.data)this.data[k]=(this.data[k]||0)+1}catch(e){}}},
 pct(id){const d=this.data;if(!d)return null;const p=d.tw_players||0,c=d["tw_a_"+id]||0;if(p<10)return null;return Math.min(100,c/p*100)},
 txt(id){const p=this.pct(id);if(p==null)return"";if(p===0)return"还没有人拿到";const s=p<1?p.toFixed(1):Math.round(p);return p<50?`只有 ${s}% 的人拿到`:`${s}% 的人拿到`}};
