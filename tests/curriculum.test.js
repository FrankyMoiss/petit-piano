/* Vérification des données du programme (fautes de frappe dans les suites, paroles, champs manquants).
 * Lancer : node tests/curriculum.test.js
 */
'use strict';
var PP = require('../js/notes.js');
var CURRICULA = require('../js/curriculum.js');

var failures = 0, passes = 0;
function check(cond, msg) {
  if (cond) passes++;
  else { failures++; console.log('ÉCHEC : ' + msg); }
}

var ILLUS = ['posture', 'bubbleHand', 'fingerNumbers', 'repeatNote', 'cPosition', 'thumbUnder', 'leftThumb'];
var EXPECTED_LENGTHS = { 'l04/5': 22, 'l06/4': 14, 'l07/5': 30, 'l09/8': 32 };

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
check(cur.lessons.length === 9, '9 leçons');

// Mélodies de référence (DESIGN, revue du critique)
function names(seq) { return PP.parseSeq(seq).map(function (n) { return PP.NOTES[n.pc].fr; }).join(' '); }
check(names(cur.lessons[3].steps[4].seq).indexOf('Do Do Do Ré Mi Ré Do Mi Ré Ré Do') === 0, 'Au clair de la lune : mélodie');
check(names(cur.lessons[5].steps[3].seq) === 'Do Ré Mi Do Do Ré Mi Do Mi Fa Sol Mi Fa Sol', 'Frère Jacques début : mélodie');

// parseSeq : format compact
var p = PP.parseSeq('C4-1 E4-3:2 G3-g1 F#4 C5-5:0.5');
check(p[0].midi === 60 && p[0].finger === 1 && p[0].hand === 'R' && p[0].beats === 1, 'parseSeq C4-1');
check(p[1].midi === 64 && p[1].beats === 2, 'parseSeq E4-3:2');
check(p[2].midi === 55 && p[2].pc === 7 && p[2].hand === 'L' && p[2].finger === 1, 'parseSeq G3-g1');
check(p[3].midi === 66 && p[3].finger === null, 'parseSeq F#4 sans doigt');
check(p[4].midi === 72 && p[4].beats === 0.5, 'parseSeq C5-5:0.5');

console.log('\n' + passes + ' vérifications réussies, ' + failures + ' échec(s).');
if (failures > 0) process.exit(1);
