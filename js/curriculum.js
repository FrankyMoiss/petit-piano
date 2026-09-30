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

  // ---------- Niveau 2 (DESIGN §10) ----------
  // Uniquement du domaine public (compositeurs morts depuis > 70 ans, airs traditionnels).
  var LH_RANGE = { from: 'C3', to: 'C5', phone: { from: 'C3', to: 'C4' } };     // l10, l11
  var MID_RANGE = { from: 'C3', to: 'C5', phone: { from: 'F3', to: 'G4' } };    // l12, l13
  var SIDE_RANGE = { from: 'C3', to: 'C5', phone: { from: 'G3', to: 'A4' } };   // l14, l15, l18

  // Main gauche, position de Do (Do3–Sol3)
  var LH_POSITION_DO = 'C3-g5 D3-g4 E3-g3 F3-g2 G3-g1';

  // When the Saints Go Marching In (spiritual traditionnel, en Do, main gauche)
  var SAINTS_OH = 'C3-g5 E3-g3 F3-g2 G3-g1:4';                                              // Oh when the saints
  var SAINTS_GO = 'C3-g5 E3-g3 F3-g2 G3-g1:2 E3-g3:2 C3-g5:2 E3-g3:2 D3-g4:4';              // … go marching in
  var SAINTS_A = [SAINTS_OH, SAINTS_OH, SAINTS_GO].join(' ');                               // 16 notes
  var SAINTS_LORD = 'E3-g3:2 E3-g3 D3-g4 C3-g5:3 C3-g5 E3-g3:2 G3-g1:2 G3-g1 F3-g2:3';       // Oh Lord, I want… (9)
  var SAINTS_END = 'E3-g3 F3-g2 G3-g1:2 E3-g3:2 C3-g5:2 D3-g4:2 C3-g5:4';                    // when the saints… (7)
  var SAINTS_OH_LY = 'Oh|when|the|saints';
  var SAINTS_GO_LY = 'Oh|when|the|saints|go|mar|ching|in';
  var SAINTS_END_LY = 'when|the|saints|go|mar|ching|in';
  var SAINTS_A_LY = [SAINTS_OH_LY, SAINTS_OH_LY, SAINTS_GO_LY].join('|');

  // Position du Do du milieu (deux pouces sur Do4)
  var MID_RH = 'C4-1 D4-2 E4-3 F4-4 G4-5';
  var MID_LH = 'C4-g1 B3-g2 A3-g3 G3-g4 F3-g5';

  // Joyeux anniversaire (Good Morning to All, 1893 ; en Do)
  var JA_1 = 'G3-g4:0.75 G3-g4:0.25 A3-g3 G3-g4 C4-1 B3-g2:2';
  var JA_2 = 'G3-g4:0.75 G3-g4:0.25 A3-g3 G3-g4 D4-2 C4-1:2';
  var JA_3 = 'G3-g4:0.75 G3-g4:0.25 G4-5 E4-3 C4-1 B3-g2 A3-g3:2';
  var JA_4 = 'F4-4:0.75 F4-4:0.25 E4-3 C4-1 D4-2 C4-1:2';
  var JA_LY = 'Jo|yeux|an|ni|ver|saire';
  var JA_3_LY = 'Jo|yeux|an|ni|ver|saire|🎂';

  // Mains côte à côte : pouce gauche Do4, pouce droit Ré4
  var SIDE_HANDS = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2';
  var SIDE_ALL = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 F4-3 G4-4 A4-5';

  // Korobeïniki (air populaire russe, en La mineur) — l'air traditionnel seulement
  var KORO_A1 = 'E4-2 B3-g2:0.5 C4-g1:0.5 D4-1 C4-g1:0.5 B3-g2:0.5 A3-g3 A3-g3:0.5 C4-g1:0.5 E4-2 D4-1:0.5 C4-g1:0.5'; // 12
  var KORO_A2 = 'B3-g2:1.5 C4-g1:0.5 D4-1 E4-2 C4-g1 A3-g3 A3-g3:2';                                                   // 7
  var KORO_A = KORO_A1 + ' ' + KORO_A2;                                                                                 // 19
  var KORO_B1 = 'D4-1:1.5 F4-3:0.5 A4-5 G4-4:0.5 F4-3:0.5 E4-2:1.5 C4-g1:0.5 E4-2 D4-1:0.5 C4-g1:0.5';                 // 10
  var KORO_B2 = 'B3-g2 B3-g2:0.5 C4-g1:0.5 D4-1 E4-2 C4-g1 A3-g3 A3-g3:2';                                              // 8
  var KORO_B = KORO_B1 + ' ' + KORO_B2;                                                                                 // 18

  // Jingle Bells (Pierpont 1857 ; refrain en Sol, position de Sol)
  var POSITION_SOL = 'G4-1 A4-2 B4-3 C5-4 D5-5';
  var JB_1 = 'B4-3 B4-3 B4-3:2 B4-3 B4-3 B4-3:2 B4-3 D5-5 G4-1:1.5 A4-2:0.5 B4-3:4';
  var JB_1_LY = 'Jin|gle|bells|jin|gle|bells|jin|gle|all|the|way';
  var JB_FUN = 'C5-4 C5-4 C5-4:1.5 C5-4:0.5 C5-4 B4-3 B4-3 B4-3:0.5 B4-3:0.5';
  var JB_FUN_LY = 'Oh|what|fun|it|is|to|ride|in|a';
  var JB_2 = JB_FUN + ' B4-3 A4-2 A4-2 B4-3 A4-2:2 D5-5:2';
  var JB_2_LY = JB_FUN_LY + '|one|horse|o|pen|sleigh|hey';
  var JB_3 = JB_FUN + ' D5-5 D5-5 C5-4 A4-2 G4-1:4';
  var JB_3_LY = JB_FUN_LY + '|one|horse|o|pen|sleigh';

  // La Lettre à Élise (Beethoven ; en La mineur, position de La, Ré♯ au doigt 4)
  var POSITION_LA = 'A4-1 B4-2 C5-3 D#5-4 E5-5';
  var ELISE_BALANCE = 'E5-5 D#5-4 E5-5 D#5-4 E5-5:2';                                                                   // 5
  var ELISE_M = 'E5-5:0.5 D#5-4:0.5 E5-5:0.5 D#5-4:0.5 E5-5:0.5 B4-2:0.5 D5-4:0.5 C5-3:0.5 A4-1:1.5';                 // 9
  var ELISE_R1 = 'E4-g1:0.5 A4-1:0.5 B4-2:1.5';                                                                         // 3
  var ELISE_R2 = 'E4-g1:0.5 C5-3:0.5 B4-2:0.5 A4-1:1.5';                                                                // 4
  var ELISE_ALL = [ELISE_M, ELISE_R1, ELISE_M, ELISE_R1, ELISE_R2].join(' ');                                          // 28

  // Dans l'antre du roi de la montagne (Grieg ; transposé en La mineur, mains côte à côte)
  var TROLL_1 = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 C4-g1 E4-2:2';                                                             // 7
  var TROLL_2 = 'D#4-2 B3-g2 D#4-2:2 D4-1 A#3-g2 D4-1:2';                                                               // 6
  var TROLL_A = TROLL_1 + ' ' + TROLL_2;                                                                                // 13
  var TROLL_B = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 C4-g1 E4-2 A4-5 G4-4 E4-2 C4-g1 E4-2 G4-4:2';                            // 13
  var TROLL_ALL = TROLL_A + ' ' + TROLL_B;                                                                              // 26

  root.CURRICULA = {
    grand: {
      id: 'grand',
      title: 'Niveau 1',            // conservé (compatibilité) ; les niveaux sont dans `levels`
      tempo: 96,
      // Niveau d'une leçon = dernier niveau dont `first` est à un index ≤ celui de la leçon (DESIGN §10.3a).
      levels: [
        { num: 1, title: 'Niveau 1', subtitle: 'La main droite', emoji: '🖐️', first: 'l01' },
        { num: 2, title: 'Niveau 2', subtitle: 'Les deux mains', emoji: '🙌', first: 'l10' }
      ],
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
        },

        // ================= Niveau 2 — Les deux mains (DESIGN §10) =================
        {
          id: 'l10', num: 10, title: 'La main gauche', emoji: '🤚', keyboard: LH_RANGE,
          doneText: 'Ta main gauche joue du jazz ! 🤚',
          steps: [
            { type: 'info', illus: 'leftHand',
              text: 'Ta main **gauche** aussi a des numéros : 1 = pouce … 5 = petit doigt.',
              say: 'Nouveau niveau, {prenom} ! On réveille ta main gauche. Elle aussi a des numéros : le pouce, c\'est 1, le petit doigt, c\'est 5.' },
            { type: 'info', keys: LH_POSITION_DO,
              text: 'Petit doigt gauche sur le **Do grave**, pouce sur Sol : la position de Do, à gauche !',
              say: 'Pose ta main gauche sur le Do grave, un Do plus bas que le Do du milieu. Petit doigt sur Do, pouce sur Sol : c\'est la position de Do, à gauche.' },
            { type: 'find', accept: ['C'], count: 3, keys: 'C3-g5',
              text: 'Petit doigt gauche (5) sur le Do grave. Joue-le 3 fois.',
              say: 'Petit doigt gauche sur le Do grave. Joue-le trois fois.',
              hint: 'Le Do grave : un Do plus à gauche que le Do du milieu.' },
            { type: 'sequence', seq: 'C3-g5 D3-g4 E3-g3 F3-g2 G3-g1',
              text: 'Monte : Do Ré Mi Fa Sol, du petit doigt au pouce.',
              say: 'On monte avec la main gauche : Do, Ré, Mi, Fa, Sol. Du petit doigt jusqu\'au pouce.' },
            { type: 'sequence', seq: 'G3-g1 F3-g2 E3-g3 D3-g4 C3-g5:2',
              text: 'Redescends : Sol Fa Mi Ré Do.',
              say: 'Et on redescend, du pouce au petit doigt.' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: SAINTS_OH + ' ' + SAINTS_OH, lyrics: SAINTS_OH_LY + '|' + SAINTS_OH_LY,
              text: 'Du jazz ! Do, Mi, Fa, Sol… deux fois. 🎺',
              say: 'Un air de jazz de La Nouvelle-Orléans : When the Saints ! Do, Mi, Fa, Sol : petit doigt, doigt trois, doigt deux, pouce. Deux fois. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: SAINTS_A, lyrics: SAINTS_A_LY,
              text: 'Toute la 1re ligne ! 🎺',
              say: 'Et maintenant, toute la première ligne. À la fin, ça redescend : Mi, Do, Mi, Ré.' }
          ]
        },
        {
          id: 'l11', num: 11, title: 'When the Saints', emoji: '🎺', keyboard: LH_RANGE,
          doneText: 'Tu joues du jazz à la main gauche ! 🎺',
          steps: [
            { type: 'info', keys: LH_POSITION_DO,
              text: 'La suite de « When the Saints », toujours à gauche !',
              say: 'Aujourd\'hui, toute la chanson When the Saints, avec la main gauche. Petit doigt sur le Do grave !' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: SAINTS_A, lyrics: SAINTS_A_LY,
              text: 'La 1re ligne. Tu la connais !',
              say: 'D\'abord la première ligne. Tu la connais déjà !' },
            { type: 'sequence', song: true, title: 'When the Saints', seq: SAINTS_LORD,
              text: 'Mi Mi Ré Do… puis ça monte jusqu\'au Sol !',
              say: 'La deuxième ligne : Mi, Mi, Ré, Do, puis ça monte jusqu\'au Sol, avec le pouce, et on finit sur Fa.' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: SAINTS_END, lyrics: SAINTS_END_LY,
              text: 'La fin : Mi Fa Sol, Mi Do, Ré Do.',
              say: 'La fin : Mi, Fa, Sol, puis Mi, Do, Ré, et Do avec le petit doigt.' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: SAINTS_LORD + ' ' + SAINTS_END,
              text: 'La 2e ligne et la fin, à la suite !',
              say: 'La deuxième ligne et la fin, à la suite.' },
            { type: 'sequence', song: true, title: 'When the Saints',
              seq: [SAINTS_A, SAINTS_LORD, SAINTS_END].join(' '),
              text: 'Toute la chanson ! 🎺🎷',
              say: 'Et maintenant, toute la chanson, comme un vrai jazzman !' }
          ]
        },
        {
          id: 'l12', num: 12, title: 'Les deux pouces sur Do', emoji: '🪞', keyboard: MID_RANGE,
          doneText: 'Tes deux mains jouent chacune leur tour ! 🪞',
          steps: [
            { type: 'info', keys: MID_RH,
              text: 'Nouvelle position : les **deux pouces** sur le Do du milieu !',
              say: 'Nouvelle position ! Tes deux pouces se partagent le Do du milieu. La main droite part vers la droite, la main gauche vers la gauche.' },
            { type: 'sequence', seq: 'C4-1 D4-2 E4-3 F4-4 G4-5:2',
              text: 'Main droite : Do Ré Mi Fa Sol ⬆️',
              say: 'Main droite : Do, Ré, Mi, Fa, Sol. Tu connais !' },
            { type: 'info', keys: MID_LH,
              text: 'Main gauche : pouce sur Do, puis **Si, La, Sol, Fa** vers la gauche.',
              say: 'Main gauche maintenant : le pouce sur le même Do. Les autres doigts descendent vers la gauche : Si, La, Sol, Fa.' },
            { type: 'sequence', seq: 'C4-g1 B3-g2 A3-g3 G3-g4 F3-g5:2',
              text: 'Main gauche : Do Si La Sol Fa ⬇️',
              say: 'Avec la main gauche : Do, Si, La, Sol, Fa. On descend !' },
            { type: 'sequence', seq: 'F3-g5 G3-g4 A3-g3 B3-g2 C4-g1:2',
              text: 'Et remonte avec la main gauche ⬆️',
              say: 'Et on remonte avec la main gauche, du petit doigt au pouce.' },
            { type: 'sequence', seq: 'C4-1 E4-3 G4-5 C4-g1 A3-g3 F3-g5:2',
              text: 'Chacun son tour : 3 notes à droite, 3 à gauche !',
              say: 'Chacun son tour : trois notes avec la main droite, puis trois avec la main gauche.' },
            { type: 'sequence', seq: 'F3-g5 G3-g4 A3-g3 B3-g2 C4-1 D4-2 E4-3 F4-4 G4-5:2',
              text: 'Du Fa grave au Sol : la main droite prend le relais !',
              say: 'On monte du Fa grave jusqu\'au Sol. La main gauche commence, et la main droite prend le relais sur le Do.' }
          ]
        },
        {
          id: 'l13', num: 13, title: 'Joyeux anniversaire', emoji: '🎂', keyboard: MID_RANGE,
          doneText: 'Tu peux jouer Joyeux anniversaire à toute la famille ! 🎂',
          steps: [
            { type: 'info', keys: 'G3-g4 A3-g3 B3-g2 C4-1 D4-2 E4-3 F4-4 G4-5',
              text: 'La chanson des anniversaires, à deux mains ! 🎂',
              say: 'Voici la chanson des anniversaires. Tu pourras la jouer pour toute la famille ! Deux pouces sur le Do du milieu.' },
            { type: 'sequence', song: true, title: 'Joyeux anniversaire',
              seq: JA_1, lyrics: JA_LY,
              text: 'Sol Sol La Sol à gauche, puis Do et Si.',
              say: 'Joyeux anniversaire : Sol, Sol, La, Sol avec la main gauche, puis Do à droite et Si à gauche. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Joyeux anniversaire',
              seq: JA_2, lyrics: JA_LY,
              text: 'Presque pareil, mais ça finit sur Ré puis Do.',
              say: 'Presque pareil, mais cette fois ça finit sur Ré, puis Do.' },
            { type: 'info', keys: 'G3-g4 G4-5',
              text: 'Le grand saut : le **Sol aigu**, avec le petit doigt droit !',
              say: 'Attention, dans la phrase suivante il y a un grand saut : du Sol grave au Sol aigu, avec le petit doigt de la main droite.' },
            // Le 🎂 des paroles tient la place du prénom qu'on fête.
            { type: 'sequence', song: true, title: 'Joyeux anniversaire',
              seq: JA_3, lyrics: JA_3_LY,
              text: 'Le grand saut, puis ça redescend !',
              say: 'Le grand saut, puis ça redescend doucement jusqu\'au La.' },
            { type: 'sequence', song: true, title: 'Joyeux anniversaire',
              seq: JA_4, lyrics: JA_LY,
              text: 'La dernière phrase : toute à la main droite.',
              say: 'La dernière phrase se joue toute avec la main droite. Fa avec le doigt quatre !' },
            { type: 'sequence', song: true, title: 'Joyeux anniversaire',
              seq: [JA_1, JA_2, JA_3, JA_4].join(' '),
              lyrics: [JA_LY, JA_LY, JA_3_LY, JA_LY].join('|'),
              text: 'Toute la chanson ! 🎂',
              say: 'Et maintenant, toute la chanson !' }
          ]
        },
        {
          id: 'l14', num: 14, title: 'L\'air des briques', emoji: '🧱', keyboard: SIDE_RANGE,
          doneText: 'Les briques tombent en musique ! 🧱',
          steps: [
            { type: 'info', keys: SIDE_HANDS,
              text: 'Un vieil air russe… devenu la musique d\'un célèbre jeu vidéo de briques ! 🧱',
              say: 'Voici Korobeïniki, une vieille chanson russe. Tu la connais sûrement : c\'est devenu la musique d\'un célèbre jeu vidéo où des briques tombent !' },
            { type: 'info', keys: SIDE_HANDS,
              text: 'Pouce gauche sur Do. Main droite : glisse d\'une touche, **pouce sur Ré** !',
              say: 'Nouvelle installation ! Ton pouce gauche garde le Do du milieu. Ta main droite glisse d\'une touche vers la droite : le pouce sur Ré. Tes deux mains sont côte à côte !' },
            { type: 'sequence', seq: 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 D4-1 C4-g1 B3-g2 A3-g3:2',
              text: 'La Si Do à gauche, Ré Mi à droite… et retour !',
              say: 'On essaie : La, Si, Do avec la main gauche, Ré, Mi avec la main droite. Puis on redescend.' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_A1,
              text: 'Le début : Mi à droite, puis Si Do à gauche…',
              say: 'Le début de l\'air. Il commence sur Mi, avec le doigt deux de la main droite. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_A2,
              text: 'La fin de la phrase : elle finit sur La, deux fois.',
              say: 'La fin de la phrase. Elle finit sur La, deux fois, avec le doigt trois de la main gauche.' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_A,
              text: 'Toute la 1re partie ! 🧱',
              say: 'Et maintenant, toute la première partie !' }
          ]
        },
        {
          id: 'l15', num: 15, title: 'Korobeïniki en entier', emoji: '🕹️', keyboard: SIDE_RANGE,
          doneText: 'Tu joues tout l\'air des briques ! 🕹️',
          steps: [
            { type: 'info', keys: SIDE_ALL,
              text: 'La 2e partie monte plus haut : Fa, Sol, **La** avec les doigts 3, 4, 5 !',
              say: 'La deuxième partie monte plus haut. Garde tes mains côte à côte : Fa, Sol et La, avec les doigts trois, quatre et cinq de la main droite.' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_A,
              text: 'D\'abord la 1re partie. Tu la connais !',
              say: 'D\'abord, la première partie. Tu la connais déjà !' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_B1,
              text: 'Ré, Fa, **La**… puis ça redescend !',
              say: 'La deuxième partie : Ré, Fa, La, tout en haut avec le petit doigt, puis ça redescend. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_B2,
              text: 'La fin ressemble à la 1re partie !',
              say: 'La fin ressemble beaucoup à la fin de la première partie : Si, Si, Do, Ré, Mi, Do, La, La.' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_B,
              text: 'Toute la 2e partie !',
              say: 'Toute la deuxième partie, à la suite.' },
            { type: 'sequence', song: true, title: 'Korobeïniki', seq: KORO_A + ' ' + KORO_B,
              text: 'Tout Korobeïniki ! 🕹️',
              say: 'Et maintenant, tout l\'air, du début à la fin !' }
          ]
        },
        {
          id: 'l16', num: 16, title: 'Jingle Bells', emoji: '🛷',
          keyboard: { from: 'C4', to: 'E5', phone: { from: 'C4', to: 'D5' } },
          doneText: 'Jingle Bells ! Tu connais la position de Sol ! 🛷',
          steps: [
            { type: 'info', keys: POSITION_SOL,
              text: 'Déplace ta main droite : pouce sur **Sol**. C\'est la **position de Sol** !',
              say: 'Nouvelle position ! Déplace ta main droite : le pouce sur le Sol juste au-dessus du Do du milieu, le petit doigt sur Ré. C\'est la position de Sol.' },
            { type: 'sequence', seq: 'G4-1 A4-2 B4-3 C5-4 D5-5 C5-4 B4-3 A4-2 G4-1:2',
              text: 'Sol La Si Do Ré… et retour !',
              say: 'Monte, Sol, La, Si, Do, Ré, et redescends.' },
            { type: 'sequence', song: true, title: 'Jingle Bells',
              seq: JB_1, lyrics: JB_1_LY,
              text: 'Jingle Bells ! Presque tout sur **Si**, doigt 3.',
              say: 'Tu la connais sûrement : Jingle Bells, c\'est l\'air de Vive le vent ! Presque tout se joue sur Si, avec le doigt trois. Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'Jingle Bells',
              seq: JB_2, lyrics: JB_2_LY,
              text: 'La suite : le Do avec le doigt 4.',
              say: 'La suite. Le Do se joue avec le doigt quatre.' },
            { type: 'sequence', song: true, title: 'Jingle Bells',
              seq: JB_3, lyrics: JB_3_LY,
              text: 'La fin est différente : elle finit sur Sol !',
              say: 'La fin du refrain est un peu différente : elle finit sur Sol, avec le pouce.' },
            { type: 'sequence', song: true, title: 'Jingle Bells',
              seq: JB_1 + ' ' + JB_3, lyrics: JB_1_LY + '|' + JB_3_LY,
              text: 'La deuxième moitié : elle finit sur Sol !',
              say: 'La deuxième moitié du refrain, jusqu\'au Sol final.' },
            { type: 'sequence', song: true, title: 'Jingle Bells',
              seq: [JB_1, JB_2, JB_1, JB_3].join(' '),
              lyrics: [JB_1_LY, JB_2_LY, JB_1_LY, JB_3_LY].join('|'),
              text: 'Tout le refrain ! 🛷🔔',
              say: 'Et maintenant, tout le refrain !' }
          ]
        },
        {
          id: 'l17', num: 17, title: 'La Lettre à Élise', emoji: '💌',
          keyboard: { from: 'C4', to: 'G5', phone: { from: 'E4', to: 'E5' } },
          doneText: 'Tu joues la Lettre à Élise de Beethoven ! 💌',
          steps: [
            { type: 'info', keys: 'D5 D#5 E5', groups: '2',
              text: 'Ta 1re touche noire en musique : le **Ré♯**, entre Ré et Mi !',
              say: 'Voici ta première touche noire en musique : le Ré dièse. Dièse veut dire un tout petit peu plus haut. C\'est la touche noire juste à droite du Ré, entre Ré et Mi.' },
            { type: 'find', accept: ['D#'], count: 3, keys: 'D#5-4',
              text: 'Joue un Ré♯ !',
              say: 'Joue un Ré dièse : la deuxième touche noire du groupe de deux.',
              hint: 'La 2e touche noire du groupe de 2.' },
            { type: 'info', keys: POSITION_LA,
              text: 'Pouce droit sur **La**, petit doigt sur Mi. Le doigt 4 va sur le Ré♯.',
              say: 'Une musique très célèbre de Beethoven : la Lettre à Élise ! Pose ton pouce droit sur le La au-dessus du Do du milieu, le petit doigt sur Mi. Le doigt quatre se pose sur la touche noire, Ré dièse.' },
            { type: 'sequence', song: true, title: 'La Lettre à Élise', seq: ELISE_BALANCE,
              text: 'Mi, Ré♯, Mi, Ré♯, Mi : doigts 5 et 4, ça se balance !',
              say: 'Le début se balance : Mi, Ré dièse, Mi, Ré dièse, Mi. Doigt cinq, doigt quatre, doigt cinq… Écoute d\'abord !' },
            { type: 'sequence', song: true, title: 'La Lettre à Élise', seq: ELISE_M,
              text: 'Puis ça descend : Si, Ré, Do, **La** !',
              say: 'Après le balancement, ça descend : Si, Ré, Do, et La avec le pouce. Le doigt quatre revient sur la touche blanche, Ré.' },
            { type: 'info', illus: 'leftThumb', keys: 'E4-g1 A4-1 B4-2',
              text: 'Le pouce **gauche** sur le Mi du bas : il répond !',
              say: 'Maintenant, la réponse. Pose le pouce de ta main gauche sur le Mi, plus bas, à gauche de ta main droite. Il répond à la main droite !' },
            { type: 'sequence', song: true, title: 'La Lettre à Élise', seq: ELISE_M + ' ' + ELISE_R1,
              text: 'La mélodie, puis la réponse : Mi à gauche, La Si à droite.',
              say: 'La mélodie, puis la réponse : Mi avec le pouce gauche, puis La et Si avec la main droite.' },
            { type: 'sequence', song: true, title: 'La Lettre à Élise',
              seq: [ELISE_M, ELISE_R1, ELISE_R2].join(' '),
              text: 'La fin : après la réponse, Mi… Do, Si, La !',
              say: 'La fin du thème : la mélodie, la réponse, puis encore Mi avec le pouce gauche, et Do, Si, La pour finir.' },
            { type: 'sequence', song: true, title: 'La Lettre à Élise', seq: ELISE_ALL,
              text: 'Toute la Lettre à Élise ! 💌',
              say: 'Et maintenant, tout le thème, deux fois la mélodie !' }
          ]
        },
        {
          id: 'l18', num: 18, title: 'Le roi de la montagne', emoji: '👹', keyboard: SIDE_RANGE,
          doneText: 'Tu as échappé au roi de la montagne ! 👹',
          steps: [
            { type: 'info', keys: SIDE_HANDS,
              text: 'Le grand final : **Dans l\'antre du roi de la montagne** ! 👹',
              say: 'Le grand final ! Une musique de Grieg : Dans l\'antre du roi de la montagne. Des trolls avancent sur la pointe des pieds, puis de plus en plus vite ! Mains côte à côte, comme pour l\'air des briques : pouce gauche sur Do, pouce droit sur Ré.' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_1,
              text: 'Les trolls avancent : La Si Do à gauche, Ré Mi à droite.',
              say: 'Les trolls avancent : La, Si, Do avec la main gauche, Ré, Mi avec la main droite, puis Do, Mi. Écoute d\'abord !' },
            { type: 'info', keys: 'A#3-g2 D#4-2',
              text: 'Deux touches noires : **Ré♯** (doigt 2 droit) et **La♯** (doigt 2 gauche).',
              say: 'Deux touches noires arrivent. Le Ré dièse, tu le connais : avec le doigt deux de la main droite. Et le La dièse, la touche noire entre La et Si, avec le doigt deux de la main gauche.' },
            { type: 'find', accept: ['A#'], count: 3, keys: 'A#3-g2',
              text: 'Joue un La♯, doigt 2 gauche.',
              say: 'Joue un La dièse, avec le doigt deux de la main gauche. C\'est la touche noire entre La et Si.',
              hint: 'La 3e touche noire du groupe de 3, entre La et Si.' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_2,
              text: 'Ça se faufile sur les touches noires !',
              say: 'Maintenant, ça se faufile sur les touches noires : Ré dièse, Si, Ré dièse, puis Ré, La dièse, Ré.' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_A,
              text: 'Toute la 1re partie !',
              say: 'Toute la première partie, à la suite.' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_B,
              text: 'La 2e partie monte jusqu\'au **La**, petit doigt !',
              say: 'La deuxième partie commence pareil, puis monte jusqu\'au La, tout en haut, avec le petit doigt. Elle finit sur Sol.' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_ALL,
              text: 'Tout le morceau ! 👹',
              say: 'Et maintenant, tout le morceau !' },
            { type: 'sequence', song: true, title: 'Le roi de la montagne', seq: TROLL_ALL, tempo: 144,
              text: 'Encore, **plus vite** ! Comme les trolls ! 🔥',
              say: 'Dans la vraie musique, ça va de plus en plus vite. Écoute la démo rapide, et joue aussi vite que tu peux !' }
          ]
        }
      ]
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = root.CURRICULA;
})(typeof window !== 'undefined' ? window : globalThis);
