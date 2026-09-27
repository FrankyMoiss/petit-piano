/* Petit Piano — micro : getUserMedia, boucle d'analyse ~60 Hz, suspension pendant les sons de l'appli.
 * Le calcul (YIN, attaques) est dans js/pitch.js ; ici on ne fait que brancher le micro.
 *
 * Événements (PP.mic.on(nom, fn)) :
 *   note  { pc, midi, freq }   une frappe détectée (une seule par attaque)
 *   frame { rms, level, gate, freq, clarity, note, armed, suppressed }   chaque trame (jauge, debug)
 *   ended                      la piste micro s'est arrêtée (autre appli, casque…)
 *   muted / unmuted            iOS coupe la piste (sans l'arrêter) pendant une interruption
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};
  var P = PP.pitch;

  var stream = null, source = null, analyser = null, buf = null;
  var detector = null;
  var running = false, listening = false;
  var wasSuppressed = false;
  var tuningCents = 0;
  var handlers = { note: [], frame: [], ended: [], muted: [], unmuted: [] };
  var calib = null;          // mesure du silence en cours
  var timer = null;
  // Boucle à cadence fixe (~60 analyses/s) plutôt que requestAnimationFrame : les seuils
  // du détecteur sont en trames (4 trames ≈ 65 ms), or rAF tourne à 120 Hz sur les
  // écrans ProMotion et tombe à 30 Hz en mode économie d'énergie sur iOS.
  var FRAME_MS = 1000 / 60;

  function emit(name, data) { handlers[name].forEach(function (fn) { fn(data); }); }

  /** Vrai pendant un son de l'appli (+300 ms après la fin de son enveloppe) ou la voix. */
  function suppressed() {
    var ctx = PP.audio.ctx();
    var synthBusy = ctx && ctx.currentTime < PP.synth.busyUntil + 0.3;
    return !!synthBusy || PP.voice.busy();
  }

  /** Niveau 0..1 pour la jauge (échelle en décibels, −60 dB → 0, −12 dB → 1). */
  function levelOf(rms) {
    if (rms <= 0) return 0;
    var db = 20 * Math.log(rms) / Math.LN10;
    return Math.max(0, Math.min(1, (db + 60) / 48));
  }

  function tick() {
    if (!running) return;
    var t = performance.now();
    var ctx = PP.audio.ctx();
    if (!ctx || ctx.state !== 'running') {
      // contexte suspendu/interrompu : l'analyseur ne renvoie que des zéros et
      // currentTime est figé. On signale la pause ; à la reprise, on repart désarmé.
      wasSuppressed = true;
      emit('frame', {
        rms: 0, level: 0, gate: detector.gate(), freq: null, clarity: 0, note: null,
        armed: false, suppressed: true, paused: true, noiseFloor: detector.state.noiseFloor
      });
      return;
    }
    analyser.getFloatTimeDomainData(buf);
    var rms = P.rms(buf);

    if (calib) calib.values.push(rms);

    var sup = suppressed();
    if (sup) wasSuppressed = true;
    else if (wasSuppressed) {
      // reprise après un son de l'appli : on repart désarmé (un son qui résonne ne doit pas compter)
      wasSuppressed = false;
      detector.disarm(t);
    }

    var gate = detector.gate();
    var r = null, note = null;
    // YIN seulement au-dessus de la porte (économise la batterie des tablettes)
    if (!sup && rms >= gate) {
      r = P.detectPitch(buf, PP.audio.ctx().sampleRate);
      if (r.freq && r.clarity >= P.CFG.minClarity) note = P.freqToNote(r.freq, tuningCents);
    }

    var ev = null;
    if (!sup && listening) {
      // niveau d'attaque sur les 1024 derniers échantillons : une répétition rapide et plus
      // douce se voit mieux que sur toute la fenêtre de 2048 (~45 ms)
      var attackRms = P.rms(buf.subarray(buf.length - 1024));
      ev = detector.feed({ t: t, rms: rms, attackRms: attackRms, pc: note ? note.pc : null, midi: note ? note.midi : null, freq: r ? r.freq : null });
    }

    emit('frame', {
      rms: rms, level: levelOf(rms), gate: gate,
      freq: r ? r.freq : null, clarity: r ? r.clarity : 0, note: note,
      armed: detector.state.armed, suppressed: sup, paused: false, noiseFloor: detector.state.noiseFloor
    });
    if (ev) emit('note', ev);
  }

  PP.mic = {
    on: function (name, fn) { handlers[name].push(fn); },
    off: function (name, fn) { var i = handlers[name].indexOf(fn); if (i >= 0) handlers[name].splice(i, 1); },

    isRunning: function () { return running; },

    /**
     * Demande le micro. Renvoie une promesse résolue quand l'analyse tourne,
     * rejetée avec { kind: 'insecure' | 'denied' | 'notfound' | 'other' }.
     */
    start: function (noiseFloor) {
      if (running) return Promise.resolve();
      var ctx = PP.audio.ensure();
      if (!root.navigator.mediaDevices || !root.navigator.mediaDevices.getUserMedia || !ctx) {
        return Promise.reject({ kind: 'insecure' });
      }
      return root.navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      }).then(function (s) {
        stream = s;
        source = ctx.createMediaStreamSource(s);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);           // pas vers les haut-parleurs
        buf = new Float32Array(analyser.fftSize);
        detector = P.createOnsetDetector({ noiseFloor: noiseFloor || 0.004 });
        s.getAudioTracks().forEach(function (tr) {
          tr.onended = function () { PP.mic.stop(); emit('ended'); };
          tr.onmute = function () { emit('muted'); };
          tr.onunmute = function () { if (detector) detector.disarm(performance.now()); emit('unmuted'); };
        });
        running = true;
        timer = setInterval(tick, FRAME_MS);
      }, function (err) {
        var name = err && err.name;
        var kind = name === 'NotAllowedError' || name === 'SecurityError' ? 'denied'
          : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'notfound' : 'other';
        return Promise.reject({ kind: kind });
      });
    },

    stop: function () {
      running = false;
      clearInterval(timer);
      listening = false;
      if (stream) stream.getTracks().forEach(function (tr) { tr.onended = tr.onmute = tr.onunmute = null; tr.stop(); });
      if (source) source.disconnect();
      stream = source = analyser = null;
    },

    /** Active/désactive la production d'événements « note » (la jauge continue). */
    listen: function (on) {
      if (on && !listening && detector) detector.disarm(performance.now());
      listening = !!on;
    },

    /** Notes attendues (classes de hauteur) : acceptées plus vite que les fausses notes. */
    setTargets: function (pcs) { if (detector) detector.setTargets(pcs); },
    setTuning: function (cents) { tuningCents = cents || 0; },

    /** Désarme le détecteur (il faudra un silence ou une nouvelle attaque). */
    disarm: function () { if (detector) detector.disarm(performance.now()); },

    /** Mesure le bruit de fond pendant `ms` millisecondes ; résout avec la médiane du RMS. */
    measureSilence: function (ms) {
      return new Promise(function (resolve) {
        calib = { values: [] };
        setTimeout(function () {
          var v = calib.values.sort(function (a, b) { return a - b; });
          calib = null;
          var med = v.length ? v[v.length >> 1] : 0.004;
          var floor = Math.max(0.0005, med);
          if (detector) detector.setNoiseFloor(floor);
          resolve(floor);
        }, ms);
      });
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
