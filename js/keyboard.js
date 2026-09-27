/* Petit Piano — clavier SVG à l'écran : touches cibles colorées + numéros de doigts, tactile.
 * Le SVG est dessiné à la taille réelle du conteneur (en pixels) pour garder des pastilles
 * rondes et un texte net ; on redessine au redimensionnement.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};
  var NS = 'http://www.w3.org/2000/svg';
  var MIN_WHITE = 40;          // px : largeur minimale d'une touche blanche (cible tactile)

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function whiteCount(from, to) {
    var n = 0;
    for (var m = from; m <= to; m++) if (!PP.isBlack(m)) n++;
    return n;
  }

  /**
   * Choisit la plage affichée (DESIGN §3.4) : plage de la leçon si les blanches font ≥ 40 px,
   * sinon la plage « phone » de la leçon, sinon Do4–Do5 (ou la plus petite plage contenant
   * toutes les notes de la leçon).
   */
  PP.keyboardRange = function (spec, lessonMidis, width) {
    var main = { from: PP.midiFromName(spec.from), to: PP.midiFromName(spec.to) };
    if (whiteCount(main.from, main.to) * MIN_WHITE <= width) return main;
    if (spec.phone) return { from: PP.midiFromName(spec.phone.from), to: PP.midiFromName(spec.phone.to) };
    var inMain = lessonMidis.filter(function (m) { return m >= main.from && m <= main.to; });
    var lo = Math.min.apply(null, inMain.concat([60])), hi = Math.max.apply(null, inMain.concat([72]));
    while (PP.isBlack(lo)) lo--;
    while (PP.isBlack(hi)) hi++;
    return { from: lo, to: hi };
  };

  PP.createKeyboard = function (container, opts) {
    opts = opts || {};
    var svg = el('svg', { class: 'kb-svg', role: 'group', 'aria-label': 'Clavier' });
    container.appendChild(svg);
    var range = { from: 60, to: 72 };
    var marks = { keys: [], groups: '', pulse: [] };
    var keyEls = {};            // midi → <g>
    var geom = {};              // midi → { x, w, h, black }

    function layout() {
      var W = container.clientWidth, H = container.clientHeight;
      if (!W || !H) return;
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      keyEls = {}; geom = {};

      var nWhite = whiteCount(range.from, range.to);
      var ww = W / nWhite, bw = ww * 0.6, bh = H * 0.62;
      var gWhite = el('g', {}, svg), gBlack = el('g', {}, svg), gOver = el('g', { class: 'kb-over' }, svg);

      var x = 0;
      for (var m = range.from; m <= range.to; m++) {
        if (PP.isBlack(m)) {
          geom[m] = { x: x - bw / 2, w: bw, h: bh, black: true };
        } else {
          geom[m] = { x: x, w: ww, h: H, black: false };
          x += ww;
        }
      }

      Object.keys(geom).forEach(function (k) {
        var m = +k, g = geom[m], n = PP.noteOf(m);
        var grp = el('g', { class: 'key ' + (g.black ? 'black' : 'white'), 'data-midi': m }, g.black ? gBlack : gWhite);
        el('rect', { class: 'body', x: g.x + (g.black ? 0 : 1), y: 0, width: g.w - (g.black ? 0 : 2), height: g.h,
          rx: g.black ? 4 : 6 }, grp);
        if (!g.black) {
          var label = el('text', { class: 'name', x: g.x + g.w / 2, y: H - 12, 'text-anchor': 'middle' }, grp);
          label.textContent = n.fr;
        }
        keyEls[m] = grp;
      });

      drawGroups(gOver, bh);
      applyMarks();
    }

    /** Contours neutres autour des groupes de 2 / 3 touches noires entièrement visibles. */
    function drawGroups(parent, bh) {
      if (!marks.groups) return;
      var want = marks.groups.split(',');
      // premier dièse de chaque groupe : Do♯ (groupe de 2), Fa♯ (groupe de 3)
      for (var m = range.from; m <= range.to; m++) {
        var pc = m % 12, size = pc === 1 ? 2 : pc === 6 ? 3 : 0;
        if (!size || want.indexOf(String(size)) < 0) continue;
        var last = size === 2 ? m + 2 : m + 4;
        if (!geom[m] || !geom[last]) continue;
        var x0 = geom[m].x - 5, x1 = geom[last].x + geom[last].w + 5;
        el('rect', { class: 'group group' + size, x: x0, y: 3, width: x1 - x0, height: bh + 4, rx: 10 }, parent);
      }
    }

    function applyMarks() {
      Object.keys(keyEls).forEach(function (k) {
        var grp = keyEls[k];
        grp.classList.remove('target', 'pulse');
        grp.style.removeProperty('--note');
        grp.style.removeProperty('--note-text');
        var old = grp.querySelector('.badge');
        if (old) grp.removeChild(old);
      });
      marks.keys.forEach(function (key) {
        var grp = keyEls[key.midi], g = geom[key.midi];
        if (!grp) return;                        // hors de la plage affichée : ignoré
        var n = PP.noteOf(key.midi);
        grp.classList.add('target');
        grp.style.setProperty('--note', n.color);
        grp.style.setProperty('--note-text', n.text);
        if (key.finger) {
          var r = Math.min(14, g.w / 2 - 3);
          var cy = g.black ? g.h - r - 8 : container.clientHeight - 34 - r;
          var b = el('g', { class: 'badge' }, grp);
          el('circle', { cx: g.x + g.w / 2, cy: cy, r: r }, b);
          var tx = el('text', { x: g.x + g.w / 2, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
            'font-size': key.hand === 'L' ? r * 0.95 : r * 1.25 }, b);
          tx.textContent = (key.hand === 'L' ? 'g' : '') + key.finger;
          tx.style.fill = n.color === '#FDD835' ? '#1F1A3D' : n.color;   // jaune illisible sur blanc
        }
      });
      marks.pulse.forEach(function (m) { if (keyEls[m]) keyEls[m].classList.add('pulse'); });
    }

    function onPointerDown(e) {
      var k = e.target.closest && e.target.closest('[data-midi]');
      if (!k) return;
      e.preventDefault();
      var midi = +k.getAttribute('data-midi');
      k.classList.add('down');
      setTimeout(function () { k.classList.remove('down'); }, 160);
      if (opts.onPress) opts.onPress(midi);
    }
    svg.addEventListener('pointerdown', onPointerDown);

    var ro = root.ResizeObserver ? new ResizeObserver(layout) : null;
    if (ro) ro.observe(container); else root.addEventListener('resize', layout);

    return {
      setRange: function (from, to) { range = { from: from, to: to }; layout(); },
      range: function () { return range; },
      /** keys: [{midi, finger, hand}], groups: "2,3" */
      setMarks: function (m) {
        marks.keys = m.keys || [];
        var changedGroups = (m.groups || '') !== marks.groups;
        marks.groups = m.groups || '';
        marks.pulse = [];
        if (changedGroups) layout(); else applyMarks();
      },
      pulse: function (midis) { marks.pulse = midis || []; applyMarks(); },
      /** Allume brièvement une touche. kind : 'good' (couleur de la note), 'wrong' (gris-bleu + nom), 'demo'. */
      flash: function (midi, kind, ms) {
        var grp = keyEls[midi], g = geom[midi];
        if (!grp) return;
        var n = PP.noteOf(midi);
        grp.style.setProperty('--flash', kind === 'wrong' ? 'var(--gentle)' : n.color);
        grp.classList.add('flash');
        var lbl = null;
        if (kind === 'wrong' && g.black) {
          lbl = el('text', { class: 'flash-label', x: g.x + g.w / 2, y: g.h - 12, 'text-anchor': 'middle' }, grp);
          lbl.textContent = n.fr;
        }
        clearTimeout(grp._flashT);
        grp._flashT = setTimeout(function () {
          grp.classList.remove('flash');
          if (lbl && lbl.parentNode) lbl.parentNode.removeChild(lbl);
        }, ms || 300);
      },
      /** Midi visible le plus proche de `near` ayant la classe de hauteur pc (pour afficher une note entendue). */
      nearestVisible: function (pc, near) {
        var best = null;
        for (var m = range.from; m <= range.to; m++) {
          if (m % 12 === pc && (best === null || Math.abs(m - near) < Math.abs(best - near))) best = m;
        }
        return best;
      }
    };
  };
})(window);
