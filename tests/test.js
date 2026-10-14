const assert = require('assert');
const M = require('../js/math.js');
const T = require('../js/tasks.js');
const { fr } = M;

// Formelsatz
assert.strictEqual(M.scheitelFormel(fr(1), fr(-3), fr(-2)), 'f(x)=(x+3)^2-2');
assert.strictEqual(M.scheitelFormel(fr(-1), fr(2), fr(0)), 'f(x)=-(x-2)^2');
assert.strictEqual(M.scheitelFormel(fr(1, 2), fr(0), fr(3)), 'f(x)=\\frac{1}{2}x^2+3');
assert.strictEqual(M.scheitelFormel(fr(-2), fr(1, 2), fr(-1, 2)), 'f(x)=-2(x-\\frac{1}{2})^2-\\frac{1}{2}');
assert.strictEqual(M.polyFormel(fr(1), fr(-6), fr(7)), 'f(x)=x^2-6x+7');
assert.strictEqual(M.polyFormel(fr(-1), fr(1), fr(0)), 'f(x)=-x^2+x');
assert.strictEqual(M.wertemenge(true, fr(-2), true), 'W=[-2;\\,\\infty[');
assert.strictEqual(M.wertemenge(false, fr(3), true), 'W=]{-}\\infty;\\,3]');

// Eingabe
const eqv = (s, n, d) => { const p = M.parseInput(s); assert.ok(p && p.n === n && p.d === d, s); };
eqv('-3', -3, 1); eqv('−3', -3, 1); eqv('0,5', 1, 2); eqv('1/2', 1, 2); eqv('-3/4', -3, 4); eqv('-0,25', -1, 4); eqv('4/2', 2, 1);
['', '-', '1/0', '1/', 'abc', '1,2,3'].forEach(s => assert.strictEqual(M.parseInput(s), null, s));

// Aufgaben: richtige Lösung wird akzeptiert, falsche nicht
for (const modus of Object.keys(T.MODI)) for (let level = 1; level <= 3; level++) for (let i = 0; i < 300; i++) {
  const t = T.neueAufgabe(modus, level, '');
  const tag = modus + level + ' ' + t.sig;
  assert.ok(t.hints.length >= 2 && t.loesung && t.aufgabe, tag);
  const e = t.eingabe;
  if (e.typ === 'felder') {
    const felder = e.vorlage.filter(s => s.feld).map(s => s.feld);
    const ok = { a: t.a, xs: t.xs, ys: t.ys };
    if (modus === 'ausmult') {
      ok.b = M.mul(t.a, M.mul(fr(-2), t.xs));
      ok.c = M.add(M.mul(t.a, M.mul(t.xs, t.xs)), t.ys);
    }
    const richtig = {}; felder.forEach(f => richtig[f] = ok[f]);
    assert.ok(t.pruefe(richtig).richtig, 'richtig ' + tag);
    const letzte = felder[felder.length - 1];
    const falsch = Object.assign({}, richtig, { [letzte]: M.add(richtig[letzte], fr(1)) });
    assert.ok(!t.pruefe(falsch).richtig, 'falsch ' + tag);
    assert.ok(!t.pruefe({}).richtig, tag);
  } else if (e.typ === 'wahl' || e.typ === 'graphen') {
    assert.ok(t.pruefe(e.richtig).richtig, tag);
    const ids = e.optionen.map(o => o.id);
    assert.strictEqual(new Set(ids).size, ids.length, tag);
    ids.filter(id => id !== e.richtig).forEach(id => assert.ok(!t.pruefe(id).richtig, tag));
    const texte = e.optionen.map(o => o.tex || o.text);
    if (e.typ === 'wahl') assert.strictEqual(new Set(texte).size, texte.length, tag);
  } else if (e.typ === 'bauer') {
    assert.ok(t.pruefe({ a: t.a, xs: t.xs, ys: t.ys }).richtig, tag);
    assert.ok(!t.pruefe({ a: t.a, xs: M.add(t.xs, fr(1)), ys: t.ys }).richtig, tag);
  }
}

// Erkennen: genug Gitterpunkte; Punkte-Jagd: P im Gitter
for (let i = 0; i < 300; i++) for (const l of [1, 2, 3]) {
  const t = T.neuesErkennen(l);
  assert.ok(T.gitterpunkte(t.a, t.xs, t.ys).length >= 2);
  const p = T.neuesPunkt(l);
  assert.ok(p.graph.punkte.every(q => Math.abs(q.x) <= 7 && Math.abs(q.y) <= 7));
}

// Ausmultiplizieren: Beispielrechnung (x-3)^2-2 = x^2-6x+7 und -2(x+1)^2+3 = -2x^2-4x+1
{
  const calc = (a, xs, ys) => ({ A: a, B: M.mul(a, M.mul(fr(-2), xs)), C: M.add(M.mul(a, M.mul(xs, xs)), ys) });
  let r = calc(fr(1), fr(3), fr(-2)); assert.strictEqual(M.polyFormel(r.A, r.B, r.C), 'f(x)=x^2-6x+7');
  r = calc(fr(-2), fr(-1), fr(3)); assert.strictEqual(M.polyFormel(r.A, r.B, r.C), 'f(x)=-2x^2-4x+1');
}
console.log('Alle Tests bestanden');
