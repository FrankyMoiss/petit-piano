/* Petit Piano — profils et progression (DESIGN §6.4).
 * localStorage entouré de try/catch : si le stockage est indisponible (navigation
 * privée, quota…), tout reste en mémoire et l'appli fonctionne pour la session.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  var KEY = 'petitpiano.v1';

  function defaults() {
    return {
      version: 1,
      activeProfile: null,
      device: { input: 'mic', noiseFloor: null, tuningCents: 0, calibrated: false },
      profiles: {}
    };
  }

  function profileDefaults(id, name) {
    return {
      id: id,
      name: name,
      mode: 'grand',
      curriculum: 'grand',
      avatar: '🦊',
      createdAt: localDate(),
      settings: { voiceAuto: false, unlockAll: false },   // réglages propres à chaque enfant
      progress: {},
      streak: { days: 0, last: null }
    };
  }

  /** Date locale AAAA-MM-JJ (pas toISOString, qui est en UTC et décale le jour la nuit). */
  function localDate(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function yesterdayOf(dateStr) {
    var p = dateStr.split('-');
    return localDate(new Date(+p[0], +p[1] - 1, +p[2] - 1));
  }

  /** Fusion profonde : les champs absents prennent la valeur par défaut (migration sans perte). */
  function merge(def, val) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) return val === undefined ? def : val;
    var out = {};
    Object.keys(def || {}).forEach(function (k) { out[k] = def[k]; });
    Object.keys(val).forEach(function (k) {
      out[k] = def && def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) ? merge(def[k], val[k]) : val[k];
    });
    return out;
  }

  var data = defaults();
  var storageOk = true;

  var store = {
    /** Charge l'état ; JSON invalide ou stockage bloqué → état vide, sans planter. */
    load: function () {
      var raw = null;
      try {
        raw = root.localStorage.getItem(KEY);
        storageOk = true;
      } catch (e) {
        storageOk = false;
      }
      data = defaults();
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          data = merge(defaults(), parsed);
          // ancien format : « tout débloquer » était partagé par l'appareil → on le reporte sur chaque profil
          var legacyUnlock = !!(data.device && data.device.unlockAll);
          if (data.device) delete data.device.unlockAll;
          Object.keys(data.profiles).forEach(function (id) {
            data.profiles[id] = merge(profileDefaults(id, ''), data.profiles[id]);
            if (legacyUnlock) data.profiles[id].settings.unlockAll = true;
          });
        } catch (e) { data = defaults(); }
      }
      return data;
    },

    save: function () {
      try {
        root.localStorage.setItem(KEY, JSON.stringify(data));
        storageOk = true;
      } catch (e) {
        storageOk = false;
      }
    },

    storageOk: function () { return storageOk; },
    device: function () { return data.device; },

    profile: function () { return data.activeProfile ? data.profiles[data.activeProfile] || null : null; },

    /** Crée un profil (p1, p2…) et le rend actif. */
    createProfile: function (name) {
      var n = 1;
      while (data.profiles['p' + n]) n++;
      var id = 'p' + n;
      data.profiles[id] = profileDefaults(id, name);
      data.activeProfile = id;
      store.save();
      return data.profiles[id];
    },

    setDevice: function (patch) {
      Object.keys(patch).forEach(function (k) { data.device[k] = patch[k]; });
      store.save();
    },

    lessonProgress: function (lessonId) {
      var p = store.profile();
      return p && p.progress[lessonId] || null;
    },

    /** Déverrouillage calculé : la leçon précédente (ordre du tableau) a ≥ 1 étoile. */
    isUnlocked: function (lessons, index) {
      var p = store.profile();
      if (index === 0 || (p && p.settings.unlockAll)) return true;
      var prev = store.lessonProgress(lessons[index - 1].id);
      return !!(prev && prev.stars >= 1);
    },

    totalStars: function () {
      var p = store.profile();
      if (!p) return 0;
      return Object.keys(p.progress).reduce(function (s, k) { return s + (p.progress[k].stars || 0); }, 0);
    },

    /** Enregistre la fin d'une leçon ; renvoie { previousStars, record }. */
    recordLesson: function (lessonId, stars, errors) {
      var p = store.profile();
      var today = localDate();
      var prev = p.progress[lessonId];
      var previousStars = prev ? prev.stars : 0;
      p.progress[lessonId] = {
        stars: Math.max(previousStars, stars),
        bestErrors: prev ? Math.min(prev.bestErrors, errors) : errors,
        plays: (prev ? prev.plays : 0) + 1,
        lastPlayed: today
      };
      // Série de jours : +1 si la veille, inchangée si déjà aujourd'hui, sinon 1.
      var s = p.streak;
      if (s.last !== today) {
        s.days = s.last && s.last === yesterdayOf(today) ? s.days + 1 : 1;
        s.last = today;
      }
      store.save();
      return { previousStars: previousStars, record: !!prev && stars > previousStars };
    },

    /** Série affichée : revient à 0 si plus d'un jour sans leçon (affichée « 🔥 1 jour » au prochain jeu). */
    streakDays: function () {
      var p = store.profile();
      if (!p || !p.streak.last) return 0;
      var today = localDate();
      return p.streak.last === today || p.streak.last === yesterdayOf(today) ? p.streak.days : 0;
    },

    reset: function () {
      data = defaults();
      try { root.localStorage.removeItem(KEY); } catch (e) { storageOk = false; }
    }
  };

  PP.store = store;
})(typeof window !== 'undefined' ? window : globalThis);
