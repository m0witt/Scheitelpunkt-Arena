/* Oberfläche, Spielstand und Gamification der Scheitelpunkt-Arena. */
(function () {
  'use strict';
  const { fr, eq, tex, parseInput, inputTex } = M;

  const KEY = 'scheitelpunkt-arena-v1';
  const ZIEL = 20;        // Tagesziel: richtige Aufgaben
  const FREISCHALT = 5;   // richtige Aufgaben je Stufe bis zur nächsten
  const RAENGE = [[0, 'Parabel-Neuling'], [100, 'Gitterläufer'], [250, 'Scheitelsucher'], [450, 'Kurvenkenner'],
    [700, 'Parabel-Profi'], [1000, 'Scheitelmeister'], [1400, 'Parabel-Legende']];
  const REIHENFOLGE = ['lesen', 'erkennen', 'zuordnen', 'punkt', 'bauer', 'ausmult'];

  const $ = id => document.getElementById(id);
  const k = (t, display) => { try { return katex.renderToString(t, { throwOnError: false, displayMode: !!display, strict: 'ignore' }); } catch (e) { return t; } };
  const rich = s => String(s).split('$').map((p, i) => (i % 2 ? k(p) : p)).join('');

  /* ---------- Spielstand ---------- */
  const leer = () => ({ xp: 0, richtig: 0, ohneHilfe: 0, serie: 0, besteSerie: 0, modi: {}, badges: {}, heute: { datum: '', richtig: 0 } });
  const heuteStr = () => new Date().toLocaleDateString('sv');
  let spiegel = null; // Notnagel, falls localStorage fehlt
  let S = laden();

  function laden() {
    let s = leer();
    try {
      const roh = localStorage.getItem(KEY);
      if (roh) s = Object.assign(leer(), JSON.parse(roh));
    } catch (e) { if (spiegel) s = spiegel; }
    if (!s.heute || s.heute.datum !== heuteStr()) s.heute = { datum: heuteStr(), richtig: 0 };
    return s;
  }
  function speichern() {
    spiegel = S;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* privater Modus: Spielstand nur für diese Sitzung */ }
  }
  function modus(id) {
    if (!S.modi[id]) S.modi[id] = { frei: 1, zaehl: { 1: 0, 2: 0, 3: 0 }, richtig: 0 };
    return S.modi[id];
  }
  const rangIndex = xp => RAENGE.reduce((r, [min], i) => (xp >= min ? i : r), 0);

  /* ---------- Abzeichen ---------- */
  const BADGES = [
    { id: 'erste', sym: '🌱', name: 'Erste Parabel', text: 'Die erste Aufgabe richtig gelöst', test: s => s.richtig >= 1 },
    { id: 'serie5', sym: '🔥', name: '5er-Serie', text: '5 Aufgaben in Folge ohne Fehler', test: s => s.besteSerie >= 5 },
    { id: 'serie10', sym: '⚡', name: '10er-Serie', text: '10 Aufgaben in Folge ohne Fehler', test: s => s.besteSerie >= 10 },
    { id: 'serie20', sym: '🚀', name: 'Unaufhaltsam', text: '20 Aufgaben in Folge ohne Fehler', test: s => s.besteSerie >= 20 },
    { id: 'ohne10', sym: '🧠', name: 'Ohne Hilfe', text: '10 Aufgaben im ersten Versuch und ohne Tipp', test: s => s.ohneHilfe >= 10 },
    { id: 'lesen20', sym: '📖', name: 'Scheitelpunkt-Profi', text: '20 Aufgaben in „Ablesen“', test: s => modus('lesen').richtig >= 20 },
    { id: 'erkennen10', sym: '🔍', name: 'Gitter-Detektiv', text: '10 Parabeln im Gitter erkannt', test: s => modus('erkennen').richtig >= 10 },
    { id: 'zuordnen10', sym: '🦅', name: 'Adleraugen', text: '10 Graphen richtig zugeordnet', test: s => modus('zuordnen').richtig >= 10 },
    { id: 'punkt10', sym: '🎯', name: 'Punktlandung', text: '10 Aufgaben in der Punkte-Jagd', test: s => modus('punkt').richtig >= 10 },
    { id: 'bauer5', sym: '🛠️', name: 'Baumeister', text: '5 Parabeln nachgebaut', test: s => modus('bauer').richtig >= 5 },
    { id: 'ausmult10', sym: '✖️', name: 'Ausmultiplizier-Ass', text: '10 Terme in die allgemeine Form gebracht', test: s => modus('ausmult').richtig >= 10 },
    { id: 'alle', sym: '🧭', name: 'Allrounder', text: 'In jedem Spiel mindestens eine Aufgabe gelöst', test: s => REIHENFOLGE.every(i => modus(i).richtig >= 1) },
    { id: 'stufe3', sym: '🏔️', name: 'Gipfelstürmer', text: 'Stufe 3 in einem Spiel freigeschaltet', test: s => REIHENFOLGE.some(i => modus(i).frei >= 3) },
    { id: 'xp500', sym: '💎', name: '500 XP', text: '500 Erfahrungspunkte gesammelt', test: s => s.xp >= 500 }
  ];

  /* ---------- Hilfsfunktionen für die Oberfläche ---------- */
  function toast(text, gold) {
    const d = document.createElement('div');
    d.className = 'toast' + (gold ? ' gold' : '');
    d.innerHTML = text;
    $('toasts').appendChild(d);
    setTimeout(() => d.remove(), 3700);
  }
  function dialog(titel, html) {
    $('dlg-titel').textContent = titel;
    $('dlg-inhalt').innerHTML = html;
    const d = $('dlg');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  const dialogOffen = () => $('dlg').hasAttribute('open');

  function renderKopf() {
    const i = rangIndex(S.xp), von = RAENGE[i][0], bis = i + 1 < RAENGE.length ? RAENGE[i + 1][0] : null;
    $('rang-name').textContent = RAENGE[i][1];
    $('xp-text').textContent = S.xp + ' XP';
    $('xp-text').title = bis ? 'Nächster Rang bei ' + bis + ' XP' : 'Höchster Rang erreicht';
    $('xp-balken').style.width = (bis ? Math.min(100, (S.xp - von) / (bis - von) * 100) : 100) + '%';
    $('serie-zahl').textContent = S.serie;
    $('serie').classList.toggle('heiss', S.serie >= 3);
  }

  /* ---------- Übersicht ---------- */
  function renderHome() {
    $('ziel-text').textContent = Math.min(S.heute.richtig, ZIEL) + ' / ' + ZIEL;
    $('ziel-balken').style.width = Math.min(100, S.heute.richtig / ZIEL * 100) + '%';
    const box = $('karten');
    box.innerHTML = '';
    REIHENFOLGE.forEach(id => {
      const info = T.MODI[id], m = modus(id);
      const kart = document.createElement('article');
      kart.className = 'modus';
      kart.innerHTML = '<button class="modus-haupt"><strong>' + info.name + '</strong><span>' + info.untertitel + '</span></button><div class="stufen"></div>';
      kart.querySelector('.modus-haupt').onclick = () => start(id, m.frei);
      const st = kart.querySelector('.stufen');
      [1, 2, 3].forEach(l => {
        const b = document.createElement('button');
        const gesperrt = l > m.frei, fertig = l < m.frei || (l === m.frei && m.zaehl[l] >= FREISCHALT);
        b.className = 'stufe-btn' + (l === m.frei ? ' aktuell' : '');
        b.disabled = gesperrt;
        b.innerHTML = 'Stufe ' + l + '<small>' + (gesperrt ? '🔒' : fertig ? '✓ geschafft' : Math.min(m.zaehl[l], FREISCHALT) + ' / ' + FREISCHALT) + '</small>';
        b.onclick = () => start(id, l);
        st.appendChild(b);
      });
      box.appendChild(kart);
    });
  }

  function zeigeHome() {
    $('aufgabe').hidden = true; $('home').hidden = false; $('btn-zurueck').hidden = true;
    renderHome(); renderKopf(); window.scrollTo(0, 0);
  }

  /* ---------- Aufgaben ---------- */
  let cur = null;   // laufende Aufgabe
  let ui = null;    // Zustand der Oberfläche zur Aufgabe

  function start(id, level) {
    cur = { id, level, letzteSig: '' };
    $('home').hidden = true; $('aufgabe').hidden = false; $('btn-zurueck').hidden = false;
    naechste();
  }

  function naechste() {
    const t = T.neueAufgabe(cur.id, cur.level, cur.letzteSig);
    cur.letzteSig = t.sig;
    const felder = t.eingabe.typ === 'felder' ? t.eingabe.vorlage.filter(s => s.feld).map(s => s.feld) : [];
    ui = { t, hilfen: 0, versuche: 0, fertig: false, fehler: false, werte: {}, status: {}, aktiv: felder[0] || null, felder, wahl: null, gesperrt: {}, bauer: null };
    if (t.eingabe.typ === 'bauer') {
      const aw = t.eingabe.aWerte;
      ui.bauer = { ai: Math.max(0, aw.findIndex(a => eq(a, fr(1)))), xs: 0, ys: 0 };
    }
    renderAufgabe();
    window.scrollTo(0, 0);
  }

  function renderAufgabe() {
    const t = ui.t, m = modus(cur.id);
    $('a-modus').textContent = T.MODI[cur.id].name;
    $('a-stufe').textContent = 'Stufe ' + cur.level;
    $('a-fortschritt').textContent = cur.level === m.frei && cur.level < 3 ? Math.min(m.zaehl[cur.level], FREISCHALT) + ' / ' + FREISCHALT + ' bis Stufe ' + (cur.level + 1) : '';
    $('a-text').innerHTML = rich(t.aufgabe);
    $('a-formel').innerHTML = t.formel ? k(t.formel, true) : '';
    renderGraph();
    renderEingabe();
    $('a-hinweise').innerHTML = '';
    $('a-feedback').innerHTML = '';
    $('btn-tipp').hidden = false; $('btn-tipp').disabled = false; $('btn-tipp').textContent = '💡 Tipp (0/' + t.hints.length + ')';
    $('btn-pruefen').hidden = false;
    $('btn-loesung').hidden = true;
    $('btn-weiter').hidden = true;
    $('tastatur').hidden = t.eingabe.typ !== 'felder';
    $('panel').classList.toggle('fest', t.eingabe.typ === 'felder' || t.eingabe.typ === 'bauer');
    panelHoehe();
  }

  function panelHoehe() {
    const ph = $('panel').offsetHeight;
    document.documentElement.style.setProperty('--panel-h', (ph + 12) + 'px');
    const fest = $('panel').classList.contains('fest');
    document.documentElement.style.setProperty('--graph-max', fest ? Math.max(200, window.innerHeight - ph - 230) + 'px' : '330px');
  }
  function zeigeNachricht(el) {
    panelHoehe();
    if (el.scrollIntoView) el.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }

  function renderGraph(loesung) {
    const t = ui.t, box = $('a-graph');
    if (ui.bauer) {
      const e = t.eingabe, b = ui.bauer;
      box.innerHTML = G.graphSvg({
        R: T.R, alt: 'Zielparabel (gestrichelt) und deine Parabel',
        parabeln: [{ a: t.a, xs: t.xs, ys: t.ys, cls: 'ziel' }, { a: e.aWerte[b.ai], xs: fr(b.xs), ys: fr(b.ys) }],
        punkte: [{ x: b.xs, y: b.ys }]
      });
      return;
    }
    const g = loesung && t.graphLoesung ? t.graphLoesung : t.graph;
    box.innerHTML = g ? G.graphSvg(Object.assign({ R: T.R }, g)) : '';
  }

  /* ----- Eingabe ----- */
  function renderEingabe() {
    const e = ui.t.eingabe, box = $('a-eingabe');
    box.innerHTML = '';
    if (e.typ === 'felder') { box.appendChild(document.createElement('div')).className = 'formelzeile'; renderFelder(); }
    else if (e.typ === 'wahl' || e.typ === 'graphen') renderWahl();
    else if (e.typ === 'bauer') renderBauer();
  }

  function renderFelder() {
    const zeile = $('a-eingabe').querySelector('.formelzeile');
    zeile.innerHTML = '';
    ui.t.eingabe.vorlage.forEach(seg => {
      if (seg.tex) {
        const sp = document.createElement('span'); sp.innerHTML = k(seg.tex); zeile.appendChild(sp);
      } else {
        const v = ui.werte[seg.feld] || '';
        const neg = seg.klammer && /^[-−]/.test(v);
        if (neg) { const o = document.createElement('span'); o.className = 'klammer-text'; o.textContent = '('; zeile.appendChild(o); }
        const b = document.createElement('button');
        b.className = 'feld' + (v ? '' : ' leer') + (ui.aktiv === seg.feld && !ui.fertig ? ' aktiv' : '') +
          (ui.status[seg.feld] === true ? ' ok' : ui.status[seg.feld] === false ? ' fehl' : '');
        b.setAttribute('aria-label', 'Eingabefeld ' + seg.feld);
        b.innerHTML = v ? k(inputTex(v)) : '';
        b.onclick = () => { if (ui.fertig) return; ui.aktiv = seg.feld; renderFelder(); };
        zeile.appendChild(b);
        if (neg) { const c = document.createElement('span'); c.className = 'klammer-text'; c.textContent = ')'; zeile.appendChild(c); }
      }
    });
  }

  function taste(z) {
    if (ui.fertig || !ui.aktiv) return;
    const id = ui.aktiv, v = ui.werte[id] || '';
    const i = ui.felder.indexOf(id);
    if (z === '›' || z === '‹') {
      ui.aktiv = ui.felder[(i + (z === '›' ? 1 : -1) + ui.felder.length) % ui.felder.length];
    } else {
      let n = v;
      if (/^\d$/.test(z)) { if (v.length < 8) n = v + z; }
      else if (z === '⌫') n = v.slice(0, -1);
      else if (z === '−') n = /^-/.test(v) ? v.slice(1) : '-' + v;
      else if (z === ',') { if (!/[,/]/.test(v)) n = (v === '' || v === '-') ? v + '0,' : v + ','; }
      else if (z === '/') { if (/^-?\d+$/.test(v)) n = v + '/'; }
      if (n !== v) { ui.werte[id] = n; delete ui.status[id]; }
    }
    renderFelder();
  }

  function baueTastatur() {
    const box = $('tastatur');
    ['7', '8', '9', '⌫', '4', '5', '6', '/', '1', '2', '3', '−', '0', ',', '‹', '›'].forEach(z => {
      const b = document.createElement('button');
      b.className = 'taste' + (/[\/⌫‹›,]/.test(z) ? ' zweit' : '');
      b.textContent = z;
      b.setAttribute('aria-label', { '⌫': 'Löschen', '‹': 'Vorheriges Feld', '›': 'Nächstes Feld', '−': 'Minus', ',': 'Komma', '/': 'Bruchstrich' }[z] || z);
      b.onclick = () => taste(z);
      box.appendChild(b);
    });
  }

  function renderWahl() {
    const e = ui.t.eingabe, box = $('a-eingabe');
    const w = document.createElement('div');
    w.className = 'wahl' + (e.typ === 'graphen' ? ' wahl-graphen' : '');
    e.optionen.forEach(o => {
      const b = document.createElement('button');
      b.className = 'wahl-btn';
      b.dataset.id = o.id;
      if (e.typ === 'graphen') {
        b.innerHTML = '<span class="buchstabe">' + o.buchstabe + '</span>' +
          G.graphSvg({ R: T.R, compact: true, labelEvery: 0, alt: 'Graph ' + o.buchstabe, parabeln: [{ a: o.a, xs: o.xs, ys: o.ys }] }).replace('class="graph"', 'class="graph graph-klein"');
      } else b.innerHTML = o.tex ? k(o.tex) : o.text;
      b.onclick = () => {
        if (ui.fertig || ui.gesperrt[o.id]) return;
        ui.wahl = o.id;
        w.querySelectorAll('.wahl-btn').forEach(x => x.classList.toggle('gewaehlt', x.dataset.id === o.id));
      };
      w.appendChild(b);
    });
    box.appendChild(w);
  }

  function markiereWahl(richtigId, falschId) {
    $('a-eingabe').querySelectorAll('.wahl-btn').forEach(b => {
      b.classList.remove('gewaehlt');
      if (b.dataset.id === richtigId) b.classList.add('ok');
      if (b.dataset.id === falschId) b.classList.add('fehl');
    });
  }

  function renderBauer() {
    const e = ui.t.eingabe, b = ui.bauer, box = $('a-eingabe');
    box.innerHTML = '<div class="live" id="b-live"></div><div class="regler">' +
      '<label><span class="r-name">' + k('a') + '</span><input type="range" id="r-a" min="0" max="' + (e.aWerte.length - 1) + '" step="1" value="' + b.ai + '"><span class="r-wert" id="v-a"></span></label>' +
      '<label><span class="r-name">' + k('x_S') + '</span><input type="range" id="r-xs" min="' + e.xsRange[0] + '" max="' + e.xsRange[1] + '" step="1" value="' + b.xs + '"><span class="r-wert" id="v-xs"></span></label>' +
      '<label><span class="r-name">' + k('y_S') + '</span><input type="range" id="r-ys" min="' + e.ysRange[0] + '" max="' + e.ysRange[1] + '" step="1" value="' + b.ys + '"><span class="r-wert" id="v-ys"></span></label>' +
      '</div><div id="b-teil" class="pruef-teil"></div>';
    const upd = () => {
      b.ai = +$('r-a').value; b.xs = +$('r-xs').value; b.ys = +$('r-ys').value;
      const a = e.aWerte[b.ai];
      $('v-a').innerHTML = k(tex(a)); $('v-xs').innerHTML = k(String(b.xs)); $('v-ys').innerHTML = k(String(b.ys));
      $('b-live').innerHTML = k(M.scheitelFormel(a, fr(b.xs), fr(b.ys)), true);
      $('b-teil').innerHTML = '';
      renderGraph();
    };
    ['r-a', 'r-xs', 'r-ys'].forEach(id => $(id).addEventListener('input', upd));
    upd();
  }

  /* ----- Antwort lesen ----- */
  function antwort() {
    const e = ui.t.eingabe;
    if (e.typ === 'felder') {
      const ant = {};
      for (const id of ui.felder) {
        if (!ui.werte[id]) { meldung('info', 'Trage zuerst in alle Felder eine Zahl ein.'); return null; }
        ant[id] = parseInput(ui.werte[id]);
        if (!ant[id]) { ui.status[id] = false; renderFelder(); meldung('info', 'Diese Eingabe ist keine Zahl. Beispiele: <b>-3</b>, <b>2,5</b>, <b>1/2</b>.'); return null; }
      }
      return ant;
    }
    if (e.typ === 'bauer') return { a: e.aWerte[ui.bauer.ai], xs: fr(ui.bauer.xs), ys: fr(ui.bauer.ys) };
    if (!ui.wahl) { meldung('info', 'Wähle zuerst eine Antwort aus.'); return null; }
    return ui.wahl;
  }

  function meldung(art, html, gross) {
    $('a-feedback').innerHTML = '<div class="' + art + '">' + (gross ? '<span class="gross">' + gross + '</span>' : '') + html + '</div>';
    zeigeNachricht($('a-feedback'));
  }

  /* ----- Prüfen ----- */
  function pruefen() {
    if (ui.fertig) return;
    const ant = antwort();
    if (ant === null) return;
    const erg = ui.t.pruefe(ant);
    ui.versuche++;
    if (erg.richtig) richtig(erg); else falsch(erg, ant);
  }

  function falsch(erg, ant) {
    const e = ui.t.eingabe;
    if (!ui.fehler) { ui.fehler = true; S.serie = 0; speichern(); renderKopf(); }
    if (e.typ === 'felder') { ui.felder.forEach(id => { ui.status[id] = erg.teil[id]; }); renderFelder(); }
    else if (e.typ === 'wahl' || e.typ === 'graphen') {
      ui.gesperrt[ant] = true;
      $('a-eingabe').querySelectorAll('.wahl-btn').forEach(b => { if (b.dataset.id === ant) { b.classList.remove('gewaehlt'); b.classList.add('fehl'); } });
      ui.wahl = null;
    } else if (e.typ === 'bauer') {
      $('b-teil').innerHTML = [['a', 'a'], ['xs', 'x_S'], ['ys', 'y_S']].map(([id, n]) => '<span class="' + (erg.teil[id] ? 'ok' : 'fehl') + '">' + k(n) + (erg.teil[id] ? ' ✓' : ' ✗') + '</span>').join('');
    }
    meldung('fehl', (erg.hinweis ? rich(erg.hinweis) : 'Das passt noch nicht. Versuch es noch einmal oder nutze einen Tipp.'), 'Noch nicht richtig');
    if (ui.versuche >= 2) $('btn-loesung').hidden = false;
  }

  function loesungHtml() {
    const t = ui.t;
    if (t.rechnung) return '<div class="rechnung">' + k(t.rechnung, true) + '</div>' + rich(t.schluss);
    return rich(t.loesung);
  }

  function abschluss() {
    ui.fertig = true;
    $('btn-tipp').hidden = true; $('btn-pruefen').hidden = true; $('btn-loesung').hidden = true; $('btn-weiter').hidden = false;
    $('tastatur').hidden = true;
    renderGraph(true);
    if (ui.t.eingabe.typ === 'felder') renderFelder();
    panelHoehe();
    $('btn-weiter').focus({ preventScroll: true });
  }

  function richtig(erg) {
    const t = ui.t, m = modus(cur.id);
    const ersterVersuch = !ui.fehler;
    let xp = T.punkte(cur.level, ui.hilfen, ui.versuche);
    if (ersterVersuch) {
      S.serie++; S.besteSerie = Math.max(S.besteSerie, S.serie);
      xp += S.serie >= 10 ? 8 : S.serie >= 5 ? 4 : S.serie >= 3 ? 2 : 0;
    }
    const rangVorher = rangIndex(S.xp);
    S.xp += xp; S.richtig++; m.richtig++; m.zaehl[cur.level]++;
    if (ui.hilfen === 0 && ui.versuche === 1) S.ohneHilfe++;
    S.heute.richtig++;
    const lobe = ['Richtig!', 'Stark!', 'Genau!', 'Sauber gelöst!', 'Treffer!'];
    const lob = lobe[Math.floor(Math.random() * lobe.length)];
    const zeigeWeg = ui.hilfen > 0 || ui.versuche > 1 || ['ausmult', 'punkt', 'erkennen'].includes(cur.id);

    if (t.eingabe.typ === 'felder') ui.felder.forEach(id => { ui.status[id] = true; });
    if (t.eingabe.typ === 'wahl' || t.eingabe.typ === 'graphen') markiereWahl(t.eingabe.richtig, null);
    if (t.eingabe.typ === 'bauer') $('b-teil').innerHTML = '<span class="ok">' + k('a') + ' ✓</span><span class="ok">' + k('x_S') + ' ✓</span><span class="ok">' + k('y_S') + ' ✓</span>';
    meldung('ok', (zeigeWeg ? '<div style="margin-top:4px">' + loesungHtml() + '</div>' : ''), lob + ' +' + xp + ' XP' + (ersterVersuch && S.serie >= 3 ? ' · Serie ' + S.serie + ' 🔥' : ''));

    if (cur.level === m.frei && cur.level < 3 && m.zaehl[cur.level] >= FREISCHALT) {
      m.frei++;
      toast('🔓 Stufe ' + m.frei + ' in „' + T.MODI[cur.id].name + '“ freigeschaltet', true);
    }
    if (rangIndex(S.xp) > rangVorher) toast('⭐ Neuer Rang: ' + RAENGE[rangIndex(S.xp)][1], true);
    if (S.heute.richtig === ZIEL) toast('🏁 Tagesziel erreicht: ' + ZIEL + ' Aufgaben!', true);
    BADGES.forEach(b => { if (!S.badges[b.id] && b.test(S)) { S.badges[b.id] = heuteStr(); toast(b.sym + ' Abzeichen: ' + b.name, true); } });
    speichern(); renderKopf();
    $('a-fortschritt').textContent = cur.level === m.frei && cur.level < 3 ? Math.min(m.zaehl[cur.level], FREISCHALT) + ' / ' + FREISCHALT + ' bis Stufe ' + (cur.level + 1) : '';
    abschluss();
  }

  function loesungZeigen() {
    if (ui.fertig) return;
    if (!ui.fehler) { ui.fehler = true; S.serie = 0; speichern(); renderKopf(); }
    const e = ui.t.eingabe;
    if (e.typ === 'wahl' || e.typ === 'graphen') markiereWahl(e.richtig, null);
    meldung('info', loesungHtml(), 'So geht’s');
    abschluss();
  }

  function tipp() {
    const t = ui.t;
    if (ui.fertig || ui.hilfen >= t.hints.length) return;
    ui.hilfen++;
    const d = document.createElement('div');
    d.className = 'hinweis';
    d.innerHTML = '<b>Tipp ' + ui.hilfen + ':</b> ' + rich(t.hints[ui.hilfen - 1]);
    $('a-hinweise').appendChild(d);
    zeigeNachricht(d);
    $('btn-tipp').textContent = '💡 Tipp (' + ui.hilfen + '/' + t.hints.length + ')';
    $('btn-tipp').disabled = ui.hilfen >= t.hints.length;
  }

  /* ---------- Dialoge ---------- */
  function zeigeBadges() {
    dialog('Abzeichen', '<div class="badge-liste">' + BADGES.map(b =>
      '<div class="badge' + (S.badges[b.id] ? ' da' : '') + '"><span class="sym">' + b.sym + '</span><div><strong>' + b.name + '</strong><small>' + b.text + '</small></div></div>').join('') + '</div>');
  }
  function zeigeMerk() {
    const z = [
      ['Scheitelpunktform', '$f(x)=a(x-x_S)^2+y_S$ mit dem Scheitelpunkt $S(x_S\\,|\\,y_S)$.'],
      ['Vorzeichen beachten', 'In der Klammer steht $x-x_S$. Bei $(x+3)^2$ ist $x_S=-3$, denn $x+3=x-(-3)$.'],
      ['Öffnungsrichtung', '$a>0$: nach oben geöffnet. $a<0$: nach unten geöffnet.'],
      ['Weite', '$|a|>1$: enger als die Normalparabel. $|a|<1$: weiter. $|a|=1$: gleich weit.'],
      ['Wertemenge', '$a>0$: $W=[y_S;\\,\\infty[$. $a<0$: $W=]{-}\\infty;\\,y_S]$.'],
      ['Allgemeine Form', '$f(x)=ax^2+bx+c$. Man erhält sie durch Ausmultiplizieren mit $(x-x_S)^2=x^2-2x_Sx+x_S^2$.']
    ];
    dialog('Merkkasten', '<div class="merk">' + z.map(([t, x]) => '<div><strong>' + t + '</strong><br>' + rich(x) + '</div>').join('') + '</div>');
  }
  function zuruecksetzen() {
    if (!confirm('Wirklich den gesamten Fortschritt auf diesem Gerät löschen?')) return;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ }
    S = leer(); S.heute.datum = heuteStr(); spiegel = null;
    zeigeHome();
  }

  /* ---------- Start ---------- */
  function init() {
    baueTastatur();
    $('btn-zurueck').onclick = zeigeHome;
    $('btn-tipp').onclick = tipp;
    $('btn-pruefen').onclick = pruefen;
    $('btn-loesung').onclick = loesungZeigen;
    $('btn-weiter').onclick = naechste;
    $('btn-badges').onclick = zeigeBadges;
    $('btn-merk').onclick = zeigeMerk;
    $('btn-reset').onclick = zuruecksetzen;
    $('dlg-zu').onclick = () => { const d = $('dlg'); if (d.close) d.close(); else d.removeAttribute('open'); };
    $('dlg').addEventListener('click', ev => { if (ev.target === $('dlg')) $('dlg-zu').click(); });

    document.addEventListener('keydown', ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey || dialogOffen() || $('aufgabe').hidden || !ui) return;
      if (ev.key === 'Enter') {
        if (ui.fertig) naechste(); else pruefen();
        ev.preventDefault(); return;
      }
      if (ui.t.eingabe.typ !== 'felder' || ui.fertig) return;
      const map = { Backspace: '⌫', ',': ',', '.': ',', '/': '/', '-': '−', '−': '−', ArrowRight: '›', ArrowLeft: '‹' };
      let z = null;
      if (/^\d$/.test(ev.key)) z = ev.key;
      else if (map[ev.key]) z = map[ev.key];
      else if (ev.key === 'Tab') z = ev.shiftKey ? '‹' : '›';
      if (z) { ev.preventDefault(); taste(z); }
    });

    window.addEventListener('resize', () => { if (!$('aufgabe').hidden) panelHoehe(); });
    renderKopf();
    zeigeHome();
  }
  init();
})();
