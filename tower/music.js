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
 if(c.resume)c.resume().catch(()=>{});A.next=c.currentTime+.1;if(!A.timer)A.timer=setInterval(sched,25)}
document.addEventListener("visibilitychange",()=>{if(!A.ctx)return;if(document.hidden)A.ctx.suspend&&A.ctx.suspend().catch(()=>{});else{A.ctx.resume().catch(()=>{});A.next=Math.max(A.next,A.ctx.currentTime+.05)}});
["pointerdown","touchend","click","keydown"].forEach(ev=>addEventListener(ev,audioUnlock,true));
function audioSave(){try{localStorage.setItem("nwt-audio",JSON.stringify({music:A.music,sfx:A.sfx}))}catch(e){}if(A.bgm)A.bgm.gain.value=A.music?.22:0;if(A.fx)A.fx.gain.value=A.sfx?.6:0}

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
 flute:(m,t,l)=>{tone({type:"sine",f:mtof(m),t,dur:l*1.2,vol:.16,att:.05,dest:D(),vib:5,vibD:mtof(m)*.008,vibDelay:.12,sus:.7,wet:.45});noise({t,dur:.08,vol:.02,f:mtof(m)*2,q:6,dest:D()})},
};
const BASS={
 soft:(r,t,e,q)=>{if(e===0||e===4)tone({type:"sine",f:mtof(r-12),t,dur:q*3.5,vol:.32,dest:D(),filt:"lowpass",ff:400})},
 walk:(r,t,e,q)=>{if(e%2===0)tone({type:"triangle",f:mtof(r-12+[0,7,12,7][e/2]),t,dur:q*1.6,vol:.24,dest:D(),filt:"lowpass",ff:700})},
 drive:(r,t,e,q)=>tone({type:"sawtooth",f:mtof(r-24+(e%2?12:0)),t,dur:q*.9,vol:.12,dest:D(),filt:"lowpass",ff:520,q:3}),
 heavy:(r,t,e,q)=>{if(e!==3&&e!==7){tone({type:"sawtooth",f:mtof(r-24),t,dur:q*.95,vol:.16,dest:D(),filt:"lowpass",ff:380,q:4});tone({type:"sine",f:mtof(r-24),t,dur:q,vol:.2,dest:D()})}},
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
 none:()=>{}};
const CH=(r,q)=>{const iv={M:[0,4,7],m:[0,3,7],7:[0,4,7,10],m7:[0,3,7,10],M7:[0,4,7,11],sus:[0,5,7]}[q||"M"];return iv.map(i=>r+i)};

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
function sched(h=.15){const c=A.ctx;if(!c)return;if(A.next<c.currentTime-.2)A.next=c.currentTime+.05;
 while(A.next<c.currentTime+h){const T=TR[A.cur];const q=60/(T?T.bpm:100)/2;
  if(T&&A.music&&(c.state==="running"||A.offline)){const s=A.step%64,bar=Math.floor(s/8),e=s%8,t=A.next+(e%2?q*T.sw:0);const [r,ty]=T.ch[bar%T.ch.length];const chord=CH(r,ty);
   const m=T.mel[s];if(m>0){let l=1;while(T.mel[(s+l)%64]===-1&&l<8)l++;INST[T.lead](m,t,q*l)}
   BASS[T.bass](r,t,e,q);DRUM[T.dr](t,e,bar);
   if(T.pad&&e===0)chord.forEach(n=>tone({type:"sine",f:mtof(n),t,dur:q*8.2,vol:T.pad,att:.4,dest:D(),wet:.3}));
   if(T.arp)tone({type:"triangle",f:mtof(chord[e%chord.length]+(e>=4?12:0)),t,dur:q*2,vol:.07,dest:D(),wet:.4});
   if(T.bell&&e===0&&bar%2===0)INST.bell(r+24,t,q)}
  A.next+=q;A.step++}}
function playMusic(n){const map={swing:"map",tense:"battle",space:"event",country:"shop",home:"rest"};n=map[n]||n;if(A.cur===n)return;A.cur=n;A.step=0;if(A.ctx)A.next=A.ctx.currentTime+.08}
