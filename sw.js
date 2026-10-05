const V='naiwa-202610052337';
const CORE=['./','index.html','naiwa.html','three.min.js','cannon.min.js','qrcode.min.js','zanshang.jpg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  const page=r.mode==='navigate'||/\.html$/.test(u.pathname)||u.pathname.endsWith('/');
  if(page){
    // pages: try the network for 4s so updates arrive, otherwise use the saved copy
    e.respondWith(new Promise(res=>{let done=false;const fin=x=>{if(!done&&x){done=true;res(x)}};
      const saved=()=>caches.match(r,{ignoreSearch:true}).then(c=>c||caches.match('index.html')).then(c=>c||caches.match('naiwa.html'));
      const t=setTimeout(()=>saved().then(fin),4000);
      fetch(r).then(n=>{clearTimeout(t);if(n.ok){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}fin(n)})
        .catch(()=>{clearTimeout(t);saved().then(c=>fin(c||Response.error()))})}));
    return}
  // engine, images, CDN files: saved copy first
  e.respondWith(caches.match(r).then(c=>c||fetch(r).then(n=>{if(n.ok||n.type==='opaque'){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}return n})))});
