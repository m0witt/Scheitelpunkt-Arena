/* SVG-Koordinatensystem mit Gitter, Parabeln und Punkten. */
(function (root) {
  'use strict';
  let uid = 0;

  /* opts: R (Halbweite, Standard 7), labelEvery, parabeln:[{a,xs,ys,cls}], punkte:[{x,y,cls,label}], compact */
  function graphSvg(opts) {
    const R = opts.R || 7;
    const m = opts.compact ? 0.7 : 1.0;
    const lo = -R - m, size = 2 * (R + m);
    const lab = opts.labelEvery === undefined ? 1 : opts.labelEvery;
    const clip = 'clip' + (++uid);
    const Y = y => -y;
    let s = '<svg class="graph" viewBox="' + lo + ' ' + lo + ' ' + size + ' ' + size +
      '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (opts.alt || 'Koordinatensystem mit Parabel') + '">';
    s += '<defs><clipPath id="' + clip + '"><rect x="' + (-R) + '" y="' + (-R) + '" width="' + 2 * R + '" height="' + 2 * R + '"/></clipPath></defs>';
    s += '<rect class="g-bg" x="' + lo + '" y="' + lo + '" width="' + size + '" height="' + size + '"/>';
    for (let i = -R; i <= R; i++) {
      const ax = i === 0 ? ' g-axis' : '';
      s += '<line class="g-grid' + ax + '" x1="' + i + '" y1="' + (-R) + '" x2="' + i + '" y2="' + R + '"/>';
      s += '<line class="g-grid' + ax + '" x1="' + (-R) + '" y1="' + i + '" x2="' + R + '" y2="' + i + '"/>';
    }
    s += '<line class="g-axis" x1="' + (-R - 0.4) + '" y1="0" x2="' + (R + 0.4) + '" y2="0"/>';
    s += '<line class="g-axis" x1="0" y1="' + (R + 0.4) + '" x2="0" y2="' + (-R - 0.4) + '"/>';
    s += '<path class="g-arrow" d="M' + (R + 0.6) + ',0 l-0.4,-0.2 v0.4 z M0,' + (-R - 0.6) + ' l-0.2,0.4 h0.4 z"/>';
    s += '<text class="g-lab" x="' + (R + 0.55) + '" y="0.75" text-anchor="end">x</text>';
    s += '<text class="g-lab" x="0.3" y="' + (-R - 0.45) + '">y</text>';
    if (lab) {
      for (let i = -R; i <= R; i++) {
        if (i === 0 || i % lab !== 0) continue;
        s += '<text class="g-tick" x="' + i + '" y="0.62" text-anchor="middle">' + i + '</text>';
        s += '<text class="g-tick" x="-0.15" y="' + (Y(i) + 0.2) + '" text-anchor="end">' + i + '</text>';
      }
    }
    s += '<g clip-path="url(#' + clip + ')">';
    (opts.parabeln || []).forEach(p => {
      let d = '';
      const a = p.a.n / p.a.d, xs = p.xs.n / p.xs.d, ys = p.ys.n / p.ys.d;
      for (let x = -R; x <= R + 1e-9; x += 0.05) {
        const y = a * (x - xs) * (x - xs) + ys;
        d += (d ? 'L' : 'M') + x.toFixed(2) + ',' + Y(y).toFixed(3);
      }
      s += '<path class="g-parabel ' + (p.cls || '') + '" d="' + d + '"/>';
    });
    s += '</g>';
    (opts.punkte || []).forEach(p => {
      s += '<circle class="g-punkt ' + (p.cls || '') + '" cx="' + p.x + '" cy="' + Y(p.y) + '" r="0.24"/>';
      if (p.label) s += '<text class="g-plab ' + (p.cls || '') + '" x="' + (p.x + 0.4) + '" y="' + (Y(p.y) - 0.35) + '">' + p.label + '</text>';
    });
    return s + '</svg>';
  }

  const api = { graphSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.G = api;
})(typeof window !== 'undefined' ? window : globalThis);
