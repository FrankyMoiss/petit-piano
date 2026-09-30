/* Petit Piano — textes d'interface (français).
 * Les textes des leçons sont dans js/curriculum.js ; ici uniquement l'interface.
 * {prenom}, {note}, {n}… sont remplacés par PP.t().
 */
(function (root) {
  'use strict';
  var PP = root.PP = root.PP || {};

  PP.STR = {
    fr: {
      appName: 'Petit Piano',

      // E1 — Bienvenue
      'welcome.hello': 'Salut ! Comment tu t\'appelles ?',
      'welcome.placeholder': 'Ton prénom',
      'welcome.go': 'C\'est parti ! ▶',
      'welcome.haveCode': 'J\'ai déjà un code famille ›',
      'welcome.newChild': 'Nouvel enfant : comment il ou elle s\'appelle ?',

      // E7 — Qui joue ?
      'who.title': 'Qui joue ?',
      'who.found': 'Retrouvé : {prenom} {avatar} !',

      // E2 — Réglage du micro
      'mic.explain1': 'Pour t\'entendre jouer, j\'ai besoin du micro.',
      'mic.explain2': 'Pose le téléphone sur le pupitre du piano.',
      'mic.explain3': 'Si une fenêtre s\'ouvre, demande à un adulte d\'appuyer sur « Autoriser ».',
      'mic.enable': '🎤 Activer le micro',
      'mic.noMic': 'Jouer sans micro (avec l\'écran) ›',
      'mic.waiting': 'Appuie sur « Autoriser » dans la fenêtre…',
      'mic.silence': 'Chut… Ne joue rien pendant 2 secondes 🤫',
      'mic.testTitle': 'Test du micro : joue n\'importe quelle touche !',
      'mic.youPlayed': 'Tu as joué : {note} ! 🎉',
      'mic.perfect': 'Parfait, je t\'entends très bien !',
      'mic.works': 'Ça marche ! ▶',
      'mic.hearNothing': 'Je n\'entends rien ? ›',
      'mic.helpTitle': 'Je n\'entends rien ?',
      'mic.tips': [
        'Rapproche le téléphone du piano',
        'Joue un peu plus fort',
        'Ferme la porte, éteins la télé',
        'Vérifie que le son n\'est pas coupé'
      ],
      'mic.redoSilence': 'Refaire le silence',
      'mic.useScreen': '👆 Jouer avec l\'écran',
      'mic.close': 'OK',

      // E2b — Micro bloqué
      'blocked.title': 'Oups, le micro est bloqué.',
      'blocked.adult': 'Pour un adulte :',
      'blocked.ios': 'iPad / iPhone (Safari) : touche « aA » dans la barre d\'adresse › Réglages du site › Micro › Autoriser.',
      'blocked.android': 'Android / Chrome : cadenas à gauche de l\'adresse › Autorisations › Micro › Autoriser. Puis recharger la page.',
      'blocked.notFound': 'Je ne trouve pas de micro sur cet appareil.',
      'blocked.insecure': 'Le micro ne marche que si l\'appli est ouverte en https:// ou sur localhost. Demande à l\'adulte qui l\'a installée.',
      'blocked.other': 'Le micro n\'a pas pu démarrer. Il est peut-être utilisé par une autre appli.',
      'blocked.retry': '↻ Réessayer',

      // E3 — Carte
      'map.hello': 'Salut {prenom} ! 👋',
      'map.day': '{n} jour',
      'map.days': '{n} jours',
      'map.play': 'Jouer ▶',
      'map.locked': 'Termine la leçon d\'avant pour ouvrir celle-ci 🔒',
      'map.allDone': 'Tu as tout fini ! Rejoue tes chansons préférées 🎶',
      'map.longPress': 'Appui long pour les parents',
      'map.settings': 'Coin des parents',

      // E4 — Leçon
      'lesson.quit': 'Quitter la leçon',
      'lesson.continue': 'Continuer ▶',
      'lesson.listen': '🔊 Écoute d\'abord',
      'lesson.stop': '⏹ Stop',
      'lesson.readAloud': 'Lire la consigne',
      'lesson.playFinger': 'Joue le {note} avec le doigt {finger}',
      'lesson.playLeftThumb': 'Joue le {note} avec le pouce gauche',
      'lesson.play': 'Joue le {note}',
      'lesson.youPlayed': 'Tu as joué {note}',
      'lesson.listenThis': 'Écoute… c\'est ce son-là !',
      'lesson.praise': ['Super !', 'Génial !', 'Top !'],
      'lesson.listening': 'Je t\'écoute… Joue le {note} 🙂',
      'lesson.listeningAny': 'Je t\'écoute… 🙂',
      'lesson.quitConfirm': 'Tu veux quitter la leçon ?',
      'lesson.quitYes': 'Oui, quitter',
      'lesson.quitNo': 'Non, je continue',
      'lesson.resume': 'Touche l\'écran pour continuer ▶',
      'lesson.micStopped': 'Le micro s\'est arrêté.',
      'lesson.touchMode': 'Mode écran : tu joues en touchant le téléphone.',
      'lesson.useMic': '🎹 Jouer avec le piano',
      'lesson.micIndicator': 'J\'écoute',
      'lesson.touchIndicator': 'Mode écran : touche pour réessayer le micro',
      'lesson.micRetryFailed': 'Le micro ne répond pas. On continue avec l\'écran 👆',

      // E5 — Bravo
      'bravo.title': 'Bravo {prenom} !',
      'bravo.stars3': 'Parfait !',
      'bravo.stars2': 'Super !',
      'bravo.stars1': 'Bien joué ! Rejoue pour gagner plus d\'étoiles.',
      'bravo.record': 'Nouveau record !',
      'bravo.unlocked': 'Nouvelle leçon débloquée : {title} 🔓',
      'bravo.levelDone': 'Tu as fini le {level} ! 🏆',
      'bravo.replay': 'Rejouer ↻',
      'bravo.next': 'Leçon suivante ▶',
      'bravo.map': 'Carte 🗺',

      // E6 — Coin des parents
      'parents.title': 'Coin des parents',
      'parents.name': 'Prénom',
      'parents.save': 'Enregistrer',
      'parents.input': 'Jouer avec',
      'parents.inputMic': '🎤 Micro',
      'parents.inputTouch': '👆 Écran',
      'parents.redoMic': '🎤 Refaire le test du micro (et l\'accordage)',
      'parents.tuning': 'Accordage du piano mesuré : {c} cents',
      'parents.voice': 'Lire les consignes à voix haute automatiquement',
      'parents.unlockAll': 'Débloquer toutes les leçons',
      'parents.reset': 'Tout réinitialiser',
      'parents.resetConfirm': 'Effacer le prénom et toute la progression ?',
      'parents.resetYes': 'Oui, tout effacer',
      'parents.cancel': 'Annuler',
      'parents.storageWarn': '⚠️ La progression ne peut pas être sauvegardée sur cet appareil.',
      'parents.addChild': '+ Ajouter un enfant',
      'parents.debug': 'Astuce : ajoute ?debug=1 à l\'adresse pour voir ce que le micro entend.',
      'parents.back': '◀ Retour',

      // E6 — Plusieurs téléphones (DESIGN §9.12)
      'sync.title': 'Plusieurs téléphones',
      'sync.intro': 'Partage la progression entre les téléphones de la famille.',
      'sync.create': '➕ Créer un code famille',
      'sync.join': '🔑 J\'ai déjà un code',
      'sync.codeLabel': 'Code famille :',
      'sync.share': '📤 Partager le code',
      'sync.howTo': 'Sur l\'autre téléphone : ouvre Petit Piano, puis « J\'ai déjà un code ».',
      'sync.keep': 'Garde ce code : il sert aussi à tout récupérer si un téléphone est perdu.',
      'sync.copied': 'Code copié ✓',
      'sync.shareTitle': 'Petit Piano',
      'sync.shareText': 'Code famille Petit Piano : {code}\nSur l\'autre téléphone : ouvre Petit Piano, puis « J\'ai déjà un code ». (À garder entre parents.)',
      'sync.creating': 'Création du code…',
      'sync.joinTitle': 'Entre le code famille',
      'sync.joinGo': 'Rejoindre ▶',
      'sync.checking': 'Je vérifie…',
      'sync.joined': '✓ Progression partagée',
      'sync.errNotFound': 'Je ne trouve pas ce code. Vérifie-le sur l\'autre téléphone.',
      'sync.errFormat': 'Ce code n\'a pas l\'air complet. Vérifie-le.',
      'sync.errChars': 'Ce code contient un 0, un O, un 1, un I ou un L : il n\'y en a jamais. Vérifie-le.',
      'sync.errOffline': 'Pas de connexion internet. Réessaie plus tard.',
      'sync.errOther': 'Ça n\'a pas marché. Réessaie dans un moment.',
      'sync.leave': 'Quitter la synchronisation ›',
      'sync.leaveConfirm': 'Ce téléphone ne sera plus synchronisé. La progression reste ici, et aussi sur les autres téléphones.',
      'sync.leaveYes': 'Quitter',
      'sync.resetConfirmUnsynced': 'Ce téléphone n\'est pas synchronisé : les dernières leçons jouées ici seront perdues. Tout effacer ?',
      'sync.resetConfirmFamily': 'Effacer ce téléphone ? La progression reste sur les autres téléphones de la famille.',

      // Statut (petit, sous le code)
      'sync.statusNow': '✓ Synchronisé à l\'instant',
      'sync.statusMin': '✓ Synchronisé il y a {n} min',
      'sync.statusHour': '✓ Synchronisé il y a {n} h',
      'sync.statusDay': '✓ Synchronisé le {date}',
      'sync.statusSyncing': 'Synchronisation…',
      'sync.statusOffline': 'Hors ligne, sera synchronisé plus tard',
      'sync.statusError': 'Pas encore synchronisé, nouvel essai bientôt',
      'sync.statusTooNew': 'Mets à jour Petit Piano sur ce téléphone pour synchroniser.',

      // Aides par note (après 2 erreurs, si l'étape n'a pas son propre « hint »)
      'hint.C': 'Le Do est juste à gauche des 2 touches noires.',
      'hint.D': 'Le Ré est entre les 2 touches noires.',
      'hint.E': 'Le Mi est juste à droite des 2 touches noires.',
      'hint.F': 'Le Fa est juste à gauche des 3 touches noires.',
      'hint.G': 'Le Sol est juste à droite du Fa.',
      'hint.A': 'Le La est entre la 2e et la 3e noire du groupe de 3.',
      'hint.B': 'Le Si est juste avant le Do.',
      'hint.black': 'Cherche parmi les touches noires.'
    }
  };

  var lang = 'fr';

  /** Texte d'interface avec remplacement des {variables}. Une liste est renvoyée telle quelle. */
  PP.t = function (key, vars) {
    var s = PP.STR[lang][key];
    if (s === undefined) return key;
    if (typeof s !== 'string') return s;
    return PP.fill(s, vars);
  };

  /** Remplace {nom} par vars.nom (laisse intact si absent). */
  PP.fill = function (s, vars) {
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] !== undefined ? vars[k] : m; });
  };
})(typeof window !== 'undefined' ? window : globalThis);
