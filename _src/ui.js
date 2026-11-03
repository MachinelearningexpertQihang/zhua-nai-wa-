/* ===================== 图标 & 场景（全部矢量，边缘清晰） ===================== */
const INK="#2a1a33";
const sv=(b,vb="0 0 32 32")=>`<svg class="ico" viewBox="${vb}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${b}</svg>`;
const ICON={
sword:sv(`<path d="M24 3 L29 3 L29 8 L13 24 L8 19 Z" fill="#e9eef7"/><path d="M24 3 L29 8" stroke-width="1.6" fill="none"/><path d="M6 17 L15 26" fill="none" stroke-width="3.4"/><path d="M4 28 L9 23" stroke-width="4.2"/><path d="M6 17 L15 26" stroke="#f7c948" stroke-width="1.6" fill="none"/>`),
shield:sv(`<path d="M16 3 L27 7 V15 C27 22 22 27 16 29 C10 27 5 22 5 15 V7 Z" fill="#5fb0f0"/><path d="M16 7 L23 9.6 V15 C23 19.6 20 23 16 24.6 Z" fill="#bfe3ff" stroke="none"/>`),
up:sv(`<path d="M16 3 L27 15 H20 V29 H12 V15 H5 Z" fill="#ff8a5b"/>`),
swirl:sv(`<circle cx="16" cy="16" r="13" fill="#b392ff"/><path d="M16 16 m0 -2 a2 2 0 1 1 -2 2 a4.5 4.5 0 1 1 4.5 4.5 a7 7 0 1 1 -7 -7" fill="none" stroke-width="2.2"/>`),
mud:sv(`<path d="M5 22 C3 16 8 13 11 14 C11 8 18 6 21 11 C26 9 30 14 27 19 C30 23 26 28 20 26 C16 29 9 28 5 22 Z" fill="#8a6038"/><circle cx="13" cy="18" r="1.8" fill="${INK}" stroke="none"/><circle cx="20" cy="18" r="1.8" fill="${INK}" stroke="none"/>`),
bomb:sv(`<circle cx="14" cy="19" r="10" fill="#3d3550"/><path d="M20 11 L24 7" fill="none" stroke-width="3"/><path d="M24 7 L27 4 M27 7 L29 6 M25 3 L26 1" stroke="#ff9a1f" stroke-width="2.4"/><circle cx="10.5" cy="15.5" r="2.5" fill="#fff" stroke="none" opacity=".7"/>`),
boom:sv(`<path d="M16 2 L19 10 L28 6 L23 14 L31 18 L22 20 L25 29 L17 23 L10 30 L11 21 L2 19 L9 14 L4 6 L13 9 Z" fill="#ffb02e"/><path d="M16 10 L18 14 L22 13 L20 17 L23 20 L18 20 L16 24 L14 20 L10 20 L12 17 L10 13 L14 14 Z" fill="#fff3a0" stroke="none"/>`),
wind:sv(`<path d="M3 11 H20 A4 4 0 1 0 16 7" fill="none" stroke-width="3"/><path d="M3 18 H25 A4 4 0 1 1 21 22" fill="none" stroke-width="3"/><path d="M6 25 H14" fill="none" stroke-width="3"/>`),
grab:sv(`<path d="M7 18 V9 a2 2 0 0 1 4 0 V15 V6 a2 2 0 0 1 4 0 V15 V7 a2 2 0 0 1 4 0 V16 V10 a2 2 0 0 1 4 0 V20 C23 26 19 29 14 29 C10 29 7 26 5 22 L3 17 a2 2 0 0 1 4 -1 Z" fill="#ffd7a8"/>`),
coin:sv(`<circle cx="16" cy="16" r="12" fill="#f7c948"/><circle cx="16" cy="16" r="7.5" fill="none" stroke="#b07a12" stroke-width="2"/><path d="M11 10 A8 8 0 0 1 21 9" stroke="#fff6c8" fill="none" stroke-width="2.4"/>`),
heart:sv(`<path d="M16 28 C6 21 3 15 3 10.5 A6.5 6.5 0 0 1 16 8 A6.5 6.5 0 0 1 29 10.5 C29 15 26 21 16 28 Z" fill="#ff5a6e"/><path d="M8 9.5 A3 3 0 0 1 11.5 7.5" stroke="#ffd0d6" fill="none" stroke-width="2.2"/>`),
fire:sv(`<path d="M16 2 C18 8 26 11 26 20 A10 10 0 0 1 6 20 C6 14 10 12 11 7 C13 10 14 12 14 14 C15 10 15 6 16 2 Z" fill="#ff7a2e"/><path d="M16 14 C18 18 21 19 21 23 A5 5 0 0 1 11 23 C11 20 14 19 16 14 Z" fill="#ffe17a" stroke="none"/>`),
bag:sv(`<path d="M11 9 L9 4 H23 L21 9 C27 12 29 18 28 23 C27 28 22 29 16 29 C10 29 5 28 4 23 C3 18 5 12 11 9 Z" fill="#e8b866"/><path d="M11 9 H21" fill="none"/><text x="16" y="25" text-anchor="middle" font-size="12" font-weight="900" fill="${INK}" stroke="none" font-family="Arial">$</text>`),
chest:sv(`<rect x="3" y="13" width="26" height="15" rx="2" fill="#c27a3a"/><path d="M3 13 C3 6 8 4 16 4 C24 4 29 6 29 13 Z" fill="#e0954a"/><rect x="13" y="11" width="6" height="7" rx="1.5" fill="#f7c948"/><path d="M3 13 H29" fill="none"/>`),
q:sv(`<circle cx="16" cy="16" r="13" fill="#a983ff"/><text x="16" y="22.5" text-anchor="middle" font-size="19" font-weight="900" fill="#fff" stroke="${INK}" stroke-width="1.2" font-family="Arial">?</text>`),
deck:sv(`<rect x="9" y="3" width="17" height="23" rx="3" fill="#8a6cf0" transform="rotate(10 17 14)"/><rect x="5" y="6" width="17" height="23" rx="3" fill="#ffe08a"/><circle cx="13.5" cy="17.5" r="3.5" fill="#ff8a5b"/>`),
gear:sv(`<path d="M13.5 3 H18.5 L19.2 7 L22.6 8.6 L26 6.4 L29.3 10 L27 13.4 L28 17 L31 18.5 V19 L28 21 L27 24 L29 27 L26 30 L22.6 28 L19.5 29.2 L18.5 31 H13.5 L12.6 29 L9.4 28 L6 30 L2.8 27 L5 23.6 L3.8 20.5 L1 19 V14 L4 13 L5 9.8 L2.8 6.4 L6 3.2 L9.4 5.4 L12.6 4.2 Z" fill="#cfc6e6" transform="scale(.94) translate(1 0)"/><circle cx="16" cy="16.5" r="4.6" fill="${INK}" stroke="none"/>`),
star:sv(`<path d="M16 3 L19.6 11.4 L28.6 12 L21.6 17.8 L23.8 26.8 L16 22 L8.2 26.8 L10.4 17.8 L3.4 12 L12.4 11.4 Z" fill="#f7c948"/>`),
skull:sv(`<path d="M16 3 C8 3 4 9 4 15 C4 19 6 21 8 22 V27 H24 V22 C26 21 28 19 28 15 C28 9 24 3 16 3 Z" fill="#f2ead8"/><circle cx="11.5" cy="15" r="3.2" fill="${INK}" stroke="none"/><circle cx="20.5" cy="15" r="3.2" fill="${INK}" stroke="none"/><path d="M13 27 V23 M16 27 V23 M19 27 V23" fill="none" stroke-width="1.8"/>`),
};

/* 场景：分层平涂 SVG，没有模糊边 */
function sceneSVG(kind){
 const P={swamp:{s1:"#16103a",s2:"#2c2263",s3:"#4f3a7d",moon:"#fff1c2",far:"#2a2058",mid:"#1d3a3a",near:"#132a26",water:"#2a3f6b",gl:"#3d6b4f"},
  boss:{s1:"#12081e",s2:"#3a1438",s3:"#7a2a3a",moon:"#ffb08a",far:"#2b1030",mid:"#2a1a22",near:"#170e14",water:"#4a1f33",gl:"#5a2f30"},
  title:{s1:"#120c30",s2:"#2b1f62",s3:"#7a4f8a",moon:"#fff1c2",far:"#241a52",mid:"#1c2f3a",near:"#11221f",water:"#2d3f72",gl:"#2f5a48"},
  rest:{s1:"#0c1230",s2:"#1a2556",s3:"#2f3a74",moon:"#fff1c2",far:"#1b2350",mid:"#17303a",near:"#0f2220",water:"#22396a",gl:"#2b5244"},
  event:{s1:"#170f33",s2:"#2e2366",s3:"#5a3f7d",moon:"#fff1c2",far:"#271d58",mid:"#1e3540",near:"#132824",water:"#2b3f70",gl:"#335a48"},
  shop:{s1:"#2a1230",s2:"#4a1f3a",s3:"#8a3a3a",moon:"#ffd9a0",far:"#3a1838",mid:"#2b1a1c",near:"#1a0f10",water:"#3a1f2a",gl:"#4a2a24"}}[kind]||{};
 const mx={swamp:1040,boss:640,title:760,rest:1060,event:980,shop:180}[kind]||1000,mr={boss:96,title:84}[kind]||54,my=kind==="boss"?150:120;
 let stars="";for(let i=0;i<46;i++){const x=(i*277)%1280,y=(i*131)%330,r=i%5===0?2.2:1.2;stars+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${.35+(i%4)*.18}"/>`}
 const tower=(x,s,c)=>`<g transform="translate(${x} ${470-200*s}) scale(${s})" fill="${c}"><path d="M42 0 L52 26 L50 26 L50 34 L58 34 L60 60 L56 60 L60 120 L66 120 L70 200 L14 200 L18 120 L24 120 L28 60 L24 60 L26 34 L34 34 L34 26 L32 26 Z"/><g fill="#ffd77a"><rect x="40" y="44" width="4" height="7" rx="2"/><rect x="36" y="80" width="4" height="7" rx="2"/><rect x="46" y="96" width="4" height="7" rx="2"/><rect x="40" y="140" width="5" height="9" rx="2.5"/><rect x="30" y="166" width="5" height="9" rx="2.5"/></g></g>`;
 const tree=(x,y,s,c,flip)=>`<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s})" fill="${c}"><path d="M-6 0 L-4 -70 C-30 -70 -40 -95 -24 -110 C-40 -130 -20 -160 0 -150 C10 -175 45 -165 40 -140 C62 -130 55 -95 30 -92 C40 -75 20 -68 4 -70 L6 0 Z"/></g>`;
 const reed=(x,h,c)=>`<path d="M${x} 720 Q${x+4} ${720-h/2} ${x-6} ${720-h}" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="${x-6}" cy="${720-h+10}" rx="4" ry="11" fill="${c}"/>`;
 let reeds="";[30,52,70,1190,1214,1240,1262].forEach((x,i)=>reeds+=reed(x,90+(i*37)%70,P.near));
 return `<svg class="scene" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.s1}"/><stop offset=".6" stop-color="${P.s2}"/><stop offset="1" stop-color="${P.s3}"/></linearGradient></defs>
 <rect width="1280" height="720" fill="url(#sk)"/>${stars}
 <circle cx="${mx}" cy="${my}" r="${mr+36}" fill="${P.moon}" opacity=".08"/><circle cx="${mx}" cy="${my}" r="${mr+16}" fill="${P.moon}" opacity=".12"/><circle cx="${mx}" cy="${my}" r="${mr}" fill="${P.moon}"/><circle cx="${mx+mr*.3}" cy="${my-mr*.25}" r="${mr*.16}" fill="#000" opacity=".07"/><circle cx="${mx-mr*.35}" cy="${my+mr*.3}" r="${mr*.11}" fill="#000" opacity=".07"/>
 ${kind!=="shop"?tower(kind==="boss"?980:kind==="title"?860:780,kind==="title"?2.05:1.5,P.far):""}
 <path d="M0 470 C160 420 300 440 420 455 C560 470 700 420 860 432 C1000 442 1140 410 1280 430 V720 H0 Z" fill="${P.far}"/>
 ${tree(90,500,1.25,P.mid)}${tree(210,510,.85,P.mid,1)}${tree(1150,505,1.2,P.mid,1)}${tree(1030,512,.8,P.mid)}
 <path d="M0 500 C200 480 400 492 640 490 C880 488 1080 476 1280 494 V720 H0 Z" fill="${P.mid}"/>
 <path d="M0 520 H1280 V720 H0 Z" fill="${P.water}"/>
 <g fill="${P.moon}" opacity=".35">${[0,1,2,3,4,5].map(i=>`<rect x="${mx-40+i*7-(i%2)*20}" y="${528+i*13}" width="${80-i*10}" height="4" rx="2"/>`).join("")}</g>
 <path d="M0 560 C180 545 320 572 520 562 C760 550 900 575 1280 556 V720 H0 Z" fill="${P.gl}"/>
 <path d="M0 610 C220 596 420 618 640 610 C900 600 1060 620 1280 606 V720 H0 Z" fill="${P.near}"/>
 ${reeds}</svg>`}
