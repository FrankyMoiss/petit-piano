/* Petit Piano — lecture des consignes à voix haute (speechSynthesis fr-FR, optionnelle).
 * Pendant la lecture, PP.voice.busy() est vrai : le micro est suspendu (+300 ms ensuite).
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  var synth = root.speechSynthesis;
  var frVoice = null;
  var speaking = false;
  var quietUntil = 0;
  var current = null;        // énoncé en cours : les fins d'énoncés annulés sont ignorées
  var safetyT = null;

  function done(u) {
    if (u !== current) return;   // onend/onerror « interrupted » d'un énoncé précédent
    current = null;
    clearTimeout(safetyT);
    speaking = false;
    quietUntil = performance.now() + 300;
  }
  var listeners = [];

  function pickVoice() {
    if (!synth) return;
    var voices = synth.getVoices() || [];
    frVoice = voices.filter(function (v) { return /^fr(-|_|$)/i.test(v.lang); })
      .sort(function (a, b) { return (b.lang === 'fr-FR') - (a.lang === 'fr-FR'); })[0] || null;
    listeners.forEach(function (fn) { fn(!!frVoice); });
  }
  if (synth) {
    pickVoice();
    if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', pickVoice);
  }

  PP.voice = {
    /** Vrai si une voix française est disponible (sinon le bouton 🗣️ est masqué). */
    available: function () { return !!frVoice; },
    onAvailability: function (fn) { listeners.push(fn); },

    speak: function (text) {
      if (!frVoice) return;
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.voice = frVoice;
      u.lang = frVoice.lang;
      u.rate = 0.95;
      speaking = true;
      current = u;
      u.onend = u.onerror = function () { done(u); };
      // filet de sécurité : si onend ne vient jamais (Safari iOS), le micro ne reste pas coupé
      clearTimeout(safetyT);
      safetyT = setTimeout(function () { done(u); }, text.length * 90 + 2000);
      synth.speak(u);
    },

    stop: function () {
      if (!synth) return;
      if (speaking) quietUntil = performance.now() + 300;
      speaking = false;
      current = null;
      clearTimeout(safetyT);
      synth.cancel();
    },

    busy: function () { return speaking || performance.now() < quietUntil; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
