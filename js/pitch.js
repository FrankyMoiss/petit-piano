/* Petit Piano — détection de hauteur (partie « pure », sans navigateur).
 *
 *  - detectPitch(buf, sampleRate) : algorithme YIN → { freq, clarity }
 *  - rms(buf)                     : niveau sonore d'une trame
 *  - freqToNote(freq, tuning)     : fréquence → note la plus proche (après correction d'accordage)
 *  - estimateTuning(centsList)    : écart d'accordage du piano (moyenne circulaire)
 *  - createOnsetDetector(opts)    : machine à états « une frappe = un événement »
 *
 * Aucun accès au micro ici : js/mic.js alimente ces fonctions trame par trame.
 * Utilisable depuis Node (tests) grâce à module.exports.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  /** Réglages de départ (DESIGN §5.3). À affiner sur le vrai piano avec ?debug=1. */
  var CFG = {
    minFreq: 60,
    maxFreq: 2000,
    yinThreshold: 0.15,
    minClarity: 0.8,        // trame « voisée » seulement si clarté ≥ 0,8
    minGate: 0.002,         // porte RMS minimale
    gateFactor: 3,          // porte = max(minGate, 3 × bruit de fond)
    noiseAlpha: 0.02,       // vitesse de suivi du bruit de fond
    framesTarget: 4,        // trames stables pour accepter la note attendue
    framesWrong: 8,         // trames stables pour déclarer une fausse note
    framesLegato: 6,        // note différente stable → réarmement sans silence
    silenceFrames: 2,       // trames sous la porte → réarmement
    attackRatio: 1.6,       // remontée du RMS depuis le minimum → nouvelle attaque
    attackHoldMs: 150       // garde avant d'accepter une nouvelle attaque
  };
  PP.PITCH_CFG = CFG;

  /** Racine de la moyenne des carrés d'une trame. */
  function rms(buf) {
    var s = 0;
    for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  /**
   * YIN (de Cheveigné & Kawahara, 2002).
   * Renvoie { freq: Hz ou null, clarity: 0..1 } où clarity = 1 − d′ au creux retenu.
   * On s'arrête dès que le premier creux sous le seuil est trouvé : les notes aiguës
   * coûtent donc beaucoup moins de calcul que les graves.
   */
  function detectPitch(buf, sampleRate, opts) {
    opts = opts || CFG;
    var minTau = Math.max(2, Math.floor(sampleRate / (opts.maxFreq || CFG.maxFreq)));
    var maxTau = Math.floor(sampleRate / (opts.minFreq || CFG.minFreq));
    var threshold = opts.yinThreshold || CFG.yinThreshold;
    // fenêtre d'intégration : ce qui reste après le plus grand décalage
    var W = buf.length - maxTau;
    if (W < maxTau / 2) { maxTau = Math.floor(buf.length / 2); W = buf.length - maxTau; }

    var energy = 0;
    for (var e = 0; e < buf.length; e++) energy += buf[e] * buf[e];
    if (energy < 1e-10) return { freq: null, clarity: 0 };

    // d′(τ) : différence cumulée normalisée, calculée à la volée jusqu'au creux
    var cmnd = new Float32Array(maxTau + 1);
    cmnd[0] = 1;
    var running = 0;
    var found = -1;
    var bestTau = -1, bestVal = Infinity;
    for (var tau = 1; tau <= maxTau; tau++) {
      var d = 0;
      for (var j = 0; j < W; j++) {
        var diff = buf[j] - buf[j + tau];
        d += diff * diff;
      }
      running += d;
      cmnd[tau] = running > 0 ? d * tau / running : 1;
      if (tau < minTau) continue;

      if (found < 0) {
        if (cmnd[tau] < bestVal) { bestVal = cmnd[tau]; bestTau = tau; }
        if (cmnd[tau] < threshold) found = tau;
      } else if (cmnd[tau] < cmnd[found]) {
        found = tau;            // on descend jusqu'au fond du creux
      } else {
        break;                  // le creux remonte : c'est fini
      }
    }

    var tauEst = found >= 0 ? found : bestTau;
    if (tauEst < 0) return { freq: null, clarity: 0 };
    var clarity = Math.max(0, 1 - cmnd[tauEst]);

    // interpolation parabolique autour du creux pour une précision sub-échantillon
    var betterTau = tauEst;
    if (tauEst > 1 && tauEst < maxTau) {
      var s0 = cmnd[tauEst - 1], s1 = cmnd[tauEst], s2 = cmnd[tauEst + 1];
      var denom = s0 + s2 - 2 * s1;
      if (denom !== 0) betterTau = tauEst + (s0 - s2) / (2 * denom);
    }
    return { freq: sampleRate / betterTau, clarity: clarity };
  }

  /**
   * Fréquence → note. tuningCents = écart mesuré du piano (négatif = piano trop bas),
   * retiré AVANT l'arrondi au demi-ton pour ne pas basculer sur la note voisine.
   */
  function freqToNote(freq, tuningCents) {
    var m = 69 + 12 * Math.log(freq / 440) / Math.LN2 - (tuningCents || 0) / 100;
    var midi = Math.round(m);
    return { midi: midi, pc: ((midi % 12) + 12) % 12, cents: (m - midi) * 100 };
  }

  /** Écart brut (cents) d'une fréquence par rapport au demi-ton tempéré le plus proche, dans [-50 ; 50). */
  function rawCents(freq) {
    var m = 69 + 12 * Math.log(freq / 440) / Math.LN2;
    return (m - Math.round(m)) * 100;
  }

  /**
   * Accordage du piano à partir des écarts bruts de plusieurs notes (≥ 3).
   * Les écarts sont « circulaires » (+50 et −50 c sont le même son, à un demi-ton près) :
   * on prend donc une moyenne circulaire (angle = 2π·c/100), jamais une médiane après
   * repli, qui casserait un piano accordé vers +30 c (La 442/444 + étirement des aigus).
   * Si les notes ne sont pas d'accord entre elles (dispersion > 15 c), on ne devine
   * pas : 0. Un écart moyen au-delà de +40 c est relu comme un piano trop bas
   * (ex. +45 → −55), cas le plus fréquent d'un piano non entretenu. Plage : [−60 ; +40].
   */
  function estimateTuning(centsList) {
    if (!centsList || centsList.length < 3) return null;
    var sx = 0, sy = 0;
    centsList.forEach(function (c) {
      var a = 2 * Math.PI * c / 100;
      sx += Math.cos(a); sy += Math.sin(a);
    });
    var n = centsList.length;
    var R = Math.sqrt(sx * sx + sy * sy) / n;             // 1 = toutes identiques
    var spread = R > 0 ? Math.sqrt(-2 * Math.log(R)) * 100 / (2 * Math.PI) : Infinity;
    if (spread > 15) return 0;
    var mean = Math.atan2(sy, sx) * 100 / (2 * Math.PI);   // [−50 ; +50]
    if (mean > 40) mean -= 100;
    return Math.round(mean);
  }

  /**
   * Machine à états des attaques (DESIGN §5.3).
   * feed({ t, rms, attackRms?, pc }) avec t en ms, attackRms = niveau sur la fin de la
   * trame seulement (~20 ms, réagit plus vite aux attaques rapprochées ; rms sinon), pc = classe de hauteur si la trame est voisée
   * (clarté suffisante), sinon null. Renvoie un événement { pc, midi, freq } ou null.
   *
   * Armé    : une classe de hauteur stable N trames → événement puis désarmement
   *           (N = 4 si c'est une note attendue, 8 sinon : l'attaque d'un piano
   *           acoustique est bruitée, on ne veut pas de fausse note fantôme).
   * Désarmé : réarmement par (1) silence, (2) nouvelle attaque (RMS ×1,6 au-dessus
   *           du minimum depuis le désarmement, après 150 ms), ou (3) legato : une
   *           autre classe de hauteur stable 6 trames.
   */
  function createOnsetDetector(opts) {
    var c = {};
    for (var k in CFG) c[k] = CFG[k];
    if (opts) for (var k2 in opts) c[k2] = opts[k2];

    var st = {
      noiseFloor: c.noiseFloor || 0.004,
      armed: true,
      targets: null,          // tableau de classes de hauteur attendues, ou null
      candPc: null, candCount: 0, candMidi: null, candFreq: null,
      disarmT: 0, minRms: Infinity, silent: 0,
      lastPc: null,           // note qui résonne (pour la règle legato)
      legatoPc: null, legatoCount: 0
    };

    function gate() { return Math.max(c.minGate, c.gateFactor * st.noiseFloor); }

    function resetCandidate() { st.candPc = null; st.candCount = 0; }

    function arm() {
      st.armed = true;
      resetCandidate();
      st.legatoPc = null; st.legatoCount = 0;
    }

    function disarm(t, lastPc) {
      st.armed = false;
      st.disarmT = t;
      st.minRms = Infinity;
      st.silent = 0;
      st.lastPc = lastPc === undefined ? null : lastPc;
      st.legatoPc = null; st.legatoCount = 0;
      resetCandidate();
    }

    function required(pc) {
      if (!st.targets) return c.framesTarget;
      return st.targets.indexOf(pc) >= 0 ? c.framesTarget : c.framesWrong;
    }

    function countCandidate(f) {
      if (f.pc === st.candPc) st.candCount++;
      else { st.candPc = f.pc; st.candCount = 1; }
      st.candMidi = f.midi; st.candFreq = f.freq;
      if (st.candCount >= required(st.candPc)) {
        var ev = { pc: st.candPc, midi: st.candMidi, freq: st.candFreq };
        disarm(f.t, st.candPc);
        st.minRms = attackLevel(f);
        return ev;
      }
      return null;
    }

    /** Niveau pour détecter les attaques : fenêtre courte si fournie (plus réactive). */
    function attackLevel(f) { return f.attackRms != null ? f.attackRms : f.rms; }

    function feed(f) {
      var g = gate();
      var loud = f.rms >= g;
      if (!loud) {
        // suivi lent du bruit de fond sur les trames « calmes »
        st.noiseFloor += c.noiseAlpha * (f.rms - st.noiseFloor);
      }
      var voiced = loud && f.pc !== null && f.pc !== undefined;

      if (st.armed) {
        if (!voiced) { resetCandidate(); return null; }
        return countCandidate(f);
      }

      // --- désarmé ---
      if (!loud) {
        st.silent++;
        if (st.silent >= c.silenceFrames) arm();
        return null;
      }
      st.silent = 0;

      // (2) nouvelle attaque : remontée nette du niveau après la garde
      var lvl = attackLevel(f);
      if (f.t - st.disarmT >= c.attackHoldMs && lvl > c.attackRatio * st.minRms) {
        arm();
        return voiced ? countCandidate(f) : null;
      }
      // Pendant la garde, le niveau peut encore monter (fenêtre d'analyse de ~45 ms qui
      // « rattrape » l'attaque) : on part donc du niveau atteint à la fin de la garde.
      st.minRms = f.t - st.disarmT < c.attackHoldMs ? lvl : Math.min(st.minRms, lvl);

      if (!voiced) { st.legatoPc = null; st.legatoCount = 0; return null; }

      // Après une reprise « à l'aveugle » (fin d'un son de l'appli), la première
      // note entendue est celle qui résonne : elle ne doit pas compter.
      if (st.lastPc === null) st.lastPc = f.pc;

      // (3) legato : une autre note, stable, alors que la précédente résonne encore
      if (f.pc !== st.lastPc) {
        if (f.pc === st.legatoPc) st.legatoCount++;
        else { st.legatoPc = f.pc; st.legatoCount = 1; }
        if (st.legatoCount >= c.framesLegato) {
          arm();
          st.candPc = f.pc; st.candCount = c.framesLegato - 1;
          return countCandidate(f);
        }
      } else {
        st.legatoPc = null; st.legatoCount = 0;
      }
      return null;
    }

    return {
      feed: feed,
      /** Désarme (reprise après un son de l'appli) : il faudra un silence ou une nouvelle attaque. */
      disarm: function (t) { disarm(t, null); },
      setTargets: function (pcs) { st.targets = pcs && pcs.length ? pcs.slice() : null; },
      setNoiseFloor: function (v) { st.noiseFloor = v; },
      gate: gate,
      state: st
    };
  }

  PP.pitch = {
    CFG: CFG,
    rms: rms,
    detectPitch: detectPitch,
    freqToNote: freqToNote,
    rawCents: rawCents,
    estimateTuning: estimateTuning,
    createOnsetDetector: createOnsetDetector
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = PP.pitch;
})(typeof window !== 'undefined' ? window : globalThis);
