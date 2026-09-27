/* Petit Piano — programme des leçons (données pures, DESIGN §4 et §6.3).
 *
 * Conventions :
 *  - Notes « NOTE-doigt:durée » séparées par des espaces : "C4-1 E4-3:2 G3-g1".
 *    Do4 = C4 = Do du milieu ; doigt 1 = pouce … 5 = petit doigt ; g1 = pouce gauche.
 *  - accept : classes de hauteur en noms anglais internes ("C", "C#"…).
 *  - id de leçon STABLE (clé de progression) : ne jamais renuméroter.
 *  - Champs réservés au futur mode « petit » : textPetit, sayPetit, icon.
 */
(function (root) {
  'use strict';

  var POSITION_DO = 'C4-1 D4-2 E4-3 F4-4 G4-5';
  var C3_C5 = { from: 'C3', to: 'C5', phone: { from: 'C4', to: 'C5' } };
  var C4_C5 = { from: 'C4', to: 'C5' };

  // Frère Jacques, morceaux réutilisés (L6, L9)
  var FJ_FRERE = 'C4-1 D4-2 E4-3 C4-1 C4-1 D4-2 E4-3 C4-1';
  var FJ_FRERE_LY = 'Frè|re|Jac|ques|frè|re|Jac|ques';
  var FJ_DORMEZ = 'E4-3 F4-4 G4-5:2 E4-3 F4-4 G4-5:2';
  var FJ_DORMEZ_LY = 'Dor|mez|vous|Dor|mez|vous';
  var FJ_SONNEZ = 'G4-4:0.5 A4-5:0.5 G4-4:0.5 F4-3:0.5 E4-2 C4-1';
  var FJ_SONNEZ_LY = 'Son|nez|les|ma|ti|nes';
  var FJ_DIN = 'C4-1 G3-g1 C4-1:2 C4-1 G3-g1 C4-1:2';
  var FJ_DIN_LY = 'Din|dan|don|Din|dan|don';

  // Au clair de la lune
  var ACL_1 = 'C4-1 C4-1 C4-1 D4-2 E4-3:2 D4-2:2';
  var ACL_2 = 'C4-1 E4-3 D4-2 D4-2 C4-1:4';

  // Ode à la joie
  var ODE_1 = 'E4-3 E4-3 F4-4 G4-5 G4-5 F4-4 E4-3 D4-2';
  var ODE_2 = 'C4-1 C4-1 D4-2 E4-3 E4-3:1.5 D4-2:0.5 D4-2:2';
  var ODE_3 = 'C4-1 C4-1 D4-2 E4-3 D4-2:1.5 C4-1:0.5 C4-1:2';

  root.CURRICULA = {
    grand: {
      id: 'grand',
      title: 'Niveau 1',
      tempo: 96,
      lessons: [
        {
          id: 'l01', num: 1, title: 'Le clavier', emoji: '🎹', keyboard: C3_C5,
          doneText: 'Tu connais ton clavier !',
          steps: [
            { type: 'info', illus: 'posture',
              text: 'Salut {prenom} ! Assieds-toi au milieu du piano, le dos bien droit.',
              say: 'Salut {prenom} ! On apprend le piano ensemble. Assieds-toi bien au milieu du piano, le dos droit, les pieds posés par terre.' },
            { type: 'info', illus: 'bubbleHand',
              text: 'Arrondis ta main comme si tu tenais une bulle de savon. 🫧',
              say: 'Arrondis ta main, comme si tu tenais une bulle de savon. Doigts ronds, poignet souple.' },
            { type: 'info', illus: 'fingerNumbers',
              text: 'Tes doigts ont des numéros : 1 = pouce … 5 = petit doigt.',
              say: 'Tes doigts ont des numéros. Le pouce, c\'est 1. Le petit doigt, c\'est 5.' },
            { type: 'info', groups: '2,3',
              text: 'Les touches noires vont par groupes de 2 et de 3.',
              say: 'Regarde les touches noires. Elles vont par groupes de deux, et par groupes de trois.' },
            { type: 'find', accept: ['C#', 'D#'], count: 3, groups: '2',
              text: 'Joue une touche noire d\'un **groupe de 2**.',
              say: 'Joue une touche noire d\'un groupe de deux.',
              hint: 'Cherche 2 touches noires côte à côte.' },
            { type: 'find', accept: ['F#', 'G#', 'A#'], count: 3, groups: '3',
              text: 'Maintenant, une touche noire d\'un **groupe de 3**.',
              say: 'Maintenant, joue une touche noire d\'un groupe de trois.',
              hint: 'Cherche 3 touches noires côte à côte.' }
          ]
        },
        {
          id: 'l02', num: 2, title: 'Le Do', emoji: '🔴', keyboard: C3_C5,
          doneText: 'Tu sais trouver le Do !',
          steps: [
            { type: 'info', keys: 'C3 C4 C5', groups: '2',
              text: 'Le **Do** est la touche blanche juste à gauche des 2 touches noires.',
              say: 'Le Do, c\'est la touche blanche juste à gauche des deux touches noires.' },
            { type: 'find', accept: ['C'], count: 4, keys: 'C3 C4 C5',
              text: 'Trouve un Do et joue-le. Partout sur le piano !',
              say: 'Trouve un Do et joue-le. Essaie à plein d\'endroits du piano !',
              hint: 'Cherche 2 touches noires, puis va juste à gauche.' },
            { type: 'info', keys: 'C4',
              text: 'Le **Do du milieu** est le Do le plus proche du centre du piano.',
              say: 'Le Do du milieu, c\'est le Do le plus proche du milieu du piano, souvent juste sous le nom du piano.' },
            { type: 'find', accept: ['C'], count: 3, keys: 'C4-1',
              text: 'Pose ton pouce droit (1) sur le Do du milieu. Joue-le 3 fois.',
              say: 'Pose ton pouce droit sur le Do du milieu, et joue-le trois fois.' },
            { type: 'info', keys: 'C4-1',
              text: 'Garde ton pouce sur le Do du milieu : c\'est ta maison 🏠.',
              say: 'Garde ton pouce sur le Do du milieu. C\'est ta maison !' }
          ]
        },
        {
          id: 'l03', num: 3, title: 'Ré et Mi', emoji: '🟠', keyboard: C3_C5,
          doneText: 'Tu connais Do, Ré et Mi !',
          steps: [
            { type: 'info', keys: 'D4-2',
              text: 'Le **Ré** est entre les 2 touches noires.',
              say: 'Le Ré se cache entre les deux touches noires.' },
            { type: 'find', accept: ['D'], count: 3, keys: 'D4-2',
              text: 'Joue le Ré avec le doigt 2.',
              say: 'Joue le Ré avec le doigt deux.',
              hint: 'Entre les 2 touches noires.' },
            { type: 'info', keys: 'E4-3',
              text: 'Le **Mi** est juste à droite des 2 touches noires.',
              say: 'Le Mi est juste à droite des deux touches noires.' },
            { type: 'find', accept: ['E'], count: 3, keys: 'E4-3',
              text: 'Joue le Mi avec le doigt 3.',
              say: 'Joue le Mi avec le doigt trois.',
              hint: 'À droite des 2 touches noires.' },
            { type: 'sequence', seq: 'C4-1 D4-2 E4-3',
              text: 'On monte l\'escalier : Do, Ré, Mi.',
              say: 'On monte l\'escalier : Do, Ré, Mi. Écoute d\'abord si tu veux !' },
            { type: 'sequence', seq: 'E4-3 D4-2 C4-1',
              text: 'On redescend : Mi, Ré, Do.',
              say: 'Et on redescend : Mi, Ré, Do.' },
            { type: 'sequence', seq: 'C4-1 D4-2 E4-3 D4-2 C4-1',
              text: 'Aller-retour !',
              say: 'Un aller-retour !' },
            { type: 'sequence', seq: 'C4-1 E4-3 D4-2 C4-1 E4-3',
              text: 'Petit défi : ça saute !',
              say: 'Petit défi : cette fois, ça saute !' }
          ]
        },
        {
          id: 'l04', num: 4, title: 'Au clair de la lune', emoji: '🌙', keyboard: C3_C5,
          doneText: 'Tu as joué ta première chanson ! 🌙',
          steps: [
            { type: 'info', keys: 'C4-1 D4-2 E4-3',
              text: 'Ta première chanson ! Seulement 3 notes : Do, Ré, Mi.',
              say: 'Ta toute première chanson ! Elle n\'a que trois notes : Do, Ré et Mi.' },
            { type: 'info', illus: 'repeatNote',
              text: 'Pour rejouer la même note, relève bien le doigt entre chaque.',
              say: 'Quand tu rejoues la même note, relève bien ton doigt à chaque fois.' },
            { type: 'sequence', song: true, title: 'Au clair de la lune',
              seq: ACL_1, lyrics: 'Au|clair|de|la|lu|ne',
              text: 'Début de la chanson. Écoute d\'abord !',
              say: 'Voici le début. Écoute d\'abord, puis joue.' },
            { type: 'sequence', song: true, title: 'Au clair de la lune',
              seq: ACL_2, lyrics: 'mon|a|mi|Pier|rot',
              text: 'La suite !',
              say: 'Maintenant, la suite.' },
            { type: 'sequence', song: true, title: 'Au clair de la lune',
              seq: [ACL_1, ACL_2, ACL_1, ACL_2].join(' '),
              lyrics: 'Au|clair|de|la|lu|ne|mon|a|mi|Pier|rot|Prê|te|moi|ta|plu|me|pour|é|cri|r\'un|mot',
              text: 'Toute la chanson ! 🌙',
              say: 'Et maintenant, toute la chanson !' }
          ]
        },
        {
          id: 'l05', num: 5, title: 'Fa et Sol', emoji: '🟢', keyboard: C3_C5,
          doneText: 'Tu connais 5 notes ! 🖐️',
          steps: [
            { type: 'info', keys: 'F4', groups: '3',
              text: 'Le **Fa** est juste à gauche des 3 touches noires.',
              say: 'Le Fa est juste à gauche des trois touches noires.' },
            { type: 'find', accept: ['F'], count: 3, keys: 'F4-4',
              text: 'Joue le Fa avec le doigt 4.',
              say: 'Joue le Fa avec le doigt quatre.',
              hint: 'À gauche des 3 touches noires.' },
            { type: 'info', keys: 'G4',
              text: 'Le **Sol** est juste à droite du Fa.',
              say: 'Le Sol est juste à droite du Fa.' },
            { type: 'find', accept: ['G'], count: 3, keys: 'G4-5',
              text: 'Joue le Sol avec le petit doigt (5).',
              say: 'Joue le Sol avec ton petit doigt, le cinq.',
              hint: 'Juste à droite du Fa.' },
            { type: 'info', illus: 'cPosition', keys: POSITION_DO,
              text: 'Pouce sur Do, petit doigt sur Sol : c\'est la **position de Do** !',
              say: 'Un doigt par touche : le pouce sur Do, le petit doigt sur Sol. C\'est la position de Do !' },
            { type: 'sequence', seq: POSITION_DO,
              text: 'Monte : Do Ré Mi Fa Sol.',
              say: 'On monte, avec les cinq doigts.' },
            { type: 'sequence', seq: 'G4-5 F4-4 E4-3 D4-2 C4-1',
              text: 'Descends : Sol Fa Mi Ré Do.',
              say: 'Et on redescend.' },
            { type: 'sequence', seq: 'C4-1 E4-3 G4-5 E4-3 C4-1',
              text: 'Les sauts : Do, Mi, Sol !',
              say: 'Maintenant, des sauts : Do, Mi, Sol !' }
          ]
        },
        {
          id: 'l06', num: 6, title: 'Frère Jacques', emoji: '🔔', keyboard: C4_C5,
          doneText: 'Frère Jacques commence à sonner ! 🔔',
          steps: [
            { type: 'info', keys: POSITION_DO,
              text: 'Une chanson que tu connais : Frère Jacques !',
              say: 'Une chanson que tu connais sûrement : Frère Jacques !' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: FJ_FRERE, lyrics: FJ_FRERE_LY,
              text: '« Frère Jacques » deux fois.',
              say: 'Frère Jacques, deux fois.' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: FJ_DORMEZ, lyrics: FJ_DORMEZ_LY,
              text: '« Dormez-vous ? » deux fois.',
              say: 'Dormez-vous, deux fois.' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: FJ_FRERE + ' ' + FJ_DORMEZ, lyrics: FJ_FRERE_LY + '|' + FJ_DORMEZ_LY,
              text: 'Tout le début ! 🔔',
              say: 'Et maintenant, tout le début !' }
          ]
        },
        {
          id: 'l07', num: 7, title: 'Ode à la joie', emoji: '🎉', keyboard: C4_C5,
          doneText: 'Tu joues du Beethoven ! 🎉',
          steps: [
            { type: 'info', keys: 'E4-3',
              text: 'Une musique célèbre de Beethoven ! Elle commence sur **Mi**, doigt 3.',
              say: 'Voici une musique très célèbre de Beethoven. Elle commence sur Mi, avec le doigt trois.' },
            { type: 'sequence', song: true, title: 'Ode à la joie', seq: ODE_1,
              text: 'Morceau 1',
              say: 'Premier morceau. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Ode à la joie', seq: ODE_2,
              text: 'Morceau 2',
              say: 'Deuxième morceau.' },
            { type: 'sequence', song: true, title: 'Ode à la joie', seq: ODE_3,
              text: 'Morceau 3 : presque pareil, mais ça finit sur Do !',
              say: 'Le troisième morceau ressemble au deuxième, mais il finit sur Do.' },
            { type: 'sequence', song: true, title: 'Ode à la joie',
              seq: [ODE_1, ODE_2, ODE_1, ODE_3].join(' '),
              text: 'Tout l\'Ode à la joie ! 🎉',
              say: 'Et maintenant, tout le morceau !' }
          ]
        },
        {
          id: 'l08', num: 8, title: 'La et Si', emoji: '⭐', keyboard: C3_C5,
          doneText: 'Tu connais les 7 notes ! Do Ré Mi Fa Sol La Si ⭐',
          steps: [
            { type: 'info', keys: 'A4', groups: '3',
              text: 'Le **La** est entre la 2e et la 3e touche noire du groupe de 3.',
              say: 'Le La est entre la deuxième et la troisième touche noire du groupe de trois.' },
            { type: 'find', accept: ['A'], count: 3, keys: 'A4',
              text: 'Joue un La.',
              say: 'Joue un La.',
              hint: 'Dans le groupe de 3, entre la 2e et la 3e noire.' },
            { type: 'info', keys: 'B4',
              text: 'Le **Si** est juste à droite du groupe de 3, avant le Do.',
              say: 'Le Si est juste à droite du groupe de trois, juste avant le Do.' },
            { type: 'find', accept: ['B'], count: 3, keys: 'B4',
              text: 'Joue un Si.',
              say: 'Joue un Si.',
              hint: 'Juste avant le Do suivant.' },
            { type: 'info', illus: 'thumbUnder', keys: 'C4-1 D4-2 E4-3 F4-1',
              text: '8 notes, 5 doigts… Après Mi, le **pouce passe dessous** pour jouer Fa !',
              say: 'Huit notes, mais seulement cinq doigts ! L\'astuce : après le Mi, ton pouce passe dessous pour jouer le Fa.' },
            { type: 'sequence', seq: 'C4-1 D4-2 E4-3 F4-1',
              text: 'Do Ré Mi… et le pouce passe dessous sur Fa !',
              say: 'Do, Ré, Mi, et le pouce passe dessous pour le Fa.' },
            { type: 'sequence', seq: 'F4-1 G4-2 A4-3 B4-4 C5-5',
              text: 'Puis Fa Sol La Si Do.',
              say: 'Puis, depuis Fa : Fa, Sol, La, Si, Do.' },
            { type: 'sequence', seq: 'C4-1 D4-2 E4-3 F4-1 G4-2 A4-3 B4-4 C5-5:2',
              text: 'La gamme de Do en entier ! ⬆️',
              say: 'La gamme de Do, en entier !' },
            { type: 'sequence', seq: 'C5-5 B4-4 A4-3 G4-2 F4-1 E4-3 D4-2 C4-1:2',
              text: 'Et on redescend. Après Fa, le doigt 3 passe par-dessus ! ⬇️',
              say: 'Et on redescend. Après le Fa, ton doigt trois passe par-dessus le pouce.' }
          ]
        },
        {
          id: 'l09', num: 9, title: 'Frère Jacques en entier', emoji: '🔔',
          keyboard: { from: 'G3', to: 'C5', phone: { from: 'G3', to: 'A4' } },
          doneText: 'Tu joues Frère Jacques en entier ! 🔔',
          steps: [
            { type: 'info',
              text: 'La suite de Frère Jacques ! Tu connais déjà toutes les notes.',
              say: 'Aujourd\'hui, toute la chanson Frère Jacques. Tu connais déjà toutes les notes !' },
            { type: 'info', keys: 'G4-4 A4-5 F4-3 E4-2 C4-1',
              text: 'Petit doigt sur La, doigt 4 sur Sol. Le pouce s\'écarte vers le Do.',
              say: 'Pour sonner les matines, pose le petit doigt sur La et le doigt quatre sur Sol. Ton pouce s\'écarte pour attraper le Do.' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: FJ_SONNEZ, lyrics: FJ_SONNEZ_LY,
              text: '« Sonnez les matines »',
              say: 'Sonnez les matines. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: 'E4-3 F4-4 G4-5:2 ' + FJ_SONNEZ, lyrics: 'Dor|mez|vous|' + FJ_SONNEZ_LY,
              text: 'Après « vous », glisse ta main d\'une touche vers la droite !',
              say: 'Après dormez-vous, glisse ta main d\'une touche vers la droite, pour sonner les matines.' },
            { type: 'info', illus: 'leftThumb', keys: 'G3-g1',
              text: 'Le **Sol grave** : à gauche du Do du milieu. Joue-le avec le pouce **gauche** !',
              say: 'Le Sol grave, c\'est le Sol juste à gauche du Do du milieu. Joue-le avec le pouce de ta main gauche !' },
            // La validation ignore l'octave : un Sol aigu est aussi accepté (voulu, DESIGN §5.3).
            { type: 'find', accept: ['G'], count: 2, keys: 'G3-g1',
              text: 'Pouce gauche sur le Sol grave : joue-le 2 fois.',
              say: 'Pouce gauche sur le Sol grave, et joue-le deux fois.' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: FJ_DIN, lyrics: FJ_DIN_LY,
              text: '« Din, dan, don » : pouce droit, pouce gauche, pouce droit.',
              say: 'Din, dan, don : pouce droit, pouce gauche, pouce droit.' },
            { type: 'sequence', song: true, title: 'Frère Jacques',
              seq: [FJ_FRERE, FJ_DORMEZ, FJ_SONNEZ, FJ_SONNEZ, FJ_DIN].join(' '),
              lyrics: [FJ_FRERE_LY, FJ_DORMEZ_LY, FJ_SONNEZ_LY, FJ_SONNEZ_LY, FJ_DIN_LY].join('|'),
              text: 'Toute la chanson ! 🔔🔔',
              say: 'Et maintenant, toute la chanson Frère Jacques !' }
          ]
        }
      ]
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.CURRICULA;
})(typeof window !== 'undefined' ? window : globalThis);
