/* Petit Piano — AudioContext partagé et son de piano synthétique (WebAudio).
 * Chaque son programmé repousse PP.synth.busyUntil : js/mic.js suspend la
 * détection jusqu'à cette heure + 300 ms (on ne veut pas « s'entendre » soi-même).
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  var ctx = null, master = null;
  var active = [];          // voix en cours, pour pouvoir tout couper
  var timers = [];          // minuteries visuelles de « Écoute d'abord »
  var RELEASE = 0.25;       // s : durée audible après le relâchement
  var stateListeners = [];  // changements d'état de l'AudioContext (interruption iPad…)

  PP.audio = {
    /** Crée / reprend l'AudioContext. À appeler depuis un geste (obligatoire sur iPad). */
    ensure: function () {
      if (!ctx) {
        var AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        // Gain maître élevé + compresseur léger : sur iOS, la sortie baisse quand le micro est ouvert.
        var comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4;
        comp.attack.value = 0.003; comp.release.value = 0.2;
        master = ctx.createGain();
        master.gain.value = 1.6;
        master.connect(comp); comp.connect(ctx.destination);
        // iPad : Siri, un appel, une alarme… passent le contexte en « interrupted » ou
        // « suspended » sans visibilitychange : l'appli doit le savoir.
        ctx.onstatechange = function () {
          stateListeners.forEach(function (fn) { fn(ctx.state); });
        };
      }
      if (ctx.state !== 'running') ctx.resume().catch(function () {});
      return ctx;
    },
    ctx: function () { return ctx; },
    running: function () { return !!ctx && ctx.state === 'running'; },
    /** fn(state) à chaque changement d'état du contexte ('running', 'suspended', 'interrupted'…). */
    onStateChange: function (fn) { stateListeners.push(fn); }
  };

  function now() { return ctx ? ctx.currentTime : 0; }

  /**
   * Joue une note : partiels sinusoïdaux qui s'éteignent d'autant plus vite qu'ils sont aigus
   * (timbre « piano » simple). Renvoie l'heure de fin (s, horloge du contexte).
   */
  function playNote(midi, when, dur, velocity) {
    if (!PP.audio.ensure()) return 0;
    when = Math.max(when || now(), now());
    dur = dur || 0.6;
    var f0 = PP.midiToFreq(midi);
    var vel = velocity || 0.3;
    var decay = Math.max(0.35, 1.6 - (midi - 48) * 0.025);   // les aigus s'éteignent plus vite

    var out = ctx.createGain();
    out.gain.setValueAtTime(0, when);
    out.gain.linearRampToValueAtTime(vel, when + 0.004);
    out.gain.setTargetAtTime(vel * 0.25, when + 0.004, decay);
    out.gain.setTargetAtTime(0, when + dur, RELEASE / 4);
    out.connect(master);

    var amps = [1, 0.5, 0.3, 0.18, 0.1, 0.06];
    var oscs = [];
    for (var n = 1; n <= amps.length && n * f0 < 8000; n++) {
      var o = ctx.createOscillator();
      o.frequency.value = n * f0 * Math.sqrt(1 + 0.0003 * n * n);   // légère inharmonicité
      var g = ctx.createGain();
      g.gain.setValueAtTime(amps[n - 1], when);
      g.gain.setTargetAtTime(0, when, decay / (1 + 0.7 * (n - 1)));
      o.connect(g); g.connect(out);
      o.start(when);
      o.stop(when + dur + RELEASE + 0.1);
      oscs.push(o);
    }
    var end = when + dur + RELEASE;
    var voice = { out: out, oscs: oscs, end: end };
    active.push(voice);
    oscs[0].onended = function () { var i = active.indexOf(voice); if (i >= 0) active.splice(i, 1); };
    PP.synth.busyUntil = Math.max(PP.synth.busyUntil, end);
    return end;
  }

  PP.synth = {
    /** Heure (horloge du contexte) de fin du dernier son programmé. */
    busyUntil: 0,

    play: function (midi, dur) { return playNote(midi, now(), dur || 0.7); },

    /**
     * « Écoute d'abord » : joue une suite {midi, beats} au tempo donné.
     * onNote(i) est appelé au moment où la note i sonne (pour l'allumer à l'écran),
     * onEnd() à la fin. Renvoie { stop }.
     */
    playSeq: function (notes, tempo, onNote, onEnd) {
      if (!PP.audio.ensure()) { if (onEnd) onEnd(); return { stop: function () {} }; }
      var beat = 60 / (tempo || 96);
      var t = now() + 0.15;
      var start = t;
      notes.forEach(function (n, i) {
        var d = n.beats * beat;
        playNote(n.midi, t, d * 0.92);
        var delay = (t - start + 0.15) * 1000;
        timers.push(setTimeout(function () { if (onNote) onNote(i); }, delay));
        t += d;
      });
      var stopped = false;
      timers.push(setTimeout(function () { if (!stopped && onEnd) onEnd(); }, (t - start + 0.15) * 1000 + 150));
      return {
        stop: function () {
          if (stopped) return;
          stopped = true;
          PP.synth.stopAll();
          if (onEnd) onEnd();
        }
      };
    },

    /** Coupe tous les sons et les minuteries visuelles. */
    stopAll: function () {
      timers.forEach(clearTimeout);
      timers = [];
      if (!ctx) return;
      var t = now();
      active.slice().forEach(function (v) {
        v.out.gain.cancelScheduledValues(t);
        v.out.gain.setTargetAtTime(0, t, 0.02);
        v.oscs.forEach(function (o) { try { o.stop(t + 0.15); } catch (e) { /* déjà arrêté */ } });
      });
      active = [];
      PP.synth.busyUntil = Math.min(PP.synth.busyUntil, t + 0.15);
    },

    /** Petit « ding » de l'écran Bravo (i = 0, 1, 2 → de plus en plus aigu). */
    ding: function (i) {
      if (!PP.audio.ensure()) return;
      var base = [84, 88, 91][i % 3];
      playNote(base, now(), 0.15, 0.18);
      playNote(base + 12, now() + 0.02, 0.1, 0.08);
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
