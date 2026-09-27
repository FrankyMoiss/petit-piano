/* Petit Piano — profils et progression (DESIGN §6.4, §9.10).
 * localStorage entouré de try/catch : si le stockage est indisponible (navigation
 * privée, quota…), tout reste en mémoire et l'appli fonctionne pour la session.
 * v2 : même clé qu'en v1, migration en place sans perte (ajout de `sync` et de
 * `profile.updatedAt`) ; les profils existants (p1…) gardent leur id à vie.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  var KEY = 'petitpiano.v1';

  function defaults() {
    return {
      version: 2,
      activeProfile: null,
      device: { input: 'mic', noiseFloor: null, tuningCents: 0, calibrated: false },   // propre au téléphone, jamais synchronisé
      profiles: {},
      sync: syncDefaults()                                                             // propre au téléphone (§9.7)
    };
  }

  function syncDefaults() { return { familyCode: null, lastSyncAt: null, lastState: 'idle', pendingJoin: false }; }

  var AVATARS = ['🦊', '🐰', '🐻', '🐱', '🐼', '🦁', '🐸', '🐧'];

  function profileDefaults(id, name) {
    return {
      id: id,
      name: name,
      mode: 'grand',
      curriculum: 'grand',
      avatar: '🦊',
      createdAt: localDate(),
      updatedAt: 0,            // dernière modification par un parent (ms) ; 0 = profil v1 (§9.6)
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
  var changeListeners = [];

  /** Prévient la synchro (anti-rebond) : kind = 'lesson' | 'profile'. */
  function changed(kind) {
    changeListeners.forEach(function (fn) { try { fn(kind); } catch (e) { /* jamais bloquant */ } });
  }

  function syncLib() { return PP.syncLib || null; }

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
          data.version = 2;
          if (!data.sync || typeof data.sync !== 'object') data.sync = syncDefaults();
          if (data.sync.lastState === 'syncing') data.sync.lastState = 'idle';
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

    /** Profil actif. Ne pas garder la référence au-delà d'un appel : la synchro remplace les objets. */
    profile: function () { return data.activeProfile ? data.profiles[data.activeProfile] || null : null; },

    profiles: function () { return data.profiles; },

    /** Profils triés pour « Qui joue ? » : createdAt croissant, puis id (même ordre sur tous les téléphones). */
    profileList: function () {
      return Object.keys(data.profiles).map(function (id) { return data.profiles[id]; }).sort(function (a, b) {
        var ca = a.createdAt || '', cb = b.createdAt || '';
        return ca < cb ? -1 : ca > cb ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
    },

    setActive: function (id) {
      if (!data.profiles[id]) return;
      data.activeProfile = id;
      store.save();
    },

    /** Crée un profil (nouvel id aléatoire « p-xxxxxxxx », §9.5) et le rend actif. */
    createProfile: function (name) {
      var lib = syncLib(), id;
      if (lib) id = lib.newProfileId(data.profiles);
      else { var n = 1; while (data.profiles['p' + n]) n++; id = 'p' + n; }
      var p = profileDefaults(id, name);
      var used = Object.keys(data.profiles).map(function (k) { return data.profiles[k].avatar; });
      p.avatar = AVATARS.filter(function (a) { return used.indexOf(a) < 0; })[0] || AVATARS[0];
      p.updatedAt = Date.now();
      data.profiles[id] = p;
      data.activeProfile = id;
      store.save();
      changed('profile');
      return data.profiles[id];
    },

    /** Un parent a modifié le prénom, l'avatar ou un réglage du profil actif (§9.6). */
    touchProfile: function () {
      var p = store.profile();
      if (p) p.updatedAt = Math.max(Date.now(), (p.updatedAt || 0) + 1);
      store.save();
      changed('profile');
    },

    /** Écoute les changements à synchroniser. */
    onChange: function (fn) { changeListeners.push(fn); },

    /**
     * Intègre des profils venus d'un autre téléphone. C'est TOUJOURS une fusion monotone
     * (jamais un remplacement) : même appelée avec n'importe quoi, rien de local ne recule.
     * Renvoie true si quelque chose a changé en local.
     */
    applyMerged: function (profiles) {
      var lib = syncLib();
      if (!lib) return false;
      var next = lib.mergeFamilies(data.profiles, profiles);
      if (lib.canon(next) === lib.canon(data.profiles)) return false;
      data.profiles = next;
      store.save();
      return true;
    },

    /** Jonction : renomme des profils locaux ({ ancienId: nouvelId }) ; activeProfile suit. */
    reidProfiles: function (renamed) {
      var ids = Object.keys(renamed || {});
      if (!ids.length) return;
      ids.forEach(function (oldId) {
        var p = data.profiles[oldId], nid = renamed[oldId];
        if (!p || data.profiles[nid]) return;
        p.id = nid;
        data.profiles[nid] = p;
        delete data.profiles[oldId];
        if (data.activeProfile === oldId) data.activeProfile = nid;
      });
      store.save();
    },

    syncState: function () { return data.sync; },

    setSync: function (patch, noSave) {
      Object.keys(patch).forEach(function (k) { data.sync[k] = patch[k]; });
      if (!noSave) store.save();
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
      var previousStars = prev ? prev.stars || 0 : 0;
      var prevErr = prev && typeof prev.bestErrors === 'number' && isFinite(prev.bestErrors) ? prev.bestErrors : errors;
      var entry = {};
      if (prev) Object.keys(prev).forEach(function (k) { entry[k] = prev[k]; });   // champs futurs conservés
      entry.stars = Math.max(previousStars, stars);
      entry.bestErrors = Math.min(prevErr, errors);
      entry.plays = (prev ? prev.plays || 0 : 0) + 1;
      entry.lastPlayed = today;
      p.progress[lessonId] = entry;
      // Série de jours : +1 si la veille, inchangée si déjà aujourd'hui, sinon 1.
      var s = p.streak;
      if (s.last !== today) {
        s.days = s.last && s.last === yesterdayOf(today) ? s.days + 1 : 1;
        s.last = today;
      }
      store.save();
      changed('lesson');
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
