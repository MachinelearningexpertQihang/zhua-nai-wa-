/* ===================== 奶蛙尖塔 · 数据 ===================== */
const FAM={frog:{n:"奶蛙",c:"#7bd06b"},horse:{n:"奶马",c:"#f0a54a"},chick:{n:"奶鸡",c:"#ffd23f"},cat:{n:"奶猫",c:"#ff8fb1"},pal:{n:"伙伴",c:"#b392ff"},mud:{n:"泥巴",c:"#8a6038"},none:{n:"无",c:"#b7b0c9"}};
const RAR={P:{n:"伙伴",c:"#b392ff"},G:{n:"金卡",c:"#f7c948"},S:{n:"起始",c:"#b8b3c8"},C:{n:"普通",c:"#9aa6bb"},R:{n:"稀有",c:"#3d8bff"},E:{n:"史诗",c:"#9b5cff"},L:{n:"传说",c:"#ff9a1f"},X:{n:"无色",c:"#6fc7c0"},K:{n:"诅咒",c:"#4a3d5c"},T:{n:"状态",c:"#6b7080"}};
const TYPE={atk:{n:"攻击",c:"#e2546a"},skl:{n:"技能",c:"#3aa3e0"},pow:{n:"能力",c:"#e8a400"},cur:{n:"诅咒",c:"#5b4b72"},sts:{n:"状态",c:"#6b7080"}};
const U=(u,a,b)=>u?b:a;

/* fx(B,u,t)  B=battle api, u=upgraded, t=target enemy */
const CARDS={
/* ---- 起始 ---- */
strike:{n:"打一下",cost:1,type:"atk",r:"S",fam:"frog",img:"n1",tgt:1,d:u=>`造成 ${U(u,6,9)} 点伤害`,fx:(B,u,t)=>B.hit(t,U(u,6,9))},
guard:{n:"抱紧",cost:1,type:"skl",r:"S",fam:"chick",img:"i3",d:u=>`获得 ${U(u,5,8)} 护盾`,fx:(B,u)=>B.block(U(u,5,8))},
/* ---- 功夫奶蛙 普通 ---- */
fist:{n:"拳拳到奶",cost:1,type:"atk",r:"C",fam:"frog",img:"n3",tgt:1,d:u=>`造成 ${U(u,6,9)} 伤害。连击 ≥3 时再打一次`,fx:(B,u,t)=>{B.hit(t,U(u,6,9));if(B.combo>=3)B.hit(t,U(u,6,9))}},
palm:{n:"连环掌",cost:1,type:"atk",r:"C",fam:"frog",img:"i4",tgt:1,d:u=>`造成 3 伤害 ${U(u,2,3)} 次`,fx:(B,u,t)=>B.hit(t,3,U(u,2,3))},
breath:{n:"呼吸法",cost:0,type:"skl",r:"C",fam:"frog",img:"fj",d:u=>`下一张攻击牌伤害 +${U(u,4,6)}`,fx:(B,u)=>{B.p.nextAtk+=U(u,4,6)}},
sit:{n:"打坐",cost:1,type:"skl",r:"C",fam:"frog",img:"i5",d:u=>`获得 ${U(u,7,10)} 护盾，抽 1 张`,fx:(B,u)=>{B.block(U(u,7,10));B.draw(1)}},
flow:{n:"顺势",cost:0,type:"skl",r:"C",fam:"frog",img:"m5",d:u=>`抽 ${U(u,2,3)} 张，然后弃 1 张`,fx:(B,u)=>{B.draw(U(u,2,3));B.chooseDiscard(1)}},
still:{n:"静水",cost:0,type:"skl",r:"C",fam:"frog",img:"c2",exh:1,d:u=>`获得 ${U(u,1,2)} 点奶力。消耗`,fx:(B,u)=>B.gainEnergy(U(u,1,2))},
charge:{n:"蓄力",cost:1,type:"skl",r:"C",fam:"frog",img:"m2",d:u=>`本回合力气 +${U(u,2,3)}`,fx:(B,u)=>{B.p.tstr+=U(u,2,3);B.fxBuff(B.p)}},
borrow:{n:"借力",cost:1,type:"skl",r:"C",fam:"horse",img:"hr",d:u=>`获得 5 护盾。本回合每打出一张攻击牌，再 +${U(u,2,3)} 护盾`,fx:(B,u)=>{B.block(5);B.p.borrow+=U(u,2,3)}},
spin:{n:"回旋踢",cost:1,type:"atk",r:"C",fam:"horse",img:"hrw",d:u=>`对所有敌人造成 ${U(u,8,11)} 伤害`,fx:(B,u)=>B.hitAll(U(u,8,11))},
sweep:{n:"扫堂腿",cost:1,type:"atk",r:"C",fam:"horse",img:"hrs",tgt:1,d:u=>`造成 ${U(u,6,9)} 伤害，易伤 ${U(u,1,2)}`,fx:(B,u,t)=>{B.hit(t,U(u,6,9));B.apply(t,"vuln",U(u,1,2))}},
whisk:{n:"拂尘",cost:1,type:"atk",r:"C",fam:"chick",img:"ckd",tgt:1,d:u=>`造成 ${U(u,5,8)} 伤害，虚弱 ${U(u,1,2)}`,fx:(B,u,t)=>{B.hit(t,U(u,5,8));B.apply(t,"weak",U(u,1,2))}},
thought:{n:"一念",cost:1,type:"atk",r:"C",fam:"chick",img:"ckf",tgt:1,d:u=>`造成 ${U(u,9,12)} 伤害。手里有同家族的牌时抽 1 张`,fx:(B,u,t,c)=>{B.hit(t,U(u,9,12));if(B.hand.some(h=>h!==c&&CARDS[h.id].fam===CARDS[c.id].fam))B.draw(1)}},
tea:{n:"奶茶补给",cost:1,type:"skl",r:"C",fam:"cat",img:"ct",d:u=>`回复 ${U(u,3,5)} 生命，抽 1 张`,fx:(B,u)=>{B.heal(U(u,3,5));B.draw(1)}},
/* ---- 稀有 ---- */
oneb:{n:"一气呵成",cost:2,type:"atk",r:"R",fam:"horse",img:"hrf",tgt:1,d:u=>`造成 连击数 × ${U(u,3,4)} 伤害`,fx:(B,u,t)=>B.hit(t,B.combo*U(u,3,4))},
thousand:{n:"千手",cost:1,type:"atk",r:"R",fam:"frog",img:"np",tgt:1,d:u=>`造成 ${U(u,2,3)} 伤害 3 次，连击每多 1 再打一次`,fx:(B,u,t)=>B.hit(t,U(u,2,3),2+B.combo)},
retreat:{n:"闭关",cost:2,type:"skl",r:"R",fam:"frog",img:"hs",d:u=>`获得 ${U(u,15,20)} 护盾，下回合少抽 1 张`,fx:(B,u)=>{B.block(U(u,15,20));B.p.drawMinus++}},
bell:{n:"金钟罩",cost:2,type:"skl",r:"R",fam:"frog",img:"hg",d:u=>`获得 ${U(u,12,16)} 护盾，本回合结束护盾不清零`,fx:(B,u)=>{B.block(U(u,12,16));B.p.retain=1}},
glow:{n:"回光",cost:2,type:"skl",r:"R",fam:"chick",img:"ckg",exh:1,d:u=>`回复 本回合出牌数 × ${U(u,2,3)} 生命。消耗`,fx:(B,u)=>B.heal(B.played*U(u,2,3))},
calm:{n:"定心",cost:1,type:"pow",r:"R",fam:"frog",img:"c7",d:u=>`每次触发三连，获得 ${U(u,4,6)} 护盾`,fx:(B,u)=>{B.p.pw.calm=(B.p.pw.calm||0)+U(u,4,6)}},
/* ---- 史诗 ---- */
way:{n:"修行之道",cost:2,cu:1,type:"pow",r:"E",fam:"frog",img:"c1",d:u=>`每回合第一次三连后，多给 1 点奶力`,fx:(B,u)=>{B.p.pw.way=1}},
zone:{n:"心流",cost:1,cu:0,type:"pow",r:"E",fam:"horse",img:"hrf",d:u=>`每打出 5 张牌，抽 2 张`,fx:(B,u)=>{B.p.pw.zone=(B.p.pw.zone||0)+1}},
thunder:{n:"雷霆一击",cost:3,type:"atk",r:"E",fam:"horse",img:"hrz",tgt:1,dyn:B=>B.played>=4?-2:0,d:u=>`造成 ${U(u,28,36)} 伤害。本回合已打出 4 张牌时费用 -2`,fx:(B,u,t)=>{B.hit(t,U(u,28,36));B.shake(10)}},
/* ---- 传说 ---- */
hundred:{n:"百连",cost:-1,type:"atk",r:"L",fam:"frog",img:"n4",tgt:1,d:u=>`X 费。打（X + 连击数）次，每次 ${U(u,4,5)} 伤害`,fx:(B,u,t,c,x)=>B.hit(t,U(u,4,5),x+B.combo)},
enlight:{n:"顿悟",cost:1,type:"skl",r:"L",fam:"frog",img:"hn",exhU:1,d:u=>`本回合所有牌 0 费${U(u,"。消耗","")}`,fx:(B,u)=>{B.p.free=1;B.renderHand()}},
noself:{n:"无我",cost:2,cu:1,type:"pow",r:"L",fam:"frog",img:"n2",d:u=>`三连只需要 2 张同家族的牌`,fx:(B,u)=>{B.p.pw.noself=1}},
/* ---- 无色 ---- */
milktea:{n:"奶茶",cost:0,type:"skl",r:"X",fam:"cat",img:"ctm",exh:1,d:u=>`回复 ${U(u,5,8)} 生命。消耗`,fx:(B,u)=>B.heal(U(u,5,8))},
gacha:{n:"扭蛋",cost:1,cu:0,type:"skl",r:"X",fam:"none",img:"egj",exh:1,d:u=>`随机一张稀有以上的卡加入手牌，本回合 0 费。消耗`,fx:B=>B.addRandomRare()},
shake:{n:"晃一晃",cost:0,type:"skl",r:"X",fam:"none",img:"m3",d:u=>`弃掉所有手牌，再抽同样多张${U(u,"",' +1')}`,fx:(B,u,t,c)=>{const n=B.hand.filter(h=>h!==c).length;B.discardHand(c);B.draw(n+U(u,0,1))}},
gather:{n:"凑齐",cost:1,cu:0,type:"skl",r:"X",fam:"none",img:"c3",d:u=>`从抽牌堆选一张和手牌同家族的牌，放进手里`,fx:(B,u,t,c)=>B.chooseFamily(c)},
bigfrog:{n:"巨无霸奶蛙",cost:2,type:"atk",r:"X",fam:"frog",img:"m4",tgt:1,d:u=>`造成 ${U(u,20,26)} 伤害`,fx:(B,u,t)=>{B.hit(t,U(u,20,26));B.shake(8)}},
icefrog:{n:"冰冻奶蛙",cost:1,type:"skl",r:"X",fam:"frog",img:"c7",tgt:1,d:u=>`敌人虚弱 ${U(u,3,4)}`,fx:(B,u,t)=>B.apply(t,"weak",U(u,3,4))},
bombfrog:{n:"炸弹奶蛙",cost:1,type:"atk",r:"X",fam:"frog",img:"xsr",d:u=>`对所有敌人造成 ${U(u,20,26)} 伤害，自己受到 5 伤害`,fx:(B,u)=>{B.hitAll(U(u,20,26));B.selfDamage(5);B.shake(12)}},
kiss:{n:"吸血鬼之吻",cost:1,type:"atk",r:"X",fam:"none",img:"vp",tgt:1,exh:1,d:u=>`造成 ${U(u,8,11)} 伤害，回复 ${U(u,8,11)} 生命。消耗`,fx:(B,u,t)=>{B.hit(t,U(u,8,11));B.heal(U(u,8,11))}},
goldfrog:{n:"金奶蛙",cost:0,type:"skl",r:"X",fam:"none",img:"hg",exh:1,d:u=>`获得 ${U(u,25,40)} 金币。消耗`,fx:(B,u)=>B.gainGold(U(u,25,40))},
tray:{n:"异世界的端盘",cost:2,type:"skl",r:"X",fam:"none",img:"yjx",exh:1,d:u=>`获得 3 点奶力，抽 3 张，回复 10 生命。消耗`,fx:B=>{B.gainEnergy(3);B.draw(3);B.heal(10)}},
/* ---- 3.0 扩充：奶蛙（连击） ---- */
leap:{n:"蛙跳",cost:1,type:"atk",r:"C",fam:"frog",img:"c3",tgt:1,d:u=>`造成 ${U(u,6,9)} 伤害。连击 ≥2 时抽 1 张`,fx:(B,u,t)=>{B.hit(t,U(u,6,9));if(B.combo>=2)B.draw(1)}},
jab:{n:"刺拳",cost:0,type:"atk",r:"C",fam:"frog",img:"xs",tgt:1,d:u=>`造成 ${U(u,3,5)} 伤害`,fx:(B,u,t)=>B.hit(t,U(u,3,5))},
flurry:{n:"乱拳",cost:1,type:"atk",r:"C",fam:"frog",img:"m5",tgt:1,d:u=>`造成 ${U(u,4,6)} 伤害，本回合每打出过 1 张攻击牌，再 +${U(u,2,3)}`,fx:(B,u,t)=>B.hit(t,U(u,4,6)+(B.combo-1)*U(u,2,3))},
tongue:{n:"长舌卷",cost:1,type:"atk",r:"C",fam:"frog",img:"xsp",tgt:1,d:u=>`造成 ${U(u,7,10)} 伤害。从弃牌堆随机拿回 1 张攻击牌`,fx:(B,u,t)=>{B.hit(t,U(u,7,10));B.fetchAtk()}},
echo:{n:"余音",cost:1,type:"skl",r:"R",fam:"frog",img:"c5",exhU:1,d:u=>`下一张攻击牌打出两次${U(u,"。消耗","")}`,fx:B=>{B.p.echo=(B.p.echo||0)+1}},
dragon:{n:"飞龙在天",cost:2,type:"atk",r:"R",fam:"frog",img:"nx",tgt:1,dyn:B=>B.combo>=3?-2:0,d:u=>`造成 ${U(u,14,19)} 伤害。连击 ≥3 时费用 -2`,fx:(B,u,t)=>{B.hit(t,U(u,14,19));B.shake()}},
rhythm:{n:"节奏感",cost:1,cu:0,type:"pow",r:"R",fam:"frog",img:"xsw",d:u=>`每回合打出第 3 张攻击牌时，获得 1 点奶力，抽 1 张`,fx:B=>{B.p.pw.rhythm=(B.p.pw.rhythm||0)+1}},
storm:{n:"奶拳风暴",cost:2,type:"atk",r:"E",fam:"frog",img:"n2",d:u=>`对所有敌人造成 4 伤害 ${U(u,3,4)} 次`,fx:(B,u)=>{for(let i=0;i<U(u,3,4);i++)B.hitAll(4)}},
/* 奶马（冲锋 / 群攻 / 易伤） */
gallop:{n:"奔腾",cost:1,type:"atk",r:"C",fam:"horse",img:"hra",d:u=>`对所有敌人造成 ${U(u,4,6)} 伤害，并给予易伤 1`,fx:(B,u)=>{B.hitAll(U(u,4,6));B.alive().forEach(e=>B.apply(e,"vuln",1))}},
rush:{n:"冲锋",cost:2,type:"atk",r:"C",fam:"horse",img:"hrg",tgt:1,d:u=>`造成 ${U(u,12,16)} 伤害，本回合每打出过 1 张奶马牌再 +4`,fx:(B,u,t)=>B.hit(t,U(u,12,16)+(B.horseN-1)*4)},
backkick:{n:"后踢",cost:1,type:"atk",r:"C",fam:"horse",img:"hrc",tgt:1,d:u=>`造成 ${U(u,8,11)} 伤害。目标有易伤时抽 1 张`,fx:(B,u,t)=>{B.hit(t,U(u,8,11));if(t.vuln>0)B.draw(1)}},
mane:{n:"抖鬃毛",cost:0,type:"skl",r:"C",fam:"horse",img:"hrh",d:u=>`所有敌人易伤 ${U(u,1,2)}`,fx:(B,u)=>B.alive().forEach(e=>B.apply(e,"vuln",U(u,1,2)))},
trample:{n:"践踏",cost:2,type:"atk",r:"R",fam:"horse",img:"hrz",d:u=>`对所有敌人造成 ${U(u,10,14)} 伤害，有易伤的敌人再受 5`,fx:(B,u)=>B.alive().forEach(e=>{B.hit(e,U(u,10,14));if(e.vuln>0&&e.hp>0)B.hit(e,5)})},
stampede:{n:"万马奔腾",cost:2,cu:1,type:"pow",r:"E",fam:"horse",img:"hrar",d:u=>`每回合开始，对所有敌人造成 4 伤害`,fx:B=>{B.p.pw.stampede=(B.p.pw.stampede||0)+4}},
unicorn:{n:"独角冲",cost:2,type:"atk",r:"L",fam:"horse",img:"hrr",tgt:1,d:u=>`造成 ${U(u,22,30)} 伤害。击败敌人时回满奶力，抽 2 张`,fx:(B,u,t)=>{const a=t.hp>0;B.hit(t,U(u,22,30));B.shake();if(a&&t.hp<=0){B.p.energy=Math.max(B.p.energy,3);B.gainEnergy(0);B.draw(2)}}},
/* 奶鸡（护盾 / 虚弱 / 反击） */
peck:{n:"啄一啄",cost:1,type:"atk",r:"C",fam:"chick",img:"cka",tgt:1,d:u=>`造成 ${U(u,6,8)} 伤害，获得 ${U(u,4,6)} 护盾`,fx:(B,u,t)=>{B.hit(t,U(u,6,8));B.block(U(u,4,6))}},
fluff:{n:"炸毛",cost:1,type:"skl",r:"C",fam:"chick",img:"ckh",d:u=>`获得 ${U(u,8,11)} 护盾。有敌人虚弱时再 +4`,fx:(B,u)=>B.block(U(u,8,11)+(B.alive().some(e=>e.weak>0)?4:0))},
roost:{n:"回窝",cost:1,type:"skl",r:"C",fam:"chick",img:"ckb",d:u=>`获得 ${U(u,6,8)} 护盾，下回合开始再获得 ${U(u,6,8)}`,fx:(B,u)=>{B.block(U(u,6,8));B.p.nextBlock=(B.p.nextBlock||0)+U(u,6,8)}},
crow:{n:"晨啼",cost:1,type:"skl",r:"C",fam:"chick",img:"ckg",d:u=>`所有敌人虚弱 ${U(u,2,3)}，抽 1 张`,fx:(B,u)=>{B.alive().forEach(e=>B.apply(e,"weak",U(u,2,3)));B.draw(1)}},
spur:{n:"鸡爪反击",cost:1,type:"pow",r:"R",fam:"chick",img:"cks",d:u=>`获得荆棘 ${U(u,3,5)}（被攻击时反弹伤害）`,fx:(B,u)=>B.apply(B.p,"thorn",U(u,3,5))},
wall:{n:"鸡毛长城",cost:2,cu:1,type:"skl",r:"R",fam:"chick",img:"cki",exh:1,d:u=>`护盾翻倍。消耗`,fx:B=>B.block(B.p.block,1)},
iron:{n:"铁公鸡",cost:3,cu:2,type:"pow",r:"E",fam:"chick",img:"ckik",d:u=>`护盾不会在回合开始时清零`,fx:B=>{B.p.pw.iron=1}},
blaze:{n:"浴火",cost:2,type:"skl",r:"L",fam:"chick",img:"ckar",exh:1,d:u=>`获得 ${U(u,20,28)} 护盾，所有敌人虚弱 2。消耗`,fx:(B,u)=>{B.block(U(u,20,28));B.alive().forEach(e=>B.apply(e,"weak",2))}},
/* 奶猫（回复 / 抽牌 / 保留） */
paw:{n:"猫猫拳",cost:1,type:"atk",r:"C",fam:"cat",img:"ctl",tgt:1,ret:1,d:u=>`造成 ${U(u,7,10)} 伤害。保留`,fx:(B,u,t)=>B.hit(t,U(u,7,10))},
nap:{n:"打盹",cost:1,type:"skl",r:"C",fam:"cat",img:"ctu",ret:1,d:u=>`抽 ${U(u,2,3)} 张。保留`,fx:(B,u)=>B.draw(U(u,2,3))},
purr:{n:"呼噜",cost:1,type:"skl",r:"C",fam:"cat",img:"ctp",d:u=>`回复 ${U(u,4,6)} 生命，获得 ${U(u,4,6)} 护盾`,fx:(B,u)=>{B.heal(U(u,4,6));B.block(U(u,4,6))}},
yarn:{n:"毛线球",cost:0,type:"skl",r:"C",fam:"cat",img:"cty",d:u=>`抽 1 张，抽到奶猫牌就再抽 ${U(u,1,2)} 张`,fx:(B,u)=>{const c=B.draw(1);if(c&&CARDS[c.id].fam==="cat")B.draw(U(u,1,2))}},
nine:{n:"九命",cost:1,type:"pow",r:"R",fam:"cat",img:"ctw",d:u=>`每回合开始，回复 ${U(u,2,3)} 生命`,fx:(B,u)=>{B.p.pw.nine=(B.p.pw.nine||0)+U(u,2,3)}},
prowl:{n:"潜行",cost:1,type:"pow",r:"R",fam:"cat",img:"ctcc",d:u=>`敏捷 +${U(u,2,3)}（护盾牌效果更好）`,fx:(B,u)=>B.apply(B.p,"dex",U(u,2,3))},
stargaze:{n:"观星",cost:1,type:"skl",r:"E",fam:"cat",img:"ctf",ret:1,d:u=>`从抽牌堆选 ${U(u,1,2)} 张放进手里。保留`,fx:(B,u)=>{for(let i=0;i<U(u,1,2);i++)B.chooseFromDraw()}},
galaxy:{n:"银河猫",cost:3,cu:2,type:"pow",r:"L",fam:"cat",img:"ctar",d:u=>`每回合多抽 1 张，多 1 点奶力`,fx:B=>{B.p.pw.galaxy=(B.p.pw.galaxy||0)+1}},
/* 无色扩充 */
dogpal:{n:"奶狗来帮忙",cost:1,type:"atk",r:"X",fam:"none",img:"dg",tgt:1,d:u=>`造成 ${U(u,5,7)} 伤害 2 次`,fx:(B,u,t)=>B.hit(t,U(u,5,7),2)},
twinegg:{n:"双黄蛋",cost:1,cu:0,type:"skl",r:"X",fam:"none",img:"ega",exh:1,d:u=>`下回合多 1 点奶力，多抽 2 张。消耗`,fx:B=>{B.p.nextEnergy=(B.p.nextEnergy||0)+1;B.p.nextDraw=(B.p.nextDraw||0)+2}},
snakestep:{n:"蛇形步",cost:0,type:"skl",r:"X",fam:"none",img:"sn",ret:1,d:u=>`获得 ${U(u,4,7)} 护盾，敏捷 +1。保留`,fx:(B,u)=>{B.block(U(u,4,7));B.apply(B.p,"dex",1)}},
ratpack:{n:"鼠群",cost:1,type:"atk",r:"X",fam:"none",img:"msa",d:u=>`对所有敌人造成 3 伤害 ${U(u,3,4)} 次`,fx:(B,u)=>{for(let i=0;i<U(u,3,4);i++)B.hitAll(3)}},
/* ---- 0.3：奶蛙池 ---- */
lure:{n:"引蛙入池",cost:0,type:"skl",r:"C",fam:"frog",img:"xcf",d:u=>`往池里多放 1 个奶蛙${U(u,"",'，抽 1 张')}`,fx:(B,u)=>{B.poolAdd("frog");if(u)B.draw(1)}},
scoop:{n:"捞一捞",cost:0,type:"skl",r:"C",fam:"cat",img:"ct",d:u=>`从池里捞走最后 ${U(u,1,2)} 个，抽 1 张`,fx:(B,u)=>{B.poolPop(U(u,1,2));B.draw(1)}},
drain:{n:"清池",cost:1,type:"skl",r:"R",fam:"chick",img:"ckc",d:u=>`清空池子，每清掉 1 个获得 ${U(u,3,4)} 护盾`,fx:(B,u)=>{const n=B.poolClear();B.block(n*U(u,3,4))}},
rinse:{n:"换水",cost:1,cu:0,type:"skl",r:"C",fam:"horse",img:"hrd",d:u=>`把池里的泥巴全部变成奶马`,fx:B=>B.poolConvert("mud","horse")},
pondheart:{n:"池塘之心",cost:2,cu:1,type:"pow",r:"E",fam:"frog",img:"c6",d:u=>`池子 +1 格，每次消除回复 2 生命`,fx:B=>{B.poolCap++;B.p.pw.pond=(B.p.pw.pond||0)+2;renderPool()}},
chain:{n:"连锁",cost:1,type:"atk",r:"R",fam:"frog",img:"c4",tgt:1,d:u=>`造成 ${U(u,5,7)} 伤害，池里每有 1 个奶蛙 +${U(u,3,4)}`,fx:(B,u,t)=>B.hit(t,U(u,5,7)+B.poolCount("frog")*U(u,3,4))},
cushion:{n:"鸡毛垫",cost:1,type:"skl",r:"C",fam:"chick",img:"ckl",d:u=>`获得 ${U(u,7,10)} 护盾，本回合池子溢出不受伤`,fx:(B,u)=>{B.block(U(u,7,10));B.p.noOverflow=1}},
reservoir:{n:"蓄水",cost:1,type:"skl",r:"R",fam:"cat",img:"ctu",d:u=>`池里每有 1 个，获得 ${U(u,2,3)} 护盾`,fx:(B,u)=>B.block(B.pool.length*U(u,2,3))},
devil:{n:"大魔王之怒",cost:2,cu:1,type:"skl",r:"L",fam:"none",img:"bx",exh:1,d:u=>`立刻消除池里最多的那种，不管几个都触发爆发。消耗`,fx:B=>B.poolForce()},
/* 天气 / 月相 */
callwind:{n:"呼风",cost:1,cu:0,type:"skl",r:"R",fam:"horse",img:"hrw",d:u=>`本场战斗天气变成大风，抽 1 张`,fx:B=>{B.setWx("wind");B.draw(1)}},
callrain:{n:"唤雨",cost:1,cu:0,type:"skl",r:"R",fam:"frog",img:"c2",d:u=>`本场战斗天气变成下雨，抽 1 张`,fx:B=>{B.setWx("rain");B.draw(1)}},
moonbow:{n:"拜月",cost:2,cu:1,type:"skl",r:"E",fam:"cat",img:"an",exh:1,d:u=>`本场战斗变成满月。消耗`,fx:B=>B.setMoon("full")},
snowball:{n:"雪球",cost:1,type:"atk",r:"C",fam:"chick",img:"ckq",tgt:1,d:u=>`造成 ${U(u,7,10)} 伤害，下雪天再 +7`,fx:(B,u,t)=>B.hit(t,U(u,7,10)+(B.wx==="snow"?7:0))},
thunderg:{n:"雷公",cost:2,type:"atk",r:"E",fam:"horse",img:"hrn",d:u=>`对所有敌人造成 ${U(u,9,12)} 伤害，雷雨天打两次`,fx:(B,u)=>{B.hitAll(U(u,9,12));if(B.wx==="storm")B.hitAll(U(u,9,12))}},
/* 家族扩充 */
croak:{n:"蛙鸣",cost:0,type:"skl",r:"C",fam:"frog",img:"xch",d:u=>`下一张攻击牌伤害 +${U(u,3,5)}，抽 1 张`,fx:(B,u)=>{B.p.nextAtk+=U(u,3,5);B.draw(1)}},
cicada:{n:"金蝉脱壳",cost:1,type:"skl",r:"R",fam:"frog",img:"hg",d:u=>`获得 ${U(u,8,11)} 护盾，下一张攻击牌伤害 +5`,fx:(B,u)=>{B.block(U(u,8,11));B.p.nextAtk+=5}},
legion:{n:"千蛙阵",cost:3,cu:2,type:"atk",r:"E",fam:"frog",img:"xcs",tgt:1,d:u=>`造成 3 伤害，次数 = 池里奶蛙数 × 2 + 2`,fx:(B,u,t)=>B.hit(t,3,B.poolCount("frog")*2+2)},
swallow:{n:"马踏飞燕",cost:1,type:"atk",r:"C",fam:"horse",img:"hre",tgt:1,d:u=>`造成 ${U(u,5,7)} 伤害，池里有奶马时再打一次`,fx:(B,u,t)=>{B.hit(t,U(u,5,7));if(B.poolCount("horse"))B.hit(t,U(u,5,7))}},
relief:{n:"驰援",cost:1,type:"skl",r:"R",fam:"horse",img:"hrq",d:u=>`获得 ${U(u,6,9)} 护盾，下一张奶马牌费用为 0`,fx:(B,u)=>{B.block(U(u,6,9));B.p.horseFree=1}},
bloodhorse:{n:"汗血",cost:1,type:"pow",r:"E",fam:"horse",img:"hry",d:u=>`每打出一张奶马牌，本回合力气 +${U(u,1,2)}`,fx:(B,u)=>{B.p.pw.blood=(B.p.pw.blood||0)+U(u,1,2)}},
hatch:{n:"孵化",cost:1,type:"skl",r:"C",fam:"chick",img:"cke",d:u=>`获得 ${U(u,5,8)} 护盾，从抽牌堆抽 1 张奶鸡牌`,fx:(B,u)=>{B.block(U(u,5,8));B.drawFam("chick")}},
cockfight:{n:"斗鸡",cost:1,type:"atk",r:"R",fam:"chick",img:"ckr",tgt:1,d:u=>`造成等于你护盾${U(u,"","×1.5")}的伤害`,fx:(B,u,t)=>B.hit(t,Math.floor(B.p.block*U(u,1,1.5)),1,1)},
rooster:{n:"金鸡独立",cost:2,cu:1,type:"pow",r:"E",fam:"chick",img:"ckp",d:u=>`每回合开始，获得 4 护盾`,fx:B=>{B.p.pw.rooster=(B.p.pw.rooster||0)+4}},
scratch:{n:"猫爪挠",cost:1,type:"atk",r:"C",fam:"cat",img:"ctl",tgt:1,d:u=>`造成 ${U(u,3,4)} 伤害 3 次`,fx:(B,u,t)=>B.hit(t,U(u,3,4),3)},
stretch:{n:"伸懒腰",cost:1,type:"skl",r:"C",fam:"cat",img:"cty",ret:1,d:u=>`回复 ${U(u,3,5)} 生命，敏捷 +1。保留`,fx:(B,u)=>{B.heal(U(u,3,5));B.apply(B.p,"dex",1)}},
ninetail:{n:"九尾",cost:1,cu:0,type:"skl",r:"L",fam:"cat",img:"ctar",exh:1,d:u=>`把弃牌堆洗回抽牌堆，抽 4 张。消耗`,fx:B=>{B.dp.push(...B.disc);B.disc=[];B.dp=shuffle(B.dp);B.draw(4)}},
/* ---- 0.3：伙伴卡（只能靠抓敌人获得） ---- */
p_rat:{n:"鼠鼠帮手",cost:0,type:"atk",r:"P",fam:"pal",img:"ms",tgt:1,d:u=>`造成 ${U(u,3,4)} 伤害 2 次`,fx:(B,u,t)=>B.hit(t,U(u,3,4),2)},
p_ratg:{n:"灰鼠偷袭",cost:1,type:"atk",r:"P",fam:"pal",img:"msg",tgt:1,d:u=>`造成 ${U(u,6,9)} 伤害，虚弱 1`,fx:(B,u,t)=>{B.hit(t,U(u,6,9));B.apply(t,"weak",1)}},
p_ratb:{n:"牛奶鼠",cost:1,type:"skl",r:"P",fam:"pal",img:"msb",d:u=>`获得 ${U(u,7,10)} 护盾，回复 2 生命`,fx:(B,u)=>{B.block(U(u,7,10));B.heal(2)}},
p_poo:{n:"泥巴投手",cost:1,type:"skl",r:"P",fam:"pal",img:"pp",tgt:1,d:u=>`敌人中 ${U(u,5,8)} 层泥巴`,fx:(B,u,t)=>B.apply(t,"mud",U(u,5,8))},
p_laugh:{n:"狂笑",cost:0,type:"skl",r:"P",fam:"pal",img:"m3",exh:1,d:u=>`本回合力气 +${U(u,3,4)}。消耗`,fx:(B,u)=>{B.p.tstr+=U(u,3,4);B.fxBuff(B.p)}},
p_chick:{n:"偷吃",cost:0,type:"skl",r:"P",fam:"pal",img:"ck",exh:1,d:u=>`获得 ${U(u,15,22)} 金币，抽 1 张。消耗`,fx:(B,u)=>{B.gainGold(U(u,15,22));B.draw(1)}},
p_snake:{n:"蛇咬",cost:1,type:"atk",r:"P",fam:"pal",img:"sne",tgt:1,d:u=>`造成 ${U(u,5,7)} 伤害，虚弱 2`,fx:(B,u,t)=>{B.hit(t,U(u,5,7));B.apply(t,"weak",2)}},
p_crawl:{n:"爬行突袭",cost:2,type:"atk",r:"P",fam:"pal",img:"xcs",tgt:1,d:u=>`造成 ${U(u,12,16)} 伤害，易伤 2`,fx:(B,u,t)=>{B.hit(t,U(u,12,16));B.apply(t,"vuln",2)}},
p_giant:{n:"巨无霸伙伴",cost:2,type:"atk",r:"P",fam:"pal",img:"m4",tgt:1,d:u=>`造成 ${U(u,20,26)} 伤害，力气 +1`,fx:(B,u,t)=>{B.hit(t,U(u,20,26));B.apply(B.p,"str",1);B.shake()}},
p_bomb:{n:"炸弹伙伴",cost:1,type:"atk",r:"P",fam:"pal",img:"xsr",exh:1,d:u=>`对所有敌人造成 ${U(u,12,16)} 伤害。消耗`,fx:(B,u)=>{B.hitAll(U(u,12,16));B.shake()}},
p_mud:{n:"小泥怪",cost:0,type:"skl",r:"P",fam:"pal",img:"xc",d:u=>`把池里 ${U(u,1,2)} 个泥巴变成伙伴`,fx:(B,u)=>B.poolConvert("mud","pal",U(u,1,2))},
/* ---- 诅咒 / 状态 ---- */
mud:{n:"泥巴块",cost:1,type:"sts",r:"T",fam:"none",img:"pp",exh:1,d:u=>`在手里时，回合结束受到 2 伤害。打出后消耗`,fx:()=>{}},
heavy:{n:"沉重",cost:-2,type:"cur",r:"K",fam:"none",img:"xsh",d:u=>`不能打出`,fx:()=>{}},
fret:{n:"烦躁",cost:-2,type:"cur",r:"K",fam:"none",img:"xch",d:u=>`不能打出。抽到时失去 1 点奶力`,fx:()=>{}},
frozen:{n:"冻住",cost:-2,type:"sts",r:"T",fam:"none",img:"c7",eth:1,d:u=>`不能打出。回合结束时消失`,fx:()=>{}},
};
const POOL_HERO=["lure","scoop","drain","rinse","pondheart","chain","cushion","reservoir","callwind","callrain","moonbow","snowball","thunderg","croak","cicada","legion","swallow","relief","bloodhorse","hatch","cockfight","rooster","scratch","stretch","ninetail","leap","jab","flurry","tongue","echo","dragon","rhythm","storm","gallop","rush","backkick","mane","trample","stampede","unicorn","peck","fluff","roost","crow","spur","wall","iron","blaze","paw","nap","purr","yarn","nine","prowl","stargaze","galaxy","fist","palm","breath","sit","flow","still","charge","borrow","spin","sweep","whisk","thought","tea","oneb","thousand","retreat","bell","glow","calm","way","zone","thunder","hundred","enlight","noself"];
const POOL_X=["devil","dogpal","twinegg","snakestep","ratpack","milktea","gacha","shake","gather","bigfrog","icefrog","bombfrog","kiss","goldfrog"];
const POOL_PAL=["p_rat","p_ratg","p_ratb","p_poo","p_laugh","p_chick","p_snake","p_crawl","p_giant","p_bomb","p_mud"];
const STARTER=["strike","strike","strike","strike","strike","guard","guard","guard","guard","fist"];

/* ===================== 敌人 ===================== */
/* intent: {k:'atk',v,x} {k:'def',v} {k:'buff',s,v} {k:'debuff',s,v} {k:'add',card,n} {k:'atkdef',v,b} {k:'steal',v,g} {k:'flee'} {k:'boom',v} {k:'summon'} {k:'cnt',v}*/
const ENEMY={
rat:{n:"奶鼠",pal:"p_rat",img:"ms",hp:[9,12],h:120,ai:(e,t)=>[{k:"atk",v:4},{k:"atk",v:3,x:2},{k:"def",v:5}][(t+e.seed)%3]},
ratg:{n:"灰奶鼠",pal:"p_ratg",img:"msg",hp:[10,13],h:118,ai:(e,t)=>[{k:"atk",v:3,x:2},{k:"atk",v:5},{k:"debuff",s:"weak",v:1}][(t+e.seed)%3]},
ratb:{n:"奶牛奶鼠",pal:"p_ratb",img:"msb",hp:[12,15],h:124,ai:(e,t)=>[{k:"def",v:6},{k:"atk",v:6}][(t+e.seed)%2]},
poo:{n:"泥巴奶屎",pal:"p_poo",img:"pp",hp:[26,30],h:130,ai:(e,t)=>t%2===0?{k:"add",card:"mud",n:2,s:"mud",v:3}:{k:"atk",v:8}},
laugh:{n:"狂笑奶蛙",pal:"p_laugh",img:"m3",hp:[32,36],h:170,ai:(e,t)=>[{k:"atk",v:9},{k:"atkdef",v:5,b:8},{k:"buff",s:"str",v:2},{k:"atk",v:5,x:2}][t%4]},
chick:{n:"偷吃奶鸡",pal:"p_chick",img:"ck",hp:[22,26],h:140,ai:(e,t)=>t<2?{k:"steal",v:6,g:12}:{k:"flee"}},
snake:{n:"泥沼奶蛇",pal:"p_snake",img:"sne",hp:[26,30],h:150,ai:(e,t)=>[{k:"atk",v:6,s:"weak",d:1},{k:"def",v:6,s2:"str",v2:2},{k:"atk",v:11}][t%3]},
crawl:{n:"沼泽爬行奶蛙",pal:"p_crawl",img:"xcs",hp:[38,42],h:150,ai:(e,t)=>[{k:"atk",v:12},{k:"debuff",s:"vuln",v:2},{k:"atk",v:7,x:2}][t%3]},
/* 精英 */
giant:{n:"巨无霸奶蛙",pal:"p_giant",img:"m4",hp:[70,74],h:250,elite:1,ai:(e,t)=>e.enraged?[{k:"atk",v:16},{k:"atk",v:5,x:3},{k:"atkdef",v:10,b:10}][t%3]:[{k:"buff",s:"str",v:2},{k:"atk",v:14},{k:"atkdef",v:8,b:10}][t%3]},
bomb:{n:"炸弹小奶蛙",pal:"p_bomb",img:"xsr",hp:[16,18],h:110,elite:1,ai:(e,t)=>t<2?{k:"atkcnt",v:5,c:3-t}:{k:"boom",v:12}},
bombp:{n:"炸弹小奶蛙",pal:"p_bomb",img:"xsp",hp:[16,18],h:110,elite:1,ai:(e,t)=>t<2?{k:"atkcnt",v:5,c:3-t}:{k:"boom",v:12}},
bombw:{n:"炸弹小奶蛙",pal:"p_bomb",img:"xs",hp:[16,18],h:110,elite:1,ai:(e,t)=>t<2?{k:"atkcnt",v:5,c:3-t}:{k:"boom",v:12}},
/* 首领 */
king:{n:"沼泽之王",img:"xsk",hp:[150,150],h:260,boss:1,ai:(e,t)=>{if(e.phase2){return[{k:"atk",v:6,x:3},{k:"add",card:"mud",n:2,s:"mud",v:3},{k:"atkdef",v:16,b:12},{k:"buff",s:"str",v:3}][t%4]}return[{k:"add",card:"mud",n:2,s:"mud",v:2},{k:"atk",v:14},{k:"def",v:12,s2:"str",v2:2},{k:"atk",v:8,x:2}][t%4]}},
mudling:{n:"小泥怪",pal:"p_mud",img:"xc",hp:[14,16],h:105,ai:(e,t)=>[{k:"atk",v:5},{k:"debuff",s:"weak",v:1}][(t+e.seed)%2]},
};
const ENC={
easy:[["rat","ratg"],["poo"],["chick"],["snake"]],
normal:[["rat","ratg","ratb"],["laugh"],["poo","rat"],["crawl"],["snake","rat"],["chick","poo"]],
elite:[["giant"],["bomb","bombp","bombw"]],
boss:[["king"]]};

/* ===================== 遗物 ===================== */
const RELICS={
cup:{n:"茶杯",img:"ctm",r:"S",d:"每场战斗结束，回复 6 生命"},
pot:{n:"奶茶壶",img:"ct",r:"C",d:"在休息点休息时，多回复 10 生命"},
badge:{n:"三连徽章",img:"c1",r:"C",d:"每场战斗第一次触发三连时，抽 2 张"},
moon:{n:"月亮石",img:"nx",r:"R",d:"每过 3 回合，额外获得 1 点奶力"},
feather:{n:"天使羽毛",img:"an",r:"C",d:"每场战斗开始，获得 8 护盾"},
ring:{n:"金戒指",img:"hg",r:"C",d:"每场战斗结束，获得 8 金币"},
cape:{n:"吸血鬼披风",img:"vp",r:"R",d:"每击败一个敌人，回复 3 生命"},
phoenix:{n:"不死羽",img:"xb",r:"E",d:"第一次生命归零时，回到 30% 生命（只有一次）"},
bellr:{n:"招财铃",img:"ctl",r:"R",d:"商店里的东西打八折"},
clover:{n:"四叶草",img:"c2",r:"R",d:"卡牌奖励多一个选项"},
lantern:{n:"灯笼",img:"cty",r:"C",d:"每场战斗第一回合，多 1 点奶力"},
mirror:{n:"双子镜",img:"xg",r:"E",d:"每场战斗打出的第一张牌，效果触发两次"},
sand:{n:"时之沙",img:"xsw",r:"C",d:"每场战斗第一回合，多抽 2 张"},
star:{n:"流派之星",img:"n4",r:"R",d:"每场战斗开始，力气 +1"},
belt:{n:"药水腰带",img:"ega",r:"C",d:"药水栏 +1 格"},
net:{n:"大网兜",img:"cks",r:"R",d:"每场战斗可以多抓 1 只敌人"},
pondstone:{n:"池塘石",img:"c3",r:"C",d:"奶蛙池多 1 格"},
moonmirror:{n:"月光镜",img:"nx",r:"E",d:"每层都当作满月（三连只需要 2 个）"},
pup:{n:"奶狗陪伴",img:"dg",r:"R",d:"每场战斗第一回合，奶狗对随机敌人造成 6 伤害"},
};
const RELIC_POOL=Object.keys(RELICS).filter(k=>RELICS[k].r!=="S"&&k!=="pup");

/* ===================== 药水 ===================== */
const POTIONS={
pstr:{n:"力量药水",c:"#ff6b6b",d:"本场战斗力气 +2",fx:B=>{B.p.str+=2;B.fxBuff(B.p)}},
pheal:{n:"回血药水",c:"#ff8fb1",d:"回复 20 生命",fx:B=>B.heal(20)},
pdraw:{n:"抽牌药水",c:"#6fc3ff",d:"抽 3 张牌",fx:B=>B.draw(3)},
pen:{n:"能量药水",c:"#ffd23f",d:"获得 2 点奶力",fx:B=>B.gainEnergy(2)},
pblock:{n:"护盾药水",c:"#9ad7ff",d:"获得 12 护盾",fx:B=>B.block(12)},
pbomb:{n:"炸弹药水",c:"#ff9a1f",tgt:1,d:"对一个敌人造成 20 伤害",fx:(B,t)=>B.hit(t,20,1,1)},
pmud:{n:"泥巴药水",c:"#8a6a3c",tgt:1,d:"敌人中 7 层泥巴",fx:(B,t)=>B.apply(t,"mud",7)},
pice:{n:"冰冻药水",c:"#bfefff",d:"所有敌人虚弱 3",fx:B=>B.enemies.forEach(e=>e.hp>0&&B.apply(e,"weak",3))},
};

/* ===================== 状态 ===================== */
const STAT={str:{n:"力气",c:"#ff6b6b",d:"攻击伤害 +1/层"},dex:{n:"敏捷",c:"#6fc3ff",d:"护盾 +1/层"},vuln:{n:"易伤",c:"#ff9a1f",d:"受到伤害 +50%（回合数）"},weak:{n:"虚弱",c:"#a98bff",d:"造成伤害 -25%（回合数）"},mud:{n:"泥巴",c:"#8a6a3c",d:"回合开始扣等量生命，然后 -1"},thorn:{n:"荆棘",c:"#4fa86a",d:"被攻击时，对攻击者造成等量伤害"}};

/* ===================== 剧情 ===================== */
const STORY={
intro:[["fj","奶蛙长老","满月又升起来了。尖塔……也跟着回来了。"],["n1","功夫奶蛙","长老，村里的奶茶泉，这几天又浅了一截。"],["fj","奶蛙长老","是那个影子。大魔王倒下以后，它的影子钻进了塔里，一点点把泉水往上吸。"],["fj","奶蛙长老","塔每次出现，里面的路都不一样。你得一层层往上爬，见招拆招。"],["n1","功夫奶蛙","我练了这么多年拳，就是为了这一天。"],["fj","奶蛙长老","记住：同一种家族的招式连出三次，会生出意想不到的力量。去吧。"]],
boss:[["xsk","沼泽之王","呱……呱……谁……谁在踩我的泥巴……"],["n1","功夫奶蛙","沼泽之王？你的眼睛……怎么是黑的？"],["xsk","沼泽之王","影子大人说……谁往上走……就把谁……埋进泥里！"]],
win:[["xsk","沼泽之王","呱……头好晕。我刚才……是不是做了什么坏事？"],["n1","功夫奶蛙","你被影子控制了。现在没事了。"],["xsk","沼泽之王","那个影子……往上跑了。上面是月夜古堡，住着一个很饿很饿的家伙……你要小心。"],["fj","奶蛙长老","第一层，你守住了。可是塔还很高。"]],
};
const ELDER_TALES=["很久很久以前，奶茶泉旁边住着一只总是一个人修行的奶蛙。","它太专心了，专心到连自己的影子都忘了。","影子一个人待在黑暗里，越来越大，越来越饿。","长老说到这里停了下来：「剩下的，等你爬得更高再告诉你。」"];

/* ===================== 月相 / 天气 ===================== */
const MOON={new:{n:"新月",d:"池子少 1 格，但每次消除多 1 点奶力"},wax:{n:"上弦月",d:"攻击牌伤害 +1"},full:{n:"满月",d:"三连只需要 2 个"},wane:{n:"下弦月",d:"护盾牌多 2 护盾"}};
const MOON_CYCLE=["new","wax","full","wane"];
const WX={clear:{n:"晴",d:"没有特别的事"},rain:{n:"下雨",d:"泥巴伤害翻倍；奶蛙牌伤害 +2"},wind:{n:"大风",d:"每回合风会吹走 1 张手牌，再补 1 张；奶马牌伤害 +3"},snow:{n:"下雪",d:"回合开始护盾只消一半；奶鸡牌多 3 护盾"},fog:{n:"大雾",d:"看不清敌人的伤害数字；每回合第一张奶猫牌抽 1 张"},storm:{n:"雷雨",d:"每回合开始，闪电随机劈中一个角色，造成 5 伤害"}};
const WX_POOL=["clear","clear","rain","wind","snow","fog","storm"];
