/* Vérification des données du programme (fautes de frappe dans les suites, paroles, champs manquants).
 * Lancer : node tests/curriculum.test.js
 */
'use strict';
var PP = require('../js/notes.js');
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var execSync = require('child_process').execSync;
var CURRICULA = require('../js/curriculum.js');

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('ÉCHEC : ' + msg); }
}

var ILLUS = ['posture', 'bubbleHand', 'fingerNumbers', 'repeatNote', 'cPosition', 'thumbUnder', 'leftThumb', 'leftHand'];
var EXPECTED_LENGTHS = { 'l04/5': 22, 'l06/4': 14, 'l07/5': 30, 'l09/8': 32,
  'l10/6': 8, 'l10/7': 16, 'l11/2': 16, 'l11/3': 9, 'l11/4': 7, 'l11/5': 16, 'l11/6': 32, 'l12/7': 9, 'l13/7': 25,
  'l14/3': 9, 'l14/4': 12, 'l14/5': 7, 'l14/6': 19, 'l15/3': 10, 'l15/4': 8, 'l15/5': 18, 'l15/6': 37,
  'l16/6': 25, 'l16/7': 51, 'l17/4': 5, 'l17/5': 9, 'l17/7': 12, 'l17/8': 16, 'l17/9': 28,
  'l18/2': 7, 'l18/5': 6, 'l18/6': 13, 'l18/7': 13, 'l18/8': 26, 'l18/9': 26 };

var cur = CURRICULA.grand;
var ids = {};
cur.lessons.forEach(function (lesson) {
  check(!ids[lesson.id], lesson.id + ' : identifiant unique');
  ids[lesson.id] = true;
  check(lesson.title && lesson.emoji && lesson.doneText, lesson.id + ' : titre, emoji, doneText');
  var from = PP.midiFromName(lesson.keyboard.from), to = PP.midiFromName(lesson.keyboard.to);
  var phone = lesson.keyboard.phone;
  var pFrom = phone ? PP.midiFromName(phone.from) : from, pTo = phone ? PP.midiFromName(phone.to) : to;

  lesson.steps.forEach(function (step, i) {
    var where = lesson.id + '/' + (i + 1);
    check(['info', 'find', 'sequence'].indexOf(step.type) >= 0, where + ' : type connu');
    check(typeof step.text === 'string' && step.text.length > 0, where + ' : text');
    check(typeof step.say === 'string' && step.say.length > 0, where + ' : say');
    if (step.illus) check(ILLUS.indexOf(step.illus) >= 0, where + ' : illustration connue (' + step.illus + ')');
    if (step.keys) {
      try { PP.parseSeq(step.keys); passes++; } catch (e) { check(false, where + ' : keys — ' + e.message); }
    }
    if (step.type === 'find') {
      check(step.count > 0 && step.accept && step.accept.length > 0, where + ' : accept + count');
      step.accept.forEach(function (n) {
        try { PP.pcFromName(n); passes++; } catch (e) { check(false, where + ' : ' + e.message); }
      });
    }
    if (step.type === 'sequence') {
      var notes;
      try { notes = PP.parseSeq(step.seq); } catch (e) { check(false, where + ' : seq — ' + e.message); return; }
      notes.forEach(function (n) {
        check(n.midi >= from && n.midi <= to, where + ' : note ' + n.midi + ' dans la plage tablette');
        check(n.midi >= pFrom && n.midi <= pTo, where + ' : note ' + n.midi + ' dans la plage téléphone');
        check(n.finger !== null, where + ' : doigt indiqué pour chaque note');
      });
      if (step.lyrics) {
        var ly = step.lyrics.split('|').length;
        check(ly === notes.length, where + ' : ' + ly + ' syllabes pour ' + notes.length + ' notes');
      }
      if (EXPECTED_LENGTHS[where]) {
        check(notes.length === EXPECTED_LENGTHS[where], where + ' : ' + notes.length + ' notes (attendu ' + EXPECTED_LENGTHS[where] + ')');
      }
    }
  });
});
check(cur.lessons.length === 18, '18 leçons');
cur.lessons.forEach(function (l, i) {
  var id = 'l' + (i + 1 < 10 ? '0' : '') + (i + 1);
  check(l.id === id, 'leçon ' + (i + 1) + ' : id ' + l.id + ' (attendu ' + id + ')');
  check(l.num === i + 1, l.id + ' : num = index + 1');
});

// Plage téléphone (même calcul que keyboard.js) : ≤ 9 touches blanches pour chaque leçon.
function whiteCount(from, to) { var n = 0; for (var m = from; m <= to; m++) if (!PP.isBlack(m)) n++; return n; }
cur.lessons.forEach(function (l) {
  var r = l.keyboard.phone || l.keyboard;
  var wc = whiteCount(PP.midiFromName(r.from), PP.midiFromName(r.to));
  check(wc <= 9, l.id + ' : ' + wc + ' blanches sur téléphone (≤ 9)');
  // Niveau 2 : toutes les touches marquées (keys) aussi dans la plage téléphone
  // (au Niveau 1, l02 montre volontairement les 3 Do ; ceux hors plage sont simplement ignorés)
  if (cur.lessons.indexOf(l) < 9) return;
  l.steps.forEach(function (st, i) {
    if (!st.keys) return;
    PP.parseSeq(st.keys).forEach(function (n) {
      check(n.midi >= PP.midiFromName(r.from) && n.midi <= PP.midiFromName(r.to), l.id + '/' + (i + 1) + ' : touche ' + n.midi + ' visible sur téléphone');
    });
  });
});

// Niveaux
var lv = cur.levels || [];
check(lv.length === 2, '2 niveaux');
var lastIdx = -1;
lv.forEach(function (level) {
  var idx = cur.lessons.findIndex(function (l) { return l.id === level.first; });
  check(idx > lastIdx, 'niveau ' + level.num + ' : first ' + level.first + ' existe, dans l\'ordre');
  check(level.title && level.subtitle && level.emoji, 'niveau ' + level.num + ' : titre, sous-titre, emoji');
  lastIdx = idx;
});
check(lv[0] && lv[0].first === 'l01' && lv[1] && lv[1].first === 'l10', 'niveaux : l01 puis l10');

// l01–l09 inchangées : comparaison avec la version de git HEAD (progression stockée par id).
var headSrc = null;
try {
  headSrc = execSync('git show HEAD:js/curriculum.js', { cwd: path.join(__dirname, '..'), stdio: ['ignore', 'pipe', 'ignore'] }).toString();
} catch (e) { console.log('(git indisponible : comparaison avec HEAD sautée)'); }
if (headSrc) {
  var sandbox = {};
  vm.runInNewContext(headSrc, { globalThis: sandbox, module: undefined });
  var headCur = sandbox.CURRICULA.grand;
  if (headCur.lessons.length === 9) {
    headCur.lessons.forEach(function (old, i) {
      check(JSON.stringify(cur.lessons[i]) === JSON.stringify(old), old.id + ' : identique à HEAD');
    });
  } else {
    // HEAD contient déjà le Niveau 2 : toutes ses leçons doivent être conservées à l'identique
    headCur.lessons.forEach(function (old, i) {
      check(cur.lessons[i] && cur.lessons[i].id === old.id, old.id + ' : id conservé à la même place que HEAD');
      if (i < 9) check(JSON.stringify(cur.lessons[i]) === JSON.stringify(old), old.id + ' : identique à HEAD');
    });
  }
}

// Titres du Niveau 2 (DESIGN §10.1) et plus aucune comptine française
var L2_TITLES = ['La main gauche', 'When the Saints', 'Les deux pouces sur Do', 'Joyeux anniversaire', 'L\'air des briques',
  'Korobeïniki en entier', 'Jingle Bells', 'La Lettre à Élise', 'Le roi de la montagne'];
L2_TITLES.forEach(function (title, k) { check(cur.lessons[9 + k] && cur.lessons[9 + k].title === title, 'l' + (10 + k) + ' : titre « ' + title + ' »'); });
var OLD_SONGS = ['Au clair de la lune', 'Frère Jacques', 'Ah ! vous dirai-je maman', 'Ode à la joie', 'À la claire fontaine'];
cur.lessons.slice(9).forEach(function (l) {
  check(OLD_SONGS.indexOf(l.title) < 0, l.id + ' : pas de comptine française (titre)');
  l.steps.forEach(function (st, i) {
    if (st.title) check(OLD_SONGS.indexOf(st.title) < 0, l.id + '/' + (i + 1) + ' : pas de comptine française (' + st.title + ')');
  });
});
// Aucun nom de jeu vidéo (marque) dans les textes
cur.lessons.forEach(function (l) {
  check(!/tetris/i.test(JSON.stringify(l)), l.id + ' : aucun nom de jeu vidéo');
});

// Touches noires : l17/2 accepte D#, l18/4 accepte A# ; doigtés imposés
function lessonById(id) { return cur.lessons.find(function (l) { return l.id === id; }); }
check(lessonById('l17').steps[1].accept.indexOf('D#') >= 0, 'l17/2 accepte D#');
check(lessonById('l18').steps[3].accept.indexOf('A#') >= 0, 'l18/4 accepte A#');
check(lessonById('l18').steps[8].tempo === 144, 'l18/9 : tempo 144');
cur.lessons.forEach(function (l) {
  l.steps.forEach(function (st, i) {
    if (st.type !== 'sequence') return;
    var where = l.id + '/' + (i + 1);
    PP.parseSeq(st.seq).forEach(function (n) {
      if (!PP.isBlack(n.midi)) return;
      check(l.id === 'l17' || l.id === 'l18', where + ' : touche noire seulement en l17–l18');
      if (l.id === 'l17') check(n.pc === 3 && n.hand === 'R' && n.finger === 4, where + ' : Ré♯ au doigt 4 droit');
      if (l.id === 'l18' && n.pc === 3) check(n.hand === 'R' && n.finger === 2, where + ' : Ré♯ au doigt 2 droit');
      if (l.id === 'l18' && n.pc === 10) check(n.hand === 'L' && n.finger === 2, where + ' : La♯ au doigt g2');
      if (l.id === 'l18') check(n.pc === 3 || n.pc === 10, where + ' : seulement Ré♯ / La♯');
    });
  });
});

// Un doigt = une touche dans chaque leçon du Niveau 2 (pas de déplacement de main en cours de leçon),
// sauf les glissements prévus sur la touche noire voisine (DESIGN §10.4).
cur.lessons.slice(9).forEach(function (l) {
  var map = {};
  l.steps.forEach(function (st, i) {
    if (st.type !== 'sequence') return;
    PP.parseSeq(st.seq).forEach(function (n) {
      var f = n.hand + n.finger;
      var white = PP.isBlack(n.midi) ? n.midi + 1 : n.midi;   // Ré♯ → Mi, La♯ → Si (glissement vers la noire)
      if (l.id === 'l17' && n.pc === 3) white = n.midi - 1;       // l17 : le doigt 4 passe de Ré à Ré♯
      if (l.id === 'l12' || l.id === 'l13') return;              // deux pouces sur Do : Do joué par 1 ou g1
      map[f] = map[f] || {};
      map[f][white] = true;
    });
  });
  Object.keys(map).forEach(function (f) {
    check(Object.keys(map[f]).length === 1, l.id + ' : le doigt ' + f + ' reste sur une seule touche (' + Object.keys(map[f]).join(',') + ')');
  });
});

// Toutes les suites du Niveau 2 : un doigt par note, doigts 1–5
cur.lessons.slice(9).forEach(function (l) {
  l.steps.forEach(function (st, i) {
    if (st.type !== 'sequence') return;
    PP.parseSeq(st.seq).forEach(function (n) {
      check(n.finger >= 1 && n.finger <= 5, l.id + '/' + (i + 1) + ' : doigt 1–5');
    });
  });
});

// Mélodies de référence (DESIGN, revue du critique)
function names(seq) { return PP.parseSeq(seq).map(function (n) { return PP.NOTES[n.pc].fr; }).join(' '); }
check(names(cur.lessons[3].steps[4].seq).indexOf('Do Do Do Ré Mi Ré Do Mi Ré Ré Do') === 0, 'Au clair de la lune : mélodie');
check(names(cur.lessons[5].steps[3].seq) === 'Do Ré Mi Do Do Ré Mi Do Mi Fa Sol Mi Fa Sol', 'Frère Jacques début : mélodie');

// Mélodies du Niveau 2 (DESIGN §10.4), en classes de hauteur
function step(id, n) { return lessonById(id).steps[n - 1].seq; }
check(names(step('l11', 6)) === ['Do Mi Fa Sol', 'Do Mi Fa Sol', 'Do Mi Fa Sol Mi Do Mi Ré', 'Mi Mi Ré Do Do Mi Sol Sol Fa',
  'Mi Fa Sol Mi Do Ré Do'].join(' '), 'When the Saints : mélodie');
check(names(step('l13', 7)) === 'Sol Sol La Sol Do Si Sol Sol La Sol Ré Do Sol Sol Sol Mi Do Si La Fa Fa Mi Do Ré Do', 'Joyeux anniversaire : mélodie');
check(names(step('l15', 6)) === ['Mi Si Do Ré Do Si La La Do Mi Ré Do Si Do Ré Mi Do La La',
  'Ré Fa La Sol Fa Mi Do Mi Ré Do Si Si Do Ré Mi Do La La'].join(' '), 'Korobeïniki : mélodie');
var JB1 = 'Si Si Si Si Si Si Si Ré Sol La Si', JBF = 'Do Do Do Do Do Si Si Si Si';
check(names(step('l16', 7)) === [JB1, JBF, 'Si La La Si La Ré', JB1, JBF, 'Ré Ré Do La Sol'].join(' '), 'Jingle Bells : mélodie');
var EM = 'Mi Ré♯ Mi Ré♯ Mi Si Ré Do La';
check(names(step('l17', 9)) === [EM, 'Mi La Si', EM, 'Mi La Si', 'Mi Do Si La'].join(' '), 'Lettre à Élise : mélodie');
check(names(step('l18', 8)) === 'La Si Do Ré Mi Do Mi Ré♯ Si Ré♯ Ré La♯ Ré La Si Do Ré Mi Do Mi La Sol Mi Do Mi Sol', 'Roi de la montagne : mélodie');
// Roi de la montagne = original de Grieg (Si mineur) transposé de −2 demi-tons, octave comprise
var TROLL_B_MINOR = [59, 61, 62, 64, 66, 62, 66, 65, 61, 65, 64, 60, 64, 59, 61, 62, 64, 66, 62, 66, 71, 69, 66, 62, 66, 69];
check(JSON.stringify(PP.parseSeq(step('l18', 8)).map(function (n) { return n.midi + 2 - 12; })) === JSON.stringify(TROLL_B_MINOR) ||
  JSON.stringify(PP.parseSeq(step('l18', 8)).map(function (n) { return n.midi + 2; })) === JSON.stringify(TROLL_B_MINOR), 'Roi de la montagne : intervalles de Grieg');
check(JSON.stringify(step('l18', 9)) === JSON.stringify(step('l18', 8)), 'l18/9 = l18/8 (plus vite)');
// Main gauche seule en L10–L11
cur.lessons.slice(9, 11).forEach(function (l) {
  l.steps.forEach(function (st) {
    if (st.type === 'sequence') PP.parseSeq(st.seq).forEach(function (n) { check(n.hand === 'L', l.id + ' : main gauche seule'); });
  });
});

// parseSeq : format compact
var p = PP.parseSeq('C4-1 E4-3:2 G3-g1 F#4 C5-5:0.5');
check(p[0].midi === 60 && p[0].finger === 1 && p[0].hand === 'R' && p[0].beats === 1, 'parseSeq C4-1');
check(p[1].midi === 64 && p[1].beats === 2, 'parseSeq E4-3:2');
check(p[2].midi === 55 && p[2].pc === 7 && p[2].hand === 'L' && p[2].finger === 1, 'parseSeq G3-g1');
check(p[3].midi === 66 && p[3].finger === null, 'parseSeq F#4 sans doigt');
check(p[4].midi === 72 && p[4].beats === 0.5, 'parseSeq C5-5:0.5');

console.log('\n' + passes + ' vérifications réussies, ' + failures + ' échec(s).');
if (failures > 0) process.exit(1);
