/* Petit Piano — moteur de leçon (écran E4) : étapes info / find / sequence, erreurs, combo.
 * Tout le texte vient des données (curriculum.js) ou de strings.js.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};
  var t = function (k, v) { return PP.t(k, v); };
  var $ = function (id) { return document.getElementById(id); };

  var PRAISE_MS = 700;
  var SILENCE_HELP_MS = 12000;

  /** Étoiles (DESIGN §3.7) : N notes à jouer, E erreurs. */
  PP.starsFor = function (N, E) {
    if (E <= Math.max(1, 0.1 * N)) return 3;
    if (E <= Math.max(3, 0.3 * N)) return 2;
    return 1;
  };

  /** Nombre de notes à jouer dans une leçon (étapes find + sequence). */
  PP.lessonNoteCount = function (lesson) {
    return lesson.steps.reduce(function (n, s) {
      if (s.type === 'find') return n + s.count;
      if (s.type === 'sequence') return n + PP.parseSeq(s.seq).length;
      return n;
    }, 0);
  };

  var S = null;          // état de la leçon en cours
  var kb = null;         // clavier (créé une fois)

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function noteName(pc) { return PP.NOTES[pc].fr; }

  function currentStep() { return S.lesson.steps[S.stepIndex]; }

  // ---------- clavier ----------

  function lessonMidis(lesson) {
    var out = [];
    lesson.steps.forEach(function (s) {
      PP.parseSeq(s.keys).concat(PP.parseSeq(s.seq)).forEach(function (n) { out.push(n.midi); });
    });
    return out;
  }

  function updateRange() {
    if (!S) return;
    var box = $('lesson-keyboard');
    var r = PP.keyboardRange(S.lesson.keyboard, S.midis, box.clientWidth);
    var cur = kb.range();
    if (cur.from !== r.from || cur.to !== r.to) kb.setRange(r.from, r.to);
  }

  function onKeyPress(midi) {
    if (!S) return;
    if (S.demo) S.demo.stop();
    PP.synth.play(midi);
    var step = currentStep();
    if (S.busy || step.type === 'info') return;
    handleNote({ pc: midi % 12, midi: midi, source: 'tap' });
  }

  /** Cible actuelle : { pcs, midi, finger, hand } */
  function currentTarget() {
    var step = currentStep();
    if (step.type === 'sequence') {
      var n = S.seq[S.pos];
      return { pcs: [n.pc], midi: n.midi, finger: n.finger, hand: n.hand, pc: n.pc };
    }
    if (step.type === 'find') {
      var pcs = step.accept.map(PP.pcFromName);
      var keys = PP.parseSeq(step.keys);
      var midi = keys.length ? keys[0].midi : kb.nearestVisible(pcs[0], 60);
      return { pcs: pcs, midi: midi, pc: pcs[0] };
    }
    return null;
  }

  function targetMarks() {
    var step = currentStep();
    if (step.type === 'sequence') {
      var n = S.seq[S.pos];
      return { keys: n ? [n] : [], groups: '' };
    }
    return { keys: PP.parseSeq(step.keys), groups: step.groups || '' };
  }

  // ---------- rendu des étapes ----------

  function renderProgress() {
    var total = S.lesson.steps.length;
    $('lesson-progress-fill').style.width = (100 * S.stepIndex / total) + '%';
    $('lesson-progress-text').textContent = (S.stepIndex + 1) + '/' + total;
  }

  function renderCombo(pop) {
    var c = $('lesson-combo');
    c.textContent = S.combo >= 3 ? '🔥x' + S.combo : '';
    if (pop) {
      c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      if (S.combo >= 10) {
        var burst = el('span', 'burst', '✨');
        c.appendChild(burst);
        setTimeout(function () { burst.remove(); }, 800);
      }
    }
  }

  function renderStep() {
    var step = currentStep();
    var stage = $('lesson-stage');
    stage.innerHTML = '';
    stage.className = 'stage stage-' + step.type;
    S.errCount = 0;
    S.busy = false;
    renderProgress();

    if (step.type === 'info') {
      if (step.illus) stage.appendChild(el('div', 'illus', PP.illus(step.illus)));
      stage.appendChild(el('p', 'step-text', PP.ui.formatText(PP.ui.pickText(step))));
      var go = el('button', 'btn primary big continue', t('lesson.continue'));
      go.addEventListener('click', nextStep);
      stage.appendChild(go);
    }

    if (step.type === 'find') {
      S.hits = 0;
      stage.appendChild(el('p', 'step-text', PP.ui.formatText(PP.ui.pickText(step))));
      var pcs = step.accept.map(PP.pcFromName);
      var b = pcs.length === 1 ? PP.ui.noteBubble(pcs[0], 'bubble big find-bubble') : el('div', 'bubble big find-bubble neutral', '🎹');
      stage.appendChild(b);
      S.findBubble = b;
      var dots = el('div', 'dots');
      stage.appendChild(dots);
      S.dotsEl = dots;
      renderDots();
      stage.appendChild(el('p', 'feedback', ''));
    }

    if (step.type === 'sequence') {
      S.seq = PP.parseSeq(step.seq);
      S.pos = 0;
      var head = el('div', 'seq-head');
      if (step.song && step.title) head.appendChild(el('div', 'song-title', PP.ui.escape(step.title)));
      head.appendChild(el('p', 'step-text small', PP.ui.formatText(PP.ui.pickText(step))));
      var listen = el('button', 'btn secondary listen', t('lesson.listen'));
      listen.addEventListener('click', toggleDemo);
      head.appendChild(listen);
      S.listenBtn = listen;
      stage.appendChild(head);

      var viewport = el('div', 'bubbles-viewport');
      var track = el('div', 'bubbles-track');
      var lyrics = step.lyrics ? step.lyrics.split('|') : null;
      S.bubbles = S.seq.map(function (n, i) {
        var cell = el('div', 'bubble-cell');
        var bub = PP.ui.noteBubble(n.pc, 'bubble' + (n.hand === 'L' ? ' left' : ''));
        bub.appendChild(el('span', 'finger', (n.hand === 'L' ? 'g' : '') + (n.finger || '')));
        cell.appendChild(bub);
        if (lyrics) cell.appendChild(el('span', 'lyric', PP.ui.escape(lyrics[i])));
        track.appendChild(cell);
        return bub;
      });
      viewport.appendChild(track);
      stage.appendChild(viewport);
      S.track = track; S.viewport = viewport;
      stage.appendChild(el('p', 'prompt', ''));
      stage.appendChild(el('p', 'feedback', ''));
      renderSeqPos();
    }

    kb.setMarks(targetMarks());
    armListening();
    if (PP.ui.voiceAuto()) PP.voice.speak(PP.ui.pickSay(step));
  }

  function renderDots() {
    var step = currentStep();
    var s = '';
    for (var i = 0; i < step.count; i++) s += '<span class="dot' + (i < S.hits ? ' on' : '') + '"></span>';
    S.dotsEl.innerHTML = s + '<span class="dots-count">' + S.hits + ' / ' + step.count + '</span>';
  }

  function renderSeqPos() {
    S.bubbles.forEach(function (b, i) {
      b.classList.toggle('current', i === S.pos);
      b.classList.toggle('done', i < S.pos);
    });
    scrollBubbles(S.pos);
    var n = S.seq[S.pos];
    if (!n) {
      // fin de la rangée : plus de consigne ni de touche cible pendant les félicitations
      setText('.prompt', '');
      setText('.feedback', '');
      kb.setMarks({ keys: [], groups: '' });
      return;
    }
    var key = promptKey(n, S.seq);
    setText('.prompt', t(key, { note: noteName(n.pc), finger: n.finger }));
    setText('.feedback', '');
  }

  /** Consigne sous les bulles (DESIGN §10.3d) : « gauche »/« droit » seulement quand les deux mains se mélangent. */
  function promptKey(n, seq) {
    if (n.hand === 'L') return n.finger > 1 ? 'lesson.playLeftFinger' : 'lesson.playLeftThumb';
    if (!n.finger) return 'lesson.play';
    var mixed = seq.some(function (m) { return m.hand === 'L'; });
    return mixed ? 'lesson.playRightFinger' : 'lesson.playFinger';
  }

  /** Fait défiler la rangée pour garder la bulle i au tiers gauche. */
  function scrollBubbles(i) {
    var b = S.bubbles[i] || S.bubbles[S.bubbles.length - 1];
    var cell = b.parentNode;
    var vw = S.viewport.clientWidth, tw = S.track.scrollWidth;
    // rangée courte : centrée ; sinon bulle courante au tiers gauche
    var x = tw <= vw ? -(vw - tw) / 2 : Math.max(0, Math.min(cell.offsetLeft + cell.offsetWidth / 2 - vw / 3, tw - vw));
    S.track.style.transform = 'translateX(' + (-x) + 'px)';
  }

  function setText(sel, text, html) {
    var e = $('lesson-stage').querySelector(sel);
    if (!e) return;
    if (html) e.innerHTML = text; else e.textContent = text;
  }

  // ---------- micro ----------

  function armListening() {
    var tg = currentTarget();
    PP.mic.setTargets(tg ? tg.pcs : null);
    PP.mic.listen(!!tg && !S.busy && S.input === 'mic');
    resetSilenceTimer();
  }

  function resetSilenceTimer() {
    clearTimeout(S.silenceT);
    if (!currentTarget() || S.input !== 'mic') return;
    S.silenceT = setTimeout(function () {
      if (!S || S.busy) return;
      // cible lue au moment du message (après avancée éventuelle dans la rangée)
      var tg = currentTarget();
      if (!tg) return;
      var msg = PP.ui.escape(currentStep().type === 'sequence' || tg.pcs.length === 1
        ? t('lesson.listening', { note: noteName(tg.pc) }) : t('lesson.listeningAny'));
      setText('.feedback', msg + ' <button class="btn link inline" data-help>' + t('mic.hearNothing') + '</button>', true);
      var btn = $('lesson-stage').querySelector('[data-help]');
      if (btn) btn.addEventListener('click', function () { PP.app.showMicHelp(); });
    }, SILENCE_HELP_MS);
  }

  // ---------- notes jouées ----------

  function handleNote(ev) {
    if (!S || S.busy) return;
    var step = currentStep();
    var tg = currentTarget();
    if (!tg) return;
    resetSilenceTimer();
    if (ev.source === 'mic') PP.ui.showHeard(ev.pc);

    if (tg.pcs.indexOf(ev.pc) >= 0) good(step, tg, ev);
    else wrong(step, tg, ev);
  }

  function good(step, tg, ev) {
    S.combo++;
    S.errCount = 0;
    renderCombo(S.combo % 5 === 0);
    kb.pulse([]);
    if (step.type === 'sequence') {
      kb.flash(tg.midi, 'good', 300);
      S.pos++;
      if (S.pos >= S.seq.length) { renderSeqPos(); return stepDone(); }
      renderSeqPos();
      kb.setMarks(targetMarks());
      PP.mic.setTargets(currentTarget().pcs);
    } else {
      var shown = ev.source === 'tap' ? ev.midi : (kb.nearestVisible(ev.pc, tg.midi) || tg.midi);
      kb.flash(shown, 'good', 300);
      S.hits++;
      renderDots();
      S.findBubble.classList.remove('pop'); void S.findBubble.offsetWidth; S.findBubble.classList.add('pop');
      setText('.feedback', '');
      if (S.hits >= step.count) return stepDone();
    }
  }

  function wrong(step, tg, ev) {
    S.errors++;
    S.combo = 0;
    renderCombo(false);
    S.errCount++;
    var shown = ev.source === 'tap' ? ev.midi : kb.nearestVisible(ev.pc, tg.midi);
    if (shown !== null) kb.flash(shown, 'wrong', 600);

    var bubble = step.type === 'sequence' ? S.bubbles[S.pos] : S.findBubble;
    bubble.classList.remove('shake'); void bubble.offsetWidth; bubble.classList.add('shake');

    if (S.errCount === 1) {
      setText('.feedback', t('lesson.youPlayed', { note: noteName(ev.pc) }));
    } else if (S.errCount === 2) {
      kb.pulse(step.type === 'sequence' ? [tg.midi] : visibleOf(tg.pcs));
      setText('.feedback', step.hint || t(tg.pcs.length > 1 ? 'hint.black' : 'hint.' + PP.NOTES[tg.pc].en));
    } else {
      setText('.feedback', t('lesson.listenThis'));
      PP.synth.play(tg.midi, 0.9);        // le micro est suspendu pendant ce son
    }
  }

  /** Touches visibles d'une ou plusieurs classes de hauteur. */
  function visibleOf(pcs) {
    var r = kb.range(), out = [];
    for (var m = r.from; m <= r.to; m++) if (pcs.indexOf(m % 12) >= 0) out.push(m);
    return out;
  }

  function stepDone() {
    S.busy = true;
    PP.mic.listen(false);
    clearTimeout(S.silenceT);
    var words = t('lesson.praise');
    var p = $('lesson-praise');
    p.textContent = words[Math.floor(Math.random() * words.length)];
    p.classList.remove('show'); void p.offsetWidth; p.classList.add('show');
    S.praiseT = setTimeout(function () { p.classList.remove('show'); nextStep(); }, PRAISE_MS);
  }

  function nextStep() {
    if (!S) return;
    if (S.demo) S.demo.stop();
    PP.voice.stop();
    S.stepIndex++;
    if (S.stepIndex >= S.lesson.steps.length) return finish();
    renderStep();
  }

  function finish() {
    var result = { errors: S.errors, notes: S.noteCount };
    var cb = S.onFinish;
    PP.lesson.stop();
    cb(result);
  }

  // ---------- « Écoute d'abord » ----------

  function toggleDemo() {
    if (S.demo) { S.demo.stop(); return; }
    PP.voice.stop();
    var step = currentStep();
    var tempo = step.tempo || S.tempo;
    var beat = 60 / tempo;
    S.listenBtn.textContent = t('lesson.stop');
    S.demo = PP.synth.playSeq(S.seq, tempo, function (i) {
      S.bubbles.forEach(function (b, j) { b.classList.toggle('demo-on', j === i); });
      scrollBubbles(i);
      kb.flash(S.seq[i].midi, 'demo', S.seq[i].beats * beat * 900);
    }, function () {
      if (!S) return;
      S.demo = null;
      S.listenBtn.textContent = t('lesson.listen');
      S.bubbles.forEach(function (b) { b.classList.remove('demo-on'); });
      scrollBubbles(S.pos);
    });
  }

  // ---------- API ----------

  PP.lesson = {
    /**
     * opts : { lesson, tempo, input: 'mic'|'touch', onFinish(result), onQuit() }
     * L'écran E4 doit déjà être visible (le clavier a besoin de sa taille).
     */
    start: function (opts) {
      if (!kb) {
        kb = PP.createKeyboard($('lesson-keyboard'), { onPress: onKeyPress });
        root.addEventListener('resize', updateRange);
      }
      S = {
        lesson: opts.lesson, tempo: opts.tempo || 96, input: opts.input,
        onFinish: opts.onFinish, onQuit: opts.onQuit,
        stepIndex: 0, errors: 0, combo: 0, errCount: 0,
        noteCount: PP.lessonNoteCount(opts.lesson),
        midis: lessonMidis(opts.lesson)
      };
      renderCombo(false);
      updateRange();
      renderStep();
    },

    stop: function () {
      if (!S) return;
      if (S.demo) S.demo.stop();
      clearTimeout(S.silenceT); clearTimeout(S.praiseT);
      PP.voice.stop();
      PP.mic.listen(false);
      $('lesson-praise').classList.remove('show');
      S = null;
    },

    handleNote: handleNote,

    /** Quitter : confirmation seulement si au moins une étape est faite. */
    requestQuit: function () {
      if (!S) return;
      var quit = S.onQuit;
      if (S.stepIndex === 0) { PP.lesson.stop(); quit(); return; }
      PP.ui.confirm(t('lesson.quitConfirm'), t('lesson.quitYes'), t('lesson.quitNo')).then(function (yes) {
        if (yes && S) { PP.lesson.stop(); quit(); }
      });
    },

    speak: function () { if (S) { if (S.demo) S.demo.stop(); PP.voice.speak(PP.ui.pickSay(currentStep())); } },

    setInput: function (mode) { if (S) { S.input = mode; armListening(); } },

    /** Appelé quand l'appli passe en arrière-plan. */
    pause: function () { if (S && S.demo) S.demo.stop(); PP.voice.stop(); }
  };
})(window);
