/* Tests de la machine à états des attaques (une frappe = un événement).
 * Lancer : node tests/onset.test.js
 * On simule directement des trames { t, rms, pc } à ~60 par seconde.
 */
'use strict';
var pitch = require('../js/pitch.js');

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('ÉCHEC : ' + msg); }
}

var FRAME_MS = 1000 / 60;
var DO = 0, RE = 2, MI = 4;

/** Petit simulateur : accumule des trames et collecte les événements. */
function sim(targets) {
  var det = pitch.createOnsetDetector({ noiseFloor: 0.002 });   // porte = 0,006
  det.setTargets(targets || null);
  var t = 0, events = [];
  var api = {
    det: det,
    events: events,
    frame: function (rms, pc) {
      var ev = det.feed({ t: t, rms: rms, pc: pc, midi: pc === null ? null : 60 + pc, freq: 0 });
      if (ev) events.push(ev.pc);
      t += FRAME_MS;
      return api;
    },
    /** Note de piano : montée rapide puis décroissance exponentielle. */
    note: function (pc, frames, peak, decayPerFrame) {
      for (var i = 0; i < frames; i++) api.frame(peak * Math.pow(decayPerFrame || 0.97, i), pc);
      return api;
    },
    silence: function (frames) { for (var i = 0; i < frames; i++) api.frame(0.001, null); return api; },
    /** Trames bruyantes sans hauteur claire (bruit de marteau, voix…). */
    unvoiced: function (frames, rms) { for (var i = 0; i < frames; i++) api.frame(rms, null); return api; }
  };
  return api;
}

// 1. « Do Do Do » avec le doigt relevé entre chaque (court silence) → 3 événements
(function () {
  var s = sim([DO]).silence(10).note(DO, 25, 0.2).silence(4).note(DO, 25, 0.2).silence(4).note(DO, 25, 0.2).silence(10);
  check(s.events.length === 3, 'Do Do Do séparés par de courts silences → 3 (obtenu ' + s.events.length + ')');
})();

// 2. « Do Do Do » sans vrai silence : chaque nouvelle frappe fait remonter le niveau
(function () {
  var s = sim([DO]).silence(5).note(DO, 20, 0.2, 0.95).note(DO, 20, 0.2, 0.95).note(DO, 30, 0.2, 0.95);
  check(s.events.length === 3, 'Do Do Do liés (sans silence, remontée du RMS) → 3 (obtenu ' + s.events.length + ')');
})();

// 3. Une note tenue longtemps (3 s) qui décroît, avec un niveau qui fluctue → 1 seul événement
(function () {
  var s = sim([DO]).silence(5);
  for (var i = 0; i < 180; i++) {
    var wobble = 1 + 0.15 * Math.sin(i * 0.9);          // battements des cordes
    s.frame(0.25 * Math.pow(0.985, i) * wobble, DO);
  }
  s.silence(10);
  check(s.events.length === 1, 'note tenue 3 s → 1 (obtenu ' + s.events.length + ')');
})();

// 4. Répétition trop rapide (< 150 ms) pendant la garde : pas de double comptage d'une même frappe
(function () {
  var s = sim([DO]).silence(5).note(DO, 5, 0.1, 1).note(DO, 4, 0.2, 1).note(DO, 20, 0.2);
  check(s.events.length === 1, 'sursaut de niveau pendant la garde de 150 ms → 1 (obtenu ' + s.events.length + ')');
})();

// 5. Legato Do → Ré sans remontée du niveau (le Do résonne encore) → 2 événements
(function () {
  var s = sim([DO]).silence(5).note(DO, 15, 0.2, 0.97);
  s.det.setTargets([RE]);                                // la cible passe au Ré
  for (var i = 0; i < 20; i++) s.frame(0.1 * Math.pow(0.97, i), RE);
  check(s.events.length === 2 && s.events[1] === RE, 'Do → Ré lié → 2 événements (obtenu ' + s.events.join(',') + ')');
})();

// 6. Fausse note tenue : comptée une seule fois
(function () {
  var s = sim([DO]).silence(5).note(MI, 60, 0.2).silence(5);
  check(s.events.length === 1 && s.events[0] === MI, 'Mi tenu au lieu de Do → 1 fausse note (obtenu ' + s.events.join(',') + ')');
})();

// 7. Attaque bruitée : 5 trames d'une autre hauteur puis la bonne → seule la bonne compte
(function () {
  var s = sim([RE]).silence(5).note(MI, 5, 0.25, 1).note(RE, 20, 0.22);
  check(s.events.length === 1 && s.events[0] === RE, 'attaque instable (Mi ×5 puis Ré) → seulement Ré (obtenu ' + s.events.join(',') + ')');
})();

// 8. Sans cible (test du micro) : 4 trames suffisent
(function () {
  var s = sim(null).silence(5).note(MI, 4, 0.2, 1);
  check(s.events.length === 1, 'sans cible, 4 trames stables → 1 (obtenu ' + s.events.length + ')');
})();

// 9. Reprise après un son de l'appli : la note qui résonne ne compte pas, la frappe suivante oui
(function () {
  var s = sim([DO]);
  s.det.disarm(0);
  s.note(DO, 30, 0.15, 0.98);                            // démo de l'appli qui résonne encore
  check(s.events.length === 0, 'résonance après suspension → 0 (obtenu ' + s.events.length + ')');
  s.silence(3).note(DO, 20, 0.2);
  check(s.events.length === 1, 'frappe de l\'enfant après la reprise → 1 (obtenu ' + s.events.length + ')');
})();

// 10. Bruit sans hauteur (voix, choc) : aucun événement
(function () {
  var s = sim([DO]).unvoiced(60, 0.05);
  check(s.events.length === 0, 'bruit fort sans hauteur → 0 (obtenu ' + s.events.length + ')');
})();

// 11. Le bruit de fond suit le calme de la pièce (porte adaptative)
(function () {
  var det = pitch.createOnsetDetector({ noiseFloor: 0.004 });   // porte de départ 0,012
  for (var i = 0; i < 300; i++) det.feed({ t: i * FRAME_MS, rms: 0.0008, pc: null });
  check(Math.abs(det.gate() - 0.0024) < 0.0002, 'pièce plus calme que la calibration → porte ≈ 3 × 0,0008 (' + det.gate().toFixed(4) + ')');
  for (var j = 0; j < 300; j++) det.feed({ t: j * FRAME_MS, rms: 0.0001, pc: null });
  check(det.gate() === pitch.CFG.minGate, 'pièce silencieuse → porte minimale 0,002 (' + det.gate().toFixed(4) + ')');
})();

/** Chaîne complète sur un vrai signal : piano synthétique → YIN → machine à états,
 *  analysé comme dans le navigateur (fenêtre 2048, ~60 analyses/s, 48 kHz, niveau
 *  d'attaque sur les 1024 derniers échantillons comme js/mic.js).
 *  notes : [[midi, début (s), vélocité]] ; lift : touche relâchée `lift` s avant la suivante.
 *  targets : cible (classe de hauteur) attendue pour chaque note, dans l'ordre. */
function runSignal(notes, lift, targets) {
  var sr = 48000, hop = Math.round(sr / 60), N = 2048;
  var total = Math.round((notes[notes.length - 1][1] + 1.2) * sr), sig = new Float32Array(total);
  var seed = 7;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; }
  notes.forEach(function (nt, k) {
    var f0 = 440 * Math.pow(2, (nt[0] - 69) / 12), start = Math.round(nt[1] * sr), vel = nt[2] || 1;
    var end = k + 1 < notes.length ? Math.round(notes[k + 1][1] * sr) : total;
    var release = end - Math.round(lift * sr);
    for (var i = start; i < end; i++) {
      var tt = (i - start) / sr, env = Math.min(1, tt / 0.004) * Math.exp(-tt / 0.8);
      if (i > release) env *= Math.exp(-(i - release) / sr / 0.02);   // étouffoir
      var v = 0;
      for (var h = 1; h <= 6; h++) v += Math.exp(-tt * h * 0.8) / h * Math.sin(2 * Math.PI * f0 * h * Math.sqrt(1 + 0.0004 * h * h) * tt);
      sig[i] += 0.25 * vel * env * v;
    }
  });
  for (var i = 0; i < total; i++) sig[i] += 0.0008 * rnd();          // bruit de la pièce

  var det = pitch.createOnsetDetector({ noiseFloor: 0.0008 });
  det.setTargets([targets[0]]);
  var events = [];
  for (var pos = N; pos <= total; pos += hop) {
    var frame = sig.subarray(pos - N, pos);
    var rms = pitch.rms(frame), pc = null;
    if (rms >= det.gate()) {
      var r = pitch.detectPitch(frame, sr);
      if (r.freq && r.clarity >= pitch.CFG.minClarity) pc = pitch.freqToNote(r.freq, 0).pc;
    }
    var ev = det.feed({ t: pos / sr * 1000, rms: rms, attackRms: pitch.rms(frame.subarray(N - 1024)), pc: pc });
    if (ev) { events.push(ev.pc); if (events.length < targets.length) det.setTargets([targets[events.length]]); }
  }
  return events.join(',');
}

// 12. « Do Do Do Ré » (doigt relevé ~60 ms, la corde n'est pas totalement étouffée)
(function () {
  var got = runSignal([[60, 0.2], [60, 0.7], [60, 1.2], [62, 1.7]], 0.06, [DO, DO, DO, RE]);
  check(got === '0,0,0,2', 'signal « Do Do Do Ré » → Do,Do,Do,Ré (obtenu ' + got + ')');
})();

// 13. Ode à la joie à 96 à la noire : Ré répété vite, doigt relevé 30 ms seulement,
//     deuxième Ré plus doux (vélocité 0,6) → les deux Ré comptent. Avec le niveau
//     d'attaque calculé sur toute la fenêtre de 2048, le deuxième Ré était perdu.
(function () {
  var beat = 60 / 96;
  var got = runSignal([[64, 0.2], [62, 0.2 + beat], [62, 0.2 + 1.5 * beat, 0.6]], 0.03, [MI, RE, RE]);
  check(got === '4,2,2', '« Mi Ré:0,5 Ré:2 », Ré plus doux, relevé 30 ms → Mi,Ré,Ré (obtenu ' + got + ')');
  got = runSignal([[62, 0.2], [62, 0.2 + 0.5 * beat, 0.5], [60, 0.2 + 2.5 * beat]], 0.03, [RE, RE, DO]);
  check(got === '2,2,0', '« Ré:0,5 Ré:2 Do », Ré à vélocité 0,5, relevé 30 ms → Ré,Ré,Do (obtenu ' + got + ')');
})();

console.log('\n' + passes + ' vérifications réussies, ' + failures + ' échec(s).');
if (failures > 0) process.exit(1);
