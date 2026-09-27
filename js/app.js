/* Petit Piano — routeur d'écrans et écrans hors leçon (E1, E2, E2b, E3, E5, E6, E7).
 * Le moteur de leçon (E4) est dans js/lesson.js ; la synchro entre téléphones dans js/sync.js.
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};
  var t = function (k, v) { return PP.t(k, v); };
  var $ = function (id) { return document.getElementById(id); };
  var store = PP.store;

  var DEBUG = /[?&]debug=1\b/.test(root.location.search);
  var current = null;            // écran affiché
  var pendingLesson = null;      // leçon demandée avant un passage par le réglage / le blocage micro
  var noteConsumer = null;       // qui reçoit les notes du micro (test micro ou leçon)
  var wakeLock = null;

  // ================= utilitaires d'interface =================

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function profile() { return store.profile(); }
  function curriculum() { return root.CURRICULA[(profile() && profile().curriculum) || 'grand']; }

  PP.ui = {
    escape: escape,

    /** Texte d'étape selon le mode du profil (champ textPetit réservé au futur mode « petit »). */
    pickText: function (step) {
      var p = profile();
      return p && p.mode === 'petit' && step.textPetit != null ? step.textPetit : step.text;
    },
    pickSay: function (step) {
      var p = profile();
      var s = p && p.mode === 'petit' && step.sayPetit != null ? step.sayPetit : step.say;
      return PP.fill(s, { prenom: p ? p.name : '' });
    },

    /** Échappe, remplace {prenom} et **gras**. */
    formatText: function (s) {
      var p = profile();
      return escape(PP.fill(s, { prenom: p ? p.name : '' })).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    },

    /** Bulle de note : couleur + nom écrit (jamais la couleur seule). */
    noteBubble: function (pc, cls) {
      var n = PP.NOTES[pc];
      var b = document.createElement('div');
      b.className = cls;
      b.style.setProperty('--note', n.color);
      b.style.setProperty('--note-text', n.text);
      b.innerHTML = '<span class="name">' + n.fr + '</span>';
      return b;
    },

    voiceAuto: function () { var p = profile(); return !!(p && p.settings.voiceAuto && PP.voice.available()); },

    /** Affiche 1 s sous 👂 la note entendue (l'enfant voit que l'appli l'entend). */
    showHeard: function (pc) {
      var e = $('ear-note');
      e.textContent = PP.NOTES[pc].fr;
      clearTimeout(e._t);
      e._t = setTimeout(function () { e.textContent = ''; }, 1000);
    },

    toast: function (msg, ms) {
      var e = $('toast');
      e.textContent = msg;
      e.hidden = false;
      clearTimeout(e._t);
      e._t = setTimeout(function () { e.hidden = true; }, ms || 2200);
    },

    /** Fenêtre modale générique. buttons : [{ label, cls, value }]. Résout avec la valeur choisie. */
    modal: function (html, buttons) {
      return new Promise(function (resolve) {
        $('modal-body').innerHTML = html;
        var actions = $('modal-actions');
        actions.innerHTML = '';
        buttons.forEach(function (b) {
          var btn = document.createElement('button');
          btn.className = 'btn big ' + (b.cls || 'secondary');
          btn.textContent = b.label;
          btn.addEventListener('click', function () { $('modal').hidden = true; resolve(b.value); });
          actions.appendChild(btn);
        });
        $('modal').hidden = false;
      });
    },

    confirm: function (text, yes, no) {
      return PP.ui.modal('<p class="lead">' + escape(text) + '</p>',
        [{ label: no, cls: 'secondary', value: false }, { label: yes, cls: 'primary', value: true }]);
    }
  };

  // ================= routeur =================

  function show(name) {
    if (current === 'lesson' && name !== 'lesson') { PP.lesson.stop(); releaseWakeLock(); }
    document.querySelectorAll('.screen').forEach(function (s) { s.hidden = s.id !== 'screen-' + name; });
    current = name;
    root.scrollTo(0, 0);
  }

  // ================= micro : démarrage et erreurs =================

  /** Micro prêt ? Résout true (micro), false (mode écran) ; rejette { kind } si refusé. */
  function ensureMic() {
    var dev = store.device();
    if (dev.input !== 'mic') return Promise.resolve(false);
    if (PP.mic.isRunning()) return Promise.resolve(true);
    return PP.mic.start(dev.noiseFloor).then(function () {
      PP.mic.setTuning(dev.tuningCents);
      return true;
    });
  }

  function showBlocked(kind) {
    show('blocked');
    var d = $('blocked-details');
    if (kind === 'denied') {
      $('blocked-title').textContent = t('blocked.title');
      d.innerHTML = '<p><strong>' + escape(t('blocked.adult')) + '</strong></p><ul class="tips"><li>' +
        escape(t('blocked.ios')) + '</li><li>' + escape(t('blocked.android')) + '</li></ul>';
    } else {
      $('blocked-title').textContent = t(kind === 'notfound' ? 'blocked.notFound' : kind === 'insecure' ? 'blocked.insecure' : 'blocked.other');
      d.innerHTML = '';
    }
  }

  /** Après le micro (réussi ou mode écran) : on reprend là où l'enfant voulait aller. */
  function continueAfterMic() {
    if (pendingLesson !== null) {
      var i = pendingLesson;
      pendingLesson = null;
      startLesson(i);
    } else {
      showMap();
    }
  }

  function useTouch() {
    store.setDevice({ input: 'touch' });
    PP.mic.stop();
    continueAfterMic();
  }

  // ================= E1 — Bienvenue =================

  var addingChild = false;    // E1 ouvert depuis « + Ajouter un enfant »

  function showWelcome(opts) {
    addingChild = !!(opts && opts.adding);
    show('welcome');
    var input = $('welcome-name');
    input.value = '';
    $('welcome-go').disabled = true;
    document.querySelector('#screen-welcome .big-label').textContent = t(addingChild ? 'welcome.newChild' : 'welcome.hello');
    $('welcome-back').hidden = !addingChild;
    // « J'ai déjà un code » : seulement si ce téléphone n'est pas déjà dans une famille
    $('welcome-code').hidden = addingChild || !!store.syncState().familyCode;
    if (!addingChild) setTimeout(function () { input.focus(); }, 50);
  }

  /** Après le choix d'un profil : réglage du micro si le téléphone n'est pas calibré, sinon la carte. */
  function afterProfileChosen() {
    document.body.dataset.mode = profile().mode;
    var dev = store.device();
    if (dev.input === 'mic' && !dev.calibrated) showMicSetup();
    else showMap();
  }

  function initWelcome() {
    var deco = document.querySelector('.deco-keys');
    [0, 2, 4, 5, 7, 9, 11].forEach(function (pc) { deco.appendChild(PP.ui.noteBubble(pc, 'deco-key')); });
    $('welcome-name').addEventListener('input', function () {
      $('welcome-go').disabled = !this.value.trim();
    });
    $('welcome-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('welcome-name').value.trim();
      if (!name) return;
      var wasAdding = addingChild;
      store.createProfile(name);
      addingChild = false;
      if (wasAdding) afterProfileChosen();
      else { document.body.dataset.mode = profile().mode; showMicSetup(); }
    });
    $('welcome-back').addEventListener('click', function () { addingChild = false; showParents(); });
    $('welcome-code').addEventListener('click', function () { openJoinModal('welcome'); });
  }

  // ================= E7 — Qui joue ? =================

  function showWho() {
    show('who');
    renderWho();
  }

  function renderWho() {
    var grid = $('who-grid');
    grid.innerHTML = '';
    var active = store.profile();
    store.profileList().forEach(function (p) {
      var stars = Object.keys(p.progress || {}).reduce(function (n, k) { return n + (p.progress[k].stars || 0); }, 0);
      var b = document.createElement('button');
      b.className = 'who-tile' + (active && active.id === p.id ? ' last' : '');
      b.innerHTML = '<span class="who-avatar">' + escape(p.avatar || '🦊') + '</span>' +
        '<span class="who-name">' + escape(p.name) + '</span>' +
        '<span class="who-stars">⭐ ' + stars + '</span>';
      b.addEventListener('click', function () {
        store.setActive(p.id);
        afterProfileChosen();
      });
      grid.appendChild(b);
    });
  }

  // ================= E2 — Réglage du micro =================

  var micTest = null;   // { notes, cents, helpT }

  function micPanel(id) {
    ['mic-explain', 'mic-waiting', 'mic-silence', 'mic-test'].forEach(function (p) { $(p).hidden = p !== id; });
  }

  function showMicSetup() {
    show('mic');
    micPanel('mic-explain');
  }

  function startMicFlow() {
    PP.audio.ensure();               // geste de l'utilisateur : obligatoire sur iPad
    micPanel('mic-waiting');
    var dev = store.device();
    PP.mic.start(dev.noiseFloor).then(runSilence, function (err) {
      showBlocked(err.kind);
    });
  }

  /** C. Mesure du bruit de fond pendant 2 s. */
  function runSilence() {
    if (micTest) { clearTimeout(micTest.helpT); micTest = null; }
    noteConsumer = null;
    show('mic');
    micPanel('mic-silence');
    PP.mic.listen(false);
    var ring = document.querySelector('#mic-silence .ring-fg');
    ring.classList.remove('run'); void ring.getBoundingClientRect(); ring.classList.add('run');
    PP.mic.measureSilence(2000).then(function (floor) {
      store.setDevice({ noiseFloor: floor });
      runTest();
    });
  }

  /** D. Test : 3 notes entendues = OK ; on mesure aussi l'accordage du piano. */
  function runTest() {
    micPanel('mic-test');
    micTest = { notes: 0, cents: [] };
    PP.mic.setTuning(0);            // mesure brute, sans correction
    PP.mic.setTargets(null);
    PP.mic.listen(true);
    var bubble = $('mic-last-note');
    bubble.className = 'bubble big empty';
    bubble.innerHTML = '<span class="name">?</span>';
    $('mic-heard').textContent = '';
    $('mic-done').className = 'btn secondary big';
    renderMicDots();
    noteConsumer = onTestNote;
    armHelpTimer();
  }

  function armHelpTimer() {
    clearTimeout(micTest.helpT);
    micTest.helpT = setTimeout(function () { if (current === 'mic' && micTest) showMicHelp(); }, 10000);
  }

  function renderMicDots() {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<span class="dot' + (i < micTest.notes ? ' on' : '') + '"></span>';
    $('mic-dots').innerHTML = s;
  }

  function onTestNote(ev) {
    micTest.notes++;
    if (ev.freq) micTest.cents.push(PP.pitch.rawCents(ev.freq));
    var n = PP.NOTES[ev.pc];
    var bubble = $('mic-last-note');
    bubble.className = 'bubble big pop';
    bubble.style.setProperty('--note', n.color);
    bubble.style.setProperty('--note-text', n.text);
    bubble.innerHTML = '<span class="name">' + n.fr + '</span>';
    $('mic-heard').textContent = micTest.notes >= 3 ? t('mic.perfect') : t('mic.youPlayed', { note: n.fr });
    if (micTest.notes >= 3) $('mic-done').className = 'btn primary big';
    renderMicDots();
    armHelpTimer();
  }

  function finishMicTest() {
    if (!micTest) return;
    clearTimeout(micTest.helpT);
    var tuning = PP.pitch.estimateTuning(micTest.cents);
    var patch = { input: 'mic', calibrated: true };
    if (tuning !== null) patch.tuningCents = tuning;
    store.setDevice(patch);
    PP.mic.setTuning(store.device().tuningCents);
    PP.mic.listen(false);
    micTest = null;
    noteConsumer = null;
    continueAfterMic();
  }

  /** Aide « Je n'entends rien ? » (depuis le test ou une leçon). */
  function showMicHelp() {
    var html = '<p class="lead">' + escape(t('mic.helpTitle')) + '</p><ul class="tips">' +
      t('mic.tips').map(function (x) { return '<li>' + escape(x) + '</li>'; }).join('') + '</ul>';
    var buttons = [{ label: t('mic.useScreen'), cls: 'secondary', value: 'touch' }];
    if (PP.mic.isRunning()) buttons.unshift({ label: t('mic.redoSilence'), cls: 'secondary', value: 'silence' });
    buttons.push({ label: t('mic.close'), cls: 'primary', value: 'ok' });
    PP.ui.modal(html, buttons).then(function (v) {
      if (v === 'touch') {
        if (current === 'lesson') { store.setDevice({ input: 'touch' }); PP.mic.stop(); PP.lesson.setInput('touch'); updateEar(); }
        else { micTest = null; noteConsumer = null; useTouch(); }
      } else if (v === 'silence') {
        if (current === 'lesson') { pendingLesson = currentLessonIndex; PP.lesson.stop(); }
        runSilence();
      } else if (micTest) {
        armHelpTimer();
      }
    });
  }

  function initMic() {
    $('mic-enable').addEventListener('click', startMicFlow);
    $('mic-skip').addEventListener('click', useTouch);
    $('mic-done').addEventListener('click', finishMicTest);
    $('mic-help-open').addEventListener('click', showMicHelp);
    $('blocked-retry').addEventListener('click', function () {
      PP.audio.ensure();
      store.setDevice({ input: 'mic' });
      PP.mic.start(store.device().noiseFloor).then(function () {
        if (store.device().calibrated) { PP.mic.setTuning(store.device().tuningCents); continueAfterMic(); }
        else runSilence();
      }, function (err) { showBlocked(err.kind); PP.ui.toast(t('blocked.title')); });
    });
    $('blocked-touch').addEventListener('click', useTouch);

    PP.mic.on('note', function (ev) { if (noteConsumer) noteConsumer(ev); });
    PP.mic.on('frame', onFrame);
    PP.mic.on('ended', function () {
      if (current === 'lesson') $('lesson-banner').hidden = false;
      updateEar();
    });
    // iOS coupe la piste pendant une interruption (appel, Siri…) sans l'arrêter
    PP.mic.on('muted', function () { if (current === 'lesson') $('lesson-banner').hidden = false; });
    PP.mic.on('unmuted', function () { $('lesson-banner').hidden = true; });
  }

  // ================= indicateur 👂, jauge, débogage =================

  function onFrame(f) {
    if (current === 'mic') $('mic-meter-fill').style.width = (f.level * 100) + '%';
    if (current === 'lesson') {
      $('ear-level-fill').style.height = (f.level * 100) + '%';
      $('lesson-ear').classList.toggle('paused', f.suppressed);
      $('ear-icon').textContent = f.suppressed ? '⏸' : '👂';
    }
    if (DEBUG) {
      var d = $('debug');
      d.hidden = false;
      d.textContent =
        'freq    ' + (f.freq ? f.freq.toFixed(1) + ' Hz' : '—') + '\n' +
        'note    ' + (f.note ? PP.NOTES[f.note.pc].fr + ' (' + f.note.midi + ')  ' + (f.note.cents >= 0 ? '+' : '') + f.note.cents.toFixed(0) + ' c' : '—') + '\n' +
        'clarté  ' + f.clarity.toFixed(2) + '\n' +
        'rms     ' + f.rms.toFixed(4) + '\n' +
        'porte   ' + f.gate.toFixed(4) + '  (bruit ' + f.noiseFloor.toFixed(4) + ')\n' +
        'état    ' + (f.suppressed ? 'suspendu' : f.armed ? 'armé' : 'désarmé') + '\n' +
        'accord  ' + store.device().tuningCents + ' c';
    }
  }

  function updateEar() {
    var mic = store.device().input === 'mic' && PP.mic.isRunning();
    var ear = $('lesson-ear');
    ear.classList.toggle('touch', !mic);
    ear.setAttribute('aria-label', mic ? t('lesson.micIndicator') : t('lesson.touchIndicator'));
    $('ear-icon').textContent = mic ? '👂' : '👆';
    if (!mic) $('ear-level-fill').style.height = '0';
  }

  // ================= E3 — Carte =================

  function showMap() {
    if (!profile()) { if (Object.keys(store.profiles()).length) showWho(); else showWelcome(); return; }
    show('map');
    renderMapHeader();
    renderMapPath();
  }

  function renderMapHeader() {
    var p = profile();
    $('map-hello').textContent = t('map.hello', { prenom: p.name });
    $('map-hello').classList.toggle('tappable', store.profileList().length > 1);
    $('map-stars').textContent = '⭐ ' + store.totalStars();
    var days = store.streakDays();
    $('map-streak').textContent = days ? '🔥 ' + t(days > 1 ? 'map.days' : 'map.day', { n: days }) : '';
  }

  /** Indice de la leçon « courante » : première ouverte sans étoile (ou -1 si tout est fini). */
  function currentLesson() {
    var lessons = curriculum().lessons;
    for (var i = 0; i < lessons.length; i++) {
      if (!store.isUnlocked(lessons, i)) break;
      var pr = store.lessonProgress(lessons[i].id);
      if (!pr || !pr.stars) return i;
    }
    return -1;
  }

  function starsText(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += i < n ? '⭐' : '<span class="star-empty">☆</span>';
    return s;
  }

  /** silent : re-rendu après une synchro (pas de défilement automatique, position gardée). */
  function renderMapPath(silent) {
    var lessons = curriculum().lessons;
    var path = $('map-path');
    path.querySelectorAll('.node').forEach(function (n) { n.remove(); });
    var W = path.clientWidth;
    var wide = W >= 640;
    var cols = wide ? 5 : 1;
    var nodeSize = wide ? 88 : 72;
    var rowH = nodeSize + 90;
    var cur = currentLesson();
    var centers = [];

    lessons.forEach(function (lesson, i) {
      var row = Math.floor(i / cols), col = i % cols;
      if (row % 2 === 1) col = cols - 1 - col;          // serpentin
      var cx = wide ? (col + 0.5) * W / cols : W * (i % 2 ? 0.66 : 0.34);
      var cy = row * rowH + nodeSize / 2 + 24;
      centers.push([cx, cy]);

      var unlocked = store.isUnlocked(lessons, i);
      var pr = store.lessonProgress(lesson.id);
      var node = document.createElement('div');
      node.className = 'node' + (unlocked ? '' : ' locked') + (i === cur ? ' current' : '');
      node.style.left = cx + 'px';
      node.style.top = (cy - nodeSize / 2) + 'px';
      node.style.setProperty('--size', nodeSize + 'px');
      node.innerHTML =
        '<button class="node-btn" aria-label="' + escape(lesson.num + '. ' + lesson.title) + '">' +
          '<span class="node-emoji">' + (unlocked ? lesson.emoji : '🔒') + '</span>' +
          '<span class="node-num">' + lesson.num + '</span>' +
        '</button>' +
        '<div class="node-title">' + escape(lesson.title) + '</div>' +
        '<div class="node-stars">' + (unlocked ? starsText(pr ? pr.stars : 0) : '') + '</div>';
      node.querySelector('.node-btn').addEventListener('click', function () {
        if (unlocked) startLesson(i);
        else {
          node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake');
          PP.ui.toast(t('map.locked'));
        }
      });
      path.appendChild(node);
    });

    var rows = Math.ceil(lessons.length / cols);
    var H = rows * rowH + 20;
    path.style.height = H + 'px';
    var svg = $('map-lines');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    var lines = '';
    for (var i = 1; i < centers.length; i++) {
      var done = store.isUnlocked(lessons, i);
      lines += '<line x1="' + centers[i - 1][0] + '" y1="' + centers[i - 1][1] + '" x2="' + centers[i][0] + '" y2="' + centers[i][1] +
        '" class="' + (done ? 'open' : 'closed') + '"/>';
    }
    svg.innerHTML = lines;

    var footer = $('map-footer');
    if (cur >= 0) {
      var L = lessons[cur];
      footer.innerHTML = '<span class="footer-title">« ' + L.num + '. ' + escape(L.title) + ' »</span>';
      var play = document.createElement('button');
      play.className = 'btn primary big';
      play.textContent = t('map.play');
      play.addEventListener('click', function () { startLesson(cur); });
      footer.appendChild(play);
      var nodeEl = path.querySelectorAll('.node')[cur];
      if (!silent) setTimeout(function () { nodeEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 80);
    } else {
      footer.innerHTML = '<span class="footer-title">' + escape(t('map.allDone')) + '</span>';
    }
  }

  /** ⚙ : appui long 2 s pour le coin des parents ; un appui court affiche l'indication. */
  function initGear() {
    var gear = $('map-gear'), timer = null, fired = false;
    gear.setAttribute('aria-label', t('map.settings'));
    function start(e) {
      e.preventDefault();
      fired = false;
      gear.classList.add('pressing');
      timer = setTimeout(function () { fired = true; gear.classList.remove('pressing'); showParents(); }, 2000);
    }
    function end() {
      if (!timer) return;
      clearTimeout(timer); timer = null;
      gear.classList.remove('pressing');
      if (!fired) PP.ui.toast(t('map.longPress'));
    }
    gear.addEventListener('pointerdown', start);
    gear.addEventListener('pointerup', end);
    gear.addEventListener('pointerleave', end);
    gear.addEventListener('pointercancel', end);
    gear.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // accès clavier : Entrée maintenue n'a pas de sens, on ouvre directement
    gear.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showParents(); } });
  }

  // ================= E4 — Leçon =================

  var currentLessonIndex = null;

  function startLesson(i) {
    PP.audio.ensure();           // geste : débloque le son (iPad)
    ensureMic().then(function (micOn) {
      var lesson = curriculum().lessons[i];
      currentLessonIndex = i;
      show('lesson');
      $('lesson-banner').hidden = true;
      $('lesson-speak').hidden = !PP.voice.available();
      updateEar();
      requestWakeLock();
      noteConsumer = function (ev) { PP.lesson.handleNote({ pc: ev.pc, midi: ev.midi, source: 'mic' }); };
      PP.lesson.start({
        lesson: lesson,
        tempo: curriculum().tempo,
        input: micOn ? 'mic' : 'touch',
        onFinish: function (result) { noteConsumer = null; showBravo(i, result); },
        onQuit: function () { noteConsumer = null; showMap(); }
      });
    }, function (err) {
      pendingLesson = i;
      showBlocked(err.kind);
    });
  }

  function initLesson() {
    $('lesson-quit').setAttribute('aria-label', t('lesson.quit'));
    $('lesson-quit').addEventListener('click', function () { PP.lesson.requestQuit(); });
    $('lesson-speak').setAttribute('aria-label', t('lesson.readAloud'));
    $('lesson-speak').addEventListener('click', function () { PP.lesson.speak(); });
    PP.voice.onAvailability(function (ok) { $('lesson-speak').hidden = !ok; syncParentsVoice(); });

    // 👆 en mode écran : on retente le micro
    $('lesson-ear').addEventListener('click', function () {
      if (PP.mic.isRunning()) return;
      tryMicInLesson();
    });
    $('banner-retry').addEventListener('click', tryMicInLesson);
    $('banner-touch').addEventListener('click', function () {
      store.setDevice({ input: 'touch' });
      $('lesson-banner').hidden = true;
      PP.lesson.setInput('touch');
      updateEar();
    });

    // Arrière-plan : l'AudioContext est souvent suspendu → voile « Touche l'écran pour continuer »
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { PP.lesson.pause(); return; }
      if (current !== 'lesson') return;
      requestWakeLock();
      if (!PP.audio.running()) $('resume-veil').hidden = false;
    });
    // Interruption sans changement de visibilité (Siri, appel, alarme, centre de contrôle
    // sur iPad) : le contexte n'est plus « running » → même voile.
    PP.audio.onStateChange(function (state) {
      if (current !== 'lesson') return;
      if (state !== 'running') { PP.lesson.pause(); $('resume-veil').hidden = false; }
    });
    $('resume-veil').addEventListener('click', function () {
      PP.audio.ensure();
      PP.mic.disarm();
      $('resume-veil').hidden = true;
      // la reprise peut être refusée tant que l'interruption dure : on revérifie
      setTimeout(function () {
        if (current === 'lesson' && !PP.audio.running()) $('resume-veil').hidden = false;
      }, 600);
    });
  }

  function tryMicInLesson() {
    PP.audio.ensure();
    PP.mic.start(store.device().noiseFloor).then(function () {
      store.setDevice({ input: 'mic' });
      PP.mic.setTuning(store.device().tuningCents);
      $('lesson-banner').hidden = true;
      PP.lesson.setInput('mic');
      updateEar();
    }, function () {
      PP.ui.toast(t('lesson.micRetryFailed'), 3000);
    });
  }

  function requestWakeLock() {
    if (!navigator.wakeLock || wakeLock) return;
    navigator.wakeLock.request('screen').then(function (l) {
      wakeLock = l;
      l.addEventListener('release', function () { wakeLock = null; });
    }).catch(function () { /* non supporté ou refusé : le parent règle la mise en veille */ });
  }

  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(function () {}); wakeLock = null; }
  }

  // ================= E5 — Bravo ! =================

  function showBravo(i, result) {
    var lessons = curriculum().lessons;
    var lesson = lessons[i];
    var stars = PP.starsFor(result.notes, result.errors);
    var wasUnlocked = i + 1 < lessons.length && store.isUnlocked(lessons, i + 1);
    var rec = store.recordLesson(lesson.id, stars, result.errors);
    var last = i === lessons.length - 1;

    show('bravo');
    $('bravo-title').textContent = last ? t('bravo.levelDone', { level: curriculum().title }) : t('bravo.title', { prenom: profile().name });
    $('bravo-message').textContent = t('bravo.stars' + stars);
    $('bravo-record').hidden = !rec.record;
    $('bravo-done').textContent = PP.fill(lesson.doneText, { prenom: profile().name });
    $('bravo-unlocked').textContent = !last && !wasUnlocked ? t('bravo.unlocked', { title: lessons[i + 1].title }) : '';
    $('bravo-next').hidden = last;

    var box = $('bravo-stars');
    box.innerHTML = '';
    for (var k = 0; k < 3; k++) {
      var s = document.createElement('span');
      s.className = 'bstar' + (k < stars ? ' won' : '');
      s.textContent = k < stars ? '⭐' : '☆';
      s.style.animationDelay = (0.3 + k * 0.4) + 's';
      box.appendChild(s);
      if (k < stars) setTimeout(PP.synth.ding.bind(null, k), 300 + k * 400);
    }
    launchConfetti();

    $('bravo-replay').onclick = function () { startLesson(i); };
    $('bravo-next').onclick = function () { startLesson(i + 1); };
    $('bravo-map').onclick = showMap;
  }

  function launchConfetti() {
    var box = $('confetti');
    box.innerHTML = '';
    var colors = PP.NOTES.filter(function (n) { return !n.black; }).map(function (n) { return n.color; }).concat(['#FFC107', '#6C4DF6']);
    for (var i = 0; i < 40; i++) {
      var c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      c.style.animationDuration = (2 + Math.random() * 0.8) + 's';
      c.style.transform = 'rotate(' + Math.floor(Math.random() * 360) + 'deg)';
      box.appendChild(c);
    }
    setTimeout(function () { box.innerHTML = ''; }, 4000);
  }

  // ================= E6 — Coin des parents =================

  function syncParentsVoice() { $('parents-voice-row').hidden = !PP.voice.available(); }

  function showParents() {
    show('parents');
    var dev = store.device(), p = profile();
    $('parents-storage').hidden = store.storageOk();
    $('parents-name').value = p.name;
    $('parents-mic').classList.toggle('active', dev.input === 'mic');
    $('parents-touch').classList.toggle('active', dev.input === 'touch');
    $('parents-tuning').textContent = dev.calibrated ? t('parents.tuning', { c: (dev.tuningCents > 0 ? '+' : '') + dev.tuningCents }) : '';
    $('parents-voice').checked = !!p.settings.voiceAuto;
    $('parents-unlock').checked = !!p.settings.unlockAll;
    syncParentsVoice();
    renderSyncSection();
  }

  // ================= E6 — « Plusieurs téléphones » (DESIGN §9.2) =================

  var syncMsg = '';   // message d'erreur de la section (création hors ligne…)

  /** Statut court : « Synchronisé il y a 2 min », « Hors ligne… ». */
  function syncStatusText() {
    var st = PP.sync.status();
    if (st.state === 'syncing') return t('sync.statusSyncing');
    if (st.state === 'offline') return t('sync.statusOffline');
    if (st.state === 'error') return t('sync.statusError');
    if (st.state === 'tooNew') return t('sync.statusTooNew');
    if (!st.lastSyncAt) return t('sync.statusSyncing');
    var min = Math.floor((Date.now() - st.lastSyncAt) / 60000);
    if (min < 1) return t('sync.statusNow');
    if (min < 60) return t('sync.statusMin', { n: min });
    if (min < 24 * 60) return t('sync.statusHour', { n: Math.floor(min / 60) });
    var d = new Date(st.lastSyncAt);
    return t('sync.statusDay', { date: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') });
  }

  function renderSyncSection() {
    var box = $('parents-sync');
    var code = store.syncState().familyCode;
    var html = '<h3>' + escape(t('sync.title')) + '</h3>';
    if (!code) {
      html += '<p class="muted">' + escape(t('sync.intro')) + '</p>' +
        '<div class="row"><button id="sync-create" class="btn secondary">' + escape(t('sync.create')) + '</button>' +
        '<button id="sync-join" class="btn secondary">' + escape(t('sync.join')) + '</button></div>' +
        '<p id="sync-msg" class="muted" aria-live="polite">' + escape(syncMsg) + '</p>';
      box.innerHTML = html;
      $('sync-create').addEventListener('click', createFamily);
      $('sync-join').addEventListener('click', function () { syncMsg = ''; openJoinModal('parents'); });
      return;
    }
    html += '<span>' + escape(t('sync.codeLabel')) + '</span>' +
      '<div class="sync-code">' + escape(code) + '</div>' +
      '<div class="row"><button id="sync-share" class="btn primary">' + escape(t('sync.share')) + '</button></div>' +
      '<p class="muted">' + escape(t('sync.howTo')) + '</p>' +
      '<p class="muted">' + escape(t('sync.keep')) + '</p>' +
      '<p id="sync-status" class="muted sync-status" aria-live="polite">' + escape(syncStatusText()) + '</p>' +
      '<div class="row"><button id="sync-leave" class="btn link">' + escape(t('sync.leave')) + '</button></div>';
    box.innerHTML = html;
    $('sync-share').addEventListener('click', function () { shareCode(code); });
    $('sync-leave').addEventListener('click', function () {
      PP.ui.confirm(t('sync.leaveConfirm'), t('sync.leaveYes'), t('parents.cancel')).then(function (yes) {
        if (!yes) return;
        // les dernières leçons partent d'abord vers les autres téléphones (réussite ou non, on quitte ensuite)
        syncBefore($('sync-leave')).then(function () {
          PP.sync.leave();
          renderSyncSection();
        });
      });
    });
  }

  /** Synchronise tout de suite (bouton « Je vérifie… » pendant ce temps, 10 s max). Résout l'état final. */
  function syncBefore(btn) {
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = t('sync.checking');
    return PP.sync.run().then(function (st) {
      btn.disabled = false;
      btn.textContent = label;
      return st;
    });
  }

  function syncErrorText(err) {
    var k = err && err.kind;
    return t(k === 'offline' ? 'sync.errOffline' : k === 'notFound' ? 'sync.errNotFound' : k === 'format' ? 'sync.errFormat' :
      k === 'chars' ? 'sync.errChars' : k === 'tooNew' ? 'sync.statusTooNew' : 'sync.errOther');
  }

  function createFamily() {
    var btn = $('sync-create');
    btn.disabled = true;
    btn.textContent = t('sync.creating');
    $('sync-join').disabled = true;
    syncMsg = '';
    PP.sync.create().then(function () {
      if (current === 'parents') renderSyncSection();
    }, function (err) {
      syncMsg = syncErrorText(err);
      if (current === 'parents') renderSyncSection();
    });
  }

  /** Partager : feuille de partage (iPhone), sinon presse-papiers ; le code reste sélectionnable. */
  function shareCode(code) {
    var text = t('sync.shareText', { code: code });
    var url = root.location.origin + root.location.pathname;
    if (navigator.share) {
      navigator.share({ title: t('sync.shareTitle'), text: text, url: url }).catch(function (e) {
        if (e && e.name === 'AbortError') return;          // annulé par le parent : rien à dire
        copyCode(text);
      });
    } else {
      copyCode(text);
    }
  }

  function copyCode(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { PP.ui.toast(t('sync.copied')); }, function () {});
    }
  }

  /** Modale « Entre le code famille » (depuis E1 ou le coin des parents). Reste ouverte en cas d'erreur. */
  function openJoinModal(from) {
    $('modal-body').innerHTML =
      '<form id="join-form" autocomplete="off">' +
        '<label for="join-code" class="lead">' + escape(t('sync.joinTitle')) + '</label>' +
        '<input id="join-code" class="name-input code-input" type="text" value="PIANO-" inputmode="text" ' +
          'autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" maxlength="400">' +
        '<p id="join-error" class="muted join-error" aria-live="polite"></p>' +
      '</form>';
    var actions = $('modal-actions');
    actions.innerHTML = '';
    var cancel = document.createElement('button');
    cancel.className = 'btn big secondary';
    cancel.textContent = t('parents.cancel');
    var go = document.createElement('button');
    go.className = 'btn big primary';
    go.textContent = t('sync.joinGo');
    actions.appendChild(cancel);
    actions.appendChild(go);
    $('modal').hidden = false;
    var input = $('join-code');
    setTimeout(function () { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }, 50);

    var busy = false;
    function close() { $('modal').hidden = true; }
    cancel.addEventListener('click', function () { if (!busy) close(); });
    function submit(e) {
      if (e) e.preventDefault();
      if (busy) return;
      var norm = PP.syncLib.normalizeCode(input.value);
      if (!norm.ok) { $('join-error').textContent = syncErrorText({ kind: norm.error }); return; }
      busy = true;
      go.disabled = true;
      go.textContent = t('sync.checking');
      $('join-error').textContent = '';
      PP.sync.join(norm.code).then(function () {
        busy = false;
        close();
        onJoined(from);
      }, function (err) {
        busy = false;
        go.disabled = false;
        go.textContent = t('sync.joinGo');
        $('join-error').textContent = syncErrorText(err);
      });
    }
    go.addEventListener('click', submit);
    $('join-form').addEventListener('submit', submit);
  }

  function onJoined(from) {
    if (from === 'parents') {
      PP.ui.toast(t('sync.joined'));
      if (current === 'parents') showParents();
      return;
    }
    // depuis l'écran de bienvenue (§9.3)
    var list = store.profileList();
    if (!list.length) { $('welcome-code').hidden = true; return; }      // famille vide : on crée le prénom ici
    if (list.length === 1) {
      store.setActive(list[0].id);
      PP.ui.toast(t('who.found', { prenom: list[0].name, avatar: list[0].avatar || '' }), 3000);
      afterProfileChosen();
      return;
    }
    showWho();
  }

  /** Une synchro a changé les données ou le statut : mise à jour silencieuse de l'écran affiché. */
  function onSyncEvent(ev) {
    if (current === 'parents') {
      if (ev.type === 'status' && $('sync-status')) $('sync-status').textContent = syncStatusText();
      else if (ev.type === 'status' && !store.syncState().familyCode) renderSyncSection();
      return;
    }
    if (ev.type !== 'data') return;
    if (current === 'map') {
      if (!profile()) { showWho(); return; }
      var sc = $('map-scroll'), top = sc.scrollTop;
      renderMapHeader();
      renderMapPath(true);
      sc.scrollTop = top;
    } else if (current === 'who') {
      renderWho();
    }
    // leçon, bravo, micro : rien ; le prochain showMap() affichera l'état fusionné
  }

  function initParents() {
    $('parents-back').addEventListener('click', showMap);
    $('parents-name-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('parents-name').value.trim();
      if (!name) return;
      profile().name = name;
      store.touchProfile();
      PP.ui.toast('✓');
    });
    $('parents-mic').addEventListener('click', function () {
      store.setDevice({ input: 'mic' });
      if (!store.device().calibrated) { showMicSetup(); return; }
      showParents();
    });
    $('parents-touch').addEventListener('click', function () {
      store.setDevice({ input: 'touch' });
      PP.mic.stop();
      showParents();
    });
    $('parents-redo-mic').addEventListener('click', showMicSetup);
    $('parents-voice').addEventListener('change', function () {
      profile().settings.voiceAuto = this.checked;
      store.touchProfile();
    });
    $('parents-unlock').addEventListener('change', function () {
      profile().settings.unlockAll = this.checked;
      store.touchProfile();
    });
    $('parents-add-child').addEventListener('click', function () { showWelcome({ adding: true }); });
    $('parents-reset').addEventListener('click', function () {
      var btn = this;
      var inFamily = !!store.syncState().familyCode;
      // En famille : on envoie d'abord les dernières leçons ; « la progression reste ailleurs » seulement si c'est fait.
      (inFamily ? syncBefore(btn) : Promise.resolve('none')).then(function (st) {
        var key = !inFamily ? 'parents.resetConfirm' : st === 'ok' ? 'sync.resetConfirmFamily' : 'sync.resetConfirmUnsynced';
        return PP.ui.modal('<p class="lead">' + escape(t(key)) + '</p>', [
          { label: t('parents.cancel'), cls: 'secondary', value: false },
          { label: t('parents.resetYes'), cls: 'danger', value: true }
        ]);
      }).then(function (yes) {
        if (!yes) return;
        PP.mic.stop();
        if (inFamily) PP.sync.leave();   // sinon la fusion suivante ferait tout revenir
        syncMsg = '';
        store.reset();
        showWelcome();
      });
    });
  }

  // ================= démarrage =================

  function boot() {
    document.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = t(e.getAttribute('data-t')); });
    $('welcome-name').placeholder = t('welcome.placeholder');
    document.title = t('appName');

    store.load();
    initWelcome(); initMic(); initGear(); initLesson(); initParents();
    $('map-hello').addEventListener('click', function () { if (store.profileList().length > 1) showWho(); });
    PP.sync.onChange(onSyncEvent);

    var resizeT;
    root.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () { if (current === 'map') renderMapPath(); }, 120);
    });

    PP.mic.setTuning(store.device().tuningCents);
    PP.sync.start();   // stockage persistant + 1re synchro après l'affichage (jamais bloquant)
    var p = profile();
    var count = store.profileList().length;
    if (count > 1 || (!p && count)) { showWho(); return; }   // plusieurs enfants : « Qui joue ? » (§9.4)
    if (!p) { showWelcome(); return; }
    document.body.dataset.mode = p.mode;
    showMap();       // le micro sera demandé au 1er tap sur une leçon (geste obligatoire)
  }

  PP.app = { showMicHelp: showMicHelp };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
