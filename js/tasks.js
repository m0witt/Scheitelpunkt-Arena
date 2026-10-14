/* Aufgaben-Generatoren, Prüflogik, Hilfen und Lösungen. Reine Logik, keine DOM-Zugriffe.
   Texte enthalten Formeln zwischen $…$ (LaTeX), die die Oberfläche mit KaTeX setzt. */
(function (root) {
  'use strict';
  const M = (typeof module !== 'undefined' && module.exports) ? require('./math.js') : root.M;
  const { fr, add, sub, mul, neg, eq, sign, abs, isInt, toNum, isZero, tex } = M;

  const R = 7; // Gitter reicht von −7 bis 7

  /* ---------- Zufall ---------- */
  const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const F = (n, d) => fr(n, d === undefined ? 1 : d);
  const par = p => (sign(p) < 0 ? '(' + tex(p) + ')' : tex(p));

  /* Parameterbereiche je Stufe */
  const A_LESEN = {
    1: [F(1), F(-1)],
    2: [F(1), F(-1), F(2), F(-2), F(3), F(-3), F(1, 2), F(-1, 2)],
    3: [F(1, 4), F(-1, 4), F(1, 2), F(-1, 2), F(3, 2), F(-3, 2), F(2), F(-2), F(3), F(-3), F(5, 2), F(-5, 2)]
  };
  const A_ERKENNEN = {
    1: [F(1), F(-1)],
    2: [F(2), F(-2), F(1, 2), F(-1, 2), F(1), F(-1)],
    3: [F(3), F(-3), F(1, 4), F(-1, 4), F(3, 2), F(-3, 2), F(2), F(-2), F(1, 2), F(-1, 2)]
  };
  const A_BAUER = {
    1: [F(-1), F(1)],
    2: [F(-2), F(-1), F(-1, 2), F(1, 2), F(1), F(2)],
    3: [F(-3), F(-2), F(-1), F(-1, 2), F(-1, 4), F(1, 4), F(1, 2), F(1), F(2), F(3)]
  };
  const XP_BASIS = { 1: 10, 2: 15, 3: 20 };


  /* Gitterpunkte (ohne Scheitelpunkt) der Parabel innerhalb des Gitters, nur ganzzahlig */
  function gitterpunkte(a, xs, ys) {
    const pts = [];
    for (let x = -R; x <= R; x++) {
      if (x === toNum(xs)) continue;
      const y = add(mul(a, mul(sub(F(x), xs), sub(F(x), xs))), ys);
      if (isInt(y) && Math.abs(y.n) <= R) pts.push({ x, y: y.n });
    }
    return pts;
  }
  const lesbar = (a, xs, ys) => gitterpunkte(a, xs, ys).length >= 2 && Math.abs(toNum(xs)) <= 5 && Math.abs(toNum(ys)) <= 5;

  function halb(level) { return level === 3 ? F(rint(-10, 10), 2) : F(rint(-5, 5)); }

  /* ---------- gemeinsame Bausteine ---------- */
  const SCHEITEL_FORM = '$f(x)=a(x-x_S)^2+y_S$';
  const formelAnzeige = (a, xs, ys) => M.scheitelFormel(a, xs, ys);


  /* ===== Modus 1: Ablesen ===== */
  function lesenParams(level) {
    for (;;) {
      const a = pick(A_LESEN[level]), xs = halb(level), ys = halb(level);
      if (!(isZero(xs) && isZero(ys))) return { a, xs, ys };
    }
  }

  function lesenS(level) {
    const { a, xs, ys } = lesenParams(level);
    const klammerText = isZero(xs) ? '' :
      ' Aus $(x' + (sign(xs) > 0 ? '-' : '+') + M.texAbs(xs) + ')$ wird $x-' + par(xs) + '$.';
    return {
      modus: 'lesen', art: 'S', level, a, xs, ys,
      sig: 'S|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Lies den Scheitelpunkt $S$ der Parabel ab.',
      formel: formelAnzeige(a, xs, ys),
      eingabe: { typ: 'felder', vorlage: [{ tex: 'S(' }, { feld: 'xs' }, { tex: '\\,|\\,' }, { feld: 'ys' }, { tex: ')' }] },
      hints: [
        'Vergleiche den Term mit der Scheitelpunktform ' + SCHEITEL_FORM + '. Welche Zahl steht in der Klammer, welche steht dahinter?',
        'In der Klammer steht $x-x_S$. Der Wert $x_S$ ist also die Zahl, die hinter dem Minus steht. Bei $(x+7)^2$ ist deshalb $x_S=-7$.'
      ],
      loesung: 'Ein Vergleich mit ' + SCHEITEL_FORM + ' liefert $x_S=' + tex(xs) + '$ und $y_S=' + tex(ys) + '$.' + klammerText +
        ' Also ist $S(' + tex(xs) + '\\,|\\,' + tex(ys) + ')$.',
      pruefe(ant) {
        const teil = { xs: !!ant.xs && eq(ant.xs, xs), ys: !!ant.ys && eq(ant.ys, ys) };
        const ok = teil.xs && teil.ys;
        let hinweis = '';
        if (!ok) {
          if (ant.xs && !teil.xs && !isZero(xs) && eq(ant.xs, neg(xs)))
            hinweis = 'Achte auf das Vorzeichen von $x_S$: In der Klammer steht $x-x_S$, das Vorzeichen in der Klammer ist also das <em>Gegenteil</em> von $x_S$.';
          else if (ant.xs && ant.ys && eq(ant.xs, ys) && eq(ant.ys, xs) && !eq(xs, ys))
            hinweis = 'Die Koordinaten sind vertauscht: Zuerst kommt der $x$-Wert $x_S$, dann der $y$-Wert $y_S$.';
          else if (teil.xs) hinweis = '$x_S$ stimmt. Schau nochmal auf $y_S$.';
          else if (teil.ys) hinweis = '$y_S$ stimmt. Schau nochmal auf $x_S$.';
        }
        return { richtig: ok, teil, hinweis };
      }
    };
  }

  function lesenOeffnung(level) {
    const { a, xs, ys } = lesenParams(level);
    const oben = sign(a) > 0;
    return {
      modus: 'lesen', art: 'Oeffnung', level, a, xs, ys,
      sig: 'O|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Wie ist die Parabel geöffnet?',
      formel: formelAnzeige(a, xs, ys),
      eingabe: { typ: 'wahl', optionen: [{ id: 'oben', text: 'nach oben' }, { id: 'unten', text: 'nach unten' }], richtig: oben ? 'oben' : 'unten' },
      hints: [
        'Welche Zahl im Term entscheidet über die Öffnungsrichtung? Vergleiche mit ' + SCHEITEL_FORM + '.',
        'Es kommt auf das Vorzeichen von $a$ an: Für $a>0$ ist die Parabel nach oben geöffnet, für $a<0$ nach unten.'
      ],
      loesung: 'Hier ist $a=' + tex(a) + '$, also $a' + (oben ? '>0' : '<0') + '$. Die Parabel ist nach ' + (oben ? 'oben' : 'unten') + ' geöffnet.',
      pruefe(ant) { return { richtig: ant === (oben ? 'oben' : 'unten'), hinweis: '' }; }
    };
  }

  function lesenWertemenge(level) {
    const { a, xs, ys } = lesenParams(level);
    const oben = sign(a) > 0;
    const richtig = M.wertemenge(oben, ys, true);
    let kand = [
      M.wertemenge(!oben, ys, true),
      !eq(xs, ys) ? M.wertemenge(oben, xs, true) : M.wertemenge(oben, neg(ys), true),
      M.wertemenge(oben, ys, false),
      !isZero(ys) ? M.wertemenge(oben, neg(ys), true) : M.wertemenge(!oben, ys, false),
      !eq(xs, ys) ? M.wertemenge(!oben, xs, true) : M.wertemenge(!oben, ys, false)
    ];
    const einmalig = [];
    kand.forEach(k => { if (k !== richtig && einmalig.indexOf(k) < 0) einmalig.push(k); });
    const falsch = [einmalig[0], ...shuffle(einmalig.slice(1)).slice(0, 2)];
    const optionen = shuffle([richtig, ...falsch]).map((t, i) => ({ id: 'o' + i, tex: t, richtig: t === richtig }));
    return {
      modus: 'lesen', art: 'Wertemenge', level, a, xs, ys,
      sig: 'W|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Welche Wertemenge hat die Funktion $f$?',
      formel: formelAnzeige(a, xs, ys),
      eingabe: { typ: 'wahl', optionen, richtig: optionen.find(o => o.richtig).id },
      hints: [
        'Überlege zuerst, ob die Parabel nach oben oder nach unten geöffnet ist. Ist der Scheitelpunkt dann der tiefste oder der höchste Punkt?',
        'Der $y$-Wert $y_S$ des Scheitelpunkts ist die Grenze der Wertemenge. Achte auf die Richtung des Intervalls und darauf, ob die Grenze dazugehört.'
      ],
      loesung: 'Wegen $a=' + tex(a) + (oben ? '>0' : '<0') + '$ ist die Parabel nach ' + (oben ? 'oben' : 'unten') + ' geöffnet. Der Scheitelpunkt $S(' +
        tex(xs) + '\\,|\\,' + tex(ys) + ')$ ist der ' + (oben ? 'tiefste' : 'höchste') + ' Punkt, und $y_S=' + tex(ys) + '$ gehört zur Wertemenge. Also $' + richtig + '$.',
      pruefe(ant) {
        return { richtig: ant === optionen.find(o => o.richtig).id, hinweis: '' };
      }
    };
  }

  function lesenWeite(level) {
    const { a, xs, ys } = lesenParams(level);
    const b = abs(a);
    const was = isZero(sub(b, F(1))) ? 'gleich' : (toNum(b) > 1 ? 'enger' : 'weiter');
    const text = { gleich: 'genauso weit wie die Normalparabel', enger: 'enger als die Normalparabel', weiter: 'weiter als die Normalparabel' };
    return {
      modus: 'lesen', art: 'Weite', level, a, xs, ys,
      sig: 'V|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Vergleiche den Graphen mit der Normalparabel $y=x^2$. Er ist …',
      formel: formelAnzeige(a, xs, ys),
      eingabe: { typ: 'wahl', optionen: ['weiter', 'enger', 'gleich'].map(k => ({ id: k, text: text[k] })), richtig: was },
      hints: [
        'Die Normalparabel hat den Streckfaktor $a=1$. Vergleiche den <em>Betrag</em> von $a$ mit $1$.',
        'Das Vorzeichen von $a$ spielt für die Weite keine Rolle, nur $|a|$: Ist $|a|>1$, wird die Parabel enger, ist $|a|<1$, wird sie weiter.'
      ],
      loesung: 'Hier ist $a=' + tex(a) + '$ und damit $|a|=' + tex(b) + '$. ' +
        (was === 'gleich' ? 'Wegen $|a|=1$ ist die Parabel genauso weit wie die Normalparabel (nur evtl. gespiegelt).' :
          was === 'enger' ? 'Wegen $|a|>1$ ist die Parabel enger als die Normalparabel.' : 'Wegen $|a|<1$ ist die Parabel weiter als die Normalparabel.'),
      pruefe(ant) { return { richtig: ant === was, hinweis: '' }; }
    };
  }

  function neuesLesen(level) {
    const r = Math.random();
    if (level === 1) return r < 0.5 ? lesenS(1) : r < 0.75 ? lesenOeffnung(1) : lesenWertemenge(1);
    return r < 0.35 ? lesenS(level) : r < 0.5 ? lesenOeffnung(level) : r < 0.75 ? lesenWertemenge(level) : lesenWeite(level);
  }

  /* ===== Modus 2: Parabel erkennen ===== */
  function neuesErkennen(level) {
    let a, xs, ys;
    do { a = pick(A_ERKENNEN[level]); xs = F(rint(-5, 5)); ys = F(rint(-5, 5)); } while (!lesbar(a, xs, ys));
    const pts = gitterpunkte(a, xs, ys).slice(0, 3);
    return {
      modus: 'erkennen', art: 'Erkennen', level, a, xs, ys,
      sig: 'E|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Bestimme den Funktionsterm der abgebildeten Parabel in Scheitelpunktform.',
      formel: null,
      graph: { parabeln: [{ a, xs, ys }] },
      eingabe: { typ: 'felder', vorlage: [{ tex: 'f(x)=' }, { feld: 'a' }, { tex: '(x-' }, { feld: 'xs', klammer: true }, { tex: ')^2+' }, { feld: 'ys', klammer: true }] },
      hints: [
        'Lies zuerst den Scheitelpunkt $S(x_S\\,|\\,y_S)$ im Gitter ab. Er ist der tiefste bzw. höchste Punkt der Parabel.',
        'Für $a$ brauchst du einen weiteren Gitterpunkt $P$ der Parabel. Setze $P$ und $S$ in ' + SCHEITEL_FORM + ' ein und löse nach $a$ auf. Oder: Gehe vom Scheitelpunkt $1$ nach rechts und lies ab, wie viele Einheiten die Parabel höher oder tiefer liegt.',
        'Wenn der Scheitelpunkt zum Beispiel bei $x_S=-3$ liegt, steht in der Klammer $x-(-3)$, das ist $x+3$.'
      ],
      loesung: 'Scheitelpunkt: $S(' + tex(xs) + '\\,|\\,' + tex(ys) + ')$. ' +
        (pts.length ? 'Der Punkt $P(' + pts[0].x + '\\,|\\,' + pts[0].y + ')$ liegt auf der Parabel: $' + pts[0].y + '=a\\cdot(' + pts[0].x + '-' + par(xs) + ')^2+' + par(ys) + '$ ergibt $a=' + tex(a) + '$. ' : '') +
        'Also $' + formelAnzeige(a, xs, ys) + '$ bzw. $f(x)=' + tex(a) + '\\cdot(x-' + par(xs) + ')^2+' + par(ys) + '$.',
      pruefe(ant) {
        const teil = { a: !!ant.a && eq(ant.a, a), xs: !!ant.xs && eq(ant.xs, xs), ys: !!ant.ys && eq(ant.ys, ys) };
        const ok = teil.a && teil.xs && teil.ys;
        let hinweis = '';
        if (!ok) {
          if (teil.xs && teil.ys) hinweis = 'Der Scheitelpunkt stimmt. Prüfe nun den Faktor $a$ (Öffnungsrichtung und Weite).';
          else if (ant.xs && !teil.xs && !isZero(xs) && eq(ant.xs, neg(xs))) hinweis = 'Vorzeichen in der Klammer: Dort steht $x-x_S$. Liegt der Scheitelpunkt rechts von der $y$-Achse, ist $x_S$ positiv.';
          else if (teil.xs || teil.ys) hinweis = (teil.xs ? '$x_S$' : '$y_S$') + ' stimmt schon.';
          if (!teil.a && ant.a && eq(ant.a, neg(a))) hinweis += ' Das Vorzeichen von $a$ passt nicht zur Öffnungsrichtung.';
        }
        return { richtig: ok, teil, hinweis };
      }
    };
  }

  /* ===== Modus 3: Parabel durch einen Punkt ===== */
  function neuesPunkt(level) {
    for (;;) {
      const xs = F(rint(-4, 4)), ys = F(rint(-4, 4));
      let dx, dy;
      if (level === 1) { dx = pick([1, 2, -1, -2]); dy = pick([1, 2, 3, -1, -2, -3]) * (Math.abs(dx) === 1 ? 1 : 1); }
      else if (level === 2) { dx = pick([2, -2, 4, -4, 1, -1]); const as = [F(1, 2), F(-1, 2), F(1, 4), F(-1, 4), F(2), F(-2), F(3), F(-3)]; const a = pick(as); const v = mul(a, F(dx * dx)); if (!isInt(v)) continue; dy = v.n; }
      else { dx = pick([1, -1, 2, -2]); dy = pick([1, 2, 3, 5, -1, -2, -3, -5]); }
      if (dy === 0) continue;
      const a = fr(dy, dx * dx);
      if (level === 1 && !isInt(a)) continue;
      const px = toNum(xs) + dx, py = toNum(ys) + dy;
      if (Math.abs(px) > R || Math.abs(py) > R) continue;
      // Scheitelpunkt und Punkt sollen nicht auf gleichem Gitterpunkt liegen (dx≠0, dy≠0 ist garantiert)
      const dyTex = tex(F(dy)), dx2 = dx * dx;
      const loesung = 'Der Punkt $P(' + px + '\\,|\\,' + py + ')$ liegt auf der Parabel, also gilt $f(' + px + ')=' + py + '$. Einsetzen in ' + SCHEITEL_FORM +
        ': $' + py + '=a\\cdot(' + px + '-' + par(xs) + ')^2+' + par(ys) + '$. Das ergibt $' + dyTex + '=' + dx2 + '\\cdot a$, also $a=' + tex(a) + '$.';
      return {
        modus: 'punkt', art: 'Punkt', level, a, xs, ys,
        sig: 'P|' + formelAnzeige(a, xs, ys),
        aufgabe: 'Der Graph einer quadratischen Funktion hat den Scheitelpunkt $S(' + tex(xs) + '\\,|\\,' + tex(ys) + ')$ und verläuft durch den Punkt $P(' + px + '\\,|\\,' + py + ')$. Bestimme $a$.',
        formel: null,
        graph: { punkte: [{ x: toNum(xs), y: toNum(ys), label: 'S', cls: 'p-s' }, { x: px, y: py, label: 'P', cls: 'p-p' }] },
        graphLoesung: { parabeln: [{ a, xs, ys }], punkte: [{ x: toNum(xs), y: toNum(ys), label: 'S', cls: 'p-s' }, { x: px, y: py, label: 'P', cls: 'p-p' }] },
        eingabe: { typ: 'felder', vorlage: [{ tex: 'a=' }, { feld: 'a' }] },
        hints: [
          'Der Punkt $P$ liegt auf dem Graphen, seine Koordinaten erfüllen also die Funktionsgleichung.',
          'Setze $x_S$ und $y_S$ sowie die Koordinaten von $P$ in ' + SCHEITEL_FORM + ' ein. Dabei ist $x$ der $x$-Wert und $f(x)$ der $y$-Wert von $P$.',
          'Fasse zusammen: Es bleibt eine Gleichung mit der einzigen Unbekannten $a$. Löse sie nach $a$ auf.'
        ],
        loesung,
        pruefe(ant) {
          const ok = !!ant.a && eq(ant.a, a);
          let hinweis = '';
          if (!ok && ant.a) {
            if (eq(ant.a, neg(a))) hinweis = 'Prüfe das Vorzeichen: Liegt $P$ über oder unter $S$? Das legt die Öffnungsrichtung fest.';
            else if (eq(ant.a, F(dy))) hinweis = 'Hast du das Quadrat $(x_P-x_S)^2$ berücksichtigt?';
          }
          return { richtig: ok, teil: { a: ok }, hinweis };
        }
      };
    }
  }

  /* ===== Modus 4: Term zum Graphen ===== */
  function neuesZuordnen(level) {
    const aL = level === 1 ? [F(1), F(-1)] : [F(1), F(-1), F(2), F(-2), F(1, 2), F(-1, 2)];
    for (;;) {
      const a = pick(aL), xs = F(rint(-4, 4)), ys = F(rint(-4, 4));
      if (isZero(xs) && isZero(ys)) continue;
      const vari = [
        { a, xs: neg(xs), ys }, { a, xs, ys: neg(ys) }, { a: neg(a), xs, ys },
        { a, xs: ys, ys: xs }, { a: neg(a), xs: neg(xs), ys }, { a, xs: neg(xs), ys: neg(ys) }
      ];
      if (level >= 2) { vari.push({ a: mul(a, F(2)), xs, ys }); vari.push({ a: mul(a, F(1, 2)), xs, ys }); }
      const gleich = (p, q) => eq(p.a, q.a) && eq(p.xs, q.xs) && eq(p.ys, q.ys);
      const andere = [];
      shuffle(vari).forEach(v => {
        if (gleich(v, { a, xs, ys })) return;
        if (andere.some(o => gleich(o, v))) return;
        if (Math.abs(toNum(v.xs)) > 5 || Math.abs(toNum(v.ys)) > 5) return;
        if (gitterpunkte(v.a, v.xs, v.ys).length < 1) return;
        andere.push(v);
      });
      if (andere.length < 3 || !lesbar(a, xs, ys)) continue;
      const opts = shuffle([{ a, xs, ys, richtig: true }, ...andere.slice(0, 3)]).map((o, i) => ({ id: 'o' + i, buchstabe: 'ABCD'[i], a: o.a, xs: o.xs, ys: o.ys, richtig: !!o.richtig }));
      const richtig = opts.find(o => o.richtig);
      return {
        modus: 'zuordnen', art: 'Zuordnen', level, a, xs, ys,
        sig: 'Z|' + formelAnzeige(a, xs, ys),
        aufgabe: 'Welcher Graph gehört zu dieser Funktion?',
        formel: formelAnzeige(a, xs, ys),
        eingabe: { typ: 'graphen', optionen: opts, richtig: richtig.id },
        hints: [
          'Bestimme aus dem Term den Scheitelpunkt $S(x_S\\,|\\,y_S)$ und schließe damit Graphen aus.',
          'Vorsicht beim Vorzeichen in der Klammer: Zu $(x-2)^2$ gehört $x_S=2$, zu $(x+2)^2$ gehört $x_S=-2$.',
          'Prüfe außerdem die Öffnungsrichtung (Vorzeichen von $a$) und die Weite (Betrag von $a$).'
        ],
        loesung: 'Aus dem Term folgt $S(' + tex(xs) + '\\,|\\,' + tex(ys) + ')$, $a=' + tex(a) + '$: Die Parabel ist nach ' + (sign(a) > 0 ? 'oben' : 'unten') +
          ' geöffnet und ' + (toNum(abs(a)) === 1 ? 'so weit wie die Normalparabel' : toNum(abs(a)) > 1 ? 'enger als die Normalparabel' : 'weiter als die Normalparabel') +
          '. Das passt zu Graph ' + richtig.buchstabe + '.',
        pruefe(ant) { return { richtig: ant === richtig.id, hinweis: '' }; }
      };
    }
  }

  /* ===== Modus 5: Parabel-Bauer ===== */
  function neuesBauer(level) {
    let a, xs, ys;
    do { a = pick(A_BAUER[level]); xs = F(rint(-5, 5)); ys = F(rint(-5, 5)); }
    while (!lesbar(a, xs, ys) || (isOne(a) && isZero(xs) && isZero(ys)));  // nicht schon die Startstellung der Regler
    return {
      modus: 'bauer', art: 'Bauer', level, a, xs, ys,
      sig: 'B|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Stelle die drei Regler so ein, dass deine Parabel genau über der gestrichelten Zielparabel liegt.',
      formel: null,
      eingabe: { typ: 'bauer', aWerte: A_BAUER[level], xsRange: [-6, 6], ysRange: [-6, 6] },
      hints: [
        'Stelle zuerst den Scheitelpunkt ein: Er ist der tiefste bzw. höchste Punkt der Zielparabel.',
        'Danach passt du $a$ an: Das Vorzeichen bestimmt die Öffnungsrichtung, der Betrag die Weite.'
      ],
      loesung: 'Die Zielparabel hat den Scheitelpunkt $S(' + tex(xs) + '\\,|\\,' + tex(ys) + ')$ und $a=' + tex(a) + '$, also $' + formelAnzeige(a, xs, ys) + '$.',
      pruefe(ant) {
        const teil = { a: eq(ant.a, a), xs: eq(ant.xs, xs), ys: eq(ant.ys, ys) };
        const ok = teil.a && teil.xs && teil.ys;
        let hinweis = '';
        if (!ok) {
          const bad = [];
          if (!teil.xs) bad.push('$x_S$');
          if (!teil.ys) bad.push('$y_S$');
          if (!teil.a) bad.push('$a$');
          hinweis = 'Noch nicht deckungsgleich. Prüfe: ' + bad.join(', ') + '.';
        }
        return { richtig: ok, teil, hinweis };
      }
    };
  }

  /* ===== Modus 6: Ausmultiplizieren (Scheitelpunktform → allgemeine Form) ===== */
  function neuesAusmult(level) {
    let a, xs, ys;
    for (;;) {
      if (level === 1) { a = F(1); xs = F(rint(-5, 5)); ys = F(rint(-6, 6)); }
      else if (level === 2) { a = pick([F(1), F(-1), F(2), F(-2), F(3), F(-3)]); xs = F(rint(-5, 5)); ys = F(rint(-6, 6)); }
      else { a = pick([F(1, 2), F(-1, 2), F(3, 2), F(-3, 2), F(1, 4), F(-1, 4), F(2), F(-2)]); xs = F(rint(-5, 5)); ys = F(rint(-6, 6)); }
      if (!isZero(xs)) break;
    }
    const p = mul(F(-2), xs), q = mul(xs, xs);
    const A = a, B = mul(a, p), C = add(mul(a, q), ys);
    const innen = 'x^2' + (isZero(p) ? '' : (sign(p) > 0 ? '+' : '-') + M.texAbs(p) + 'x') + '+' + tex(q);
    const zeilen = [
      'f(x)&=' + M.scheitelTerm(a, xs, ys),
      '&=' + M.koeff(a) + '(' + innen + ')' + M.plusTex(ys),
      '&=' + M.polyTerm(A, B, add(mul(a, q), F(0))) + M.plusTex(ys),
      '&=' + M.polyTerm(A, B, C)
    ];
    if (isOne(a)) zeilen.splice(2, 1);
    const rechnung = '\\begin{aligned}' + zeilen.join('\\\\') + '\\end{aligned}';
    return {
      modus: 'ausmult', art: 'Ausmultiplizieren', level, a, xs, ys,
      sig: 'M|' + formelAnzeige(a, xs, ys),
      aufgabe: 'Bringe den Funktionsterm in die allgemeine Form $f(x)=ax^2+bx+c$ und gib $a$, $b$ und $c$ an.',
      formel: formelAnzeige(a, xs, ys),
      eingabe: { typ: 'felder', vorlage: [{ tex: 'a=' }, { feld: 'a' }, { tex: '\\qquad b=' }, { feld: 'b' }, { tex: '\\qquad c=' }, { feld: 'c' }] },
      hints: [
        'Löse zuerst die Klammer mit der binomischen Formel auf: $(x-u)^2=x^2-2ux+u^2$. Beachte: Bei $(x+u)^2$ ist das Vorzeichen des mittleren Summanden positiv.',
        'Multipliziere danach jeden Summanden in der Klammer mit dem Faktor $a$ vor der Klammer.',
        'Zuletzt fasst du die Zahlen ohne $x$ zusammen: Das konstante Glied aus der Klammer und $y_S$ ergeben $c$.'
      ],
      schluss: 'Also $a=' + tex(A) + '$, $b=' + tex(B) + '$ und $c=' + tex(C) + '$.',
      loesung: '$' + rechnung + '$ Also $a=' + tex(A) + '$, $b=' + tex(B) + '$ und $c=' + tex(C) + '$.',
      rechnung,
      pruefe(ant) {
        const teil = { a: !!ant.a && eq(ant.a, A), b: !!ant.b && eq(ant.b, B), c: !!ant.c && eq(ant.c, C) };
        const ok = teil.a && teil.b && teil.c;
        let hinweis = '';
        if (!ok) {
          if (teil.a && teil.b) hinweis = '$a$ und $b$ stimmen. Beim konstanten Glied $c$ fehlt noch etwas, denk an $y_S$ und an das Quadrat des Klammerwerts.';
          else if (teil.a && teil.c) hinweis = '$a$ und $c$ stimmen. Prüfe den mittleren Summanden der binomischen Formel, vergiss den Faktor $a$ nicht.';
          else if (teil.a) hinweis = '$a$ stimmt. Prüfe $b$ und $c$ mit der binomischen Formel.';
        }
        return { richtig: ok, teil, hinweis };
      }
    };
  }
  const isOne = M.isOne;

  /* ---------- Öffentliche Schnittstelle ---------- */
  const MODI = {
    lesen: { name: 'Ablesen', untertitel: 'Scheitelpunkt, Öffnung, Wertemenge, Weite', gen: neuesLesen },
    erkennen: { name: 'Parabel erkennen', untertitel: 'Funktionsterm aus dem Graphen', gen: neuesErkennen },
    punkt: { name: 'Punkte-Jagd', untertitel: 'Streckfaktor a aus einem Punkt', gen: neuesPunkt },
    zuordnen: { name: 'Term zum Graph', untertitel: 'Den passenden Graphen finden', gen: neuesZuordnen },
    bauer: { name: 'Parabel-Bauer', untertitel: 'Zielparabel mit Reglern nachbauen', gen: neuesBauer },
    ausmult: { name: 'Ausmultiplizieren', untertitel: 'Von der Scheitelpunktform zur allgemeinen Form', gen: neuesAusmult }
  };

  function neueAufgabe(modus, level, letzteSig) {
    let t;
    for (let i = 0; i < 12; i++) {
      t = MODI[modus].gen(level);
      if (t.sig !== letzteSig) break;
    }
    return t;
  }

  function punkte(level, hilfen, versuche) {
    const f = [1, 0.75, 0.5, 0.3][Math.min(hilfen, 3)] * (versuche > 1 ? 0.5 : 1);
    return Math.max(2, Math.round(XP_BASIS[level] * f));
  }

  const api = { R, MODI, neueAufgabe, punkte, XP_BASIS, gitterpunkte, lesbar,
    neuesLesen, lesenS, lesenOeffnung, lesenWertemenge, lesenWeite, neuesErkennen, neuesPunkt, neuesZuordnen, neuesBauer, neuesAusmult };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.T = api;
})(typeof window !== 'undefined' ? window : globalThis);
