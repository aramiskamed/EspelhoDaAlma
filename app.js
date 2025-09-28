// Espelho da Alma — Local-first app (localStorage)
(function(){
  const $ = (sel, ctx=document)=>ctx.querySelector(sel);
  const $$ = (sel, ctx=document)=>Array.from(ctx.querySelectorAll(sel));

  const ELEM_LIST = ["fogo","agua","ar","terra"];
  const POSITIVOS = {
    fogo: ["Coragem","Determinação","Autoconfiança","Entusiasmo, vitalidade","Liderança natural","Clareza e poder de decisão"],
    agua: ["Amor, compaixão","Paciência, calma","Dedicação, capacidade de nutrir","Sensibilidade e empatia","Intuição refinada","Capacidade de adaptação"],
    ar:   ["Intelecto ágil, raciocínio lógico","Criatividade e imaginação","Comunicação clara e persuasiva","Senso de justiça e equilíbrio","Flexibilidade mental","Sociabilidade"],
    terra:["Estabilidade, firmeza","Perseverança, paciência","Disciplina e ordem","Confiabilidade, responsabilidade","Praticidade e senso de realidade","Autocontrole"],
  };
  const NEGATIVOS = {
    fogo: ["Ira, agressividade","Ódio, violência","Orgulho excessivo","Impaciência","Desejo de domínio sobre os outros","Crueldade"],
    agua: ["Preguiça, inércia","Dependência emocional","Melancolia, vitimismo","Ciúme e apego excessivo","Covardia, submissão","Sensualidade descontrolada"],
    ar:   ["Instabilidade, superficialidade","Tagarelice, falsidade","Indecisão","Orgulho intelectual, arrogância mental","Desatenção, dispersão","Tendência à mentira ou manipulação"],
    terra:["Obstinação rígida","Avarícia, materialismo","Desconfiança","Indolência, teimosia","Falta de criatividade","Pessimismo, medo excessivo"],
  };

  // Tabela de transmutação
  const TRANSMUT = {
    fogo: {
      "Ira, agressividade": {raiz:"Reação impulsiva",virtude:"Paciência, calma",apoio:["terra","agua"]},
      "Impaciência": {raiz:"Desejo imediato",virtude:"Perseverança",apoio:["terra"]},
      "Orgulho excessivo": {raiz:"Ego inflado",virtude:"Humildade, serviço",apoio:["agua"]},
      "Desejo de domínio sobre os outros": {raiz:"Vontade de controlar",virtude:"Respeito, serviço",apoio:["agua"]},
      "Crueldade": {raiz:"Desejo de dominar",virtude:"Compaixão, amor ativo",apoio:["agua"]},
      "Ódio, violência": {raiz:"Reatividade",virtude:"Amor compassivo",apoio:["agua"]},
    },
    agua: {
      "Preguiça, inércia": {raiz:"Estagnação",virtude:"Atividade disciplinada",apoio:["fogo","terra"]},
      "Dependência emocional": {raiz:"Carência",virtude:"Autonomia afetiva",apoio:["fogo"]},
      "Melancolia, vitimismo": {raiz:"Falta de força interior",virtude:"Autoconfiança, responsabilidade",apoio:["fogo"]},
      "Ciúme e apego excessivo": {raiz:"Insegurança/perda",virtude:"Desapego, fé",apoio:["ar"]},
      "Covardia, submissão": {raiz:"Medo",virtude:"Coragem serena",apoio:["fogo"]},
      "Sensualidade descontrolada": {raiz:"Prazer imediato",virtude:"Pureza, autocontrole",apoio:["terra","ar"]},
    },
    ar: {
      "Desatenção, dispersão": {raiz:"Falta de foco",virtude:"Concentração, atenção plena",apoio:["terra"]},
      "Instabilidade, superficialidade": {raiz:"Desconexão do essencial",virtude:"Profundidade, estudo sério",apoio:["agua"]},
      "Orgulho intelectual, arrogância mental": {raiz:"Ego mental",virtude:"Sabedoria, simplicidade",apoio:["agua"]},
      "Tagarelice, falsidade": {raiz:"Falta de autocontrole",virtude:"Silêncio interior",apoio:["terra"]},
      "Indecisão": {raiz:"Insegurança mental",virtude:"Clareza, decisão",apoio:["fogo"]},
      "Tendência à mentira ou manipulação": {raiz:"Uso egoísta da mente",virtude:"Verdade, honestidade",apoio:["fogo"]},
    },
    terra: {
      "Obstinação rígida": {raiz:"Apego ao conhecido",virtude:"Flexibilidade",apoio:["ar"]},
      "Avarícia, materialismo": {raiz:"Apego à matéria",virtude:"Espiritualidade, generosidade",apoio:["fogo","agua"]},
      "Pessimismo, medo excessivo": {raiz:"Desconfiança na vida",virtude:"Fé, coragem",apoio:["fogo"]},
      "Indolência, teimosia": {raiz:"Resistência à mudança",virtude:"Vontade ativa, movimento",apoio:["fogo"]},
      "Desconfiança": {raiz:"Auto/heteroproteção",virtude:"Confiança prudente",apoio:["agua"]},
      "Falta de criatividade": {raiz:"Rigidez mental",virtude:"Curiosidade, jogo criativo",apoio:["ar"]},
    }
  };

  // UI tabs
  $$('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab-btn').forEach(b=>b.classList.remove('active'));
      $$('.tab-content').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      $('#'+btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab==='historico'){renderHistorico(); renderChart();}
    });
  });

  // Inicializar data com hoje
  const todayISO = new Date().toISOString().slice(0,10);
  $('#dataEntrada').value = todayISO;

  $('#btnLimparHoje').addEventListener('click', ()=>{
    $$('input[type=checkbox]').forEach(c=>c.checked=false);
    $('#notas').value='';
    renderResumo();
  });

  // Adicionar controles de intensidade ao lado das checkboxes
  function ensureIntensityControls(){
    $$('.check-grid input[type=checkbox]').forEach(cb=>{
      let host = cb.closest('label');
      if(host && !host.querySelector('.intensity')){
        const span = document.createElement('span');
        span.className = 'intensity';
        span.innerHTML = 'intensidade <select><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>';
        span.style.display = cb.checked ? 'inline-flex' : 'none';
        host.appendChild(span);
        cb.addEventListener('change', ()=>{ span.style.display = cb.checked ? 'inline-flex' : 'none'; renderResumo(); });
        span.querySelector('select').addEventListener('change', renderResumo);
      }
    });
  }
  ensureIntensityControls();

  // Interações para atualizar resumo ao marcar opções
  $$('input[type=checkbox]').forEach(c=>c.addEventListener('change', renderResumo));
  $('#notas').addEventListener('input', ()=>{});

  // Pesos globais por elemento
  const WKEY = "espelho_da_alma_weights_v1";
  function loadWeights(){
    try{ return JSON.parse(localStorage.getItem(WKEY)) || {fogo:1,agua:1,ar:1,terra:1}; }catch(e){ return {fogo:1,agua:1,ar:1,terra:1}; }
  }
  function saveWeights(w){
    localStorage.setItem(WKEY, JSON.stringify(w));
  }
  function applyWeightsToUI(){
    const w = loadWeights();
    const m = {fogo:'#w_fogo',agua:'#w_agua',ar:'#w_ar',terra:'#w_terra'};
    for(const k in m){ const el = $(m[k]); if(el) el.value = w[k] ?? 1; }
  }
  applyWeightsToUI();
  $('#btnSalvarPesos')?.addEventListener('click', ()=>{
    const w = {
      fogo: parseFloat($('#w_fogo').value||'1')||1,
      agua: parseFloat($('#w_agua').value||'1')||1,
      ar: parseFloat($('#w_ar').value||'1')||1,
      terra: parseFloat($('#w_terra').value||'1')||1,
    };
    saveWeights(w);
    alert('Pesos salvos.');
    renderResumo();
    renderChart();
  });

  // Tabela de transmutação proposta por dia (usa seleções negativas)
  function geraPropostas(selecoes){
    const prop = {};
    for(const elem of ELEM_LIST){
      const lista = [];
      for(const neg of (selecoes[elem]?.negativos||[])){
        const key = (typeof neg==='string')?neg:neg.name;
        const t = TRANSMUT[elem][key];
        if(t){
          lista.push({negativo:key, raiz:t.raiz, virtude:t.virtude, apoio:t.apoio});
        }else{
          lista.push({negativo:key, raiz:"—", virtude:"—", apoio:[]});
        }
      }
      prop[elem] = lista;
    }
    return prop;
  }

  function readSelectionsWithIntensity(elem, type){
    const items = [];
    $$(`.check-grid[data-element="${elem}"][data-type="${type}"] input[type=checkbox]:checked`).forEach(i=>{
      const sel = i.closest('label').querySelector('.intensity select');
      const intensity = sel ? parseInt(sel.value||'1') : 1;
      items.push({name: i.value, intensity});
    });
    return items;
  }

  function calculaSaldos(selecoes){
    const w = loadWeights();
    const saldos = {};
    for(const elem of ELEM_LIST){
      const p = (selecoes[elem]?.positivos||[]).reduce((acc,x)=>acc+(x.intensity||1),0);
      const n = (selecoes[elem]?.negativos||[]).reduce((acc,x)=>acc+(x.intensity||1),0);
      saldos[elem] = ((p - n) * (w[elem]||1));
    }
    return saldos;
  }

  function predominaElemento(saldos){
    const arr = Object.entries(saldos).map(([k,v])=>[k,Math.abs(v)]).sort((a,b)=>b[1]-a[1]);
    return arr[0]?.[0] || null;
  }

  function getSessaoAtual(){
    const data = $('#dataEntrada').value || new Date().toISOString().slice(0,10);
    const selecoes = {};
    for(const elem of ELEM_LIST){
      const pos = readSelectionsWithIntensity(elem, "positivo");
      const neg = readSelectionsWithIntensity(elem, "negativo");
      selecoes[elem] = {positivos: pos, negativos: neg};
    }
    const notas = $('#notas').value || '';
    const saldos = calculaSaldos(selecoes);
    const propostas = geraPropostas(selecoes);
    const predomina = predominaElemento(saldos);
    const tags = readCurrentTags();
    return {data, selecoes, notas, saldos, propostas, predomina, tags};
  }

  function badgeForSaldo(v){
    if(v >= 2) return '<span class="badge ok">expressão positiva</span>';
    if(v <= -2) return '<span class="badge bad">desequilíbrio</span>';
    return '<span class="badge warn">quase neutro</span>';
  }

  function emoji(elem){
    return {fogo:"🔥",agua:"💧",ar:"🌬️",terra:"🌍"}[elem] || "•";
  }

  function titulo(elem){
    return {fogo:"Fogo",agua:"Água",ar:"Ar",terra:"Terra"}[elem] || elem;
  }

  function renderResumo(){
    const s = getSessaoAtual();
    const box = $('#resumoContainer');
    box.innerHTML = "";
    const explicacao = document.createElement('p');
    explicacao.innerHTML = "Saldo = positivos − negativos (ponderado por intensidades e pesos). Se aparecerem qualidades positivas e negativas no mesmo dia, o elemento está <b>ativo</b>; se o saldo ficar negativo, há <b>desequilíbrio</b> e serão sugeridas transmutações.";
    box.appendChild(explicacao);

    for(const elem of ELEM_LIST){
      const card = document.createElement('div');
      card.className = 'resumo-item';
      const posList = (s.selecoes[elem].positivos||[]).map(x=>`${x.name} (${x.intensity})`).join(", ");
      const negList = (s.selecoes[elem].negativos||[]).map(x=>`${x.name} (${x.intensity})`).join(", ");
      card.innerHTML = `
        <h4>${emoji(elem)} ${titulo(elem)}</h4>
        <div>${badgeForSaldo(s.saldos[elem])} <b>Saldo:</b> ${s.saldos[elem]}</div>
        <div style="margin-top:6px"><b>Positivas:</b> ${posList||"—"}</div>
        <div><b>Negativas:</b> ${negList||"—"}</div>
      `;
      if((s.propostas[elem]||[]).length){
        const tbl = document.createElement('table');
        tbl.className = 'table';
        tbl.innerHTML = `
          <thead><tr>
            <th>Negativo</th><th>Raiz</th><th>Virtude que equilibra</th><th>Elemento(s) de apoio</th>
          </tr></thead>
          <tbody>${s.propostas[elem].map(p=>`<tr>
            <td>${p.negativo}</td><td>${p.raiz}</td><td>${p.virtude}</td><td>${p.apoio.map(a=>titulo(a)).join(", ")||"—"}</td>
          </tr>`).join("")}</tbody>
        `;
        card.appendChild(tbl);
      }
      box.appendChild(card);
    }
  }

  // ===== Tags / Gatilhos =====
  function renderTags(tags){
    const box = $('#tagsList');
    box.innerHTML = '';
    (tags||[]).forEach(t=>{
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerHTML = `${t} <button title="remover" data-t="${t}">×</button>`;
      el.querySelector('button').onclick = ()=>{
        const cur = readCurrentTags().filter(x=>x!==t);
        $('#tagInput').dataset.tags = JSON.stringify(cur);
        renderTags(cur);
      };
      box.appendChild(el);
    });
  }
  function readCurrentTags(){
    try{ return JSON.parse($('#tagInput').dataset.tags||'[]'); }catch(e){ return []; }
  }
  $('#tagInput')?.addEventListener('keydown', (ev)=>{
    if(ev.key==='Enter'){
      ev.preventDefault();
      const val = ($('#tagInput').value||'').trim();
      if(!val) return;
      const cur = readCurrentTags();
      if(!cur.includes(val)) cur.push(val);
      $('#tagInput').dataset.tags = JSON.stringify(cur);
      $('#tagInput').value='';
      renderTags(cur);
    }
  });

  // Persistência local e criptografia opcional
  const KEY = "espelho_da_alma_v1";
  const CKEY = "espelho_da_alma_crypto_v1";
  const EKEY = "espelho_da_alma_v1_enc";

  function loadAll(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
  function saveAll(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }

  function getCryptoMeta(){
    try{ return JSON.parse(localStorage.getItem(CKEY)) || null; }catch(e){ return null; }
  }
  async function deriveKeyFromPassword(password, salt){
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    return await crypto.subtle.deriveKey(
      {name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'},
      keyMaterial,
      {name:'AES-GCM', length:256},
      false,
      ['encrypt','decrypt']
    );
  }
  async function encryptJSON(password, obj){
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKeyFromPassword(password, salt);
    const data = enc.encode(JSON.stringify(obj));
    const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
    const payload = {salt: Array.from(salt), iv: Array.from(iv), cipher: Array.from(new Uint8Array(cipher))};
    return payload;
  }
  async function decryptJSON(password, payload){
    const dec = new TextDecoder();
    const salt = new Uint8Array(payload.salt);
    const iv = new Uint8Array(payload.iv);
    const key = await deriveKeyFromPassword(password, salt);
    const cipher = new Uint8Array(payload.cipher);
    const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, cipher);
    return JSON.parse(dec.decode(new Uint8Array(plain)));
  }
  function isCryptoEnabled(){ return !!getCryptoMeta(); }

  async function secureSaveAll(arr){
    const meta = getCryptoMeta();
    if(!meta){ saveAll(arr); return; }
    const pass = $('#cryptoPass')?.value || meta.hint || '';
    if(!pass){ alert('Informe a senha para salvar dados criptografados.'); return; }
    const payload = await encryptJSON(pass, arr);
    localStorage.setItem(EKEY, JSON.stringify(payload));
    localStorage.removeItem(KEY);
  }
  async function secureLoadAll(){
    const meta = getCryptoMeta();
    if(!meta){ return loadAll(); }
    const payloadRaw = localStorage.getItem(EKEY);
    if(!payloadRaw){ return loadAll(); }
    try{
      const pass = $('#cryptoPass')?.value || meta.hint || '';
      if(!pass){ throw new Error('Senha não informada'); }
      const arr = await decryptJSON(pass, JSON.parse(payloadRaw));
      return Array.isArray(arr) ? arr : [];
    }catch(e){ alert('Falha ao descriptografar: '+e.message); return []; }
  }
  $('#btnAtivarCrypto')?.addEventListener('click', async ()=>{
    const pass = $('#cryptoPass').value;
    if(!pass){ alert('Defina uma senha.'); return; }
    localStorage.setItem(CKEY, JSON.stringify({hint: pass && '***'}));
    const arr = loadAll();
    await secureSaveAll(arr);
    alert('Criptografia ativada/atualizada. Guarde sua senha.');
  });
  $('#btnDesativarCrypto')?.addEventListener('click', async ()=>{
    localStorage.removeItem(CKEY);
    const stor = localStorage.getItem(EKEY);
    if(stor){
      const pass = $('#cryptoPass').value;
      if(!pass){ alert('Informe a senha para desativar.'); return; }
      try{
        const arr = await decryptJSON(pass, JSON.parse(stor));
        saveAll(arr);
        localStorage.removeItem(EKEY);
        alert('Criptografia desativada.');
        renderHistorico(); renderChart();
      }catch(e){ alert('Erro: '+e.message); }
    }else{
      alert('Criptografia desativada.');
    }
  });

  async function salvarSessao(){
    const s = getSessaoAtual();
    let all = await secureLoadAll();
    const idx = all.findIndex(x=>x.data===s.data);
    if(idx>=0) all.splice(idx,1);
    all.push(s);
    all.sort((a,b)=>a.data.localeCompare(b.data));
    await secureSaveAll(all);
    alert('Sessão salva!');
    renderHistorico();
    renderChart();
  }
  $('#btnSalvarHoje').addEventListener('click', salvarSessao);

  async function renderHistorico(){
    const all = await secureLoadAll();
    const wrap = $('#tabelaHistorico');
    if(!all.length){ wrap.innerHTML = "<p>Nenhum registro ainda.</p>"; return; }
    let html = `<table class="table"><thead><tr>
      <th>Data</th><th>Fogo</th><th>Água</th><th>Ar</th><th>Terra</th><th>Tags</th><th>Notas</th><th>Ações</th>
    </tr></thead><tbody>`;
    for(const s of all){
      html += `<tr>
        <td>${s.data}</td>
        <td>${s.saldos.fogo}</td>
        <td>${s.saldos.agua}</td>
        <td>${s.saldos.ar}</td>
        <td>${s.saldos.terra}</td>
        <td>${(s.tags||[]).join(", ")}</td>
        <td>${(s.notas||"").slice(0,60)}${(s.notas||"").length>60?"…":""}</td>
        <td><button data-action="load" data-date="${s.data}">Carregar</button>
            <button data-action="delete" data-date="${s.data}" class="ghost">Excluir</button></td>
      </tr>`;
    }
    html += `</tbody></table>`;
    wrap.innerHTML = html;
    wrap.querySelectorAll('button[data-action="load"]').forEach(b=>b.onclick=()=>loadToEditor(b.dataset.date));
    wrap.querySelectorAll('button[data-action="delete"]').forEach(b=>b.onclick=()=>delRegistro(b.dataset.date));
  }
  async function loadToEditor(date){
    const all = await secureLoadAll();
    const s = all.find(x=>x.data===date);
    if(!s) return;
    $('#dataEntrada').value = s.data;
    $$('input[type=checkbox]').forEach(c=>c.checked=false);
    for(const elem of ELEM_LIST){
      for(const v of (s.selecoes[elem].positivos||[])){
        const input = $$(`.check-grid[data-element="${elem}"][data-type="positivo"] input`).find(i=>i.value===(v.name||v));
        if(input){ input.checked = true; const sel = input.closest('label').querySelector('.intensity select'); if(sel) sel.value = String(v.intensity||1); }
      }
      for(const v of (s.selecoes[elem].negativos||[])){
        const input = $$(`.check-grid[data-element="${elem}"][data-type="negativo"] input`).find(i=>i.value===(v.name||v));
        if(input){ input.checked = true; const sel = input.closest('label').querySelector('.intensity select'); if(sel) sel.value = String(v.intensity||1); }
      }
    }
    $('#notas').value = s.notas||'';
    // tags
    $('#tagInput').dataset.tags = JSON.stringify(s.tags||[]);
    renderTags(s.tags||[]);

    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    $$('.tab-content').forEach(c=>c.classList.remove('active'));
    $('.tab-btn[data-tab="diario"]').classList.add('active');
    $('#diario').classList.add('active');
    renderResumo();
  }
  async function delRegistro(date){
    if(!confirm("Excluir o registro de "+date+"?")) return;
    let all = await secureLoadAll();
    all = all.filter(x=>x.data!==date);
    await secureSaveAll(all);
    renderHistorico();
    renderChart();
  }

  // Export / Import (plaintext snapshots)
  $('#btnExportarJSON').addEventListener('click', async ()=>{
    const blob = new Blob([JSON.stringify(await secureLoadAll(),null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'espelho_da_alma.json';
    a.click();
  });
  $('#btnExportarCSV').addEventListener('click', async ()=>{
    const all = await secureLoadAll();
    if(!all.length){ alert("Nada para exportar."); return; }
    const header = ["data","fogo_saldo","agua_saldo","ar_saldo","terra_saldo","tags","notas"];
    const rows = [header.join(",")];
    for(const s of all){
      rows.push([s.data,s.saldos.fogo,s.saldos.agua,s.saldos.ar,s.saldos.terra,(s.tags||[]).join("|"),(s.notas||"").replace(/\n/g," ").replace(/,/g,";")].join(","));
    }
    const blob = new Blob([rows.join("\n")], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'espelho_da_alma.csv';
    a.click();
  });
  $('#inputImportarJSON').addEventListener('change', async (ev)=>{
    const file = ev.target.files[0];
    if(!file) return;
    const text = await file.text();
    try{
      const data = JSON.parse(text);
      if(!Array.isArray(data)) throw new Error("Formato inválido");
      const cur = await secureLoadAll();
      const map = new Map(cur.map(x=>[x.data,x]));
      for(const item of data){ if(item?.data) map.set(item.data,item); }
      await secureSaveAll(Array.from(map.values()).sort((a,b)=>a.data.localeCompare(b.data)));
      alert("Importado com sucesso.");
      renderHistorico();
    }catch(e){ alert("Falha ao importar: "+e.message); }
  });

  // Gráfico com filtro de intensidade mínima + pesos
  async function getSeriesWithMinIntensity(minI){
    const all = await secureLoadAll();
    const w = loadWeights();
    const dates = all.map(s=>s.data);
    const series = {fogo:[],agua:[],ar:[],terra:[]};
    all.forEach(s=>{
      const saldos = {};
      for(const elem of ELEM_LIST){
        const pos = (s.selecoes[elem]?.positivos||[]).filter(x=>(x.intensity||1)>=minI).reduce((a,x)=>a+(x.intensity||1),0);
        const neg = (s.selecoes[elem]?.negativos||[]).filter(x=>(x.intensity||1)>=minI).reduce((a,x)=>a+(x.intensity||1),0);
        saldos[elem] = (pos - neg) * (w[elem]||1);
      }
      series.fogo.push(saldos.fogo);
      series.agua.push(saldos.agua);
      series.ar.push(saldos.ar);
      series.terra.push(saldos.terra);
    });
    return {dates, series};
  }

  async function renderChart(){
    const c = $('#chartSaldo'); if(!c) return;
    const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
    const minI = parseInt($('#minIntensity')?.value||'1');
    const {dates, series} = await getSeriesWithMinIntensity(minI);
    if(!dates.length){ return; }

    const padL=60, padR=20, padT=20, padB=40;
    const W=c.width, H=c.height;
    const x0=padL, x1=W-padR, y0=H-padB, y1=padT;
    const xs = (i)=> x0 + i*(x1-x0)/(dates.length-1 || 1);
    const allVals = Object.values(series).flat();
    const vmin = Math.min(-6, Math.min(...allVals));
    const vmax = Math.max(6, Math.max(...allVals));
    const ys = (v)=> y0 - (v - vmin)*(y0-y1)/(vmax - vmin || 1);

    ctx.lineWidth=1; ctx.strokeStyle = "#2a2f3a";
    for(let v=Math.floor(vmin); v<=Math.ceil(vmax); v++){
      const y = ys(v);
      ctx.beginPath(); ctx.moveTo(x0,y); ctx.lineTo(x1,y); ctx.stroke();
      ctx.fillStyle="#9aa3b2"; ctx.font="12px system-ui";
      ctx.fillText(String(v), 8, y+4);
    }
    const step = Math.ceil(dates.length/10);
    ctx.fillStyle="#9aa3b2"; ctx.textAlign="center";
    for(let i=0;i<dates.length;i+=step){
      const x = xs(i);
      ctx.fillText(dates[i], x, y0+18);
    }
    function drawLine(vals){
      ctx.beginPath();
      vals.forEach((v,i)=>{ const x=xs(i), y=ys(v); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); });
      ctx.lineWidth=2; ctx.stroke();
    }
    ctx.save();
    drawLine(series.fogo);
    drawLine(series.agua);
    drawLine(series.ar);
    drawLine(series.terra);
    ctx.restore();
  }
  $('#btnRecalcularGrafico')?.addEventListener('click', ()=>renderChart());

  // Backup cifrado (mesma senha)
  async function exportEncryptedSnapshot(){
    const pass = $('#cryptoPass')?.value || (getCryptoMeta()?.hint||'');
    if(!pass){ alert('Digite sua senha em Configurações.'); return; }
    const arr = await secureLoadAll();
    const payload = await encryptJSON(pass, {createdAt: new Date().toISOString(), data: arr});
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'espelho_da_alma_backup.enc.json';
    a.click();
  }
  async function importEncryptedSnapshot(file){
    const pass = $('#cryptoPass')?.value || (getCryptoMeta()?.hint||'');
    if(!pass){ alert('Digite sua senha em Configurações.'); return; }
    const text = await file.text();
    const payload = JSON.parse(text);
    const obj = await decryptJSON(pass, payload);
    if(!Array.isArray(obj.data)) throw new Error('Backup inválido');
    await secureSaveAll(obj.data);
    alert('Backup restaurado.');
    renderHistorico(); renderChart(); renderResumo();
  }
  $('#btnExportBackup')?.addEventListener('click', exportEncryptedSnapshot);
  $('#inputImportBackup')?.addEventListener('change', (ev)=>{
    const f = ev.target.files[0]; if(!f) return;
    importEncryptedSnapshot(f).catch(e=>alert('Falha ao importar: '+e.message));
  });

  // Relatório semanal estilizado (abre nova janela para imprimir/salvar PDF)
  $('#btnRelatorio').addEventListener('click', async ()=>{
    const start = $('#repStart').value || null;
    const end = $('#repEnd').value || null;
    const all = (await secureLoadAll()).filter(s=>(!start || s.data>=start) && (!end || s.data<=end));
    const box = $('#relatorioHTML');
    if(!all.length){ box.innerHTML = "<p>Nada no intervalo.</p>"; return; }
    const med = {fogo:0,agua:0,ar:0,terra:0};
    all.forEach(s=>{ med.fogo+=s.saldos.fogo; med.agua+=s.saldos.agua; med.ar+=s.saldos.ar; med.terra+=s.saldos.terra; });
    for(const k in med) med[k] = (med[k]/all.length).toFixed(2);
    let html = `<h3>Período: ${start||all[0].data} → ${end||all[all.length-1].data}</h3>`;
    html += `<p><b>Médias de saldo</b> — 🔥 ${med.fogo} · 💧 ${med.agua} · 🌬️ ${med.ar} · 🌍 ${med.terra}</p>`;
    html += `<table class="table"><thead><tr><th>Data</th><th>🔥</th><th>💧</th><th>🌬️</th><th>🌍</th><th>Tags</th><th>Notas</th></tr></thead><tbody>`;
    all.forEach(s=>{
      html += `<tr><td>${s.data}</td><td>${s.saldos.fogo}</td><td>${s.saldos.agua}</td><td>${s.saldos.ar}</td><td>${s.saldos.terra}</td><td>${(s.tags||[]).join(", ")}</td><td>${(s.notas||'').slice(0,80)}${(s.notas||'').length>80?'…':''}</td></tr>`;
    });
    html += `</tbody></table>`;
    box.innerHTML = html;
  });
  $('#btnImprimir').addEventListener('click', ()=>{
    const html = $('#relatorioHTML').innerHTML || '<p>Nada para imprimir.</p>';
    const w = window.open('', '_blank');
    if(!w){ alert('Bloqueado pelo navegador. Permita pop-ups.'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório — Espelho da Alma</title>
      <style>
        body{font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto;color:#111;padding:24px}
        h1,h2,h3{margin:0 0 12px} table{border-collapse:collapse;width:100%;margin-top:10px}
        th,td{border:1px solid #ccc;padding:8px;text-align:left}
        .muted{color:#666}
      </style></head><body>
      <h1>Relatório — Espelho da Alma</h1>
      <p class="muted">${new Date().toLocaleString()}</p>
      ${html}
      </body></html>`);
    w.document.close(); w.focus();
  });

  // Primeiro render
  function initTodayUI(){
    ensureIntensityControls();
    renderResumo();
  }
  initTodayUI();
})();
