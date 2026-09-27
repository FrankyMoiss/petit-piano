/* Tests de la détection de hauteur (YIN) sur des sons synthétiques « type piano ».
 * Lancer : node tests/pitch.test.js
 */
'use strict';
var pitch = require('../js/pitch.js');

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('ÉCHEC : ' + msg); }
}

// Générateur pseudo-aléatoire déterministe (tests reproductibles)
var seed = 12345;
function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function noise() { return rand() * 2 - 1; }

var FR = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
function midiName(m) { return FR[m % 12] + (Math.floor(m / 12) - 1); }
function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

/**
 * Son de piano simplifié : 10 partiels légèrement inharmoniques (f_n = n·f0·√(1+B·n²)),
 * amplitudes décroissantes, harmoniques aiguës qui s'éteignent plus vite, bruit de fond.
 * offsetMs : début de la fenêtre analysée après l'attaque.
 */
function pianoFrame(freq, sampleRate, offsetMs, size, opts) {
  opts = opts || {};
  var B = 0.0004;
  var buf = new Float32Array(size);
  var t0 = offsetMs / 1000;
  var partials = [];
  for (var n = 1; n <= 10; n++) {
    var fn = n * freq * Math.sqrt(1 + B * n * n);
    if (fn > sampleRate / 2.2) break;
    partials.push({
      f: fn,
      a: (opts.weakFundamental && n === 1 ? 0.25 : 1) / Math.pow(n, 1.1),
      decay: 1.5 + n * 0.8,
      phase: rand() * Math.PI * 2
    });
  }
  for (var i = 0; i < size; i++) {
    var t = t0 + i / sampleRate;
    var s = 0;
    for (var p = 0; p < partials.length; p++) {
      var P = partials[p];
      s += P.a * Math.exp(-P.decay * t) * Math.sin(2 * Math.PI * P.f * t + P.phase);
    }
    buf[i] = 0.3 * s + (opts.noise || 0.01) * noise();
  }
  return buf;
}

var SIZE = 2048;                 // = fftSize de l'AnalyserNode
var G3 = 55, C6 = 84;

[44100, 48000].forEach(function (sr) {
  var ok = 0, total = 0;
  for (var m = G3; m <= C6; m++) {
    [40, 150, 400].forEach(function (offset) {
      total++;
      var r = pitch.detectPitch(pianoFrame(midiToFreq(m), sr, offset, SIZE), sr);
      var got = r.freq ? pitch.freqToNote(r.freq, 0) : null;
      var good = got && got.pc === m % 12 && r.clarity >= pitch.CFG.minClarity;
      if (good) ok++;
      check(good, sr + ' Hz, ' + midiName(m) + ' à ' + offset + ' ms : obtenu ' +
        (got ? midiName(got.midi) + ' (' + r.freq.toFixed(1) + ' Hz, clarté ' + r.clarity.toFixed(2) + ')' : 'rien'));
    });
  }
  console.log(sr + ' Hz : ' + ok + '/' + total + ' notes Sol3–Do6 reconnues (classe de hauteur)');
});

// Fondamentale faible (cas des graves d'un piano droit) : la classe de hauteur doit rester juste
[55, 57, 60].forEach(function (m) {
  var r = pitch.detectPitch(pianoFrame(midiToFreq(m), 48000, 80, SIZE, { weakFundamental: true }), 48000);
  check(r.freq && pitch.freqToNote(r.freq, 0).pc === m % 12, 'fondamentale faible ' + midiName(m));
});

// Piano désaccordé de −45 cents : sans correction on risque le demi-ton voisin, avec correction c'est juste
(function () {
  var cents = [];
  [60, 62, 64, 65, 67].forEach(function (m) {
    var f = midiToFreq(m) * Math.pow(2, -45 / 1200);
    var r = pitch.detectPitch(pianoFrame(f, 44100, 100, SIZE), 44100);
    cents.push(pitch.rawCents(r.freq));
  });
  var tuning = pitch.estimateTuning(cents);
  // L'inharmonicité des cordes « étire » un peu la hauteur perçue (quelques cents vers
  // l'aigu), comme sur un vrai piano : on tolère ±10 cents autour de −45.
  check(tuning !== null && Math.abs(tuning + 45) <= 10, 'accordage estimé ≈ −45 (obtenu ' + tuning + ')');
  var f = midiToFreq(62) * Math.pow(2, -55 / 1200);   // Ré joué 55 cents trop bas
  check(pitch.freqToNote(f, 0).pc === 1, 'sans correction, un Ré à −55 cents est lu Do♯ (attendu)');
  check(pitch.freqToNote(f, tuning).pc === 2, 'avec correction, le Ré à −55 cents est lu Ré');
  check(pitch.estimateTuning([+45, +47, +43]) === -55, '+45 cents relu comme −55 (piano trop bas)');
  var t1 = pitch.estimateTuning([28, 31, 33]);
  check(t1 >= 25 && t1 <= 35, 'piano à +30 c (La 442/444) : estimé dans [25 ; 35] (obtenu ' + t1 + ')');
  var t2 = pitch.estimateTuning([25, 29, 32, 35]);
  check(t2 >= 25 && t2 <= 35, 'piano vers +30 c, étirement des aigus : dans [25 ; 35] (obtenu ' + t2 + ')');
  var t3 = pitch.estimateTuning([-48, 49, -47]);
  check(t3 >= -50 && t3 <= -45, 'écarts de part et d\'autre du repli ±50 : ≈ −49 (obtenu ' + t3 + ')');
  check(pitch.estimateTuning([0, 30, -30, 15]) === 0, 'notes incohérentes entre elles → 0, on ne devine pas');
  // Au clair de la lune sur un piano à +28 c, corrigé avec l'estimation : notes justes
  var auClair = [60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60];
  var tuned = auClair.map(function (m) { return pitch.freqToNote(midiToFreq(m) * Math.pow(2, 28 / 1200), t1).pc; });
  check(tuned.join(',') === auClair.map(function (m) { return m % 12; }).join(','), 'piano à +28 c corrigé : Au clair de la lune lu juste');
  check(pitch.estimateTuning([5, 10]) === null, 'moins de 3 notes → pas d\'estimation');
})();

// Silence et bruit : pas de note
(function () {
  var silence = new Float32Array(SIZE);
  var r = pitch.detectPitch(silence, 48000);
  check(r.freq === null, 'silence numérique → aucune hauteur');

  var hiss = new Float32Array(SIZE);
  for (var i = 0; i < SIZE; i++) hiss[i] = 0.0005 * noise();
  r = pitch.detectPitch(hiss, 48000);
  check(r.freq === null || r.clarity < pitch.CFG.minClarity, 'souffle faible → pas de note claire (clarté ' + r.clarity.toFixed(2) + ')');
  check(pitch.rms(hiss) < pitch.CFG.minGate, 'souffle faible sous la porte RMS minimale');

  var bad = 0;
  for (var k = 0; k < 20; k++) {
    var loud = new Float32Array(SIZE);
    for (var j = 0; j < SIZE; j++) loud[j] = 0.2 * noise();
    var rr = pitch.detectPitch(loud, 44100);
    if (rr.freq !== null && rr.clarity >= pitch.CFG.minClarity) bad++;
  }
  check(bad === 0, 'bruit blanc fort → jamais « voisé » (' + bad + '/20 faux positifs)');
})();

console.log('\n' + passes + ' vérifications réussies, ' + failures + ' échec(s).');
if (failures > 0) process.exit(1);
