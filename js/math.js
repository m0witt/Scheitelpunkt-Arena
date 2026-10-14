/* Brüche, Eingabe-Parser und LaTeX-Bausteine für die Scheitelpunktform.
   Schreibweise: f(x) = a(x − x_S)² + y_S, Scheitelpunkt S(x_S | y_S). */
(function (root) {
  'use strict';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }

  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  const add = (p, q) => fr(p.n * q.d + q.n * p.d, p.d * q.d);
  const sub = (p, q) => fr(p.n * q.d - q.n * p.d, p.d * q.d);
  const mul = (p, q) => fr(p.n * q.n, p.d * q.d);
  const neg = p => fr(-p.n, p.d);
  const eq = (p, q) => p.n === q.n && p.d === q.d;
  const sign = p => Math.sign(p.n);
  const abs = p => fr(Math.abs(p.n), p.d);
  const isInt = p => p.d === 1;
  const toNum = p => p.n / p.d;
  const isZero = p => p.n === 0;
  const isOne = p => p.n === 1 && p.d === 1;

  /* Eingabe: "-3", "−3", "0,5", "1/2", "-3/4" → Bruch oder null */
  function parseInput(str) {
    if (typeof str !== 'string') return null;
    let s = str.replace(/\s+/g, '').replace(/[−–—]/g, '-').replace(/,/g, '.');
    if (!s) return null;
    let m = /^(-?)(\d+)\/(\d+)$/.exec(s);
    if (m) {
      const d = parseInt(m[3], 10);
      if (d === 0) return null;
      return fr((m[1] ? -1 : 1) * parseInt(m[2], 10), d);
    }
    m = /^(-?)(\d+)(?:\.(\d{1,3}))?$/.exec(s);
    if (m) {
      const dec = m[3] || '';
      const den = Math.pow(10, dec.length);
      return fr((m[1] ? -1 : 1) * parseInt(m[2] + dec, 10), den);
    }
    return null;
  }

  /* ---------- LaTeX ---------- */
  function tex(p) {
    if (p.d === 1) return String(p.n);
    return (p.n < 0 ? '-' : '') + '\\frac{' + Math.abs(p.n) + '}{' + p.d + '}';
  }
  /* Betrag als LaTeX (ohne Vorzeichen) */
  const texAbs = p => tex(abs(p));

  /* Anzeige einer (evtl. unfertigen) Tastatureingabe */
  function inputTex(str) {
    if (!str) return '';
    let s = str.replace(/[−–—]/g, '-');
    const m = /^(-?)(\d*[,.]?\d*)\/(\d*)$/.exec(s);
    const dec = t => t.replace(/[,.]/g, '{,}');
    if (m && m[2] !== '' && m[3] !== '') return (m[1] ? '-' : '') + '\\frac{' + dec(m[2]) + '}{' + m[3] + '}';
    return dec(s).replace(/\//g, '/');
  }

  /* Faktor vor x², ausgeschrieben: 1 → "", -1 → "-", sonst Zahl */
  function koeff(a) {
    if (isOne(a)) return '';
    if (a.n === -1 && a.d === 1) return '-';
    return tex(a);
  }
  /* + c bzw. − c angehängt (c = 0 entfällt) */
  function plusTex(c) {
    if (isZero(c)) return '';
    return (sign(c) > 0 ? '+' : '-') + texAbs(c);
  }

  /* a(x − x_S)² + y_S   (ohne "f(x) =") */
  function scheitelTerm(a, xs, ys) {
    let s;
    if (isZero(xs)) s = koeff(a) + 'x^2';
    else s = koeff(a) + '(x' + (sign(xs) > 0 ? '-' : '+') + texAbs(xs) + ')^2';
    return s + plusTex(ys);
  }
  const scheitelFormel = (a, xs, ys) => 'f(x)=' + scheitelTerm(a, xs, ys);

  /* ax² + bx + c */
  function polyTerm(a, b, c) {
    let s = koeff(a) + 'x^2';
    if (!isZero(b)) {
      const bb = abs(b);
      s += (sign(b) > 0 ? '+' : '-') + (isOne(bb) ? '' : tex(bb)) + 'x';
    }
    return s + plusTex(c);
  }
  const polyFormel = (a, b, c) => 'f(x)=' + polyTerm(a, b, c);

  /* Wertemenge als Intervall: W = [y_S; ∞[ bzw. ]−∞; y_S] */
  function wertemenge(upwards, ys, closed) {
    const c = closed !== false;
    if (upwards) return 'W=' + (c ? '[' : ']') + tex(ys) + ';\\,\\infty[';
    return 'W=]{-}\\infty;\\,' + tex(ys) + (c ? ']' : '[');
  }

  const api = { gcd, fr, add, sub, mul, neg, eq, sign, abs, isInt, toNum, isZero, isOne,
    parseInput, tex, texAbs, inputTex, koeff, plusTex, scheitelTerm, scheitelFormel,
    polyTerm, polyFormel, wertemenge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M = api;
})(typeof window !== 'undefined' ? window : globalThis);
