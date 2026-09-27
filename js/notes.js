/* Petit Piano — notes : noms, couleurs, analyse des suites « C4-1:2 ».
 * Noms anglais (C, C#, D…) uniquement en interne ; l'affichage passe toujours par PP.NOTES[pc].fr.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  // index = classe de hauteur (0 = Do)
  PP.NOTES = [
    { pc: 0,  en: 'C',  fr: 'Do',   color: '#D32F2F', text: '#FFFFFF' },
    { pc: 1,  en: 'C#', fr: 'Do♯',  color: '#9E2323', text: '#FFFFFF', black: true },
    { pc: 2,  en: 'D',  fr: 'Ré',   color: '#FB8C00', text: '#1F1A3D' },
    { pc: 3,  en: 'D#', fr: 'Ré♯',  color: '#BC6900', text: '#FFFFFF', black: true },
    { pc: 4,  en: 'E',  fr: 'Mi',   color: '#FDD835', text: '#1F1A3D' },
    { pc: 5,  en: 'F',  fr: 'Fa',   color: '#2E7D32', text: '#FFFFFF' },
    { pc: 6,  en: 'F#', fr: 'Fa♯',  color: '#225E26', text: '#FFFFFF', black: true },
    { pc: 7,  en: 'G',  fr: 'Sol',  color: '#0277BD', text: '#FFFFFF' },
    { pc: 8,  en: 'G#', fr: 'Sol♯', color: '#01598E', text: '#FFFFFF', black: true },
    { pc: 9,  en: 'A',  fr: 'La',   color: '#3949AB', text: '#FFFFFF' },
    { pc: 10, en: 'A#', fr: 'La♯',  color: '#2B3780', text: '#FFFFFF', black: true },
    { pc: 11, en: 'B',  fr: 'Si',   color: '#8E24AA', text: '#FFFFFF' }
  ];

  var LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  /** "C#" → 1. Lève une erreur si le nom est inconnu (erreur de données). */
  PP.pcFromName = function (name) {
    var m = /^([A-G])(#?)$/.exec(name);
    if (!m) throw new Error('Nom de note inconnu : ' + name);
    return (LETTER_PC[m[1]] + (m[2] ? 1 : 0)) % 12;
  };

  /** "C4" → 60 (Do4 = Do du milieu). */
  PP.midiFromName = function (name) {
    var m = /^([A-G])(#?)(-?\d)$/.exec(name);
    if (!m) throw new Error('Note inconnue : ' + name);
    return (parseInt(m[3], 10) + 1) * 12 + LETTER_PC[m[1]] + (m[2] ? 1 : 0);
  };

  PP.isBlack = function (midi) { return !!PP.NOTES[((midi % 12) + 12) % 12].black; };
  PP.noteOf = function (midiOrPc) { return PP.NOTES[((midiOrPc % 12) + 12) % 12]; };

  /**
   * Analyse une suite compacte « NOTE-doigt:durée » séparée par des espaces.
   * "C4-1 E4-3:2 G3-g1" → [{midi:60,pc:0,finger:1,hand:"R",beats:1}, …]
   * Doigt et durée sont optionnels (finger null, beats 1).
   */
  PP.parseSeq = function (str) {
    if (!str) return [];
    return str.trim().split(/\s+/).map(function (tok) {
      var m = /^([A-G]#?-?\d)(?:-(g?)(\d))?(?::(\d+(?:\.\d+)?))?$/.exec(tok);
      if (!m) throw new Error('Élément de suite invalide : ' + tok);
      var midi = PP.midiFromName(m[1]);
      return {
        midi: midi,
        pc: midi % 12,
        finger: m[3] ? parseInt(m[3], 10) : null,
        hand: m[2] ? 'L' : 'R',
        beats: m[4] ? parseFloat(m[4]) : 1
      };
    });
  };

  /** Fréquence (Hz) d'une note MIDI en tempérament égal, La4 = 440 Hz. */
  PP.midiToFreq = function (midi) { return 440 * Math.pow(2, (midi - 69) / 12); };

  if (typeof module !== 'undefined' && module.exports) module.exports = PP;
})(typeof window !== 'undefined' ? window : globalThis);
