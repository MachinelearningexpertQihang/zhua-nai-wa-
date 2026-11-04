/* ===================== 奶蛙尖塔 · 原创配乐引擎 =====================
   全部用 WebAudio 实时合成，8 首原创曲子，不读任何音频文件。 */
const A={ctx:null,music:true,sfx:true,step:0,next:0,trk:null,cur:null};
try{const o=JSON.parse(localStorage.getItem("nwt-audio")||"{}");if(o.music===false)A.music=false;if(o.sfx===false)A.sfx=false}catch(e){}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function audioUnlock(){if(A.ctx){if(A.ctx.state!=="running"&&!document.hidden)A.ctx.resume().catch(()=>{});return}
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const c=new AC;A.ctx=c;
 const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;comp.connect(c.destination);
 A.out=c.createGain();A.out.gain.value=.9;A.out.connect(comp);
 A.fx=c.createGain();A.fx.gain.value=A.sfx?.6:0;A.fx.connect(A.out);
 A.bgm=c.createGain();A.bgm.gain.value=A.music?.22:0;A.bgm.connect(A.out);
 // 简单混响：两条反馈延迟
 A.rev=c.createGain();A.rev.gain.value=.22;const d1=c.createDelay(),d2=c.createDelay(),f1=c.createGain(),f2=c.createGain(),lp=c.createBiquadFilter();
 d1.delayTime.value=.137;d2.delayTime.value=.211;f1.gain.value=.38;f2.gain.value=.33;lp.type="lowpass";lp.frequency.value=2600;
 A.rev.connect(lp);lp.connect(d1);lp.connect(d2);d1.connect(f1);f1.connect(d1);d2.connect(f2);f2.connect(d2);d1.connect(A.bgm);d2.connect(A.bgm);
 const b=c.createBuffer(1,c.sampleRate,c.sampleRate),dd=b.getChannelData(0);for(let i=0;i<dd.length;i++)dd[i]=Math.random()*2-1;A.noise=b;
 if(c.resume)c.resume().catch(()=>{});A.next=c.currentTime+.1;if(!A.timer)A.timer=setInterval(sched,25);loadSF()}
document.addEventListener("visibilitychange",()=>{if(!A.ctx)return;if(document.hidden)A.ctx.suspend&&A.ctx.suspend().catch(()=>{});else{A.ctx.resume().catch(()=>{});A.next=Math.max(A.next,A.ctx.currentTime+.05)}});
["pointerdown","touchend","click","keydown"].forEach(ev=>addEventListener(ev,audioUnlock,true));
function audioSave(){try{localStorage.setItem("nwt-audio",JSON.stringify({music:A.music,sfx:A.sfx}))}catch(e){}if(A.bgm)A.bgm.gain.value=A.music?.22:0;if(A.fx)A.fx.gain.value=A.sfx?.6:0}

/* ---- 真实乐器采样（FluidR3 GM 音色库，Frank Wen，CC BY 3.0） ---- */
const SF={};let SF_N=4,SF_LOADING=0;
function loadSF(){if(SF_LOADING||!A.ctx)return;SF_LOADING=1;for(let i=0;i<SF_N;i++){const sc=document.createElement("script");sc.src="sf/sf"+i+".js?v="+(typeof VER!=="undefined"?VER:"1");sc.onload=()=>decodeSF();document.head.appendChild(sc)}}
function decodeSF(){const W=window.__NWT_SF||{};for(const inst in W){if(SF[inst])continue;SF[inst]={keys:[],buf:{}};const notes=W[inst];for(const m in notes){const bin=atob(notes[m]);const arr=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)arr[j]=bin.charCodeAt(j);
  const done=b=>{SF[inst].buf[m]=b;SF[inst].keys=Object.keys(SF[inst].buf).map(Number).sort((a,b)=>a-b)};try{const p=A.ctx.decodeAudioData(arr.buffer,done,()=>{});if(p&&p.then)p.then(done).catch(()=>{})}catch(e){}}delete W[inst]}}
function samp(inst,m,t,dur,vol,wet){const I=SF[inst];if(!I||!I.keys.length||!A.ctx)return false;let k=I.keys[0];for(const x of I.keys)if(Math.abs(x-m)<Math.abs(k-m))k=x;const b=I.buf[k];if(!b)return false;
 const c=A.ctx,src=c.createBufferSource(),g=c.createGain();src.buffer=b;src.playbackRate.value=Math.pow(2,(m-k)/12);const end=Math.min(t+Math.max(.08,dur),t+b.duration/src.playbackRate.value);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.setValueAtTime(vol,Math.max(t+.01,end-.12));g.gain.linearRampToValueAtTime(0,end+.02);src.connect(g);g.connect(A.bgm);if(wet&&A.rev){const w=c.createGain();w.gain.value=wet;g.connect(w);w.connect(A.rev)}src.start(t);src.stop(end+.05);return true}
/* ---- 基础发声 ---- */
function tone(o){const c=A.ctx;if(!c)return;const t=o.t||c.currentTime,dur=o.dur||.15;
 const os=c.createOscillator(),g=c.createGain();os.type=o.type||"sine";os.frequency.setValueAtTime(o.f,t);if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
 if(o.vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vib;lg.gain.value=o.vibD||10;l.connect(lg);lg.connect(os.frequency);l.start(t+(o.vibDelay||0));l.stop(t+dur+.05)}
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.vol||.3,t+(o.att||.005));
 if(o.sus){g.gain.setValueAtTime(o.vol||.3,t+dur*o.sus)}g.gain.exponentialRampToValueAtTime(8e-4,t+dur);
 let n=os;if(o.filt){const f=c.createBiquadFilter();f.type=o.filt;f.frequency.value=o.ff||1e3;f.Q.value=o.q||1;os.connect(f);n=f}
 n.connect(g);g.connect(o.dest||A.fx);if(o.wet&&A.rev){const w=c.createGain();w.gain.value=o.wet;g.connect(w);w.connect(A.rev)}os.start(t);os.stop(t+dur+.05)}
function noise(o){const c=A.ctx;if(!c)return;const t=o.t||c.currentTime,dur=o.dur||.1;const s=c.createBufferSource();s.buffer=A.noise;
 const f=c.createBiquadFilter();f.type=o.filt||"bandpass";f.Q.value=o.q||1;f.frequency.setValueAtTime(o.f||1e3,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+dur);
 const g=c.createGain();g.gain.setValueAtTime(o.vol||.2,t);g.gain.exponentialRampToValueAtTime(8e-4,t+dur);s.connect(f);f.connect(g);g.connect(o.dest||A.fx);s.start(t,Math.random()*.5);s.stop(t+dur+.02)}
const SFX={boom(){const c=A.ctx;if(!c)return;const t=c.currentTime;tone({type:"sine",f:110,f2:32,t,dur:.55,vol:.6});noise({t,dur:.45,vol:.45,filt:"lowpass",f:1400,f2:160})}};

/* ---- 乐器 ---- */
const D=()=>A.bgm;
const INST={
 box:(m,t,l)=>{tone({type:"triangle",f:mtof(m),t,dur:l*1.6,vol:.17,dest:D(),wet:.5});tone({type:"sine",f:mtof(m+24),t,dur:l*.6,vol:.035,dest:D()})},
 pluck:(m,t,l)=>{tone({type:"triangle",f:mtof(m),t,dur:.35,vol:.2,dest:D(),wet:.35});tone({type:"sine",f:mtof(m)*3,t,dur:.08,vol:.04,dest:D()})},
 kalimba:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:.6,vol:.22,dest:D(),wet:.4});tone({type:"sine",f:mtof(m)*5.4,t,dur:.05,vol:.05,dest:D()})},
 square:(m,t,l)=>tone({type:"square",f:mtof(m),t,dur:l*.95,vol:.09,dest:D(),filt:"lowpass",ff:2400,sus:.6,wet:.2}),
 erhu:(m,t,l)=>tone({type:"sawtooth",f:mtof(m),t,dur:l*1.1,vol:.11,att:.04,dest:D(),filt:"lowpass",ff:1800,q:2,vib:5.5,vibD:mtof(m)*.012,vibDelay:.08,sus:.7,wet:.35}),
 brass:(m,t,l)=>{tone({type:"sawtooth",f:mtof(m),t,dur:l*1.05,vol:.11,att:.03,dest:D(),filt:"lowpass",ff:1100,sus:.7,wet:.25});tone({type:"sawtooth",f:mtof(m)*1.006,t,dur:l*1.05,vol:.06,att:.03,dest:D(),filt:"lowpass",ff:900,sus:.7})},
 bell:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:1.4,vol:.16,dest:D(),wet:.6});tone({type:"sine",f:mtof(m)*2.76,t,dur:.4,vol:.05,dest:D()});tone({type:"sine",f:mtof(m)*5.4,t,dur:.15,vol:.025,dest:D()})},
 organ:(m,t,l)=>{[1,2,3].forEach((h,i)=>tone({type:"sine",f:mtof(m)*h,t,dur:l*1.02,vol:[.12,.06,.035][i],att:.02,dest:D(),sus:.85,wet:.5}))},
 harpsi:(m,t,l)=>{tone({type:"square",f:mtof(m),t,dur:.28,vol:.07,dest:D(),filt:"lowpass",ff:3200,wet:.25});tone({type:"sawtooth",f:mtof(m)*2,t,dur:.12,vol:.03,dest:D(),filt:"highpass",ff:1200})},
 celesta:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:.9,vol:.18,dest:D(),wet:.55});tone({type:"sine",f:mtof(m)*4,t,dur:.18,vol:.04,dest:D(),wet:.4})},
 keys:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:l*1.1+.15,vol:.18,dest:D(),wet:.25,vib:4,vibD:2});tone({type:"triangle",f:mtof(m)*2,t,dur:.25,vol:.05,dest:D()})},
 synth:(m,t,l)=>{tone({type:"sawtooth",f:mtof(m),t,dur:l*.95,vol:.09,dest:D(),filt:"lowpass",ff:2600,q:4,sus:.6,wet:.2});tone({type:"sawtooth",f:mtof(m)*1.01,t,dur:l*.95,vol:.06,dest:D(),filt:"lowpass",ff:2000,sus:.6})},
 flute:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:l*1.2,vol:.16,att:.05,dest:D(),vib:5,vibD:mtof(m)*.008,vibDelay:.12,sus:.7,wet:.45});noise({t,dur:.08,vol:.02,f:mtof(m)*2,q:6,dest:D()})},
};
function bnote(m,t,d,v,fb){const S2=A.T&&A.T.s;if(S2&&S2.bass&&samp(S2.bass,m,t,Math.max(d,.2),Math.min(.9,v*2.6),.1))return;fb()}
const BASS={
 soft:(r,t,e,q)=>{if(e===0||e===4)bnote(r-12,t,q*3.5,.32,()=>tone({type:"sine",f:mtof(r-12),t,dur:q*3.5,vol:.32,dest:D(),filt:"lowpass",ff:400}))},
 walk:(r,t,e,q)=>{if(e%2===0){const m=r-12+[0,7,12,7][e/2];bnote(m,t,q*1.6,.24,()=>tone({type:"triangle",f:mtof(m),t,dur:q*1.6,vol:.24,dest:D(),filt:"lowpass",ff:700}))}},
 drive:(r,t,e,q)=>{const m=r-24+(e%2?12:0)+(e===7?7:0);bnote(m+12,t,q*.9,.13,()=>tone({type:"sawtooth",f:mtof(m),t,dur:q*.9,vol:.12,dest:D(),filt:"lowpass",ff:520,q:3}))},
 heavy:(r,t,e,q)=>{if(e!==3&&e!==7){bnote(r-12,t,q*.95,.16,()=>tone({type:"sawtooth",f:mtof(r-24),t,dur:q*.95,vol:.16,dest:D(),filt:"lowpass",ff:380,q:4}));tone({type:"sine",f:mtof(r-24),t,dur:q,vol:.16,dest:D()})}},
 none:()=>{}};
const kick=(t,v=.45)=>tone({type:"sine",f:150,f2:42,t,dur:.18,vol:v,dest:D()});
const snare=(t,v=.16)=>{noise({t,dur:.14,vol:v,filt:"highpass",f:1800,dest:D()});tone({type:"triangle",f:190,f2:140,t,dur:.08,vol:.1,dest:D()})};
const hat=(t,v=.05)=>noise({t,dur:.035,vol:v,filt:"highpass",f:7500,dest:D()});
const wood=(t,v=.12)=>tone({type:"sine",f:1250,t,dur:.06,vol:v,dest:D()});
const tom=(t,f,v=.25)=>tone({type:"sine",f,f2:f*.6,t,dur:.2,vol:v,dest:D()});
const DRUM={
 lofi:(t,e,bar)=>{if(e===0||e===5)kick(t,.3);if(e===4)snare(t,.08);if(e%2===0)hat(t,.03)},
 shaker:(t,e)=>{noise({t,dur:.05,vol:e%2?.03:.05,filt:"bandpass",f:6000,q:2,dest:D()});if(e===0)kick(t,.22)},
 drive:(t,e,bar)=>{if(e===0||e===3||e===4)kick(t);if(e===2||e===6)snare(t);hat(t,e%2?.03:.05);if(bar%4===3&&e>=6)tom(t,e===6?180:130)},
 boss:(t,e,bar)=>{if(e===0||e===3||e===5)kick(t,.55);if(e===4)snare(t,.22);if(e%2===1)hat(t,.04);if(bar%4===3&&e>=4)tom(t,[220,180,150,120][e-4],.3)},
 wood:(t,e,bar)=>{if(e===2||e===6||e===7)wood(t,e===7?.07:.12);if(e===0)kick(t,.25);if(e===4&&bar%2)noise({t,dur:.2,vol:.05,filt:"highpass",f:5000,dest:D()})},
 crickets:(t,e,bar)=>{if(e%4===1&&Math.random()<.6)for(let i=0;i<3;i++)tone({type:"sine",f:4200+Math.random()*300,t:t+i*.04,dur:.03,vol:.015,dest:D()})},
 doom:(t,e,bar)=>{if(e===0)kick(t,.75);if(e===3)kick(t,.45);if(e===4){kick(t,.6);snare(t,.18)}if(e===6&&bar%2)tom(t,110,.35);if(bar%4===3&&e>=4)tom(t,[160,130,110,90][e-4],.42);if(e%2===1)hat(t,.025);if(e===0&&bar%2===0)tone({type:"sine",f:41,t,dur:1.6,vol:.22,dest:D()})},
 factory:(t,e,bar)=>{if(e===0||e===4)kick(t,.42);if(e===2||e===6)snare(t,.14);if(e%2===1)tone({type:"square",f:2100,t,dur:.03,vol:.035,dest:D(),filt:"bandpass",ff:2400,q:8});if(e===7&&bar%2)noise({t,dur:.25,vol:.06,filt:"bandpass",f:800,f2:3000,q:3,dest:D()})},
 ice:(t,e,bar)=>{if(e===0||e===5)kick(t,.36);if(e===4)snare(t,.12);hat(t,e%2?.025:.045);if(e===7&&bar%2===1)tone({type:"sine",f:2637,t,dur:.4,vol:.04,dest:D(),wet:.5})},
 sparkle:(t,e,bar)=>{if(e%4===2&&Math.random()<.7)tone({type:"sine",f:mtof(88+[0,2,4,7,9][Math.floor(Math.random()*5)]),t,dur:.5,vol:.025,dest:D(),wet:.7});if(e===0&&bar%2===0)kick(t,.15)},
 waltz:(t,e,bar)=>{if(e===0)kick(t,.3);if(e===3||e===6)noise({t,dur:.08,vol:.05,filt:"highpass",f:4000,dest:D()})},
 none:()=>{}};
const CH=(r,q)=>{const iv={M:[0,4,7],m:[0,3,7],7:[0,4,7,10],m7:[0,3,7,10],M7:[0,4,7,11],sus:[0,5,7]}[q||"M"];return iv.map(i=>r+i)};

/* ---- 层主题曲 ---- */
const TR2={
 map1:{bpm:92,sw:0,lead:"organ",bass:"soft",dr:"waltz",pad:.05,ch:[[50,"m"],[46,"M"],[43,"m"],[45,"7"],[50,"m"],[53,"M"],[43,"m7"],[45,"7"]],
  mel:[62,0,65,69,0,74,72,69, 70,-1,-1,0,69,67,65,0, 67,0,70,74,0,77,76,74, 73,-1,-1,0,0,0,0,0, 74,0,77,81,0,79,77,76, 77,-1,74,0,72,-1,69,0, 70,0,74,72,70,69,67,65, 64,-1,-1,0,61,-1,-1,0]},
 battle1:{bpm:144,sw:0,lead:"harpsi",bass:"drive",dr:"drive",pad:.03,ch:[[50,"m"],[43,"m"],[45,"7"],[50,"m"]],
  mel:[74,73,74,77,74,73,74,0, 70,69,70,74,70,69,70,0, 69,0,73,76,79,0,76,73, 74,0,0,0,69,0,0,0, 77,76,77,81,77,76,77,0, 74,73,74,77,74,73,74,0, 73,74,76,77,79,77,76,73, 74,0,69,0,62,0,0,0]},
 map2:{bpm:76,sw:0,lead:"celesta",bass:"soft",dr:"none",pad:.06,bell:1,ch:[[52,"m"],[48,"M"],[43,"M"],[50,"M"],[52,"m"],[45,"m"],[47,"7"],[52,"m"]],
  mel:[76,0,0,79,0,0,83,0, 81,0,79,0,76,-1,-1,0, 72,0,0,76,0,0,79,0, 78,0,76,0,74,-1,-1,0, 76,0,79,0,83,0,88,0, 86,-1,84,0,83,0,81,0, 78,0,81,0,79,0,78,0, 76,-1,-1,-1,0,0,0,0]},
 battle2:{bpm:138,sw:0,lead:"square",bass:"drive",dr:"ice",pad:.03,bell:1,ch:[[52,"m"],[48,"M"],[50,"M"],[47,"7"]],
  mel:[76,0,79,0,83,0,79,76, 72,0,76,0,79,0,76,72, 74,0,78,0,81,0,78,74, 75,0,78,0,83,0,0,0, 88,0,86,83,0,79,83,0, 84,0,83,79,0,76,79,0, 81,79,78,0,74,0,78,0, 75,78,81,83,0,0,0,0]},
 map3:{bpm:112,sw:.2,lead:"keys",bass:"walk",dr:"factory",pad:.03,ch:[[53,"M"],[50,"m7"],[43,"m7"],[48,"7"]],
  mel:[72,0,69,72,0,74,0,77, 76,0,74,72,0,69,0,0, 70,0,74,77,0,74,70,0, 72,-1,-1,0,0,0,67,69, 72,0,77,0,76,74,72,0, 74,0,72,69,0,65,0,0, 67,0,70,74,72,70,67,64, 65,-1,-1,0,0,0,0,0]},
 battle3:{bpm:146,sw:0,lead:"synth",bass:"drive",dr:"factory",pad:0,ch:[[53,"m"],[49,"M"],[51,"M"],[48,"7"]],
  mel:[77,0,77,80,0,77,75,0, 73,0,73,77,0,75,73,72, 75,0,75,79,0,75,73,72, 72,0,76,0,79,0,76,0, 77,80,84,0,82,80,77,0, 80,77,73,0,75,73,77,0, 79,0,75,0,82,0,79,75, 76,0,72,0,76,79,84,0]},
 map4:{bpm:84,sw:0,lead:"flute",bass:"soft",dr:"sparkle",pad:.06,arp:1,ch:[[57,"M"],[54,"m"],[50,"M"],[52,"M"],[57,"M"],[49,"m"],[50,"M"],[52,"M"]],
  mel:[76,-1,-1,0,81,-1,80,0, 78,-1,76,0,73,-1,-1,0, 74,-1,78,0,81,-1,85,0, 83,-1,-1,-1,0,0,0,0, 88,-1,85,0,83,-1,81,0, 80,-1,81,0,83,-1,-1,0, 85,-1,83,0,81,-1,78,0, 80,-1,-1,-1,0,0,0,0]},
 battle4:{bpm:132,sw:0,lead:"brass",bass:"drive",dr:"drive",pad:.04,ch:[[57,"m"],[53,"M"],[48,"M"],[55,"M"]],
  mel:[81,0,0,84,0,83,81,0, 77,0,0,81,0,79,77,0, 76,0,79,84,0,83,79,0, 79,0,83,0,86,0,0,0, 88,0,86,84,0,83,81,0, 84,0,83,81,0,77,76,0, 77,79,81,0,83,0,84,0, 83,0,79,0,74,0,0,0]},
};
/* ---- 原创曲目（每首 64 个八分音符；0 = 休止，-1 = 延长） ---- */
const TR={
 // 标题「月下尖塔」：音乐盒，慢
 title:{bpm:80,sw:.12,lead:"box",bass:"soft",dr:"none",pad:.05,ch:[[57,"m"],[53,"M7"],[48,"M"],[55,"sus"],[57,"m"],[53,"M"],[50,"m7"],[52,"7"]],
  mel:[76,0,72,0,69,0,72,76, 77,0,76,72,0,0,69,0, 72,0,74,76,79,0,76,0, 74,0,72,74,71,0,0,0, 76,0,81,0,79,77,76,0, 77,0,74,72,74,0,0,0, 72,74,76,0,74,72,69,0, 71,0,68,0,69,0,0,0]},
 // 地图「泥沼漫步」：卡林巴 + 沙锤
 map:{bpm:100,sw:.18,lead:"kalimba",bass:"walk",dr:"shaker",pad:.03,ch:[[50,"M"],[47,"m"],[43,"M"],[45,"M"]],
  mel:[74,0,78,81,0,78,74,0, 71,0,74,78,76,0,0,0, 79,0,78,76,0,74,71,0, 76,0,74,0,73,0,0,0, 74,76,78,0,81,0,83,81, 78,0,76,74,0,71,74,0, 79,78,76,0,78,0,74,0, 73,0,76,0,74,0,0,0]},
 // 战斗「蛙拳」：方波 + 驱动鼓
 battle:{bpm:134,sw:0,lead:"square",bass:"drive",dr:"drive",pad:0,ch:[[52,"m"],[48,"M"],[50,"M"],[47,"7"]],
  mel:[76,0,76,79,0,76,74,0, 72,0,72,76,0,74,72,71, 74,0,74,78,0,74,72,71, 71,0,75,0,78,0,75,0, 76,79,83,0,81,79,76,0, 79,76,72,0,74,72,76,0, 78,0,74,0,81,0,78,74, 75,0,71,0,75,78,83,0]},
 // 精英「紫晶回廊」：铜管 + 和声小调
 elite:{bpm:140,sw:0,lead:"brass",bass:"drive",dr:"drive",pad:0,ch:[[50,"m"],[46,"M"],[43,"m"],[45,"7"]],
  mel:[74,0,77,0,81,0,77,74, 70,0,74,77,0,74,70,0, 79,0,77,74,0,70,67,0, 73,0,76,0,79,0,81,0, 86,0,84,81,0,77,74,0, 82,0,81,77,0,74,70,0, 79,77,74,0,77,74,70,0, 73,76,79,82,81,0,0,0]},
 // 首领「沼泽之王」：低音铜管 + 重鼓
 boss:{bpm:122,sw:0,lead:"brass",bass:"heavy",dr:"boss",pad:.04,ch:[[48,"m"],[44,"M"],[41,"m"],[43,"7"]],
  mel:[72,0,0,75,0,0,79,0, 80,0,79,0,75,0,72,0, 77,0,0,80,0,0,84,0, 83,0,79,0,74,0,71,0, 72,75,79,84,0,82,80,79, 80,0,77,0,75,0,72,0, 77,80,84,0,82,0,80,79, 79,0,83,0,86,0,0,0]},
 // 层末首领「塔顶不能没有人」：慢、低、弗里几亚小调，重鼓 + 低音嗡鸣
 final:{bpm:96,sw:0,lead:"brass",bass:"heavy",dr:"doom",pad:.07,ch:[[48,"m"],[49,"M"],[46,"m"],[43,"7"],[48,"m"],[49,"M"],[44,"M"],[43,"7"]],
  mel:[60,-1,-1,0,63,-1,61,0, 60,-1,-1,0,0,0,0,0, 58,-1,-1,0,61,-1,60,0, 58,-1,55,-1,0,0,0,0, 67,-1,-1,0,68,-1,67,0, 65,-1,63,-1,61,-1,0,0, 63,-1,61,0,60,-1,58,0, 55,-1,-1,-1,59,-1,-1,0]},
 // 商店「夜市灯笼」：二胡 + 木鱼（五声音阶）
 shop:{bpm:108,sw:.15,lead:"erhu",bass:"walk",dr:"wood",pad:0,ch:[[50,"M"],[45,"sus"],[47,"m"],[45,"M"]],
  mel:[74,-1,76,78,81,-1,78,76, 74,0,71,74,76,-1,0,0, 78,-1,81,83,81,78,76,0, 74,76,71,0,69,-1,0,0, 81,-1,83,81,78,0,76,78, 81,0,78,76,74,-1,0,0, 71,74,76,0,78,76,74,71, 69,0,71,0,74,-1,-1,0]},
 // 休息「篝火」：拨弦琶音 + 蟋蟀
 rest:{bpm:72,sw:.1,lead:"pluck",bass:"soft",dr:"crickets",pad:.04,arp:1,ch:[[48,"M7"],[45,"m7"],[41,"M7"],[43,"sus"]],
  mel:[0,0,0,0,76,0,0,0, 0,0,0,0,72,0,74,0, 0,0,0,0,69,0,0,0, 0,0,67,0,0,0,0,0, 0,0,0,0,79,0,76,0, 0,0,0,0,77,0,0,0, 0,0,76,0,74,0,72,0, 0,0,0,0,74,0,0,0]},
 // 事件「雾中」：钟声 + 长笛
 event:{bpm:88,sw:0,lead:"flute",bass:"soft",dr:"none",pad:.05,bell:1,ch:[[50,"m"],[48,"M"],[46,"M7"],[45,"sus"]],
  mel:[74,-1,-1,0,77,-1,76,0, 74,-1,72,0,69,-1,-1,0, 70,-1,72,0,74,-1,77,0, 76,-1,-1,-1,0,0,0,0, 81,-1,79,0,77,-1,76,0, 74,-1,76,0,77,-1,-1,0, 79,-1,77,0,76,-1,74,0, 73,-1,-1,-1,0,0,0,0]},
};
Object.assign(TR,TR2);
const ORCH={
 title:{lead:"music_box",bass:"cello",pad:"string_ensemble_1",arp:"orchestral_harp"},
 map:{lead:"kalimba",bass:"acoustic_bass",arp:"acoustic_guitar_nylon",perc:"wood"},
 battle:{lead:"pizzicato_strings",dbl:"marimba",bass:"acoustic_bass",stab:"string_ensemble_1",perc:"taiko"},
 elite:{lead:"trumpet",bass:"cello",pad:"string_ensemble_1",perc:"timp"},
 boss:{lead:"french_horn",dbl:"trumpet",bass:"cello",pad:"string_ensemble_1",perc:"taiko"},
 final:{lead:"church_organ",dbl:"french_horn",bass:"cello",pad:"string_ensemble_1",perc:"timp",bells:1},
 shop:{lead:"fiddle",bass:"acoustic_bass",arp:"acoustic_guitar_nylon",perc:"wood"},
 rest:{lead:"orchestral_harp",bass:"cello",arp:"acoustic_guitar_nylon",pad:"string_ensemble_1"},
 event:{lead:"flute",bass:"cello",pad:"string_ensemble_1",bells:1},
 map1:{lead:"church_organ",dbl:"harpsichord",bass:"cello",pad:"string_ensemble_1"},
 battle1:{lead:"harpsichord",bass:"cello",stab:"string_ensemble_1",perc:"timp"},
 map2:{lead:"celesta",dbl:"music_box",bass:"cello",pad:"string_ensemble_1",arp:"orchestral_harp"},
 battle2:{lead:"pizzicato_strings",dbl:"celesta",bass:"acoustic_bass",stab:"string_ensemble_1",perc:"taiko",bells:1},
 map3:{lead:"acoustic_grand_piano",bass:"acoustic_bass",arp:"acoustic_guitar_nylon",perc:"wood"},
 battle3:{lead:"trumpet",dbl:"acoustic_grand_piano",bass:"acoustic_bass",stab:"acoustic_grand_piano",perc:"taiko"},
 map4:{lead:"flute",bass:"cello",pad:"string_ensemble_1",arp:"orchestral_harp",bells:1},
 battle4:{lead:"french_horn",dbl:"trumpet",bass:"cello",pad:"string_ensemble_1",stab:"string_ensemble_1",perc:"timp"}};
for(const k in ORCH)if(TR[k])TR[k].s=ORCH[k];
function harmUnder(m,chord){let best=null;for(const c of chord)for(const o of [12,24,36]){const n=c+o;if(n<m-2&&n>=m-9&&(best===null||n>best))best=n}return best}
function sched(h=.15){const c=A.ctx;if(!c)return;if(A.next<c.currentTime-.2)A.next=c.currentTime+.05;
 while(A.next<c.currentTime+h){const T=TR[A.cur];const q=60/(T?T.bpm*(A.rage?1.18:1):100)/2;
  if(T&&A.music&&(c.state==="running"||A.offline)){const s=A.step%64,bar=Math.floor(s/8),e=s%8,t=A.next+(e%2?q*T.sw:0);const [r,ty]=T.ch[bar%T.ch.length];const chord=CH(r,ty);
   A.T=T;const O=T.s||{};const loop=Math.floor(A.step/64);const m=T.mel[s];if(m>0){let l=1;while(T.mel[(s+l)%64]===-1&&l<8)l++;if(!(O.lead&&samp(O.lead,m,t,q*l,.72,.3)))INST[T.lead](m,t,q*l);if(O.dbl&&(loop%2===1||A.rage))samp(O.dbl,m+(O.dbl==="music_box"||O.dbl==="celesta"?12:0),t,q*l,.28,.3);if(loop%2===1||A.rage){const hm=harmUnder(m,chord);if(hm)tone({type:"triangle",f:mtof(hm),t,dur:q*l*.9,vol:.05,dest:D(),wet:.3})}}
   if(loop%4===2&&!T.arp&&e%2===0)tone({type:"triangle",f:mtof(chord[(e/2)%chord.length]+12),t,dur:q*1.5,vol:.04,dest:D(),wet:.4});
   if(A.rage){hat(t,.05);if(e===2||e===6)kick(t,.4);if(e===7)snare(t,.1);tone({type:"sawtooth",f:mtof(r+(e%2?7:0)),t,dur:q*.8,vol:.035,dest:D(),filt:"lowpass",ff:900})}
   BASS[T.bass](r,t,e,q);DRUM[T.dr](t,e,bar);
   if(e===0&&O.pad&&SF[O.pad]){chord.forEach(n=>samp(O.pad,n,t,q*8.1,.16,.35))}else if(T.pad&&e===0)chord.forEach(n=>tone({type:"sine",f:mtof(n),t,dur:q*8.2,vol:T.pad,att:.4,dest:D(),wet:.3}));
   if(O.arp&&SF[O.arp]&&(loop>0||!T.mel[s])){const pat=[0,2,1,2,0,2,1,2];const n=chord[pat[e]%chord.length]+(e>=4?12:0);if(e%2===0||T.bpm<100)samp(O.arp,n,t,q*2,.2,.3)}
   if(O.stab&&SF[O.stab]&&(e===2||e===5||(e===7&&bar%2)))chord.forEach(n=>samp(O.stab,n+12,t,q*.6,.08,.15));
   if(O.perc==="taiko"&&SF.taiko_drum){if(e===0&&bar%2===0)samp("taiko_drum",48,t,.8,.7,.2);if(bar%4===3&&e>=4)samp("taiko_drum",[60,48,48,36][e-4],t,.5,.5+.08*(e-4),.2)}
   if(O.perc==="timp"&&SF.timpani){if(e===0)samp("timpani",r-12,t,1,.55,.25);if(bar%4===3&&e>=4)samp("timpani",r-12+(e%2?7:0),t,.3,.35+.05*(e-4),.2)}
   if(O.perc==="wood"&&SF.woodblock&&(e===3||(e===6&&bar%2)))samp("woodblock",e===3?72:84,t,.2,.35);
   if(O.bells&&SF.tubular_bells&&e===0&&bar%4===0)samp("tubular_bells",r+24,t,2,.22,.6);
   if(T.arp)tone({type:"triangle",f:mtof(chord[e%chord.length]+(e>=4?12:0)),t,dur:q*2,vol:.07,dest:D(),wet:.4});
   if(T.bell&&e===0&&bar%2===0)INST.bell(r+24,t,q)}
  A.next+=q;A.step++}}
function musicRage(on){A.rage=on?1:0}
function playMusic(n){const map={swing:"map",tense:"battle",space:"event",country:"shop",home:"rest"};n=map[n]||n;const act=(typeof S!=="undefined"&&S&&S.act)||0;if((n==="map"||n==="battle")&&act&&TR[n+act])n=n+act;if(A.cur===n)return;A.rage=0;A.cur=n;A.step=0;if(A.ctx)A.next=A.ctx.currentTime+.08}
