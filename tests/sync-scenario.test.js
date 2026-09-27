/* Petit Piano — scénarios de synchro à plusieurs téléphones (DESIGN §9.5, §9.7).
 * Charge storage.js + sync-config.js + sync.js dans des contextes « navigateur » simulés,
 * reliés à un faux Firestore en mémoire (préconditions updateTime / exists).
 * Lancer : node tests/sync-scenario.test.js
 */
'use strict';
var vm = require('vm'), fs = require('fs'), path = require('path');
var JS = path.join(__dirname, '..', 'js') + path.sep;

var passes = 0, failures = 0;
function check(cond, msg) { if (cond) passes++; else { failures++; console.log('✗ ' + msg); } }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Faux serveur Firestore. `failPost` : les écritures échouent (réseau coupé). */
function FakeFS() { this.docs = {}; this.t = 0; this.failPost = false; this.brokenBody = false; }
FakeFS.prototype.fetch = function (url, opts) {
  var self = this;
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (opts.method === 'POST' && self.failPost) return reject(new TypeError('Failed to fetch'));
      var reply = function (status, body) {
        resolve({ status: status, text: function () {
          // coupure pendant la lecture du corps (ou délai dépassé → AbortError)
          if (self.brokenBody) { var e = new Error('aborted'); e.name = 'AbortError'; return Promise.reject(e); }
          return Promise.resolve(JSON.stringify(body));
        } });
      };
      if (opts.method === 'GET') {
        var m = /documents\/familles\/([^?]+)\?/.exec(url);
        var d = self.docs[m[1]];
        return d ? reply(200, JSON.parse(JSON.stringify(d))) : reply(404, { error: { code: 404, status: 'NOT_FOUND' } });
      }
      var w = JSON.parse(opts.body).writes[0];
      var code = w.update.name.split('/').pop(), cur = self.docs[code], pre = w.currentDocument;
      if (pre && pre.exists === false && cur) return reply(409, { error: { status: 'ALREADY_EXISTS' } });
      if (pre && pre.updateTime) {
        if (!cur) return reply(404, { error: { status: 'NOT_FOUND' } });
        if (cur.updateTime !== pre.updateTime) return reply(400, { error: { status: 'FAILED_PRECONDITION' } });
      }
      var ut = '2026-09-27T10:00:00.' + String(++self.t).padStart(6, '0') + 'Z';
      w.update.fields.updatedAt = { timestampValue: ut };
      self.docs[code] = { name: w.update.name, fields: w.update.fields, updateTime: ut };
      reply(200, { commitTime: ut });
    }, 5);
  });
};

function makePhone(fsrv, initialLS) {
  var ls = Object.assign({}, initialLS || {}), listeners = {};
  var ctx = {
    console: console, setTimeout: setTimeout, clearTimeout: clearTimeout, Promise: Promise, JSON: JSON, Date: Date,
    Uint8Array: Uint8Array, Math: Math, Number: Number, String: String, Object: Object, Array: Array, Error: Error, RegExp: RegExp,
    localStorage: {
      getItem: function (k) { return k in ls ? ls[k] : null; },
      setItem: function (k, v) { ls[k] = String(v); },
      removeItem: function (k) { delete ls[k]; }
    },
    navigator: { onLine: true },
    crypto: require('crypto').webcrypto || { getRandomValues: function (a) { return require('crypto').randomFillSync(a); } },
    fetch: function (u, o) { return fsrv.fetch(u, o); },
    addEventListener: function (n, f) { (listeners[n] = listeners[n] || []).push(f); },
    document: { hidden: false, addEventListener: function (n, f) { (listeners[n] = listeners[n] || []).push(f); } }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  ['storage.js', 'sync-config.js', 'sync.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(JS + f, 'utf8'), ctx, { filename: f });
  });
  ctx.PP.SYNC_CONFIG.retryPauses = [10, 20, 30];
  ctx.PP.SYNC_CONFIG.errorRetryMs = 60000;
  ctx.PP.store.load();
  ctx.ls = ls;
  return ctx;
}

/** Téléphone resté en v1 : un seul enfant « p1 ». */
function v1(name, stars, created) {
  return { 'petitpiano.v1': JSON.stringify({ version: 1, activeProfile: 'p1', device: {}, profiles: { p1: {
    id: 'p1', name: name, createdAt: created, progress: { l01: { stars: stars, plays: 1 } }, streak: { days: 1, last: '2026-09-20' } } } }) };
}
function byName(phone) {
  var out = {}, ps = phone.PP.store.profiles();
  Object.keys(ps).forEach(function (id) { out[ps[id].name] = ps[id]; });
  return out;
}

(async function () {
  // 1. Jonction dont l'écriture échoue, puis un autre téléphone écrit un AUTRE enfant sous « p1 »
  var fsrv = new FakeFS();
  var dad = makePhone(fsrv);
  dad.PP.store.createProfile('Max');
  var code = await dad.PP.sync.create();
  var mom = makePhone(fsrv, v1('Zoé', 1, '2026-09-21'));
  fsrv.failPost = true;
  await mom.PP.sync.join(code); await wait(80);
  fsrv.failPost = false;
  check(mom.PP.store.syncState().pendingJoin === true, 'jonction non envoyée → pendingJoin reste vrai');
  check(mom.PP.store.syncState().lastState === 'offline', 'écriture impossible → état « hors ligne »');
  var gma = makePhone(fsrv, v1('Léo', 3, '2026-09-23'));
  await gma.PP.sync.join(code); await wait(80);
  check(gma.PP.store.syncState().pendingJoin === false, 'jonction envoyée → pendingJoin effacé');
  var st = await mom.PP.sync.run(); await wait(50);
  await gma.PP.sync.run(); await dad.PP.sync.run();
  [['maman', mom], ['mamie', gma], ['papa', dad]].forEach(function (x) {
    var n = byName(x[1]);
    check(n['Zoé'] && n['Léo'] && n['Max'] && Object.keys(x[1].PP.store.profiles()).length === 3, x[0] + ' : trois enfants distincts ' + JSON.stringify(Object.keys(n)));
    check(n['Zoé'] && n['Zoé'].progress.l01.stars === 1, x[0] + ' : Zoé garde 1★ (pas les étoiles de Léo)');
    check(n['Léo'] && n['Léo'].progress.l01.stars === 3, x[0] + ' : Léo garde 3★');
  });
  check(st === 'ok' && mom.PP.store.syncState().pendingJoin === false, 'maman : synchro ok puis pendingJoin effacé');
  var zoeId = byName(mom)['Zoé'].id;
  check(mom.PP.store.syncState && mom.PP.syncLib.RANDOM_ID_RE.test(zoeId) && JSON.parse(mom.ls['petitpiano.v1']).activeProfile === zoeId,
    'maman : Zoé reçoit un id aléatoire et reste le profil actif');

  // 2. Deux jonctions simultanées, sans panne réseau
  var fs2 = new FakeFS();
  var dad2 = makePhone(fs2);
  dad2.PP.store.createProfile('Max');
  var code2 = await dad2.PP.sync.create();
  var a = makePhone(fs2, v1('Zoé', 1, '2026-09-21')), b = makePhone(fs2, v1('Léo', 3, '2026-09-23'));
  await Promise.all([a.PP.sync.join(code2), b.PP.sync.join(code2)]); await wait(300);
  await a.PP.sync.run(); await b.PP.sync.run(); await dad2.PP.sync.run();
  [['A', a], ['B', b], ['papa', dad2]].forEach(function (x) {
    var n = byName(x[1]);
    check(n['Zoé'] && n['Léo'] && n['Zoé'].progress.l01.stars === 1 && n['Léo'].progress.l01.stars === 3 &&
      Object.keys(x[1].PP.store.profiles()).length === 3, 'jonctions simultanées, ' + x[0] + ' : Zoé 1★ et Léo 3★ séparés');
  });
  check(!a.PP.store.syncState().pendingJoin && !b.PP.store.syncState().pendingJoin, 'jonctions simultanées : pendingJoin effacés');

  // 3. Le même enfant sur deux téléphones (même prénom) : fusionné, pas dupliqué
  var fs3 = new FakeFS();
  var p1 = makePhone(fs3, v1('Léo', 2, '2026-09-21'));
  var code3 = await p1.PP.sync.create();
  var p2 = makePhone(fs3, v1('leo ', 3, '2026-09-22'));
  fs3.failPost = true; await p2.PP.sync.join(code3); await wait(50); fs3.failPost = false;
  await p2.PP.sync.run();
  check(Object.keys(p2.PP.store.profiles()).length === 1 && p2.PP.store.profiles().p1.progress.l01.stars === 3,
    'même enfant (prénom identique) : un seul profil, 3★');

  // 4. Coupure pendant la lecture du corps → « hors ligne » (pas « erreur ») ; nouvel essai programmé
  fs3.brokenBody = true;
  var err = null;
  await p2.PP.syncLib.getFamily(code3).catch(function (e) { err = e; });
  check(err && err.kind === 'offline', 'corps illisible → erreur typée « offline » (' + (err && err.message) + ')');
  p2.PP.SYNC_CONFIG.errorRetryMs = 40;
  var st4 = await p2.PP.sync.run();
  check(st4 === 'offline', 'run() : état « offline » et non « error »');
  fs3.brokenBody = false;
  await wait(150);
  check(p2.PP.store.syncState().lastState === 'ok', 'après un échec, nouvel essai automatique réussi');

  // 5. Quitter efface pendingJoin
  mom.PP.store.setSync({ pendingJoin: true });
  mom.PP.sync.leave();
  check(mom.PP.store.syncState().pendingJoin === false && !mom.PP.store.syncState().familyCode, 'quitter : plus de code, plus de jonction en attente');

  console.log((failures ? '✗ ' : '✓ ') + passes + ' vérifications réussies, ' + failures + ' échec(s).');
  process.exit(failures ? 1 : 0);
})().catch(function (e) { console.log('✗ exception', e); process.exit(1); });
