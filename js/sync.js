/* Petit Piano — synchronisation de la progression entre téléphones (DESIGN §9).
 *
 * 1. Fonctions pures (PP.syncLib, aussi exportées pour Node / tests) :
 *    encodeValue / decodeValue (valeurs typées Firestore), mergeFamilies (fusion monotone),
 *    resolveJoinCollisions, normalizeCode / generateCode, newProfileId.
 * 2. Client REST Firestore (fetch, sans SDK) : getFamily / commitFamily.
 * 3. Planificateur (navigateur seulement) : PP.sync = { run, create, join, leave, status, onChange }.
 *
 * Exigence n°1 : ne jamais perdre ni faire reculer la progression d'un enfant.
 * → la fusion ne fait que monter (étoiles max, erreurs min, parties max…), on sauve en local
 *   d'abord, puis on écrit à distance avec une précondition (updateTime) et on réessaie.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};
  if (!PP.SYNC_CONFIG && typeof require === 'function') { try { require('./sync-config.js'); } catch (e) { /* navigateur */ } }
  function cfg() { return PP.SYNC_CONFIG; }

  var lib = {};

  // ================= utilitaires =================

  function isObj(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }
  function has(o, k) { return isObj(o) && Object.prototype.hasOwnProperty.call(o, k) && k !== '__proto__'; }
  function keysOf(o) { return isObj(o) ? Object.keys(o).filter(function (k) { return k !== '__proto__'; }) : []; }
  function union(a, b) {
    var seen = {}, out = [];
    keysOf(a).concat(keysOf(b)).forEach(function (k) { if (!seen[k]) { seen[k] = true; out.push(k); } });
    return out.sort();
  }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  /** JSON canonique (clés triées) : sert aux comparaisons « même contenu ? ». */
  function canon(x) {
    if (Array.isArray(x)) return '[' + x.map(function (v) { return v === undefined ? 'null' : canon(v); }).join(',') + ']';
    if (isObj(x)) {
      return '{' + Object.keys(x).sort().filter(function (k) { return x[k] !== undefined; })
        .map(function (k) { return JSON.stringify(k) + ':' + canon(x[k]); }).join(',') + '}';
    }
    return x === undefined ? 'null' : JSON.stringify(x);
  }
  lib.canon = canon;

  /** Entier ≥ 0, sinon undefined (NaN, chaîne, négatif… = absent). */
  function count(x) { return typeof x === 'number' && isFinite(x) && x >= 0 ? Math.floor(x) : undefined; }
  /** Date AAAA-MM-JJ, sinon undefined. */
  function day(x) { return typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : undefined; }
  function str(x) { return typeof x === 'string' ? x : undefined; }
  function maxDay(a, b) { a = day(a); b = day(b); return a === undefined ? b : b === undefined ? a : (a > b ? a : b); }
  function minDay(a, b) { a = day(a); b = day(b); return a === undefined ? b : b === undefined ? a : (a < b ? a : b); }
  /** Valeur « la plus grande » en JSON canonique : arbitraire mais identique sur tous les téléphones. */
  function maxJson(a, b) {
    if (a === undefined) return b;
    if (b === undefined) return a;
    return canon(a) >= canon(b) ? a : b;
  }

  /** Veille d'une date AAAA-MM-JJ (calcul en UTC : pas de piège d'heure d'été). */
  function yesterday(d) {
    var p = d.split('-');
    var t = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] - 1));
    return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
  }

  // ================= valeurs typées Firestore (§9.9) =================

  lib.encodeValue = function encodeValue(x) {
    if (x === null) return { nullValue: null };
    if (typeof x === 'string') return { stringValue: x };
    if (typeof x === 'boolean') return { booleanValue: x };
    if (typeof x === 'number') {
      if (!isFinite(x)) return { nullValue: null };
      return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
    }
    if (Array.isArray(x)) {
      var values = x.filter(function (v) { return v !== undefined; }).map(encodeValue);
      return { arrayValue: values.length ? { values: values } : {} };
    }
    if (isObj(x)) {
      var fields = {}, n = 0;
      keysOf(x).forEach(function (k) {
        if (x[k] === undefined || typeof x[k] === 'function') return;
        fields[k] = encodeValue(x[k]); n++;
      });
      return { mapValue: n ? { fields: fields } : {} };
    }
    return undefined;   // undefined, fonction… : champ omis
  };

  lib.decodeValue = function decodeValue(v) {
    if (!isObj(v)) return undefined;
    if ('nullValue' in v) return null;
    if ('stringValue' in v) return String(v.stringValue);
    if ('booleanValue' in v) return !!v.booleanValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return Number(v.doubleValue);
    if ('timestampValue' in v) return String(v.timestampValue);
    if ('mapValue' in v) {
      var out = {}, f = (v.mapValue && v.mapValue.fields) || {};
      keysOf(f).forEach(function (k) {
        var d = decodeValue(f[k]);
        if (d !== undefined) out[k] = d;
      });
      return out;
    }
    if ('arrayValue' in v) {
      return ((v.arrayValue && v.arrayValue.values) || []).map(decodeValue).filter(function (d) { return d !== undefined; });
    }
    return undefined;   // type inconnu (référence, géopoint…) : ignoré
  };

  lib.encodeProfiles = function (profiles) { return lib.encodeValue(isObj(profiles) ? profiles : {}); };
  lib.decodeProfiles = function (value) { var d = lib.decodeValue(value); return isObj(d) ? d : {}; };

  /** Document Firestore → { v, profiles, updateTime }. */
  lib.decodeDocument = function (doc) {
    var f = (doc && doc.fields) || {};
    var v = lib.decodeValue(f.v);
    return {
      v: typeof v === 'number' && isFinite(v) ? v : 1,
      profiles: lib.decodeProfiles(f.profiles),
      updatedAt: lib.decodeValue(f.updatedAt),
      updateTime: doc && doc.updateTime || null
    };
  };

  // ================= fusion (§9.6) =================

  var PROFILE_DEFAULTS = { name: '', mode: 'grand', curriculum: 'grand', avatar: '🦊' };
  var SETTINGS_DEFAULTS = { voiceAuto: false, unlockAll: false };
  var KNOWN = ['id', 'name', 'mode', 'curriculum', 'avatar', 'createdAt', 'updatedAt', 'settings', 'progress', 'streak'];
  var LESSON_KNOWN = ['stars', 'bestErrors', 'plays', 'lastPlayed'];

  function normSettings(s) {
    if (!isObj(s)) return undefined;
    var out = clone(SETTINGS_DEFAULTS);
    keysOf(s).forEach(function (k) { if (s[k] !== undefined) out[k] = clone(s[k]); });
    return out;
  }

  /** Une leçon : étoiles max, erreurs min, parties max, date la plus récente. */
  function mergeLesson(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var out = {};
    union(a, b).forEach(function (k) {
      if (LESSON_KNOWN.indexOf(k) < 0) { var v = maxJson(a[k], b[k]); if (v !== undefined) out[k] = clone(v); }
    });
    var sa = count(a.stars), sb = count(b.stars);
    out.stars = Math.min(3, Math.max(sa || 0, sb || 0));
    var ea = count(a.bestErrors), eb = count(b.bestErrors);
    if (ea !== undefined || eb !== undefined) out.bestErrors = ea === undefined ? eb : eb === undefined ? ea : Math.min(ea, eb);
    out.plays = Math.max(count(a.plays) || 0, count(b.plays) || 0);
    var lp = maxDay(a.lastPlayed, b.lastPlayed);
    if (lp !== undefined) out.lastPlayed = lp;
    return out;
  }

  /** Série 🔥 : la plus récente gagne ; même jour → max ; perdant la veille → au moins perdant + 1. */
  function mergeStreak(a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var A = { days: count(a.days) || 0, last: day(a.last) || null };
    var B = { days: count(b.days) || 0, last: day(b.last) || null };
    if (A.last === B.last) return { days: Math.max(A.days, B.days), last: A.last };
    var w, l;
    if (!B.last || (A.last && A.last > B.last)) { w = A; l = B; } else { w = B; l = A; }
    var days = w.days;
    if (l.last && l.last === yesterday(w.last)) days = Math.max(w.days, l.days + 1);
    return { days: days, last: w.last };
  }

  function mergeProfile(id, a, b) {
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    var ua = count(a.updatedAt) || 0, ub = count(b.updatedAt) || 0;
    var win = ua > ub ? a : ub > ua ? b : null;
    var lose = win === a ? b : a;

    /** Champ « réglé par un parent » : côté le plus récemment modifié ; égalité → JSON le plus grand. */
    function pick(k, norm) {
      var va = norm(a[k]), vb = norm(b[k]);
      if (win) {
        var vw = win === a ? va : vb, vl = win === a ? vb : va;
        return vw !== undefined ? vw : vl;
      }
      return maxJson(va, vb);
    }

    var out = {};
    // champs inconnus (futurs) : côté gagnant, à défaut l'autre
    union(a, b).forEach(function (k) {
      if (KNOWN.indexOf(k) >= 0) return;
      var v = win ? (win[k] !== undefined ? win[k] : lose[k]) : maxJson(a[k], b[k]);
      if (v !== undefined) out[k] = clone(v);
    });
    out.id = id;
    ['name', 'mode', 'curriculum', 'avatar'].forEach(function (k) {
      var v = pick(k, str);
      out[k] = v !== undefined ? v : PROFILE_DEFAULTS[k];
    });
    var created = minDay(a.createdAt, b.createdAt);
    if (created !== undefined) out.createdAt = created;
    out.updatedAt = Math.max(ua, ub);
    out.settings = pick('settings', normSettings) || clone(SETTINGS_DEFAULTS);
    out.progress = {};
    var pa = isObj(a.progress) ? a.progress : {}, pb = isObj(b.progress) ? b.progress : {};
    union(pa, pb).forEach(function (l) { out.progress[l] = mergeLesson(pa[l], pb[l]); });
    out.streak = mergeStreak(a.streak, b.streak);
    return out;
  }

  /**
   * Fusion de deux objets `profiles` ({ id: profil }). Pure, symétrique, idempotente,
   * monotone : aucun profil, aucune leçon, aucune étoile ne disparaît jamais.
   */
  lib.mergeFamilies = function (local, remote) {
    var out = {};
    union(local, remote).forEach(function (id) {
      out[id] = mergeProfile(id, has(local, id) ? local[id] : undefined, has(remote, id) ? remote[id] : undefined);
    });
    return out;
  };

  // ================= identifiants de profil (§9.5) =================

  var B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  var RANDOM_ID_RE = /^p-[0-9a-z]{8}$/;
  lib.RANDOM_ID_RE = RANDOM_ID_RE;

  function randomBytes(n) {
    var a = new Uint8Array(n);
    var c = root.crypto;
    if (c && c.getRandomValues) c.getRandomValues(a);
    else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    return a;
  }
  lib.randomBytes = randomBytes;

  /** `size` signes tirés sans biais dans `alphabet` (rejet des octets trop grands). */
  function randomString(alphabet, size, rnd) {
    rnd = rnd || randomBytes;
    var limit = 256 - (256 % alphabet.length), out = '';
    while (out.length < size) {
      var bytes = rnd(size * 2);
      for (var i = 0; i < bytes.length && out.length < size; i++) {
        if (bytes[i] < limit) out += alphabet[bytes[i] % alphabet.length];
      }
    }
    return out;
  }

  /** Nouvel id « p-xxxxxxxx » ; `taken` = objet des profils existants ou fonction(id) → booléen. */
  lib.newProfileId = function (taken, rnd) {
    var isTaken = typeof taken === 'function' ? taken : function (id) { return has(taken, id); };
    var id;
    do { id = 'p-' + randomString(B36, 8, rnd); } while (isTaken(id));
    return id;
  };

  /** Prénom comparable : sans espaces autour, minuscules, sans accents (« Léo » = « leo »). */
  function normName(s) {
    return String(s == null ? '' : s).trim().replace(/\s+/g, ' ').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  lib.normName = normName;

  /**
   * Jonction d'une famille (§9.5) : pour chaque id présent en local ET à distance —
   *  - id aléatoire « p-xxxxxxxx »                       → même enfant (fusion) ;
   *  - prénoms identiques après normalisation            → même enfant (fusion) ;
   *  - prénoms différents (createdAt identique ou non)   → enfants différents : le profil
   *    LOCAL reçoit un nouvel id aléatoire (dupliquer ne perd rien ; fusionner deux enfants mélangerait leurs étoiles).
   * Renvoie { profiles: profils locaux (renommés), renamed: { ancienId: nouvelId } }. Pure (hors tirage aléatoire).
   */
  lib.resolveJoinCollisions = function (localProfiles, remoteProfiles, newId) {
    var taken = {};
    keysOf(localProfiles).concat(keysOf(remoteProfiles)).forEach(function (k) { taken[k] = true; });
    newId = newId || function (isTaken) { return lib.newProfileId(isTaken); };
    var out = {}, renamed = {};
    keysOf(localProfiles).sort().forEach(function (id) {
      var lp = localProfiles[id];
      var rp = has(remoteProfiles, id) ? remoteProfiles[id] : undefined;
      var same = rp === undefined || RANDOM_ID_RE.test(id) ||
        normName(isObj(lp) ? lp.name : '') === normName(isObj(rp) ? rp.name : '');
      if (same) { out[id] = clone(lp); return; }
      var nid = newId(function (x) { return !!taken[x]; });
      taken[nid] = true;
      var copy = isObj(lp) ? clone(lp) : {};
      copy.id = nid;
      out[nid] = copy;
      renamed[id] = nid;
    });
    return { profiles: out, renamed: renamed };
  };

  // ================= code famille (§9.8) =================

  var ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';   // 31 signes, sans 0 O 1 I L
  var DOC_ID_RE = /^[A-Za-z0-9-]{16,64}$/;            // imposé par les règles Firestore
  lib.ALPHABET = ALPHABET;
  lib.DOC_ID_RE = DOC_ID_RE;

  function formatCode(body) { return 'PIANO-' + body.slice(0, 5) + '-' + body.slice(5, 10) + '-' + body.slice(10, 15); }

  /** PIANO-XXXXX-XXXXX-XXXXX : 15 × log2(31) ≈ 74 bits. */
  lib.generateCode = function (rnd) { return formatCode(randomString(ALPHABET, 15, rnd)); };

  function inAlphabet(s) {
    for (var i = 0; i < s.length; i++) if (ALPHABET.indexOf(s[i]) < 0) return false;
    return true;
  }

  /**
   * Saisie → { ok: true, code } ou { ok: false, error: 'format' | 'chars' }.
   * Tolère minuscules, espaces, tirets manquants ou en trop, et le message de partage collé en entier.
   */
  lib.normalizeCode = function (input) {
    var raw = String(input == null ? '' : input);
    // 0. Forme exacte PIANO-XXXXX-XXXXX-XXXXX (en majuscules) n'importe où : message de partage collé
    //    dans un champ d'une ligne, où le retour à la ligne disparaît (« …R4WZCSur l'autre téléphone »).
    var G = '([' + ALPHABET + ']{5})';
    var exact = new RegExp('PIANO-' + G + '-' + G + '-' + G).exec(raw);
    if (exact) return { ok: true, code: formatCode(exact[1] + exact[2] + exact[3]) };
    var U = raw.toUpperCase();
    // 1. Texte collé : on cherche « PIANO » suivi d'exactement 15 signes (séparés par espaces/tirets, sur une ligne)
    var re = /PIANO[ \t-]*([A-Z0-9][A-Z0-9 \t-]*)/g, m;
    while ((m = re.exec(U))) {
      var acc = '';
      var tokens = m[1].split(/[ \t]+/);
      for (var i = 0; i < tokens.length && acc.length < 15; i++) acc += tokens[i].replace(/[^A-Z0-9]/g, '');
      if (acc.length === 15 && inAlphabet(acc)) return { ok: true, code: formatCode(acc) };
      re.lastIndex = m.index + 5;
    }
    // 2. Saisie simple : on ne garde que les lettres et chiffres, sans le préfixe PIANO
    var s = U.replace(/[^A-Z0-9]/g, '');
    if (s.indexOf('PIANO') === 0) s = s.slice(5);
    if (s.length !== 15) return { ok: false, error: 'format' };
    if (!inAlphabet(s)) return { ok: false, error: 'chars' };
    return { ok: true, code: formatCode(s) };
  };

  // ================= client REST Firestore =================

  function docName(code) {
    return 'projects/' + cfg().projectId + '/databases/(default)/documents/' + cfg().collection + '/' + code;
  }
  function apiUrl(path) {
    return 'https://firestore.googleapis.com/v1/' + path + '?key=' + encodeURIComponent(cfg().apiKey);
  }

  /** Erreur de synchro typée : kind = 'offline' | 'conflict' | 'denied' | 'notFound' | 'other'. */
  function syncError(kind, detail) {
    var e = new Error('sync:' + kind + (detail ? ' ' + detail : ''));
    e.kind = kind;
    return e;
  }
  lib.syncError = syncError;

  /** fetch avec délai max ; réseau absent / délai → 'offline'. Résout { status, body }. */
  function request(url, opts) {
    if (typeof fetch !== 'function') return Promise.reject(syncError('offline'));
    if (root.navigator && root.navigator.onLine === false) return Promise.reject(syncError('offline'));
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, cfg().timeoutMs) : null;
    var o = {};
    Object.keys(opts || {}).forEach(function (k) { o[k] = opts[k]; });
    if (ctrl) o.signal = ctrl.signal;
    // Le .catch couvre toute la chaîne : coupure ou délai dépassé PENDANT la lecture du corps → 'offline' aussi.
    return fetch(url, o).then(function (res) {
      return res.text().then(function (txt) {
        clearTimeout(timer);
        var body = null;
        try { body = txt ? JSON.parse(txt) : null; } catch (e) { body = null; }
        return { status: res.status, body: body };
      });
    }).catch(function (err) {
      clearTimeout(timer);
      throw err && err.kind ? err : syncError('offline', err && err.name);
    });
  }

  function errorFor(r) {
    var st = r.body && r.body.error && r.body.error.status;
    if (r.status === 403 || st === 'PERMISSION_DENIED') return syncError('denied');
    if (r.status === 409 || st === 'FAILED_PRECONDITION' || st === 'ABORTED' || st === 'ALREADY_EXISTS') return syncError('conflict', st);
    if (r.status === 404 || st === 'NOT_FOUND') return syncError('conflict', 'NOT_FOUND');   // précondition updateTime sur un document absent
    if (r.status === 0 || r.status >= 500) return syncError('offline', String(r.status));
    return syncError('other', r.status + ' ' + (st || ''));
  }

  /** GET du document famille → { exists, v, profiles, updateTime }. */
  lib.getFamily = function (code) {
    if (!DOC_ID_RE.test(code)) return Promise.reject(syncError('other', 'code'));
    return request(apiUrl(docName(code)), { method: 'GET', cache: 'no-store' }).then(function (r) {
      if (r.status === 200 && r.body) {
        var d = lib.decodeDocument(r.body);
        d.exists = true;
        return d;
      }
      if (r.status === 404) return { exists: false, v: cfg().docVersion, profiles: {}, updateTime: null };
      throw errorFor(r);
    });
  };

  /** Corps du commit : clés exactement v / profiles / updatedAt (= heure du serveur). */
  lib.buildCommit = function (code, profiles, precondition) {
    var write = {
      update: {
        name: docName(code),
        fields: { v: { integerValue: String(cfg().docVersion) }, profiles: lib.encodeProfiles(profiles) }
      },
      updateTransforms: [{ fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' }]
    };
    if (precondition) write.currentDocument = precondition;
    return { writes: [write] };
  };

  /** Écrit les profils ; precondition = { updateTime } ou { exists: false }. Conflit → erreur 'conflict'. */
  lib.commitFamily = function (code, profiles, precondition) {
    if (!DOC_ID_RE.test(code)) return Promise.reject(syncError('other', 'code'));
    var url = apiUrl('projects/' + cfg().projectId + '/databases/(default)/documents:commit');
    return request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lib.buildCommit(code, profiles, precondition))
    }).then(function (r) {
      if (r.status === 200) return { commitTime: r.body && r.body.commitTime };
      throw errorFor(r);
    });
  };

  PP.syncLib = lib;
  if (typeof module !== 'undefined' && module.exports) module.exports = lib;

  // ================= planificateur (navigateur) =================

  if (typeof document === 'undefined' || !PP.store) return;
  var store = PP.store;
  var listeners = [];
  var running = null, again = false, debounceT = null;

  function emit(ev) { listeners.forEach(function (fn) { try { fn(ev); } catch (e) { /* un écran ne casse pas la synchro */ } }); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function stillFamily(code) { return store.syncState().familyCode === code; }

  function setState(state, ok) {
    var patch = { lastState: state };
    if (ok) patch.lastSyncAt = Date.now();
    store.setSync(patch, state === 'syncing');   // « syncing » n'est pas sauvegardé
    emit({ type: 'status', state: state });
  }

  /** Tous les profils locaux sont maintenant à distance : la jonction est terminée. */
  function joinSent(code) {
    if (stillFamily(code) && store.syncState().pendingJoin) store.setSync({ pendingJoin: false });
    return 'ok';
  }

  /** Un cycle lire → fusionner → sauver en local → écrire, avec réessais sur conflit. */
  function cycle(code, attempt) {
    return lib.getFamily(code).then(function (doc) {
      if (!stillFamily(code)) return 'left';
      if (doc.exists && doc.v > cfg().docVersion) return 'tooNew';
      var remote = doc.exists ? doc.profiles : {};
      // Jonction pas encore envoyée (§9.5) : un autre téléphone a pu entre-temps écrire un AUTRE enfant
      // sous un id local (« p1 »). On refait le contrôle des collisions sur ce GET frais, avant de fusionner.
      if (store.syncState().pendingJoin) {
        var res = lib.resolveJoinCollisions(store.profiles(), remote);
        if (Object.keys(res.renamed).length) { store.reidProfiles(res.renamed); emit({ type: 'data' }); }
      }
      // fusion + sauvegarde locale d'abord (synchrone : aucune leçon ne peut s'intercaler)
      if (store.applyMerged(remote)) emit({ type: 'data' });
      var merged = store.profiles();
      if (doc.exists && canon(merged) === canon(lib.mergeFamilies(remote, {}))) return joinSent(code);
      return lib.commitFamily(code, merged, doc.exists ? { updateTime: doc.updateTime } : { exists: false })
        .then(function () { return joinSent(code); });
    }).catch(function (err) {
      var pauses = cfg().retryPauses;
      if (err && err.kind === 'conflict' && attempt < pauses.length && stillFamily(code)) {
        return wait(pauses[attempt]).then(function () { return cycle(code, attempt + 1); });
      }
      throw err;
    });
  }

  /** Synchronise maintenant (sans effet sans code famille). Ne rejette jamais. */
  function run() {
    var code = store.syncState().familyCode;
    if (!code) return Promise.resolve('none');
    if (running) { again = true; return running; }
    clearTimeout(debounceT);
    setState('syncing');
    running = cycle(code, 0).then(function (res) {
      if (res === 'left') return res;
      setState(res, res === 'ok');
      return res;
    }, function (err) {
      if (!stillFamily(code)) return 'left';
      var state = err && err.kind === 'offline' ? 'offline' : 'error';
      setState(state);
      return state;
    }).then(function (res) {
      running = null;
      if (again) { again = false; return run(); }
      // échec : un nouvel essai dans 1 min (remplacé par toute synchro plus tôt : pas de boucle)
      if (res === 'offline' || res === 'error') schedule(cfg().errorRetryMs);
      return res;
    });
    return running;
  }

  function schedule(ms) {
    if (!store.syncState().familyCode) return;
    clearTimeout(debounceT);
    debounceT = setTimeout(run, ms == null ? cfg().debounceMs : ms);
  }

  /** Crée un code famille et y envoie les profils de ce téléphone. Rejette { kind } (hors ligne…). */
  function create() {
    function tryOnce(n) {
      var code = lib.generateCode();
      var profiles = lib.mergeFamilies(store.profiles(), {});
      return lib.commitFamily(code, profiles, { exists: false }).then(function () {
        store.setSync({ familyCode: code, lastSyncAt: Date.now(), lastState: 'ok', pendingJoin: false });
        emit({ type: 'status', state: 'ok' });
        schedule(0);   // si un changement local a eu lieu entre-temps
        return code;
      }, function (err) {
        if (err && err.kind === 'conflict' && n < 3) return tryOnce(n + 1);   // code déjà pris (improbable)
        throw err;
      });
    }
    return tryOnce(1);
  }

  /** Rejoint une famille : le code n'est gardé qu'après un GET réussi. Résout { renamed }. */
  function join(input) {
    var norm = lib.normalizeCode(input);
    if (!norm.ok) return Promise.reject(syncError(norm.error));
    var code = norm.code;
    return lib.getFamily(code).then(function (doc) {
      if (!doc.exists) throw syncError('notFound');
      if (doc.v > cfg().docVersion) throw syncError('tooNew');
      var res = lib.resolveJoinCollisions(store.profiles(), doc.profiles, function (isTaken) {
        return lib.newProfileId(isTaken);
      });
      store.reidProfiles(res.renamed);
      store.applyMerged(doc.profiles);
      // pendingJoin : les collisions d'id seront revérifiées à chaque synchro jusqu'au 1er envoi réussi
      store.setSync({ familyCode: code, lastSyncAt: null, lastState: 'idle', pendingJoin: true });
      emit({ type: 'data' });
      run();   // écrit la fusion à distance (précondition + réessais) ; un échec ici n'annule pas la jonction
      return { code: code, renamed: res.renamed };
    });
  }

  /** Quitte la famille sur ce téléphone seulement : les profils locaux restent intacts. */
  function leave() {
    clearTimeout(debounceT);
    store.setSync({ familyCode: null, lastSyncAt: null, lastState: 'idle', pendingJoin: false });
    emit({ type: 'status', state: 'idle' });
  }

  function status() {
    var s = store.syncState();
    return { familyCode: s.familyCode, lastSyncAt: s.lastSyncAt, state: s.lastState };   // lastState suit run() pas à pas
  }

  // Déclencheurs (§9.7)
  store.onChange(function () { schedule(); });
  root.addEventListener('online', function () { run(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    var s = store.syncState();
    if (s.lastState === 'ok' && s.lastSyncAt && Date.now() - s.lastSyncAt < cfg().visibleMinGapMs) return;
    run();
  });

  PP.sync = {
    run: run,
    schedule: schedule,
    /** Démarrage : réduit le risque d'effacement du stockage (iOS), puis 1re synchro après l'affichage. */
    start: function () {
      try {
        if (root.navigator && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
      } catch (e) { /* non supporté */ }
      setTimeout(run, cfg().startDelayMs);
    },
    create: create,
    join: join,
    leave: leave,
    status: status,
    onChange: function (fn) { listeners.push(fn); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
