import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/dashboard?token=DASHBOARD_TOKEN
 *
 * Serve o painel de performance como HTML. Protegido pelo mesmo
 * DASHBOARD_TOKEN do endpoint de dados. Bookmarke a URL com o token
 * e abra direto no browser — sem configuração.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const expected = process.env.DASHBOARD_TOKEN;
  if (!expected) return res.status(503).send('<p>DASHBOARD_TOKEN não configurado no servidor.</p>');

  const token = (req.query.token as string | undefined)
    ?? req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (token !== expected) return res.status(401).send('<p>Token inválido.</p>');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(html(token));
}

function html(token: string): string {
  return /* html */`<!doctype html>
<title>Papazilla Performance</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap">

<style>
:root {
  --coral:#E05535; --coral-bg:#FCEAE4; --cream:#FAF4ED; --cream-2:#EDE3D5;
  --choco:#2A1405; --choco-2:#5C3A1C; --dust:#9B8778;
  --sage:#467838; --sage-bg:#E3EEDE; --amber:#B85E0A; --amber-bg:#FAE9D2;
  --live:#2D7D46;
  --bg:var(--cream); --surface:#FFFCF8; --border:rgba(42,20,5,.08);
  --text-1:var(--choco); --text-2:var(--choco-2); --text-3:var(--dust);
  color-scheme:light;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#180C02; --surface:#231308; --border:rgba(255,192,152,.09);
  --text-1:#F3E5D6; --text-2:#C09B72; --text-3:#876348;
  --coral:#EE7355; --coral-bg:rgba(238,115,85,.13); --cream-2:rgba(255,192,152,.1);
  --sage-bg:rgba(70,120,56,.14); --amber-bg:rgba(184,94,10,.14); --live:#4CAF72;
  color-scheme:dark;
}}
*,*::before,*::after{box-sizing:border-box;margin:0}
body{background:var(--bg);color:var(--text-1);font-family:'Inter',system-ui,sans-serif;
  font-size:14px;line-height:1.5;
  padding-left:max(20px,env(safe-area-inset-left,0px));
  padding-right:max(20px,env(safe-area-inset-right,0px));}
.wrap{max-width:900px;margin:0 auto;padding-block:36px 52px}
.header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:28px}
.brand{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;
  letter-spacing:.12em;text-transform:uppercase;color:var(--coral);margin-bottom:5px}
h1{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:600;
  color:var(--text-1);text-wrap:balance;line-height:1.25}
.meta-block{text-align:right;flex-shrink:0}
.ts-line{font-size:11px;color:var(--text-3);line-height:1.65}
.ts-line strong{color:var(--text-2);font-weight:500}
.live-dot{display:inline-flex;align-items:center;gap:5px;font-size:11px;
  font-weight:600;color:var(--live);margin-top:4px}
.live-dot::before{content:'';display:block;width:6px;height:6px;background:var(--live);
  border-radius:50%;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
.live-dot.error{color:var(--amber)}.live-dot.error::before{background:var(--amber);animation:none}
.kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px}
@media(max-width:540px){.kpi-grid{grid-template-columns:repeat(2,1fr)}.kpi-card:first-child{grid-column:1/-1}}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;
  padding:18px 20px 16px;display:flex;flex-direction:column;gap:5px;position:relative}
.kpi-label{font-size:10.5px;font-weight:600;letter-spacing:.065em;text-transform:uppercase;color:var(--text-3)}
.kpi-num{font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:700;
  line-height:1;font-variant-numeric:tabular-nums;color:var(--text-1)}
.kpi-num[contenteditable=true]{outline:none;cursor:text;display:inline-block;min-width:1ch;
  -webkit-user-modify:read-write-plaintext-only;transition:color .12s}
.kpi-num[contenteditable=true]:focus{color:var(--coral)}
.kpi-num[contenteditable=true]:empty::before{content:'0';color:var(--text-3);pointer-events:none}
.c-primary .kpi-num{color:var(--coral)}.c-positive .kpi-num{color:var(--sage)}.c-warn .kpi-num{color:var(--amber)}
.kpi-desc{font-size:11.5px;color:var(--text-3);line-height:1.4}
.kpi-badge{display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;
  padding:2px 7px;border-radius:20px;width:fit-content;font-variant-numeric:tabular-nums;margin-top:3px}
.b-neutral{background:var(--cream-2);color:var(--text-2)}
.b-positive{background:var(--sage-bg);color:var(--sage)}
.b-warn{background:var(--amber-bg);color:var(--amber)}
.kpi-source{position:absolute;top:12px;right:14px;font-size:9px;font-weight:600;
  letter-spacing:.05em;text-transform:uppercase;color:var(--live);opacity:.7}
.kpi-source.calc{color:var(--text-3)}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;
  padding:22px 24px;margin-bottom:10px}
.panel-title{font-family:'Space Grotesk',sans-serif;font-size:10.5px;font-weight:700;
  letter-spacing:.09em;text-transform:uppercase;color:var(--text-3);margin-bottom:18px}
.f-row{display:grid;grid-template-columns:160px 1fr 60px;align-items:center;gap:14px;padding:9px 0}
@media(max-width:520px){.f-row{grid-template-columns:100px 1fr 48px;gap:10px}}
.f-name{font-size:12.5px;font-weight:500;color:var(--text-2);line-height:1.3}
.f-track{height:22px;background:var(--cream-2);border-radius:4px;overflow:visible;position:relative;cursor:default}
.f-track:hover .f-tt{opacity:1}
.f-bar{height:100%;border-radius:4px;min-width:3px;transition:width .55s cubic-bezier(.25,.46,.45,.94)}
.bar-coral{background:var(--coral)}.bar-sage{background:var(--sage)}.bar-amber{background:var(--amber)}
.f-tt{position:absolute;left:calc(100% + 8px);top:50%;transform:translateY(-50%);
  background:var(--choco);color:#fff;font-size:11px;font-weight:600;padding:3px 8px;
  border-radius:5px;white-space:nowrap;opacity:0;transition:opacity .12s;
  pointer-events:none;z-index:10;font-variant-numeric:tabular-nums}
.f-pct{font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;
  color:var(--text-3);text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.f-conv{display:flex;align-items:center;gap:8px;padding:2px 0 2px 174px;border-top:1px solid var(--border)}
@media(max-width:520px){.f-conv{padding-left:110px}}
.conv-pill{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;
  padding:2px 8px;border-radius:20px;font-variant-numeric:tabular-nums;flex-shrink:0}
.pill-coral{background:var(--coral-bg);color:var(--coral)}
.pill-sage{background:var(--sage-bg);color:var(--sage)}
.pill-amber{background:var(--amber-bg);color:var(--amber)}
.conv-text{font-size:11px;color:var(--text-3)}
.footer{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 4px;flex-wrap:wrap}
.tip{font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:6px}
.tip::before{content:'';display:block;width:4px;height:4px;background:var(--text-3);border-radius:50%;opacity:.5}
.refresh-btn{background:none;border:1px solid var(--border);border-radius:7px;padding:5px 11px;
  font-size:11px;font-weight:600;color:var(--text-3);cursor:pointer;
  font-family:'Inter',sans-serif;transition:border-color .15s,color .15s}
.refresh-btn:hover{border-color:var(--coral);color:var(--coral)}
.score-card{position:relative}
.score-arc-wrap{position:relative;height:36px;overflow:visible;margin:4px 0 0}
.score-arc{width:70px;height:auto;overflow:visible}
.score-num{font-size:32px}
</style>

<div class="wrap">
  <div class="header">
    <div>
      <div class="brand">Papazilla</div>
      <h1>Performance de Lançamento</h1>
    </div>
    <div class="meta-block">
      <div class="ts-line">Atualizado<br><strong id="ts">—</strong></div>
      <div class="live-dot" id="live-indicator">ao vivo</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card c-primary">
      <div class="kpi-source" id="src-visitas">ao vivo</div>
      <div class="kpi-label">Visitas ao site</div>
      <div class="kpi-num" id="val-visitas" contenteditable="true" inputmode="numeric" spellcheck="false"></div>
      <div class="kpi-desc">Sessões na landing (Vercel Analytics)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-source">ao vivo</div>
      <div class="kpi-label">Cadastros no app</div>
      <div class="kpi-num" id="val-cadastros">—</div>
      <div class="kpi-desc">Contas criadas</div>
      <span class="kpi-badge b-neutral" id="badge-cad">—</span>
    </div>
    <div class="kpi-card c-positive">
      <div class="kpi-source">ao vivo</div>
      <div class="kpi-label">Compras realizadas</div>
      <div class="kpi-num" id="val-compras">—</div>
      <div class="kpi-desc">Pagamentos confirmados</div>
      <span class="kpi-badge b-neutral" id="badge-comp">—</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-source">ao vivo</div>
      <div class="kpi-label">Pets cadastrados</div>
      <div class="kpi-num" id="val-pets">—</div>
      <div class="kpi-desc">Usuários com perfil de pet</div>
      <span class="kpi-badge b-neutral" id="badge-pets">—</span>
    </div>
    <div class="kpi-card">
      <div class="kpi-source">ao vivo</div>
      <div class="kpi-label">Cliques no botão de compra</div>
      <div class="kpi-num" id="val-cliques">—</div>
      <div class="kpi-desc">Formulário de checkout aberto</div>
      <span class="kpi-badge b-neutral" id="badge-clic">—</span>
    </div>
    <div class="kpi-card c-warn">
      <div class="kpi-source calc">calculado</div>
      <div class="kpi-label">Abandono de carrinho</div>
      <div class="kpi-num" id="val-abandono">—</div>
      <div class="kpi-desc">Cliques − compras</div>
      <span class="kpi-badge b-neutral" id="badge-aban">—</span>
    </div>
    <div class="kpi-card score-card" id="card-mobile">
      <div class="kpi-source calc">manual</div>
      <div class="kpi-label">Real Experience Score · Mobile</div>
      <div class="kpi-num score-num" id="val-score-mobile" contenteditable="true" inputmode="numeric" spellcheck="false"></div>
      <div class="score-arc-wrap"><svg class="score-arc" id="arc-mobile" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 44 A32 32 0 0 1 72 44" stroke="var(--border)" stroke-width="6" stroke-linecap="round"/><path id="arc-mobile-fill" d="M8 44 A32 32 0 0 1 72 44" stroke="var(--score-color,#9B8778)" stroke-width="6" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg></div>
      <div class="kpi-desc">Ver em <a href="https://vercel.com/flaybio-inc1/papazilla-web/speed-insights" target="_blank" style="color:var(--coral)">Vercel Speed Insights</a></div>
    </div>
    <div class="kpi-card score-card" id="card-desktop">
      <div class="kpi-source calc">manual</div>
      <div class="kpi-label">Real Experience Score · Desktop</div>
      <div class="kpi-num score-num" id="val-score-desktop" contenteditable="true" inputmode="numeric" spellcheck="false"></div>
      <div class="score-arc-wrap"><svg class="score-arc" id="arc-desktop" viewBox="0 0 80 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 44 A32 32 0 0 1 72 44" stroke="var(--border)" stroke-width="6" stroke-linecap="round"/><path id="arc-desktop-fill" d="M8 44 A32 32 0 0 1 72 44" stroke="var(--score-color,#9B8778)" stroke-width="6" stroke-linecap="round" stroke-dasharray="100.5" stroke-dashoffset="100.5"/></svg></div>
      <div class="kpi-desc">Ver em <a href="https://vercel.com/flaybio-inc1/papazilla-web/speed-insights" target="_blank" style="color:var(--coral)">Vercel Speed Insights</a></div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-title">Funil de conversão — proporção em relação às visitas</div>
    <div class="f-row">
      <div class="f-name">Visitas ao site</div>
      <div class="f-track"><div class="f-bar bar-coral" style="width:100%"></div><div class="f-tt" id="tt-vis">—</div></div>
      <div class="f-pct">100%</div>
    </div>
    <div class="f-conv"><span class="conv-pill pill-coral" id="cp-cad">—</span><span class="conv-text">das visitas se cadastram</span></div>
    <div class="f-row">
      <div class="f-name">Cadastros</div>
      <div class="f-track"><div class="f-bar bar-coral" id="fb-cad" style="width:0%"></div><div class="f-tt" id="tt-cad">—</div></div>
      <div class="f-pct" id="fp-cad">—</div>
    </div>
    <div class="f-conv"><span class="conv-pill pill-sage" id="cp-pets">—</span><span class="conv-text">dos cadastros ativam um pet</span></div>
    <div class="f-row">
      <div class="f-name">Pets cadastrados</div>
      <div class="f-track"><div class="f-bar bar-sage" id="fb-pets" style="width:0%"></div><div class="f-tt" id="tt-pets">—</div></div>
      <div class="f-pct" id="fp-pets">—</div>
    </div>
    <div class="f-conv"><span class="conv-pill pill-coral" id="cp-clic">—</span><span class="conv-text">dos cadastros clicam em comprar</span></div>
    <div class="f-row">
      <div class="f-name">Cliques no botão</div>
      <div class="f-track"><div class="f-bar bar-coral" id="fb-clic" style="width:0%"></div><div class="f-tt" id="tt-clic">—</div></div>
      <div class="f-pct" id="fp-clic">—</div>
    </div>
    <div class="f-conv"><span class="conv-pill pill-sage" id="cp-comp">—</span><span class="conv-text">dos cliques convertem em compra</span></div>
    <div class="f-row">
      <div class="f-name">Compras realizadas</div>
      <div class="f-track"><div class="f-bar bar-sage" id="fb-comp" style="width:0%"></div><div class="f-tt" id="tt-comp">—</div></div>
      <div class="f-pct" id="fp-comp">—</div>
    </div>
    <div class="f-conv"><span class="conv-pill pill-amber" id="cp-aban">—</span><span class="conv-text">dos cliques abandonam o carrinho</span></div>
    <div class="f-row">
      <div class="f-name">Abandono de carrinho</div>
      <div class="f-track"><div class="f-bar bar-amber" id="fb-aban" style="width:0%"></div><div class="f-tt" id="tt-aban">—</div></div>
      <div class="f-pct" id="fp-aban">—</div>
    </div>
  </div>

  <div class="footer">
    <span class="tip" id="tip-footer">Métricas ao vivo via Supabase. Visitas e scores: entrada manual.</span>
    <button class="refresh-btn" onclick="fetchStats()">↻ Atualizar</button>
  </div>
</div>

<script>
'use strict';
const TOKEN = ${JSON.stringify(token)};
const API   = '/api/dashboard-stats';

function getN(id){
  const el=document.getElementById(id);
  if(!el)return 0;
  return parseInt((el.textContent||'').replace(/\\D/g,''),10)||0;
}
function pct(a,b){return b?Math.round(a/b*100)+'%':'—'}
function barW(a,b){return b?Math.min(100,Math.round(a/b*100))+'%':'0%'}
function fmt(v){return v===0?'0':v.toLocaleString('pt-BR')}
function setLive(id,v){const el=document.getElementById(id);if(el)el.textContent=String(v)}
function setBadge(id,text,cls){const el=document.getElementById(id);if(!el)return;el.textContent=text;el.className='kpi-badge '+cls}
function setBar(bId,tId,pId,v,ref){
  const b=document.getElementById(bId),t=document.getElementById(tId),p=document.getElementById(pId);
  if(b)b.style.width=barW(v,ref);
  if(t)t.textContent=fmt(v);
  if(p)p.textContent=ref?pct(v,ref):'—';
}
function setConv(id,v,cls){const el=document.getElementById(id);if(!el)return;el.textContent=v;el.className='conv-pill '+cls}

// Arc gauge for experience score (0-100)
const ARC_LEN=100.5;
function scoreColor(s){
  if(s===null||isNaN(s))return 'var(--text-3)';
  if(s>=90)return 'var(--sage)';
  if(s>=50)return 'var(--amber)';
  return 'var(--coral)';
}
function updateScoreArc(device){
  const numEl=document.getElementById('val-score-'+device);
  const arcEl=document.getElementById('arc-'+device+'-fill');
  const raw=parseInt((numEl?.textContent||'').replace(/\\D/g,''),10);
  const score=isNaN(raw)?null:Math.min(100,Math.max(0,raw));
  if(arcEl){
    arcEl.style.strokeDashoffset=String(score!==null?ARC_LEN*(1-score/100):ARC_LEN);
    arcEl.style.stroke=scoreColor(score);
  }
  try{localStorage.setItem('pz_score_'+device,score!==null?String(score):'')}catch(e){}
}

function update(){
  const vis=getN('val-visitas'),cad=getN('val-cadastros'),pets=getN('val-pets');
  const comp=getN('val-compras'),clic=getN('val-cliques'),aban=getN('val-abandono');
  const ref=vis||1;
  document.getElementById('tt-vis').textContent=fmt(vis);
  setBadge('badge-cad',  vis  ? pct(cad,vis)   +' das visitas'   :'—', vis&&cad/vis>.1   ?'b-positive':'b-neutral');
  setBadge('badge-comp', clic ? pct(comp,clic)  +' dos cliques'  :'—', clic&&comp/clic>.5?'b-positive':'b-neutral');
  setBadge('badge-pets', cad  ? pct(pets,cad)   +' dos cadastros':'—', cad&&pets/cad>.5  ?'b-positive':'b-neutral');
  setBadge('badge-clic', cad  ? pct(clic,cad)   +' dos cadastros':'—', 'b-neutral');
  setBadge('badge-aban', clic ? pct(aban,clic)  +' dos cliques'  :'—', clic&&aban/clic>.5?'b-warn':'b-neutral');
  setBar('fb-cad','tt-cad','fp-cad',cad,ref);
  setBar('fb-pets','tt-pets','fp-pets',pets,ref);
  setBar('fb-clic','tt-clic','fp-clic',clic,ref);
  setBar('fb-comp','tt-comp','fp-comp',comp,ref);
  setBar('fb-aban','tt-aban','fp-aban',aban,ref);
  setConv('cp-cad', vis  ?pct(cad,vis)  :'—','pill-coral');
  setConv('cp-pets',cad  ?pct(pets,cad) :'—','pill-sage');
  setConv('cp-clic',cad  ?pct(clic,cad) :'—','pill-coral');
  setConv('cp-comp',clic ?pct(comp,clic):'—','pill-sage');
  setConv('cp-aban',clic ?pct(aban,clic):'—','pill-amber');
  try{localStorage.setItem('pz_vis',document.getElementById('val-visitas').textContent.replace(/\\D/g,''))}catch(e){}
}

const visEl=document.getElementById('val-visitas');

async function fetchStats(){
  const ind=document.getElementById('live-indicator');
  ind.className='live-dot'; ind.textContent='buscando…';
  try{
    const r=await fetch(API+'?token='+encodeURIComponent(TOKEN));
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    if(d.error)throw new Error(d.error);
    // Visitas: ao vivo se disponível, senão mantém valor manual
    if(d.visitas!==null&&d.visitas!==undefined){
      visEl.contentEditable='false';
      visEl.style.cursor='default';
      visEl.textContent=fmt(d.visitas);
      const src=document.getElementById('src-visitas');
      if(src)src.textContent='ao vivo';
    }
    setLive('val-cadastros',fmt(d.cadastros));
    setLive('val-pets',fmt(d.pets));
    setLive('val-compras',fmt(d.compras));
    setLive('val-cliques',fmt(d.cliques));
    const aban=Math.max(0,(d.cliques||0)-(d.compras||0));
    setLive('val-abandono',fmt(aban));
    const now=new Date(d.ts||Date.now());
    document.getElementById('ts').textContent=
      now.toLocaleDateString('pt-BR')+' '+now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    ind.className='live-dot'; ind.textContent='ao vivo';
  }catch(err){
    ind.className='live-dot error'; ind.textContent='erro: '+err.message;
  }
  update();
}

function numOnlyListeners(el,onInput){
  el.addEventListener('keydown',e=>{
    if(e.key==='Enter'){e.preventDefault();el.blur();return}
    const ok=['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)||/^\\d$/.test(e.key)||e.metaKey||e.ctrlKey;
    if(!ok)e.preventDefault();
  });
  el.addEventListener('paste',e=>{
    e.preventDefault();
    const t=(e.clipboardData||window.clipboardData).getData('text').replace(/\\D/g,'');
    document.execCommand('insertText',false,t);
  });
  el.addEventListener('input',onInput);
}

// Visitas
numOnlyListeners(visEl,update);

// Experience Score tiles
['mobile','desktop'].forEach(dev=>{
  const el=document.getElementById('val-score-'+dev);
  if(!el)return;
  numOnlyListeners(el,()=>updateScoreArc(dev));
  try{const v=localStorage.getItem('pz_score_'+dev);if(v){el.textContent=v;updateScoreArc(dev);}}catch(e){}
});

// Inicializa
try{const v=localStorage.getItem('pz_vis');if(v)visEl.textContent=v}catch(e){}
update();
fetchStats();
setInterval(fetchStats,30000);
</script>`;
}
