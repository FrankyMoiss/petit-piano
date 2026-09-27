/* Petit Piano — illustrations SVG inline, par identifiant (champ `illus` des étapes).
 * Dessins simples, sans texte de consigne (seulement des noms de notes / numéros de doigts).
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  var INK = '#1F1A3D', SOFT = '#5E5878', PRIMARY = '#6C4DF6', SKIN = '#F6C9A8', SKIN_D = '#E0A47E';
  var C = PP.NOTES;

  function svg(body) {
    return '<svg viewBox="0 0 240 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' + body + '</svg>';
  }

  /** Rangée de touches blanches (vue de dessus) ; colors[i] = couleur de remplissage ou null. */
  function keys(x, y, w, h, labels, colors) {
    var s = '';
    labels.forEach(function (lab, i) {
      var fill = colors && colors[i] ? colors[i] : '#FFFFFF';
      var txt = colors && colors[i] ? (fill === C[4].color || fill === C[2].color ? INK : '#FFFFFF') : '#8A84A3';
      s += '<rect x="' + (x + i * w) + '" y="' + y + '" width="' + (w - 2) + '" height="' + h + '" rx="5" fill="' + fill + '" stroke="#D9D4E8" stroke-width="2"/>';
      s += '<text x="' + (x + i * w + w / 2 - 1) + '" y="' + (y + h - 10) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + txt + '">' + lab + '</text>';
    });
    return s;
  }

  function fingerDot(cx, cy, n, color) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="#fff" stroke="' + color + '" stroke-width="3"/>' +
      '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="14" font-weight="700" fill="' + INK + '">' + n + '</text>';
  }

  var ILLUS = {
    // Enfant assis bien droit, au milieu du piano, pieds au sol
    posture: svg(
      '<rect x="20" y="40" width="200" height="34" rx="6" fill="' + INK + '"/>' +
      '<rect x="28" y="58" width="184" height="14" rx="3" fill="#fff"/>' +
      '<g stroke="#D9D4E8" stroke-width="1">' + Array.apply(null, Array(15)).map(function (_, i) {
        return '<line x1="' + (28 + i * 12.3) + '" y1="58" x2="' + (28 + i * 12.3) + '" y2="72"/>';
      }).join('') + '</g>' +
      '<rect x="30" y="74" width="8" height="70" fill="' + INK + '"/><rect x="202" y="74" width="8" height="70" fill="' + INK + '"/>' +
      '<rect x="90" y="118" width="60" height="10" rx="4" fill="#A1887F"/>' +
      '<rect x="95" y="128" width="6" height="22" fill="#8D6E63"/><rect x="139" y="128" width="6" height="22" fill="#8D6E63"/>' +
      '<circle cx="120" cy="66" r="13" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      '<path d="M120 80 L120 116" stroke="' + PRIMARY + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M120 88 L104 98 L100 76 M120 88 L136 98 L140 76" stroke="' + SKIN_D + '" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M112 116 L112 128 L108 150 M128 116 L128 128 L132 150" stroke="#3949AB" stroke-width="7" fill="none" stroke-linecap="round"/>' +
      '<path d="M100 150 H114 M126 150 H140" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M156 80 V116" stroke="#2E9E5B" stroke-width="3" stroke-dasharray="4 4"/>' +
      '<text x="162" y="102" font-size="18">✓</text>' +
      '<line x1="10" y1="152" x2="230" y2="152" stroke="#D9D4E8" stroke-width="2"/>'
    ),

    // Main arrondie au-dessus d'une bulle de savon
    bubbleHand: svg(
      '<circle cx="120" cy="100" r="36" fill="#E3F2FD" stroke="#90CAF9" stroke-width="3"/>' +
      '<ellipse cx="106" cy="86" rx="9" ry="6" fill="#fff" opacity=".9"/>' +
      '<path d="M66 118 C 66 60, 100 38, 132 40 C 164 42, 180 66, 178 118" fill="none" stroke="' + SKIN_D + '" stroke-width="22" stroke-linecap="round"/>' +
      '<path d="M66 118 C 66 60, 100 38, 132 40 C 164 42, 180 66, 178 118" fill="none" stroke="' + SKIN + '" stroke-width="16" stroke-linecap="round"/>' +
      [80, 104, 128, 152, 174].map(function (x, i) {
        return '<circle cx="' + x + '" cy="' + (i === 0 ? 124 : 132) + '" r="8" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>';
      }).join('') +
      '<line x1="40" y1="142" x2="200" y2="142" stroke="#D9D4E8" stroke-width="3"/>'
    ),

    // Main droite vue de dessus, numéros 1 (pouce) à 5 (petit doigt)
    fingerNumbers: svg(
      '<rect x="78" y="86" width="92" height="64" rx="26" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      '<rect x="46" y="84" width="24" height="52" rx="12" transform="rotate(-38 58 110)" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      [[86, 34, 58], [108, 22, 70], [130, 28, 64], [152, 44, 50]].map(function (f) {
        return '<rect x="' + f[0] + '" y="' + f[1] + '" width="20" height="' + f[2] + '" rx="10" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>';
      }).join('') +
      fingerDot(46, 84, 1, C[0].color) + fingerDot(96, 26, 2, C[2].color) + fingerDot(118, 14, 3, C[4].color) +
      fingerDot(140, 20, 4, C[5].color) + fingerDot(162, 36, 5, C[7].color)
    ),

    // Doigt qui se relève entre deux frappes de la même touche
    repeatNote: svg(
      keys(60, 100, 40, 54, ['Do', 'Ré', 'Mi'], [C[0].color, null, null]) +
      '<rect x="70" y="30" width="20" height="56" rx="10" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      '<path d="M112 70 V36 M104 44 L112 34 L120 44" stroke="' + PRIMARY + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M132 36 V70 M124 62 L132 72 L140 62" stroke="' + PRIMARY + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="156" y="44" font-size="15" font-weight="700" fill="' + SOFT + '">Do</text>' +
      '<text x="156" y="64" font-size="15" font-weight="700" fill="' + SOFT + '">Do</text>' +
      '<text x="156" y="84" font-size="15" font-weight="700" fill="' + SOFT + '">Do</text>'
    ),

    // Position de Do : un doigt par touche, Do → Sol
    cPosition: svg(
      keys(20, 60, 40, 90, ['Do', 'Ré', 'Mi', 'Fa', 'Sol'], [C[0].color, C[2].color, C[4].color, C[5].color, C[7].color]) +
      [0, 1, 2, 3, 4].map(function (i) {
        return fingerDot(39 + i * 40, 36, i + 1, [C[0], C[2], C[4], C[5], C[7]][i].color);
      }).join('')
    ),

    // Passage du pouce : Do Ré Mi (1 2 3) puis le pouce passe dessous pour Fa
    thumbUnder: svg(
      keys(30, 70, 45, 80, ['Do', 'Ré', 'Mi', 'Fa'], [C[0].color, C[2].color, C[4].color, C[5].color]) +
      fingerDot(51, 44, 1, C[0].color) + fingerDot(96, 44, 2, C[2].color) + fingerDot(141, 44, 3, C[4].color) +
      '<path d="M56 60 C 80 132, 150 132, 180 76" fill="none" stroke="' + PRIMARY + '" stroke-width="4" stroke-dasharray="6 5"/>' +
      '<path d="M172 80 L181 72 L186 84" fill="none" stroke="' + PRIMARY + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      fingerDot(186, 44, 1, C[5].color)
    ),

    // Pouce gauche sur le Sol grave, pouce droit sur le Do du milieu
    leftThumb: svg(
      keys(20, 80, 40, 70, ['Sol', 'La', 'Si', 'Do', 'Ré'], [C[7].color, null, null, C[0].color, null]) +
      '<rect x="4" y="26" width="52" height="40" rx="16" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      '<rect x="144" y="26" width="52" height="40" rx="16" fill="' + SKIN + '" stroke="' + SKIN_D + '" stroke-width="2"/>' +
      '<path d="M40 54 L40 76" stroke="' + SKIN_D + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M40 54 L40 76" stroke="' + SKIN + '" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M160 54 L160 76" stroke="' + SKIN_D + '" stroke-width="12" stroke-linecap="round"/>' +
      '<path d="M160 54 L160 76" stroke="' + SKIN + '" stroke-width="8" stroke-linecap="round"/>' +
      '<text x="30" y="20" text-anchor="middle" font-size="14" font-weight="700" fill="' + C[7].color + '">g1</text>' +
      '<text x="170" y="20" text-anchor="middle" font-size="14" font-weight="700" fill="' + C[0].color + '">1</text>'
    )
  };

  /** Renvoie le SVG (chaîne) d'une illustration, ou '' si l'identifiant est inconnu. */
  PP.illus = function (id) { return ILLUS[id] || ''; };
})(window);
