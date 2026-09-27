/* Synchronisation entre téléphones (DESIGN §9) : encodage Firestore, fusion monotone,
 * collisions d'ids, code famille. Aucun accès réseau.
 * Lancer : node tests/sync.test.js
 */
'use strict';
require('../js/sync-config.js');
var S = require('../js/sync.js');

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('ÉCHEC : ' + msg); }
}
function same(a, b, msg) {
  var ok = S.canon(a) === S.canon(b);
  if (!ok) msg += '\n   obtenu  : ' + S.canon(a) + '\n   attendu : ' + S.canon(b);
  check(ok, msg);
}
function throwsNot(fn, msg) {
  try { fn(); passes++; } catch (e) { failures++; console.log('ÉCHEC : ' + msg + ' — ' + e.message); }
}
function deepFreeze(o) {
  if (o && typeof o === 'object') { Object.freeze(o); Object.keys(o).forEach(function (k) { deepFreeze(o[k]); }); }
  return o;
}
var M = S.mergeFamilies;

// ---------- données de référence : un vrai état v1 (téléphone de papa) ----------
var V1 = {
  p1: {
    id: 'p1', name: 'Léo', mode: 'grand', curriculum: 'grand', avatar: '🦊', createdAt: '2026-09-20',
    settings: { voiceAuto: false, unlockAll: false },
    progress: {
      l01: { stars: 3, bestErrors: 0, plays: 2, lastPlayed: '2026-09-27' },
      l02: { stars: 2, bestErrors: 4, plays: 1, lastPlayed: '2026-09-27' }
    },
    streak: { days: 3, last: '2026-09-27' }
  }
};

// ================= encodage / décodage =================
(function () {
  same(S.encodeValue('a'), { stringValue: 'a' }, 'chaîne');
  same(S.encodeValue(true), { booleanValue: true }, 'booléen');
  same(S.encodeValue(null), { nullValue: null }, 'null');
  same(S.encodeValue(3), { integerValue: '3' }, 'entier en chaîne');
  same(S.encodeValue(1790000000000), { integerValue: '1790000000000' }, 'grand entier (ms)');
  same(S.encodeValue(1.5), { doubleValue: 1.5 }, 'non entier');
  same(S.encodeValue({}), { mapValue: {} }, 'objet vide');
  same(S.encodeValue([]), { arrayValue: {} }, 'tableau vide');
  same(S.encodeValue({ a: undefined, b: 1 }), { mapValue: { fields: { b: { integerValue: '1' } } } }, 'undefined omis');
  same(S.encodeValue([1, 'x']), { arrayValue: { values: [{ integerValue: '1' }, { stringValue: 'x' }] } }, 'tableau');

  same(S.decodeValue({ integerValue: '42' }), 42, 'décodage entier');
  same(S.decodeValue({ doubleValue: 2.5 }), 2.5, 'décodage double');
  same(S.decodeValue({ mapValue: {} }), {}, 'mapValue sans fields');
  same(S.decodeValue({ arrayValue: {} }), [], 'arrayValue sans values');
  same(S.decodeValue({ timestampValue: '2026-09-27T18:04:11.201Z' }), '2026-09-27T18:04:11.201Z', 'timestamp → ISO');
  check(S.decodeValue({ geoPointValue: { latitude: 1 } }) === undefined, 'type inconnu ignoré');
  same(S.decodeValue({ mapValue: { fields: { a: { referenceValue: 'x' }, b: { stringValue: 'y' } } } }), { b: 'y' }, 'champ de type inconnu omis');

  var withUpd = M(V1, {});
  withUpd.p1.updatedAt = 1790000000000;
  withUpd.p1.futur = { liste: [1, 2, { x: null }], ok: true, r: 0.25 };
  same(S.decodeValue(S.encodeValue(withUpd)), withUpd, 'aller-retour d\'un état complet');
  same(S.decodeValue(S.encodeValue(V1)), V1, 'aller-retour d\'un état v1 réel');
  same(S.decodeProfiles(S.encodeProfiles({})), {}, 'aller-retour profils vides');
  same(S.decodeProfiles(undefined), {}, 'profils absents → {}');

  var doc = { name: 'x', updateTime: '2026-09-27T18:00:00.000000Z', fields: {
    v: { integerValue: '1' }, updatedAt: { timestampValue: '2026-09-27T18:00:00Z' }, profiles: S.encodeProfiles(V1) } };
  var d = S.decodeDocument(doc);
  check(d.v === 1 && d.updateTime === doc.updateTime, 'decodeDocument : v et updateTime');
  same(d.profiles, V1, 'decodeDocument : profils');

  var body = S.buildCommit('PIANO-22222-22222-22222', V1, { exists: false });
  var w = body.writes[0];
  same(Object.keys(w.update.fields).sort(), ['profiles', 'v'], 'commit : seulement v et profiles (+ transformation)');
  check(w.update.fields.v.integerValue === '1', 'commit : v entier');
  check(w.updateTransforms[0].fieldPath === 'updatedAt' && w.updateTransforms[0].setToServerValue === 'REQUEST_TIME', 'commit : updatedAt = REQUEST_TIME');
  check(/\/documents\/familles\/PIANO-22222-22222-22222$/.test(w.update.name), 'commit : nom du document');
  same(w.currentDocument, { exists: false }, 'commit : précondition');
})();

// ================= fusion : règles ligne par ligne (§9.6) =================
(function () {
  // profil d'un seul côté
  var r = M(V1, {});
  check(r.p1 && r.p1.progress.l01.stars === 3 && r.p1.streak.days === 3, 'profil présent d\'un seul côté gardé');
  check(r.p1.id === 'p1' && r.p1.updatedAt === 0 && r.p1.name === 'Léo', 'v1 : id gardé, updatedAt 0');
  r = M({}, V1);
  check(r.p1 && r.p1.progress.l02.bestErrors === 4, 'profil seulement à distance gardé');
  r = M(V1, { 'p-abcdefgh': { name: 'Zoé', createdAt: '2026-10-01' } });
  same(Object.keys(r).sort(), ['p-abcdefgh', 'p1'], 'union des ids de profil');
  check(r['p-abcdefgh'].mode === 'grand' && r['p-abcdefgh'].streak.days === 0 && r['p-abcdefgh'].settings.voiceAuto === false,
    'profil incomplet complété par les défauts');
  check(r['p-abcdefgh'].id === 'p-abcdefgh', 'id pris de la clé');

  // createdAt : le plus ancien
  r = M({ a: { createdAt: '2026-09-20' } }, { a: { createdAt: '2026-09-18' } });
  check(r.a.createdAt === '2026-09-18', 'createdAt = min');
  r = M({ a: { createdAt: '2026-09-20' } }, { a: {} });
  check(r.a.createdAt === '2026-09-20', 'createdAt absent → l\'autre');
  r = M({ a: { createdAt: 'n\'importe' } }, { a: {} });
  check(r.a.createdAt === undefined, 'createdAt invalide → absent');

  // updatedAt : max ; champs parent au plus récent
  var A = { a: { name: 'Léo', avatar: '🦊', updatedAt: 100, settings: { voiceAuto: true, unlockAll: false } } };
  var B = { a: { name: 'Léonard', avatar: '🐻', updatedAt: 200, settings: { voiceAuto: false } } };
  r = M(A, B);
  check(r.a.updatedAt === 200, 'updatedAt = max');
  check(r.a.name === 'Léonard' && r.a.avatar === '🐻', 'prénom/avatar du côté le plus récent');
  same(r.a.settings, { voiceAuto: false, unlockAll: false }, 'settings = bloc du plus récent (complété par défauts)');
  same(M(B, A), r, 'commutative (updatedAt différents)');
  r = M({ a: { updatedAt: 300 } }, { a: { name: 'Léo', updatedAt: 5 } });
  check(r.a.name === 'Léo', 'champ absent chez le gagnant → valeur de l\'autre');
  r = M({ a: { updatedAt: 'x' } }, { a: { updatedAt: NaN } });
  check(r.a.updatedAt === 0, 'updatedAt invalide → 0');

  // égalité d'updatedAt : champ par champ, JSON le plus grand, identique dans les deux sens
  var T1 = { a: { name: 'Léo', avatar: '🐻', updatedAt: 7 } };
  var T2 = { a: { name: 'Leo', avatar: '🦊', updatedAt: 7 } };
  same(M(T1, T2), M(T2, T1), 'commutative à updatedAt égal');
  check(M(T1, T2).a.name === (JSON.stringify('Léo') > JSON.stringify('Leo') ? 'Léo' : 'Leo'), 'égalité : JSON le plus grand');

  // progression
  var L = { a: { progress: { l01: { stars: 2, bestErrors: 3, plays: 4, lastPlayed: '2026-09-20' }, l02: { stars: 1, plays: 1 } } } };
  var R = { a: { progress: { l01: { stars: 3, bestErrors: 5, plays: 2, lastPlayed: '2026-09-25' }, l03: { stars: 0, bestErrors: 9, plays: 1 } } } };
  r = M(L, R);
  same(r.a.progress.l01, { stars: 3, bestErrors: 3, plays: 4, lastPlayed: '2026-09-25' }, 'leçon : max étoiles, min erreurs, max parties, date récente');
  same(Object.keys(r.a.progress).sort(), ['l01', 'l02', 'l03'], 'union des leçons');
  check(r.a.progress.l02.bestErrors === undefined, 'bestErrors absents des deux côtés → absent');
  check(r.a.progress.l03.bestErrors === 9, 'bestErrors d\'un seul côté gardé');
  r = M({ a: { progress: { l01: { stars: 7 } } } }, {});
  check(r.a.progress.l01.stars === 3, 'étoiles bornées à 3');
  r = M({ a: { progress: { l01: { stars: -2, plays: 'x', bestErrors: NaN } } } }, { a: { progress: { l01: { stars: 1, bestErrors: 2 } } } });
  same(r.a.progress.l01, { stars: 1, bestErrors: 2, plays: 0 }, 'nombres invalides traités comme absents');
  r = M({ a: { progress: { lXX: { stars: 1, extra: 'futur' } } } }, {});
  check(r.a.progress.lXX && r.a.progress.lXX.extra === 'futur', 'leçon inconnue et champs futurs gardés');
  r = M({ a: { progress: { l01: { stars: 1, plays: 3 } } } }, { a: { progress: { l01: { stars: 1, plays: 3 } } } });
  check(r.a.progress.l01.plays === 3, 'parties : max, pas la somme');

  // série
  function st(a, b) { return M({ a: { streak: a } }, { a: { streak: b } }).a.streak; }
  same(st({ days: 3, last: '2026-09-27' }, { days: 5, last: '2026-09-20' }), { days: 3, last: '2026-09-27' }, 'série : last le plus récent gagne');
  same(st({ days: 3, last: '2026-09-27' }, { days: 5, last: '2026-09-27' }), { days: 5, last: '2026-09-27' }, 'série : même jour → max');
  same(st({ days: 1, last: '2026-09-28' }, { days: 4, last: '2026-09-27' }), { days: 5, last: '2026-09-28' }, 'série : perdant la veille → +1');
  same(st({ days: 6, last: '2026-09-28' }, { days: 4, last: '2026-09-27' }), { days: 6, last: '2026-09-28' }, 'série : veille, gagnant déjà plus long');
  same(st({ days: 1, last: '2026-03-01' }, { days: 9, last: '2026-02-28' }), { days: 10, last: '2026-03-01' }, 'série : veille à cheval sur un mois');
  same(st({ days: 1, last: '2026-03-30' }, { days: 2, last: '2026-03-29' }), { days: 3, last: '2026-03-30' }, 'série : veille autour de l\'heure d\'été');
  same(st({ days: 2, last: null }, { days: 1, last: '2026-09-01' }), { days: 1, last: '2026-09-01' }, 'série : last null perd toujours');
  same(st(undefined, undefined), { days: 0, last: null }, 'série absente → défaut');
  same(st({ days: 2, last: null }, { days: 4, last: null }), { days: 4, last: null }, 'série : deux last null → max');

  // champs inconnus (futurs)
  r = M({ a: { updatedAt: 1, couleur: 'bleu' } }, { a: { updatedAt: 2, couleur: 'rouge' } });
  check(r.a.couleur === 'rouge', 'champ inconnu : côté gagnant');
  r = M({ a: { updatedAt: 3, couleur: 'bleu' } }, { a: { updatedAt: 2, forme: 'rond' } });
  check(r.a.couleur === 'bleu' && r.a.forme === 'rond', 'champ inconnu : à défaut de l\'autre');
})();

// ================= robustesse et pureté =================
(function () {
  [undefined, null, {}, [], 'x', 42].forEach(function (x) {
    throwsNot(function () { M(x, V1); M(V1, x); M(x, x); }, 'entrée ' + JSON.stringify(x));
  });
  same(M(null, undefined), {}, 'null + undefined → {}');
  throwsNot(function () { M({ a: null, b: 'x', c: [] }, { a: { progress: null, streak: 'x', settings: [] } }); }, 'profils de formes bizarres');
  var r = M({ a: null }, {});
  check(r.a && r.a.progress && r.a.streak && r.a.settings, 'profil null → complet');
  r = M({ a: { settings: { voiceAuto: true } } }, {});
  check(r.a.settings.unlockAll === false && r.a.settings.voiceAuto === true, 'settings sans unlockAll complété');
  r = M({ __proto__: null, a: { progress: { __proto__: { stars: 3 } } } }, {});
  check(r.a && !Object.prototype.stars, 'pas de pollution de prototype');

  var a = deepFreeze(JSON.parse(JSON.stringify(V1)));
  var b = deepFreeze({ p1: { updatedAt: 9, name: 'Léo', progress: { l01: { stars: 1 } } } });
  throwsNot(function () { M(a, b); }, 'entrées gelées (pureté)');
  same(a, V1, 'entrée locale non modifiée');
  r = M(a, b);
  r.p1.progress.l01.stars = 0; r.p1.streak.days = 99;
  same(a, V1, 'le résultat ne partage pas d\'objets avec l\'entrée');
})();

// ================= propriétés sur des cas générés =================
(function () {
  var seed = 12345;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  var DAYS = [undefined, null, '2026-09-20', '2026-09-26', '2026-09-27', '2026-09-28', 'bad'];
  function genLesson() {
    var o = {};
    if (rnd() < 0.9) o.stars = pick([0, 1, 2, 3, 5, -1, NaN, '2']);
    if (rnd() < 0.7) o.bestErrors = pick([0, 1, 2, 7, undefined, null]);
    if (rnd() < 0.8) o.plays = pick([0, 1, 2, 9]);
    if (rnd() < 0.8) o.lastPlayed = pick(DAYS);
    return o;
  }
  function genProfile() {
    if (rnd() < 0.05) return null;
    var p = {};
    if (rnd() < 0.8) p.name = pick(['Léo', 'Leo', 'Zoé', '']);
    if (rnd() < 0.5) p.avatar = pick(['🦊', '🐰']);
    if (rnd() < 0.7) p.createdAt = pick(DAYS);
    if (rnd() < 0.6) p.updatedAt = pick([0, 5, 10, 10, undefined]);
    if (rnd() < 0.6) p.settings = { voiceAuto: rnd() < 0.5, unlockAll: rnd() < 0.5 };
    if (rnd() < 0.3) p.futur = pick(['a', 'b', 1]);
    if (rnd() < 0.9) {
      p.progress = {};
      ['l01', 'l02', 'l03', 'l04'].forEach(function (l) { if (rnd() < 0.6) p.progress[l] = genLesson(); });
    }
    if (rnd() < 0.8) p.streak = { days: pick([0, 1, 3, 8]), last: pick(DAYS) };
    return p;
  }
  function genFamily() {
    var f = {};
    ['p1', 'p2', 'p-abcdefgh'].forEach(function (id) { if (rnd() < 0.6) f[id] = genProfile(); });
    return f;
  }
  function starsOf(f, id, l) { var p = f && f[id]; var e = p && p.progress && p.progress[l]; var s = e && e.stars; return typeof s === 'number' && isFinite(s) && s >= 0 ? Math.min(3, Math.floor(s)) : 0; }
  function numOf(f, id, l, k) { var p = f && f[id]; var e = p && p.progress && p.progress[l]; var s = e && e[k]; return typeof s === 'number' && isFinite(s) && s >= 0 ? Math.floor(s) : undefined; }
  function progressOnly(f) {
    var o = {};
    Object.keys(f).forEach(function (id) { o[id] = { progress: f[id].progress, createdAt: f[id].createdAt, updatedAt: f[id].updatedAt }; });
    return o;
  }

  var N = 400, bad = { idem: 0, idem2: 0, comm: 0, assoc: 0, mono: 0, ids: 0 };
  for (var i = 0; i < N; i++) {
    var a = genFamily(), b = genFamily(), c = genFamily();
    var ab = M(a, b), ba = M(b, a);
    if (S.canon(M(a, a)) !== S.canon(M(a, {}))) bad.idem++;
    if (S.canon(M(ab, b)) !== S.canon(ab) || S.canon(M(ab, ab)) !== S.canon(ab)) bad.idem2++;
    if (S.canon(ab) !== S.canon(ba)) bad.comm++;
    if (S.canon(progressOnly(M(ab, c))) !== S.canon(progressOnly(M(a, M(b, c))))) bad.assoc++;
    [a, b].forEach(function (src) {
      Object.keys(src).forEach(function (id) {
        if (!ab[id]) { bad.ids++; return; }
        var pr = src[id] && src[id].progress;
        if (pr && typeof pr === 'object') Object.keys(pr).forEach(function (l) {
          if (!ab[id].progress[l]) { bad.ids++; return; }
          if (starsOf(ab, id, l) < starsOf(src, id, l)) bad.mono++;
          var e = numOf(src, id, l, 'bestErrors');
          if (e !== undefined && !(numOf(ab, id, l, 'bestErrors') <= e)) bad.mono++;
          var pl = numOf(src, id, l, 'plays');
          if (pl !== undefined && numOf(ab, id, l, 'plays') < pl) bad.mono++;
        });
      });
    });
  }
  check(bad.idem === 0, 'idempotente merge(a,a) ≡ a normalisé (' + bad.idem + ' contre-exemples)');
  check(bad.idem2 === 0, 'idempotente merge(merge(a,b),b) ≡ merge(a,b) (' + bad.idem2 + ')');
  check(bad.comm === 0, 'commutative (' + bad.comm + ')');
  check(bad.assoc === 0, 'associative sur la progression, 3 téléphones (' + bad.assoc + ')');
  check(bad.mono === 0, 'monotone : étoiles ≥, erreurs ≤, parties ≥ (' + bad.mono + ')');
  check(bad.ids === 0, 'aucun profil ni leçon ne disparaît (' + bad.ids + ')');
})();

// ================= scénario : deux téléphones, hors ligne =================
(function () {
  var dad = M(V1, {});
  var mom = JSON.parse(JSON.stringify(dad));
  // lundi 27 sur papa, mardi 28 sur maman (hors ligne) : l02 améliorée des deux côtés
  dad.p1.progress.l02 = { stars: 3, bestErrors: 1, plays: 2, lastPlayed: '2026-09-27' };
  mom.p1.progress.l02 = { stars: 2, bestErrors: 0, plays: 3, lastPlayed: '2026-09-28' };
  mom.p1.progress.l03 = { stars: 1, bestErrors: 6, plays: 1, lastPlayed: '2026-09-28' };
  mom.p1.streak = { days: 1, last: '2026-09-28' };   // maman ne connaissait pas la série de papa
  var r = M(dad, mom);
  same(r.p1.progress.l02, { stars: 3, bestErrors: 0, plays: 3, lastPlayed: '2026-09-28' }, 'scénario : meilleure leçon des deux côtés');
  check(r.p1.progress.l03.stars === 1, 'scénario : nouvelle leçon gardée');
  same(r.p1.streak, { days: 4, last: '2026-09-28' }, 'scénario : la série continue sur deux téléphones');
  same(M(r, dad), r, 'scénario : resynchroniser ne change rien');
})();

// ================= collisions d'ids à la jonction (§9.5) =================
(function () {
  var n = 0;
  function newId() { n++; return 'p-new0000' + n; }
  var remote = { p1: { name: 'Léo', createdAt: '2026-09-20', progress: { l01: { stars: 3 } } } };

  var res = S.resolveJoinCollisions({ p1: { name: ' leo ', createdAt: '2026-09-25' } }, remote, newId);
  same(res.renamed, {}, 'même prénom normalisé (« Léo » = « leo ») → même enfant');
  check(!!res.profiles.p1, 'même enfant : id gardé');

  res = S.resolveJoinCollisions({ p1: { name: 'Zoé', createdAt: '2026-09-25', progress: { l01: { stars: 1 } } } }, remote, newId);
  check(res.renamed.p1 === 'p-new00001', 'prénoms et createdAt différents → re-id du local');
  check(!res.profiles.p1 && res.profiles['p-new00001'].id === 'p-new00001' && res.profiles['p-new00001'].name === 'Zoé', 'profil local renommé, contenu gardé');
  var merged = M(res.profiles, remote);
  check(merged.p1.name === 'Léo' && merged.p1.progress.l01.stars === 3 && merged['p-new00001'].progress.l01.stars === 1,
    'après re-id : les deux enfants coexistent sans mélange');

  res = S.resolveJoinCollisions({ p1: { name: 'Zoé', createdAt: '2026-09-20' } }, remote, newId);
  check(!!res.renamed.p1, 'prénoms différents, createdAt identique → enfants différents aussi');

  res = S.resolveJoinCollisions({ 'p-k3x9q02m': { name: 'Autre' } }, { 'p-k3x9q02m': { name: 'Zoé' } }, newId);
  same(res.renamed, {}, 'id aléatoire → même enfant (renommage)');

  res = S.resolveJoinCollisions({ p2: { name: 'Zoé' } }, remote, newId);
  same(res.renamed, {}, 'id seulement en local → rien à faire');
  check(!!res.profiles.p2, 'id seulement en local gardé');

  var seen = [];
  res = S.resolveJoinCollisions({ p1: { name: 'A' } }, { p1: { name: 'B' }, 'p-aaaaaaaa': {} }, function (isTaken) {
    var c = ['p-aaaaaaaa', 'p-bbbbbbbb'].filter(function (x) { seen.push(x); return !isTaken(x); })[0];
    return c;
  });
  check(res.renamed.p1 === 'p-bbbbbbbb', 'le nouvel id évite les ids distants existants');
  var local = deepFreeze({ p1: { name: 'Zoé' } });
  throwsNot(function () { S.resolveJoinCollisions(local, remote, newId); }, 'resolveJoinCollisions ne modifie pas ses entrées');
  throwsNot(function () { S.resolveJoinCollisions(null, undefined); }, 'resolveJoinCollisions : entrées vides');
  res = S.resolveJoinCollisions({ p1: { name: 'Zoé' } }, remote);
  check(S.RANDOM_ID_RE.test(res.renamed.p1), 'générateur d\'id par défaut');
})();

// ================= ids de profil =================
(function () {
  var ids = {};
  for (var i = 0; i < 500; i++) {
    var id = S.newProfileId(ids);
    check(S.RANDOM_ID_RE.test(id) && !ids[id], 'id « p-xxxxxxxx » unique : ' + id);
    ids[id] = true;
  }
  // boucle tant que l'id est pris
  var seq = [[0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1]], k = 0;
  function fixed() { return Uint8Array.from(seq[Math.min(k++, 1)].concat(seq[Math.min(k - 1, 1)])); }
  var id2 = S.newProfileId({ 'p-00000000': {} }, fixed);
  check(id2 === 'p-11111111', 'id déjà pris → nouveau tirage');
})();

// ================= code famille (§9.8) =================
(function () {
  var codes = {};
  var CODE = /^PIANO-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/;
  for (var i = 0; i < 300; i++) {
    var c = S.generateCode();
    check(CODE.test(c), 'format du code : ' + c);
    check(S.DOC_ID_RE.test(c), 'code conforme à la règle Firestore : ' + c);
    check(!codes[c], 'codes différents');
    codes[c] = true;
  }
  check(S.ALPHABET.length === 31 && !/[01OIL]/.test(S.ALPHABET), 'alphabet de 31 signes sans 0 O 1 I L');
  check(15 * Math.log2(S.ALPHABET.length) >= 60, 'entropie ≥ 60 bits (' + (15 * Math.log2(31)).toFixed(1) + ')');
  // rejet des octets ≥ 248 : un tirage « 255 » est ignoré
  var calls = 0;
  var c2 = S.generateCode(function (n) { calls++; var a = new Uint8Array(n); a.fill(calls === 1 ? 255 : 0); return a; });
  check(c2 === 'PIANO-22222-22222-22222' && calls === 2, 'octets ≥ 248 rejetés (pas de biais)');
  // répartition grossière
  var hist = {};
  for (i = 0; i < 2000; i++) S.generateCode().replace(/^PIANO-/, '').replace(/-/g, '').split('').forEach(function (ch) { hist[ch] = (hist[ch] || 0) + 1; });
  var vals = Object.keys(hist).map(function (k) { return hist[k]; });
  check(Object.keys(hist).length === 31 && Math.min.apply(null, vals) > 700 && Math.max.apply(null, vals) < 1250, 'tirage à peu près uniforme');

  var ok = 'PIANO-7KQ3M-XH9PT-R4WZC';
  function norm(s) { return S.normalizeCode(s); }
  [ok, 'piano-7kq3m-xh9pt-r4wzc', ' PIANO 7KQ3M XH9PT R4WZC ', 'PIANO7KQ3MXH9PTR4WZC', '7KQ3MXH9PTR4WZC', '7kq3m-xh9pt-r4wzc',
   'PIANO--7KQ3M--XH9PT--R4WZC', '7KQ3M XH9PT R4WZC', 'Piano-7KQ3-MXH9P-TR4WZC',
   'Code famille Petit Piano : PIANO-7KQ3M-XH9PT-R4WZC\nSur l\'autre téléphone : ouvre Petit Piano, puis « J\'ai déjà un code ». (À garder entre parents.)',
   'Code famille Petit Piano : PIANO-7KQ3M-XH9PT-R4WZC Sur l\'autre téléphone : ouvre Petit Piano',
   'Code famille Petit Piano : PIANO-7KQ3M-XH9PT-R4WZCSur l\'autre téléphone : ouvre Petit Piano, puis « J\'ai déjà un code ».'
  ].forEach(function (s) {
    var r = norm(s);
    check(r.ok && r.code === ok, 'normalisation : ' + JSON.stringify(s) + ' → ' + JSON.stringify(r));
  });
  [['PIANO-7KQ3M-XH9PT-R4WZ', 'format'], ['7KQ3MXH9PTR4WZCC', 'format'], ['', 'format'], [null, 'format'], ['bonjour', 'format'],
   ['PIANO-7KQ3M-XH9PT-R4WZ0', 'chars'], ['PIANO-7KQ3O-XH9PT-R4WZC', 'chars'], ['PIANO-7KQ31-XH9PT-R4WZC', 'chars'],
   ['PIANO-7KQ3I-XH9PT-R4WZC', 'chars'], ['piano-7kq3l-xh9pt-r4wzc', 'chars']
  ].forEach(function (x) {
    var r = norm(x[0]);
    check(!r.ok && r.error === x[1], 'code refusé (' + x[1] + ') : ' + JSON.stringify(x[0]) + ' → ' + JSON.stringify(r));
  });
  check(norm(ok).code.length === 23 && S.DOC_ID_RE.test(norm(ok).code), 'code normalisé conforme à la règle Firestore');
})();

console.log((failures ? '✗ ' : '✓ ') + passes + ' vérifications réussies, ' + failures + ' échec(s).');
process.exit(failures ? 1 : 0);
