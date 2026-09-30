# Petit Piano — Spécification de design v1

> Application web pour apprendre le piano à la maison, sur un **piano acoustique**, avec une tablette ou un téléphone posé sur le pupitre.
> **v1 = l'expérience du fils (9 ans, lit couramment).** Le mode « petit » (6 ans, pré-lectrice) viendra plus tard : la v1 est structurée pour l'accueillir sans tout réécrire (voir §7).

---

## 0. Principes directeurs

1. **Le piano d'abord, l'écran ensuite.** L'enfant regarde ses mains et le clavier réel. L'écran montre *une seule chose à faire* à la fois, en gros.
2. **Mode « attente » (pas de rythme noté).** L'appli attend la bonne note, comme un professeur patient. Le rythme n'est entendu que dans « Écoute d'abord ».
3. **Jamais punitif.** Pas de rouge sur les erreurs, pas de son d'échec, pas de vie perdue. Une erreur = un petit tremblement et un indice.
4. **Textes courts.** 1 à 2 phrases, 15 mots maximum de préférence. Nom de note toujours écrit ET coloré (jamais la couleur seule).
5. **Récompense rapide.** Première vraie chanson dès la leçon 4 (avec seulement 3 notes).
6. **Tout le contenu est dans des données** (`js/curriculum.js`, `js/strings.js`), jamais codé en dur dans l'interface.

---

## 1. Écrans et parcours

```
 1er lancement :
 [Bienvenue / Prénom] ──► [Réglage du micro] ──► [Carte des leçons] ──► [Leçon] ──► [Bravo !]
                                   │                     ▲                  │            │
                                   └─ refusé ──► [Micro bloqué] ─(Jouer avec l'écran)──┘            │
                                                         └───────────────────────────────────────────┘
 Lancements suivants :
 [Carte des leçons] directement (« Salut Léo ! »). Le micro est redemandé au 1er tap sur une leçon
 (obligation navigateur : l'audio démarre sur un geste), sans refaire le test sauf depuis ⚙.
```

| # | Écran | Rôle |
|---|-------|------|
| E1 | Bienvenue / Prénom | Demander le prénom une fois. Crée le profil `p1`. |
| E2 | Réglage du micro | Permission, calibration du silence, test « joue n'importe quelle note ». |
| E2b | Micro bloqué | Explications + « Réessayer » / « Jouer avec l'écran ». |
| E3 | Carte des leçons | Chemin de 9 leçons, étoiles, cadenas, série de jours 🔥. |
| E4 | Leçon | Étapes : info, trouver, suite de notes / chanson. |
| E5 | Bravo ! | Étoiles gagnées, confettis, leçon suivante. |
| E6 | Coin des parents (⚙) | Modifier le prénom, refaire le test micro (et l'accordage), mode écran/micro, voix on/off, « Débloquer toutes les leçons », réinitialiser (avec confirmation). Accès par appui long 2 s sur ⚙ (un appui court affiche « Appui long pour les parents »). Affiche aussi « ⚠️ La progression ne peut pas être sauvegardée sur cet appareil » si le stockage est indisponible. |

Une seule page HTML, écrans = `<section>` affichées/masquées par un petit routeur (`app.show('map')`). Pas d'historique d'URL nécessaire ; le bouton ✕ d'une leçon revient à la carte (confirmation « Tu veux quitter la leçon ? » seulement si ≥1 étape faite).

### 1.1 E1 — Bienvenue / Prénom

```
 Tablette paysage (1024×768)                       Téléphone portrait (390×844)
 ┌──────────────────────────────────────────────┐  ┌────────────────────────┐
 │                                              │  │                        │
 │        🎹  Petit Piano                        │  │      🎹 Petit Piano     │
 │                                              │  │                        │
 │   Salut ! Comment tu t'appelles ?            │  │  Salut ! Comment tu    │
 │   ┌──────────────────────────────┐           │  │  t'appelles ?          │
 │   │ Léo                          │           │  │ ┌────────────────────┐ │
 │   └──────────────────────────────┘           │  │ │ Léo                │ │
 │            [  C'est parti ! ▶  ]              │  │ └────────────────────┘ │
 │                                              │  │                        │
 │  (mini clavier décoratif Do-Si coloré)       │  │  [   C'est parti ! ▶  ] │
 └──────────────────────────────────────────────┘  └────────────────────────┘
```
- Champ texte 56 px de haut, police 28 px, `maxlength=20`, `autocapitalize="words"`. Bouton désactivé tant que vide.
- Prénom disponible partout via `{prenom}` dans les textes.

### 1.2 E2 — Réglage du micro (voir §5 pour le détail)

### 1.3 E3 — Carte des leçons

```
 Tablette paysage
 ┌──────────────────────────────────────────────────────────────┐
 │ Salut Léo ! 👋             ⭐ 14      🔥 3 jours       ⚙     │
 ├──────────────────────────────────────────────────────────────┤
 │   (1)🎹 ──── (2)🔴 ──── (3)🟠 ──── (4)🌙 ──── (5)🟢           │
 │   ⭐⭐⭐      ⭐⭐⭐      ⭐⭐☆     [JOUER]      🔒              │
 │                                        │                     │
 │   🔒 (9)🔔 ──── 🔒 (8)⭐ ──── 🔒 (7)🎉 ──── 🔒 (6)🔔          │
 │                                                              │
 │          « 4. Au clair de la lune »   [  Jouer ▶  ]          │
 └──────────────────────────────────────────────────────────────┘

 Téléphone portrait : même chemin, vertical, défilant (serpentin)
 ┌────────────────────────┐
 │ Salut Léo ! ⭐14 🔥3  ⚙ │
 ├────────────────────────┤
 │   (1) Le clavier  ⭐⭐⭐  │
 │      │                 │
 │         (2) Le Do ⭐⭐⭐ │
 │      │                 │
 │   (3) Ré et Mi  ⭐⭐☆   │
 │      │                 │
 │    ╔═(4) Au clair═╗    │  ← leçon courante : plus grosse, pulse doucement
 │    ╚═ [ Jouer ▶ ]═╝    │
 │      │                 │
 │   🔒 (5) Fa et Sol     │
 └────────────────────────┘
```
- Pastilles de leçon : 88 px (tablette) / 72 px (téléphone), emoji + numéro. Leçon courante : 1,2× + halo animé.
- Toute leçon déverrouillée peut être rejouée (on garde le **meilleur** score d'étoiles).
- Défilement automatique vers la leçon courante à l'ouverture.

### 1.4 E4 — Leçon (écran principal)

Structure fixe, 3 zones :
1. **Barre du haut** (56 px) : ✕ · barre de progression des étapes · combo · indicateur micro 👂.
2. **Zone consigne** (flexible) : texte, illustration ou rangée de bulles de notes, bouton « 🔊 Écoute d'abord ».
3. **Clavier à l'écran** (bas, 30–40 % de la hauteur) : touche cible colorée + numéro de doigt.

```
 Tablette paysage — étape « suite / chanson »
 ┌───────────────────────────────────────────────────────────────────┐
 │ ✕   ▓▓▓▓▓▓▓░░░░░  3/5          🔥x5          👂 (niveau ▮▮▮░)      │
 ├───────────────────────────────────────────────────────────────────┤
 │  Au clair de la lune                          [ 🔊 Écoute d'abord ]│
 │                                                                   │
 │   ✓   ✓   ✓  ╭───╮                                                │
 │  (Do)(Do)(Do)│ Ré│ (Mi) (Ré)   (Do)(Mi)(Ré)(Ré)(Do)               │
 │   Au clair de│ la│  lu   ne     mon  a  mi Pier rot               │
 │              ╰─2─╯  ← bulle courante agrandie, doigt 2             │
 │                                                                   │
 │   Joue le Ré avec le doigt 2                                      │
 ├───────────────────────────────────────────────────────────────────┤
 │ ┌──┬─┬──┬─┬──┬──┬─┬──┬─┬──┬─┬──┬──┬─┬──┬─┬──┬──┬─┬──┬─┬──┬─┬──┐  │
 │ │  │█│  │█│  │  │█│  │█│  │█│  │  │█│ ②│█│  │  │█│  │█│  │█│  │  │
 │ │  └┬┘  └┬┘  │  └┬┘  └┬┘  └┬┘  │  └┬┘▓▓└┬┘  │  └┬┘  └┬┘  └┬┘  │  │
 │ │Do│Ré│Mi│Fa│Sol│La│Si│Do│Ré│Mi│Fa│Sol│La│Si│Do│                   │
 │ └───────────────────────────────────────────────────────────────┘  │
 │   Do3 … Do5 (2 octaves). Ré4 coloré orange + pastille « 2 ».       │
 └───────────────────────────────────────────────────────────────────┘

 Téléphone portrait — même étape
 ┌────────────────────────┐
 │ ✕ ▓▓▓░░ 3/5  🔥5   👂  │
 ├────────────────────────┤
 │  Au clair de la lune   │
 │ [ 🔊 Écoute d'abord ]  │
 │                        │
 │ ✓  ✓  ✓ ╭────╮ Mi  Ré  │  ← la rangée défile : bulle courante
 │ Do Do Do│ Ré │         │    toujours au 1/3 gauche
 │         ╰─2──╯         │
 │    la                  │
 │                        │
 │  Joue le Ré            │
 │  avec le doigt 2       │
 ├────────────────────────┤
 │┌─┬┬─┬┬─┬─┬┬─┬┬─┬┬─┬─┐  │
 ││ ││ ││ │ ││ ││ ││ │ │  │  Do4 … Do5 (8 blanches)
 ││ └┘②└┘ │ └┘ └┘ └┘ │ │  │  (plage élargie par leçon si besoin,
 ││Do│Ré│Mi│Fa│Sol│La│Si│Do│    ex. Sol3–La4 en leçon 9)
 │└──────────────────────┘│
 └────────────────────────┘
```

```
 Étape « info » (tablette paysage)               Étape « trouver » (téléphone portrait)
 ┌─────────────────────────────────────────┐     ┌────────────────────────┐
 │ ✕  ▓▓░░░░ 1/7                  👂    🗣️ │     │ ✕ ▓▓▓▓░ 4/5        👂  │
 ├─────────────────────────────────────────┤     ├────────────────────────┤
 │   [ Illustration SVG : main « bulle » ] │     │                        │
 │                                         │     │        ╭──────╮        │
 │   Pose ta main comme si tu tenais       │     │        │  Do  │        │
 │   une bulle de savon.                   │     │        ╰──────╯        │
 │                                         │     │  Trouve un Do et       │
 │                      [ Continuer ▶ ]    │     │  joue-le !             │
 ├─────────────────────────────────────────┤     │                        │
 │  clavier (peut être mis en évidence)    │     │    ● ● ○ ○   2 / 4     │
 └─────────────────────────────────────────┘     ├────────────────────────┤
                                                 │ clavier : tous les Do  │
                                                 │ colorés en rouge       │
                                                 └────────────────────────┘
```

- **Paysage vs portrait** : même structure verticale partout (plus simple). En paysage tablette, le clavier prend ~38 % de la hauteur ; en portrait ~30 %. Si hauteur < 500 px (téléphone paysage) : texte réduit, illustrations masquées, clavier 40 %.
- 🗣️ (en haut à droite) lit la consigne à voix haute (option, §3.8).
- L'indicateur 👂 : vert pulsant selon le niveau sonore = j'écoute ; gris « ⏸ » = l'appli joue (démo) ; 👆 = mode écran (pas de micro). Chaque note détectée s'affiche 1 s en petit sous 👂 (« Ré ») : l'enfant voit que l'appli l'entend, et le parent peut diagnostiquer.

### 1.5 E5 — Bravo !

```
 ┌──────────────────────────────────────────┐
 │        🎊  (confettis qui tombent)  🎊     │
 │                                          │
 │           Bravo Léo !                    │
 │                                          │
 │         ⭐     ⭐     ⭐                   │  ← apparaissent une à une (+ son « ding »)
 │                                          │
 │   Tu as joué « Au clair de la lune » !   │  ← `lesson.doneText`
 │   Nouvelle leçon débloquée : Fa et Sol 🔓 │
 │                                          │
 │  [ Rejouer ↻ ]        [ Leçon suivante ▶ ]│
 │               [ Carte 🗺 ]                │
 └──────────────────────────────────────────┘
```
- Message selon étoiles : 3★ « Parfait ! », 2★ « Super ! », 1★ « Bien joué ! Rejoue pour gagner plus d'étoiles. »
- Si nouveau record : badge « Nouveau record ! ».
- Après la leçon 9 : écran spécial « Tu as fini le Niveau 1 ! 🏆 » (même composant, texte différent).

---

## 2. Déroulement d'une leçon (moteur)

- Une leçon = liste d'**étapes**. Barre de progression = étape courante / total.
- Types d'étape (v1) :
  - `info` : texte + illustration et/ou clavier mis en évidence ; bouton « Continuer ▶ ». Aucune écoute micro.
  - `find` : jouer une note (classe de hauteur) N fois, n'importe où sur le piano. Compteur de pastilles ●●○○.
  - `sequence` : suite de notes en bulles, dans l'ordre. `song: true` ajoute titre, paroles sous les bulles et rythme pour la démo.
- **Validation d'une note** (rappel pour le dev) : comparaison **par classe de hauteur** (Do = Do quelle que soit l'octave), arrondi au demi-ton le plus proche ; une frappe = un événement (gestion des attaques, notes répétées Do Do Do comptées chacune). Micro coupé pendant les sons de l'appli + 300 ms, reprise désarmée (détails §5.3).
- **Bonne note** : la bulle « éclate » en ✓ (animation 250 ms), la touche à l'écran s'allume dans sa couleur, on passe à la suivante. Fin d'étape : « Super ! » 700 ms puis étape suivante automatique.
- **Mauvaise note** (compte 1 erreur, une seule fois par frappe) :
  1. 1re erreur sur la cible : la bulle courante tremble (6 px, 300 ms) ; la touche jouée s'affiche en gris-bleu à l'écran avec son nom (« Tu as joué Mi »). Pas de son.
  2. 2e erreur sur la même cible : la touche cible pulse + texte d'aide de la note (`hint`, ex. « Le Ré est entre les 2 touches noires »).
  3. 3e erreur : l'appli joue la note cible (micro coupé) : « Écoute… c'est ce son-là ! ».
  Le compteur d'erreurs de la cible se remet à zéro à chaque bonne note.
- **Pas de retour en arrière**, pas d'échec : on ne peut que réussir, plus ou moins vite.
- **Silence** : si rien n'est détecté pendant 12 s en mode micro, bulle d'aide douce : « Je t'écoute… Joue le Ré 🙂 » (+ lien « Je n'entends rien ? » vers l'aide micro).

---

## 3. Système visuel

### 3.1 Couleurs des notes (une couleur par note, texte contrasté ≥ 4,5:1)

| Note | Nom | Fond | Texte | Emoji carte |
|------|-----|------|-------|-------------|
| Do  | rouge   | `#D32F2F` | `#FFFFFF` | 🔴 |
| Ré  | orange  | `#FB8C00` | `#1F1A3D` | 🟠 |
| Mi  | jaune   | `#FDD835` | `#1F1A3D` | 🟡 |
| Fa  | vert    | `#2E7D32` | `#FFFFFF` | 🟢 |
| Sol | bleu    | `#0277BD` | `#FFFFFF` | 🔵 |
| La  | indigo  | `#3949AB` | `#FFFFFF` | 🟣 (ou 🫐) |
| Si  | violet  | `#8E24AA` | `#FFFFFF` | 🟪 |
| dièses (touches noires) | teinte de la note de gauche assombrie de 25 % | `#FFFFFF` | — |

- La couleur **accompagne toujours le nom écrit** (daltonisme).
- Sur le clavier à l'écran : touches blanches au repos blanches (`#FFFFFF`, bord `#D9D4E8`) avec le nom en petit (14 px, `#8A84A3`) en bas ; touche cible = remplie de sa couleur + pastille ronde du numéro de doigt (28 px, fond blanc, texte couleur de la note) au-dessus.

### 3.2 Couleurs de l'interface

| Jeton | Valeur | Usage |
|-------|--------|-------|
| `--bg` | `#FFF8EC` | fond crème |
| `--surface` | `#FFFFFF` | cartes |
| `--ink` | `#1F1A3D` | texte principal |
| `--ink-soft` | `#5E5878` | texte secondaire |
| `--primary` | `#6C4DF6` | boutons principaux (texte blanc, 5,2:1) |
| `--success` | `#2E9E5B` | ✓, validations |
| `--gentle` | `#7A8CA8` | note jouée erronée (gris-bleu, **jamais de rouge**) |
| `--star` | `#FFC107` | étoiles |
| `--locked` | `#C9C4D6` | leçons verrouillées |

Pas de mode sombre en v1 (fond clair plus lisible sur un pupitre).

### 3.3 Typographie

- **Fredoka** (Google Fonts, graisses 400/600/700), repli `"Nunito", system-ui, sans-serif`.
- Tailles (tablette / téléphone) : consigne 28 / 22 px (600) ; titre 36 / 28 px (700) ; nom dans une bulle 26 / 20 px (700) ; boutons 24 / 20 px (600) ; paroles 18 / 15 px.
- Interligne 1,3 ; 2 lignes de consigne maximum visibles.

### 3.4 Tailles et zones tactiles

- Toute cible tactile ≥ **56 px** (boutons principaux 64 px de haut sur tablette), espacées de ≥ 12 px.
- Bulles de note : 72 px (tablette) / 56 px (téléphone) ; bulle courante ×1,35 avec anneau blanc 4 px + ombre.
- Clavier : largeur 100 % moins 16 px de marge ; touches noires = 60 % de la largeur d'une blanche, 62 % de la hauteur.
- **Largeur minimale d'une touche blanche : 40 px** (les touches sont des cibles tactiles en mode écran). Le moteur réduit la plage si nécessaire : si `lesson.keyboard.phone` est absent et que la plage ne tient pas, on affiche Do4–Do5 (ou la plus petite plage contenant toutes les notes de la leçon). Téléphone portrait 390 px → 8–9 blanches maximum.
- Marges latérales 16 px minimum, jamais de défilement horizontal de la page (seule la rangée de bulles défile, automatiquement).

### 3.5 Animations (CSS uniquement ; toutes désactivées/réduites si `prefers-reduced-motion`)

| Événement | Animation |
|-----------|-----------|
| Bonne note | bulle : scale 1 → 1,25 → 0,9 + fondu vers ✓ vert (250 ms) ; touche : flash couleur 300 ms |
| Mauvaise note | bulle : shake horizontal ±6 px, 300 ms ; touche jouée gris-bleu 600 ms |
| Leçon courante (carte) | halo pulsé 1,6 s en boucle |
| Combo ≥ 5 | « 🔥 x5 » qui grossit 400 ms dans la barre ; à 10, 15… petit éclat d'étoiles |
| Fin d'étape | « Super ! » / « Génial ! » / « Top ! » (au hasard) qui rebondit au centre, 700 ms |
| Bravo | 40 confettis `div` en chute (CSS keyframes, 2,5 s) ; étoiles qui tombent et rebondissent une à une (délai 400 ms) |
| Écoute d'abord | bulles et touches s'allument en rythme, le bouton devient « ⏹ Stop » |

### 3.6 Sons de l'appli

- Synthé type piano (WebAudio) pour : « Écoute d'abord », tap sur le clavier à l'écran, note-indice (3e erreur).
- **Aucun son de réussite/échec pendant l'écoute** (il perturberait le micro) : les retours sont visuels. Les « ding » ne jouent que sur l'écran Bravo (micro arrêté).

### 3.7 Règles des étoiles et gamification

- Seules les étapes `find` et `sequence` comptent. `N` = nombre de notes à jouer dans la leçon, `E` = nombre d'erreurs.
  - ⭐⭐⭐ si `E ≤ max(1, 10 % de N)`
  - ⭐⭐ si `E ≤ max(3, 30 % de N)`
  - ⭐ sinon (finir = toujours au moins 1 étoile)
- Leçon suivante déverrouillée dès 1 étoile. On conserve le meilleur score. Total d'étoiles affiché sur la carte.
- **Combo** : notes justes d'affilée dans la leçon (remis à 0 à une erreur, sans le signaler négativement : il disparaît simplement).
- **Série de jours 🔥** : +1 si une leçon est terminée un jour calendaire consécutif ; revient à 1 sinon (affichage « 🔥 1 jour » — pas de message de perte). Les dates sont des dates **locales** `AAAA-MM-JJ` (construites avec `getFullYear/getMonth/getDate`, **pas** `toISOString()` qui est en UTC et décale le jour la nuit).

### 3.8 Voix (option v1, pilier du futur mode petit)

- Chaque étape a un champ `say` (texte parlé, plus naturel que le texte affiché). Bouton 🗣️ = `speechSynthesis` en `fr-FR` (voix française disponible sinon bouton masqué).
- Réglage parent « Lire les consignes automatiquement » (désactivé par défaut pour le fils). La voix coupe le micro pendant qu'elle parle (+300 ms).

---

## 4. Programme (curriculum) final

Conventions :
- Notes en notation scientifique : **Do4 = C4 = Do du milieu**. Octave utilisée pour l'affichage et la démo ; la validation ignore l'octave.
- Doigts : `1`=pouce … `5`=petit doigt, **main droite** par défaut ; `g1` = pouce de la main gauche.
- Durées (pour la démo seulement) en temps ; tempo de démo par défaut 96 à la noire.
- `{prenom}` est remplacé par le prénom.
- Format compact d'une suite : `NOTE-doigt:durée` séparés par des espaces (durée 1 si omise). Ex. `C4-1 D4-2 E4-3:2`.

### Leçon 1 — Le clavier 🎹
*Objectif : posture, numéros des doigts, groupes de touches noires. 1re utilisation du micro (n'importe quelle touche noire d'un groupe = succès facile).* Clavier : Do3–Do5 (téléphone : Do4–Do5).

| # | Type | Texte affiché | Texte parlé (`say`) | Détails |
|---|------|---------------|---------------------|---------|
| 1 | info | Salut {prenom} ! Assieds-toi au milieu du piano, le dos bien droit. | Salut {prenom} ! On apprend le piano ensemble. Assieds-toi bien au milieu du piano, le dos droit, les pieds posés par terre. | illus `posture` |
| 2 | info | Arrondis ta main comme si tu tenais une bulle de savon. 🫧 | Arrondis ta main, comme si tu tenais une bulle de savon. Doigts ronds, poignet souple. | illus `bubbleHand` |
| 3 | info | Tes doigts ont des numéros : 1 = pouce … 5 = petit doigt. | Tes doigts ont des numéros. Le pouce, c'est 1. Le petit doigt, c'est 5. | illus `fingerNumbers` |
| 4 | info | Les touches noires vont par groupes de 2 et de 3. | Regarde les touches noires. Elles vont par groupes de deux, et par groupes de trois. | `groups: "2,3"` — surlignage **neutre** (contour épais `--primary` pour les groupes de 2, contour pointillé `--ink-soft` pour les groupes de 3), jamais une couleur de note |
| 5 | find | Joue une touche noire d'un **groupe de 2**. | Joue une touche noire d'un groupe de deux. | accept `["C#","D#"]`, count 3, `groups: "2"` ; hint « Cherche 2 touches noires côte à côte. » |
| 6 | find | Maintenant, une touche noire d'un **groupe de 3**. | Maintenant, joue une touche noire d'un groupe de trois. | accept `["F#","G#","A#"]`, count 3, `groups: "3"` ; hint « Cherche 3 touches noires côte à côte. » |

`doneText` : « Tu connais ton clavier ! »

### Leçon 2 — Le Do 🔴
Clavier : Do3–Do5 (téléphone : Do4–Do5).

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Le **Do** est la touche blanche juste à gauche des 2 touches noires. | Le Do, c'est la touche blanche juste à gauche des deux touches noires. | surligner tous les Do + groupes de 2 |
| 2 | find | Trouve un Do et joue-le. Partout sur le piano ! | Trouve un Do et joue-le. Essaie à plein d'endroits du piano ! | accept `[Do]`, count 4, surligner Do3, Do4, Do5 ; hint : « Cherche 2 touches noires, puis va juste à gauche. » |
| 3 | info | Le **Do du milieu** est le Do le plus proche du centre du piano. | Le Do du milieu, c'est le Do le plus proche du milieu du piano, souvent juste sous le nom du piano. | surligner Do4 + ⭐ |
| 4 | find | Pose ton pouce droit (1) sur le Do du milieu. Joue-le 3 fois. | Pose ton pouce droit sur le Do du milieu, et joue-le trois fois. | accept `[Do]`, count 3, cible C4 doigt 1 |
| 5 | info | Garde ton pouce sur le Do du milieu : c'est ta maison 🏠. | Garde ton pouce sur le Do du milieu. C'est ta maison ! | cible C4 doigt 1 |

`doneText` : « Tu sais trouver le Do ! »

### Leçon 3 — Ré et Mi 🟠🟡
Clavier : Do3–Do5 (téléphone : Do4–Do5).

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Le **Ré** est entre les 2 touches noires. | Le Ré se cache entre les deux touches noires. | surligner D4 ; doigt 2 |
| 2 | find | Joue le Ré avec le doigt 2. | Joue le Ré avec le doigt deux. | accept `[Ré]`, count 3, cible D4-2 ; hint « Entre les 2 touches noires. » |
| 3 | info | Le **Mi** est juste à droite des 2 touches noires. | Le Mi est juste à droite des deux touches noires. | surligner E4 ; doigt 3 |
| 4 | find | Joue le Mi avec le doigt 3. | Joue le Mi avec le doigt trois. | accept `[Mi]`, count 3, cible E4-3 ; hint « À droite des 2 touches noires. » |
| 5 | sequence | On monte l'escalier : Do, Ré, Mi. | On monte l'escalier : Do, Ré, Mi. Écoute d'abord si tu veux ! | `C4-1 D4-2 E4-3` |
| 6 | sequence | On redescend : Mi, Ré, Do. | Et on redescend : Mi, Ré, Do. | `E4-3 D4-2 C4-1` |
| 7 | sequence | Aller-retour ! | Un aller-retour ! | `C4-1 D4-2 E4-3 D4-2 C4-1` |
| 8 | sequence | Petit défi : ça saute ! | Petit défi : cette fois, ça saute ! | `C4-1 E4-3 D4-2 C4-1 E4-3` |

`doneText` : « Tu connais Do, Ré et Mi ! »

### Leçon 4 — Au clair de la lune 🌙 *(première chanson)*
Clavier : Do3–Do5 (téléphone : Do4–Do5).

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Ta première chanson ! Seulement 3 notes : Do, Ré, Mi. | Ta toute première chanson ! Elle n'a que trois notes : Do, Ré et Mi. | cibles C4-1 D4-2 E4-3 |
| 2 | info | Pour rejouer la même note, relève bien le doigt entre chaque. | Quand tu rejoues la même note, relève bien ton doigt à chaque fois. | illus `repeatNote` (doigt qui monte/descend) |
| 3 | sequence (song) | Début de la chanson. Écoute d'abord ! | Voici le début. Écoute d'abord, puis joue. | `C4-1 C4-1 C4-1 D4-2 E4-3:2 D4-2:2` · paroles « Au · clair · de · la · lu · ne » |
| 4 | sequence (song) | La suite ! | Maintenant, la suite. | `C4-1 E4-3 D4-2 D4-2 C4-1:4` · « mon · a · mi · Pier · rot » |
| 5 | sequence (song) | Toute la chanson ! 🌙 | Et maintenant, toute la chanson ! | `C4-1 C4-1 C4-1 D4-2 E4-3:2 D4-2:2 C4-1 E4-3 D4-2 D4-2 C4-1:4 C4-1 C4-1 C4-1 D4-2 E4-3:2 D4-2:2 C4-1 E4-3 D4-2 D4-2 C4-1:4` · « Au · clair · de · la · lu · ne · mon · a · mi · Pier · rot · Prê · te · moi · ta · plu · me · pour · é · cri · r'un · mot » |

`doneText` : « Tu as joué ta première chanson ! 🌙 »

### Leçon 5 — Fa et Sol 🟢🔵 *(la « position de Do »)*
Clavier : Do3–Do5 (téléphone : Do4–Do5).

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Le **Fa** est juste à gauche des 3 touches noires. | Le Fa est juste à gauche des trois touches noires. | surligner F4 + groupe de 3 |
| 2 | find | Joue le Fa avec le doigt 4. | Joue le Fa avec le doigt quatre. | accept `[Fa]`, count 3, cible F4-4 ; hint « À gauche des 3 touches noires. » |
| 3 | info | Le **Sol** est juste à droite du Fa. | Le Sol est juste à droite du Fa. | surligner G4 |
| 4 | find | Joue le Sol avec le petit doigt (5). | Joue le Sol avec ton petit doigt, le cinq. | accept `[Sol]`, count 3, cible G4-5 ; hint « Juste à droite du Fa. » |
| 5 | info | Pouce sur Do, petit doigt sur Sol : c'est la **position de Do** ! | Un doigt par touche : le pouce sur Do, le petit doigt sur Sol. C'est la position de Do ! | cibles C4-1 D4-2 E4-3 F4-4 G4-5, illus `cPosition` |
| 6 | sequence | Monte : Do Ré Mi Fa Sol. | On monte, avec les cinq doigts. | `C4-1 D4-2 E4-3 F4-4 G4-5` |
| 7 | sequence | Descends : Sol Fa Mi Ré Do. | Et on redescend. | `G4-5 F4-4 E4-3 D4-2 C4-1` |
| 8 | sequence | Les sauts : Do, Mi, Sol ! | Maintenant, des sauts : Do, Mi, Sol ! | `C4-1 E4-3 G4-5 E4-3 C4-1` |

`doneText` : « Tu connais 5 notes ! 🖐️ »

### Leçon 6 — Frère Jacques (début) 🔔
Clavier : Do4–Do5.

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Une chanson que tu connais : Frère Jacques ! | Une chanson que tu connais sûrement : Frère Jacques ! | cibles position de Do |
| 2 | sequence (song) | « Frère Jacques » deux fois. | Frère Jacques, deux fois. | `C4-1 D4-2 E4-3 C4-1 C4-1 D4-2 E4-3 C4-1` · « Frè · re · Jac · ques · frè · re · Jac · ques » |
| 3 | sequence (song) | « Dormez-vous ? » deux fois. | Dormez-vous, deux fois. | `E4-3 F4-4 G4-5:2 E4-3 F4-4 G4-5:2` · « Dor · mez · vous · Dor · mez · vous » |
| 4 | sequence (song) | Tout le début ! 🔔 | Et maintenant, tout le début ! | étapes 2 + 3 enchaînées (14 notes) |

`doneText` : « Frère Jacques commence à sonner ! 🔔 »

### Leçon 7 — Ode à la joie 🎉
Clavier : Do4–Do5. *(30 notes : découpée en 3 petits morceaux avant le tout.)*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Une musique célèbre de Beethoven ! Elle commence sur **Mi**, doigt 3. | Voici une musique très célèbre de Beethoven. Elle commence sur Mi, avec le doigt trois. | cible E4-3, position de Do |
| 2 | sequence (song) | Morceau 1 | Premier morceau. Écoute d'abord ! | `E4-3 E4-3 F4-4 G4-5 G4-5 F4-4 E4-3 D4-2` |
| 3 | sequence (song) | Morceau 2 | Deuxième morceau. | `C4-1 C4-1 D4-2 E4-3 E4-3:1.5 D4-2:0.5 D4-2:2` |
| 4 | sequence (song) | Morceau 3 : presque pareil, mais ça finit sur Do ! | Le troisième morceau ressemble au deuxième, mais il finit sur Do. | `C4-1 C4-1 D4-2 E4-3 D4-2:1.5 C4-1:0.5 C4-1:2` |
| 5 | sequence (song) | Tout l'Ode à la joie ! 🎉 | Et maintenant, tout le morceau ! | `E4-3 E4-3 F4-4 G4-5 G4-5 F4-4 E4-3 D4-2 C4-1 C4-1 D4-2 E4-3 E4-3:1.5 D4-2:0.5 D4-2:2 E4-3 E4-3 F4-4 G4-5 G4-5 F4-4 E4-3 D4-2 C4-1 C4-1 D4-2 E4-3 D4-2:1.5 C4-1:0.5 C4-1:2` |

`doneText` : « Tu joues du Beethoven ! 🎉 »

### Leçon 8 — La et Si ⭐ *(la gamme complète)*
Clavier : Do4–Do5 (tablette : Do3–Do5).
*Choix pédagogique : la gamme à 8 notes demande de passer le pouce. On l'introduit en deux moitiés avant la gamme entière.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Le **La** est entre la 2e et la 3e touche noire du groupe de 3. | Le La est entre la deuxième et la troisième touche noire du groupe de trois. | surligner A4 + groupe de 3 |
| 2 | find | Joue un La. | Joue un La. | accept `[La]`, count 3, cible A4 ; hint « Dans le groupe de 3, entre la 2e et la 3e noire. » |
| 3 | info | Le **Si** est juste à droite du groupe de 3, avant le Do. | Le Si est juste à droite du groupe de trois, juste avant le Do. | surligner B4 |
| 4 | find | Joue un Si. | Joue un Si. | accept `[Si]`, count 3, cible B4 ; hint « Juste avant le Do suivant. » |
| 5 | info | 8 notes, 5 doigts… Après Mi, le **pouce passe dessous** pour jouer Fa ! | Huit notes, mais seulement cinq doigts ! L'astuce : après le Mi, ton pouce passe dessous pour jouer le Fa. | illus `thumbUnder`, cibles C4-1 D4-2 E4-3 F4-1 |
| 6 | sequence | Do Ré Mi… et le pouce passe dessous sur Fa ! | Do, Ré, Mi, et le pouce passe dessous pour le Fa. | `C4-1 D4-2 E4-3 F4-1` |
| 7 | sequence | Puis Fa Sol La Si Do. | Puis, depuis Fa : Fa, Sol, La, Si, Do. | `F4-1 G4-2 A4-3 B4-4 C5-5` |
| 8 | sequence | La gamme de Do en entier ! ⬆️ | La gamme de Do, en entier ! | `C4-1 D4-2 E4-3 F4-1 G4-2 A4-3 B4-4 C5-5:2` |
| 9 | sequence | Et on redescend. Après Fa, le doigt 3 passe par-dessus ! ⬇️ | Et on redescend. Après le Fa, ton doigt trois passe par-dessus le pouce. | `C5-5 B4-4 A4-3 G4-2 F4-1 E4-3 D4-2 C4-1:2` |

`doneText` : « Tu connais les 7 notes ! Do Ré Mi Fa Sol La Si ⭐ »

### Leçon 9 — Frère Jacques en entier 🔔🔔
Clavier : **Sol3–Do5** (tablette, pour montrer le Sol grave) ; téléphone : **Sol3–La4** (9 blanches, sinon touches trop étroites).
*Choix pédagogique : « Sonnez les matines » avec la main un peu décalée (La au doigt 5, pouce qui s'écarte vers le Do) ; « Din dan don » avec le pouce de la main gauche sur le Sol grave → 1re utilisation de la main gauche, sans déplacer la main droite. Le passage « Dormez-vous » (Sol = doigt 5) → « Sonnez » (Sol = doigt 4) demande de glisser la main d'une touche : on l'entraîne à part (étape 4).*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | La suite de Frère Jacques ! Tu connais déjà toutes les notes. | Aujourd'hui, toute la chanson Frère Jacques. Tu connais déjà toutes les notes ! | — |
| 2 | info | Petit doigt sur La, doigt 4 sur Sol. Le pouce s'écarte vers le Do. | Pour sonner les matines, pose le petit doigt sur La et le doigt quatre sur Sol. Ton pouce s'écarte pour attraper le Do. | cibles G4-4 A4-5 F4-3 E4-2 C4-1 |
| 3 | sequence (song) | « Sonnez les matines » | Sonnez les matines. Écoute d'abord ! | `G4-4:0.5 A4-5:0.5 G4-4:0.5 F4-3:0.5 E4-2 C4-1` · « Son · nez · les · ma · ti · nes » |
| 4 | sequence (song) | Après « vous », glisse ta main d'une touche vers la droite ! | Après dormez-vous, glisse ta main d'une touche vers la droite, pour sonner les matines. | `E4-3 F4-4 G4-5:2 G4-4:0.5 A4-5:0.5 G4-4:0.5 F4-3:0.5 E4-2 C4-1` · « Dor · mez · vous · Son · nez · les · ma · ti · nes » |
| 5 | info | Le **Sol grave** : à gauche du Do du milieu. Joue-le avec le pouce **gauche** ! | Le Sol grave, c'est le Sol juste à gauche du Do du milieu. Joue-le avec le pouce de ta main gauche ! | surligner G3, pastille « g1 » ; illus `leftThumb` |
| 6 | find | Pouce gauche sur le Sol grave : joue-le 2 fois. | Pouce gauche sur le Sol grave, et joue-le deux fois. | accept `["G"]`, count 2, cible G3-g1 (la validation ne vérifie pas l'octave : un Sol aigu est aussi accepté, c'est voulu) |
| 7 | sequence (song) | « Din, dan, don » : pouce droit, pouce gauche, pouce droit. | Din, dan, don : pouce droit, pouce gauche, pouce droit. | `C4-1 G3-g1 C4-1:2 C4-1 G3-g1 C4-1:2` · « Din · dan · don · Din · dan · don » |
| 8 | sequence (song) | Toute la chanson ! 🔔🔔 | Et maintenant, toute la chanson Frère Jacques ! | `C4-1 D4-2 E4-3 C4-1 C4-1 D4-2 E4-3 C4-1 E4-3 F4-4 G4-5:2 E4-3 F4-4 G4-5:2 G4-4:0.5 A4-5:0.5 G4-4:0.5 F4-3:0.5 E4-2 C4-1 G4-4:0.5 A4-5:0.5 G4-4:0.5 F4-3:0.5 E4-2 C4-1 C4-1 G3-g1 C4-1:2 C4-1 G3-g1 C4-1:2` (32 notes) |

`doneText` : « Tu as fini le Niveau 1 ! 🏆 » (+ écran spécial).

**Note** : la portée (partition) n'est pas dans la v1. Prévu en v1.1 : une étape `info` avec une petite portée SVG Do-Ré-Mi, puis un réglage « montrer la portée » au-dessus des bulles.

---

## 5. Réglage du micro (E2 / E2b)

### 5.1 Parcours

```
[A. Explication] ─tap─► [B. Fenêtre du navigateur] ─oui─► [C. Silence 2 s] ─► [D. Test 3 notes] ─► Carte
                                    │ non / erreur                                  │ (10 s sans rien)
                                    ▼                                               ▼
                              [E2b. Micro bloqué]                          aide « Je n'entends rien ? »
                              [Réessayer] [Jouer avec l'écran 👆]
```

**A. Explication**
```
 ┌─────────────────────────────────────────┐
 │                 🎤 👂                    │
 │  Pour t'entendre jouer, j'ai besoin      │
 │  du micro.                               │
 │  Pose la tablette sur le pupitre         │
 │  du piano.                               │
 │  Si une fenêtre s'ouvre, demande à un    │
 │  adulte d'appuyer sur « Autoriser ».     │
 │                                          │
 │        [ 🎤 Activer le micro ]            │
 │   Jouer sans micro (avec l'écran)  ›     │  ← lien secondaire
 └─────────────────────────────────────────┘
```
- Le tap sur « Activer le micro » crée/reprend l'`AudioContext` (obligatoire sur iPad) puis appelle `getUserMedia`.

**C. Écoute du silence** — « Chut… Ne joue rien pendant 2 secondes 🤫 » + anneau de progression. Mesure le bruit de fond (niveau de base de la porte RMS, sauvegardé dans le profil).

**D. Test** 
```
 ┌─────────────────────────────────────────┐
 │  Test du micro : joue n'importe          │
 │  quelle touche !                         │
 │                                          │
 │   niveau : ▮▮▮▮▮▮░░░░                    │  ← jauge temps réel
 │                                          │
 │          ╭──────────╮                    │
 │          │   Sol    │  (bulle couleur)   │  ← dernière note entendue
 │          ╰──────────╯                    │
 │     Tu as joué : Sol ! 🎉   ● ● ○        │  ← 3 notes détectées = OK
 │                                          │
 │  Je n'entends rien ?  ›                  │
 │               [ Ça marche ! ▶ ]           │  ← actif après 3 notes (ou tout de suite, discret)
 └─────────────────────────────────────────┘
```
- Après 3 notes : « Parfait, je t'entends très bien ! » et le bouton devient principal.
- **Accordage du piano** (invisible pour l'enfant) : pendant le test, on mesure l'écart en cents de chaque note stable par rapport au demi-ton le plus proche ; la médiane (sur ≥ 3 notes) devient `device.tuningCents`, borné à [-70 ; +30] (un piano non entretenu est presque toujours **trop bas**). La fréquence est corrigée de cet écart avant l'arrondi au demi-ton. Sans cela, un piano désaccordé de ~40–50 cents ferait basculer des notes d'un demi-ton.
- **« Je n'entends rien ? »** (auto-ouvert après 10 s sans note) : « Rapproche la tablette du piano · Joue un peu plus fort · Ferme la porte / éteins la télé · Vérifie que le son n'est pas coupé ». Boutons « Refaire le silence » / « Jouer avec l'écran ».

### 5.2 E2b — Micro bloqué / indisponible

```
 ┌─────────────────────────────────────────┐
 │                  🙉                      │
 │   Oups, le micro est bloqué.             │
 │                                          │
 │   Pour un adulte :                       │
 │   • iPad / iPhone (Safari) : touche « aA »│
 │     dans la barre d'adresse › Réglages   │
 │     du site › Micro › Autoriser.         │
 │   • Android / Chrome : cadenas à gauche  │
 │     de l'adresse › Autorisations ›       │
 │     Micro › Autoriser. Puis recharger.   │
 │                                          │
 │  [ ↻ Réessayer ]  [ 👆 Jouer avec l'écran ]│
 └─────────────────────────────────────────┘
```
- Cas distincts (message adapté, même écran) :
  - `NotAllowedError` → texte ci-dessus.
  - `NotFoundError` → « Je ne trouve pas de micro sur cet appareil. »
  - `navigator.mediaDevices` absent (page non sécurisée) → « Le micro ne marche que si l'appli est ouverte en https:// ou sur localhost. Demande à l'adulte qui l'a installée. »
- **Mode écran** : les touches à l'écran jouent le son et comptent comme des notes jouées. L'indicateur devient 👆. On peut repasser au micro depuis ⚙ (ou le tap sur 👆 dans une leçon).
- En mode micro, les taps sur le clavier à l'écran comptent aussi (pratique pour les tests, micro coupé pendant le son).

> ⚠️ **Point d'attention installation** : une tablette qui ouvre `http://192.168.x.x:8000` (serveur sur l'ordinateur) n'est **pas** un contexte sécurisé → micro refusé par le navigateur. Pour la tablette, il faut soit héberger l'appli en https (GitHub Pages, Netlify… fichiers statiques), soit un tunnel https. `localhost` ne fonctionne que sur l'ordinateur lui-même.

### 5.3 Règles de détection (précisions pour `pitch.js`)

- **Analyse** : `AnalyserNode` fftSize 2048, `getFloatTimeDomainData`, boucle ~60 Hz (`requestAnimationFrame`). YIN avec `ctx.sampleRate` réel (44,1 ou 48 kHz selon l'appareil — ne jamais supposer 44 100), seuil 0,15, interpolation parabolique, plage 60–2000 Hz. Une trame n'est « voisée » que si RMS > porte **et** clarté YIN (1 − d′ minimal) ≥ 0,8 ; sinon elle ne compte ni comme note ni comme silence net.
- **Porte RMS** : `gate = max(0,002, 3 × noiseFloor)` ; `noiseFloor` part de la calibration puis suit lentement le minimum observé hors notes (moyenne glissante sur les trames sous la porte).
- **Frappe acceptée** : même classe de hauteur (après correction `tuningCents`, arrondi au demi-ton) sur **4 trames voisées consécutives** (~65 ms) → événement `note`. Puis **désarmement**.
- **Réarmement** (une seule de ces conditions) :
  1. silence : RMS < porte pendant ≥ 2 trames ;
  2. nouvelle attaque : après 150 ms de garde, RMS > 1,6 × le minimum atteint depuis le désarmement ;
  3. **changement de note lié (legato)** : une classe de hauteur *différente* stable pendant 6 trames — sinon Do→Ré joué lié, sans remontée nette du volume (le Do résonne encore), serait perdu.
- **Asymétrie bonne / fausse note** : une note égale à la cible est acceptée à 4 trames stables ; une note **différente** de la cible n'est déclarée fausse qu'à **8 trames** stables (~130 ms). Les premières millisecondes d'une attaque de piano acoustique sont bruitées (marteau, harmoniques) : cela évite de compter une « fausse note » fantôme juste avant la bonne.
- **Sons de l'appli** : pendant la démo, une touche tapée, la note-indice, les « ding » ou la voix, le détecteur est **suspendu** jusqu'à fin du dernier son programmé + relâchement de l'enveloppe + 300 ms. À la reprise, il repart **désarmé** (il faut un silence ou une nouvelle attaque) : un son encore en train de résonner (piano réel ou haut-parleur) ne doit pas déclencher une note.
- **Changement de cible** (bonne note → bulle suivante) : le détecteur reste désarmé ; la note qui résonne encore ne peut pas valider la cible suivante (essentiel pour Do Do Do).
- **Octave** : la validation ignore l'octave (voulu). Conséquence assumée : on ne peut pas vérifier « le Do du milieu » ni « le Sol grave » — l'écran les montre, le micro accepte n'importe quel Do / Sol.
- **Journal de débogage** : `?debug=1` affiche fréquence, cents, RMS, porte, clarté et état armé/désarmé — indispensable pour régler les seuils sur le vrai piano.

### 5.4 États techniques à gérer

| Situation | Comportement |
|-----------|--------------|
| Écran qui se met en veille pendant une leçon (tablette posée, l'enfant ne la touche pas) | `navigator.wakeLock.request('screen')` à l'entrée d'une leçon, relâché à la sortie ; redemandé au retour de visibilité. Si non supporté : rien (le parent règle la mise en veille). |
| Onglet / appli mis en arrière-plan puis repris | `AudioContext` souvent suspendu : afficher un voile « Touche l'écran pour continuer ▶ » qui fait `ctx.resume()` ; le détecteur repart désarmé. |
| Piste micro terminée (`track.onended`, micro pris par une autre appli, casque débranché) | Bandeau « Le micro s'est arrêté » + [Réessayer] / [Jouer avec l'écran]. La leçon n'est pas perdue. |
| Permission révoquée entre deux sessions | Au tap sur une leçon, `getUserMedia` échoue → E2b, puis retour à la leçon demandée. |
| Stockage indisponible (navigation privée, quota, Safari restrictif) | L'appli fonctionne en mémoire ; le prénom sera redemandé au prochain lancement ; message discret dans ⚙ (voir E6). |
| iPhone : micro actif | iOS peut basculer la sortie audio en mode « appel » (volume plus faible) quand le micro est ouvert. Le son de démo est donc réglé fort (gain maître élevé, compresseur léger). À vérifier sur appareil réel — voir Revue du critique. |

---

## 6. Modèle de données

### 6.1 Fichiers

```
index.html
css/app.css
js/strings.js      // textes d'interface (STR.fr)
js/curriculum.js   // window.CURRICULA = { grand: {...} }   ← leçons (données pures)
js/notes.js        // noms, couleurs, parse "C4-1:2", classes de hauteur
js/storage.js      // profils + progression (localStorage en try/catch, repli mémoire)
js/synth.js        // son piano WebAudio + « Écoute d'abord »
js/pitch.js        // micro, YIN, porte RMS, gestion des attaques → événements "note"
js/voice.js        // speechSynthesis fr-FR (optionnel)
js/keyboard.js     // clavier SVG/DOM à l'écran
js/illus.js        // illustrations SVG inline par id
js/app.js          // routeur d'écrans + moteur de leçon
```
Scripts classiques (`<script src>`), dans cet ordre ; espace de noms global `window.PP = {}` pour éviter les collisions.

### 6.2 Notes

```js
// js/notes.js
PP.NOTES = [ // index = classe de hauteur (0 = Do)
  { pc:0,  fr:"Do",   color:"#D32F2F", text:"#FFFFFF" },
  { pc:1,  fr:"Do♯",  color:"#9E2323", text:"#FFFFFF", black:true },
  { pc:2,  fr:"Ré",   color:"#FB8C00", text:"#1F1A3D" },
  { pc:3,  fr:"Ré♯",  color:"#BC6900", text:"#FFFFFF", black:true },
  { pc:4,  fr:"Mi",   color:"#FDD835", text:"#1F1A3D" },
  { pc:5,  fr:"Fa",   color:"#2E7D32", text:"#FFFFFF" },
  { pc:6,  fr:"Fa♯",  color:"#225E26", text:"#FFFFFF", black:true },
  { pc:7,  fr:"Sol",  color:"#0277BD", text:"#FFFFFF" },
  { pc:8,  fr:"Sol♯", color:"#01598E", text:"#FFFFFF", black:true },
  { pc:9,  fr:"La",   color:"#3949AB", text:"#FFFFFF" },
  { pc:10, fr:"La♯",  color:"#2B3780", text:"#FFFFFF", black:true },
  { pc:11, fr:"Si",   color:"#8E24AA", text:"#FFFFFF" }
];
// "C4" → midi 60 ; pc = midi % 12. Noms anglais uniquement en interne.
// parseSeq("C4-1 E4-3:2 G3-g1") → [{midi:60,pc:0,finger:1,hand:"R",beats:1}, {midi:64,...,beats:2}, {midi:55,pc:7,finger:1,hand:"L",beats:1}]
```

### 6.3 Leçons

```js
// js/curriculum.js
window.CURRICULA = {
  grand: {                       // programme du fils (lecteur). Plus tard : petit: {...}
    id: "grand",
    title: "Niveau 1",
    tempo: 96,                   // tempo de démo par défaut
    lessons: [
      {
        id: "l04",               // identifiant STABLE (clé de progression) — ne jamais renuméroter
        num: 4,
        title: "Au clair de la lune",
        emoji: "🌙",
        keyboard: { from: "C3", to: "C5", phone: { from: "C4", to: "C5" } },
        doneText: "Tu as joué ta première chanson ! 🌙",
        steps: [
          { type: "info",
            text: "Ta première chanson ! Seulement 3 notes : Do, Ré, Mi.",
            say:  "Ta toute première chanson ! Elle n'a que trois notes : Do, Ré et Mi.",
            illus: null,                         // id d'illustration (js/illus.js) ou null
            keys: "C4-1 D4-2 E4-3" },            // touches mises en évidence (+ doigts)
          { type: "sequence", song: true,
            title: "Au clair de la lune",
            text: "Début de la chanson. Écoute d'abord !",
            say:  "Voici le début. Écoute d'abord, puis joue.",
            seq:  "C4-1 C4-1 C4-1 D4-2 E4-3:2 D4-2:2",
            lyrics: "Au|clair|de|la|lu|ne",      // optionnel, même nombre d'éléments que seq
            tempo: 96 },                         // optionnel
          // …
        ]
      },
      {
        id: "l01", num: 1, title: "Le clavier", emoji: "🎹",
        keyboard: { from: "C3", to: "C5", phone: { from: "C4", to: "C5" } },
        steps: [
          // …
          { type: "find",
            text: "Joue une touche noire d'un groupe de 2.",
            say:  "Joue une touche noire d'un groupe de deux.",
            accept: ["C#", "D#"],                // classes de hauteur acceptées (noms anglais internes)
            count: 3,                            // nombre de bonnes frappes demandées
            groups: "2",                         // surligne tous les groupes de 2 visibles
            hint: "Cherche 2 touches noires côte à côte." },
        ]
      }
    ]
  }
};
```

Champs d'une étape :

| Champ | Types | Obligatoire | Sens |
|-------|-------|-------------|------|
| `type` | tous | oui | `"info"` \| `"find"` \| `"sequence"` |
| `text` | tous | oui | texte affiché (≤ 2 lignes). `**gras**` autorisé, `{prenom}` remplacé |
| `say` | tous | oui (v1 : utilisé si voix activée) | texte parlé |
| `illus` | info | non | id d'illustration SVG : `posture`, `bubbleHand`, `fingerNumbers`, `repeatNote`, `cPosition`, `thumbUnder`, `leftThumb`, `leftHand` (Niveau 2) |
| `keys` | tous | non | touches précises à mettre en évidence, format `seq` (doigt optionnel) ; hors de la plage affichée → ignorées sans erreur |
| `groups` | info, find | non | `"2"`, `"3"` ou `"2,3"` : surligne les groupes de touches noires visibles (surlignage neutre, pas de couleur de note) |
| `accept` | find | oui | liste de classes de hauteur en noms anglais internes (`"C"`, `"C#"`…) ; l'affichage utilise toujours le solfège (`PP.NOTES[pc].fr`). Les tableaux du §4 écrivent parfois Do♯ etc. pour la lisibilité : c'est la même chose |
| `count` | find | oui | nombre de réussites |
| `hint` | find, sequence | non | aide après 2 erreurs (sinon aide générique par note, dans `strings.js` : ex. `hint.D = "Le Ré est entre les 2 touches noires."`) |
| `seq` | sequence | oui | suite `NOTE-doigt:durée` |
| `song`, `title`, `lyrics`, `tempo` | sequence | non | chanson : titre, paroles sous les bulles, tempo de démo |
| `textPetit`, `sayPetit`, `icon` | tous | non (futur) | réservés au mode petit (§7) — ignorés en v1 |

### 6.4 Progression (localStorage)

Clé unique : `petitpiano.v1`

```js
{
  version: 1,
  activeProfile: "p1",
  device: {                   // propre à l'appareil + au piano, PARTAGÉ par les enfants
    input: "mic",             // "mic" | "touch"
    noiseFloor: 0.004,        // RMS mesuré à la calibration
    tuningCents: -18,         // écart d'accordage du piano mesuré (§5.1 D)
    unlockAll: false          // option parent (E6)
  },
  profiles: {
    p1: {
      id: "p1",
      name: "Léo",
      mode: "grand",            // "grand" | "petit" (futur)
      curriculum: "grand",      // clé dans CURRICULA
      avatar: "🦊",             // futur écran de choix de profil
      createdAt: "2026-09-27",
      settings: {
        voiceAuto: false        // lire les consignes automatiquement (par enfant)
      },
      progress: {
        l01: { stars: 3, bestErrors: 0, plays: 2, lastPlayed: "2026-09-27" },
        l02: { stars: 2, bestErrors: 4, plays: 1, lastPlayed: "2026-09-27" }
      },
      streak: { days: 3, last: "2026-09-27" }
    }
  }
}
```
- Déverrouillage **calculé** (pas stocké) : leçon *k* ouverte si la leçon *k-1* (dans l'ordre du tableau `lessons`, pas par `num`) a `stars ≥ 1` (la 1re toujours ouverte), ou si `device.unlockAll`.
- Micro, bruit de fond et accordage sont dans `device` (même piano, même tablette pour les deux enfants) ; seuls prénom, mode, voix et progression sont par profil.
- `load()` fusionne avec les valeurs par défaut (champ manquant → défaut) pour qu'une future `version: 2` n'efface rien.
- `storage.js` : `load()` / `save()` entourés de `try/catch` ; en cas d'échec, l'objet reste en mémoire et l'appli fonctionne normalement pour la session. JSON invalide → on repart d'un état vide (sans planter).
- Sauvegarde : à la fin de chaque leçon et à chaque changement de réglage (pas pendant le jeu).

---

## 7. Préparé pour le mode « petit » (sœur, 6 ans) — sans le construire

Ce qui est en place dès la v1 :
1. **Profils** : tout est rangé sous `profiles[id]` avec `mode` et `curriculum`. Ajouter la sœur = créer `p2` ; un écran « Qui joue ? » (avatars 🦊 🐰) s'affichera automatiquement quand il y a plus d'un profil (bouton « + Ajouter un enfant » dans ⚙).
2. **Contenu séparé de l'interface** : `CURRICULA.petit` pourra avoir ses propres leçons (plus courtes, moins de notes), avec le même moteur et les mêmes types d'étapes.
3. **Voix déjà branchée** : chaque étape a `say` ; `voice.js` sait lire et coupe le micro pendant la lecture. En mode petit, `voiceAuto` sera `true` par défaut et le texte sera secondaire.
4. **Champs réservés** `textPetit`, `sayPetit`, `icon` : le moteur choisit `step.textPetit ?? step.text` selon `profile.mode` (une seule fonction `pickText(step, profile)`).
5. **Illustrations par identifiant** (`illus`) et **couleurs par note** : le mode petit s'appuiera surtout sur couleurs + icônes + animaux, sans nouvelle architecture.
6. `body[data-mode="grand"|"petit"]` posé dès la v1 : le mode petit pourra agrandir bulles et boutons par CSS seulement.

---

## 8. Récapitulatif pour le développeur (v1 « terminée » quand…)

- [ ] E1 → E2 → E3 → E4 → E5 fonctionnent en français, en paysage et portrait, tablette et téléphone.
- [ ] Les 9 leçons ci-dessus jouables au micro sur piano acoustique ET au toucher.
- [ ] Do Do Do comptés 3 fois ; une fausse note comptée une seule fois par frappe ; pas de détection pendant les sons de l'appli (+300 ms) et reprise **désarmée** ; Do→Ré joué lié détecté (§5.3).
- [ ] L'écran ne s'éteint pas pendant une leçon (Wake Lock si disponible) ; retour d'arrière-plan géré (§5.4).
- [ ] Sur téléphone portrait, aucune touche blanche < 40 px.
- [ ] Étoiles, déverrouillage, meilleur score, combo, série de jours conservés après rechargement (et appli fonctionnelle si le stockage est bloqué).
- [ ] Refus du micro → message clair + mode écran.
- [ ] Aucun texte de leçon dans le code d'interface ; `say` présent partout.

---

## 9. Synchronisation entre téléphones (v2)

> Objectif : Léo peut faire ses leçons sur le téléphone de papa **ou** de maman, et retrouve partout ses étoiles, sa série 🔥 et ses leçons ouvertes. Plus tard, sa sœur aura son profil, partagé de la même façon.
> **Exigence n°1 du parent : ne jamais perdre ni faire reculer la progression d'un enfant.** Toute la conception en découle : fusion monotone (§9.6), écriture locale d'abord, jamais d'effacement distant.

### 9.0 Principes

1. **Hors ligne d'abord.** L'appli marche exactement comme en v1 sans réseau. La synchro est un bonus en arrière-plan : elle ne bloque jamais un écran, n'affiche jamais rien à l'enfant (ni toast, ni sablier, ni erreur).
2. **Un « code famille » = un document partagé.** Pas de compte, pas de mot de passe, pas d'e-mail. Qui a le code peut lire et écrire la progression de la famille → on le partage seulement entre parents.
3. **Fusion, jamais remplacement.** On lit le document distant, on fusionne avec le local (règles §9.6), on enregistre le résultat **en local d'abord**, puis on l'écrit à distance. Aucune donnée n'est jamais retirée par la synchro.
4. **Seuls les profils voyagent.** `device` (micro, `noiseFloor`, `tuningCents`, `input`, `calibrated`), `activeProfile` et l'état de synchro restent propres à chaque téléphone.
5. **Invisible pour l'enfant.** Tout ce qui concerne la synchro vit dans le coin des parents, sauf deux choses : le lien « J'ai déjà un code » sur l'écran de bienvenue (utilisé par un adulte) et l'écran « Qui joue ? » quand il y a plusieurs enfants.

### 9.1 Parcours

```
 Téléphone de papa (Léo y a déjà sa progression)          Téléphone de maman (neuf)
 ───────────────────────────────────────────────          ─────────────────────────
 ⚙ appui long › Coin des parents                           Ouvre Petit Piano
   › « Plusieurs téléphones »                              [Bienvenue] › « J'ai déjà un code famille › »
   › [ Créer un code famille ]                               › saisit / colle le code › [ Rejoindre ]
   › affiche PIANO-7KQ3M-XH9PT-R4WZC  [ Partager ]           › « Retrouvé : Léo 🦊 ! »
   › Messages / AirDrop vers maman  ───────────────────►     › (1 profil) Réglage du micro › Carte de Léo
                                                             › (≥ 2 profils) [Qui joue ?] › micro › Carte
 Ensuite : chaque téléphone se synchronise tout seul
 (démarrage, retour dans l'appli, retour du réseau, fin de leçon).
```

### 9.2 Coin des parents — section « Plusieurs téléphones »

Placée **après** « Débloquer toutes les leçons » et **avant** « Tout réinitialiser ». Titre de section `h3`.

**État A — pas de code famille sur ce téléphone**
```
 ┌────────────────────────────────────────────┐
 │ Plusieurs téléphones                        │
 │ Partage la progression entre les            │
 │ téléphones de la famille.                   │
 │                                             │
 │ [ ➕ Créer un code famille ]   (secondaire)  │
 │ [ 🔑 J'ai déjà un code ]       (secondaire)  │
 └────────────────────────────────────────────┘
```

**État B — code créé à l'instant** (même section, remplace A)
```
 ┌────────────────────────────────────────────┐
 │ Plusieurs téléphones                        │
 │ Code famille :                              │
 │ ┌────────────────────────────────────────┐ │
 │ │   PIANO-7KQ3M-XH9PT-R4WZC               │ │  ← 22 px, 700, monospace-ish,
 │ └────────────────────────────────────────┘ │    user-select: all
 │ [ 📤 Partager le code ]       (principal)   │
 │ Sur l'autre téléphone : ouvre Petit Piano,  │
 │ puis « J'ai déjà un code ».                 │
 │ Garde ce code : il sert aussi à tout        │
 │ récupérer si un téléphone est perdu.        │
 │                                             │
 │ ✓ Synchronisé à l'instant        (muted)    │
 │ Quitter la synchronisation ›    (lien)      │
 └────────────────────────────────────────────┘
```

**État C — téléphone déjà dans une famille** (ouvertures suivantes) : identique à B (code, Partager, consignes, statut, Quitter). Le code reste toujours visible : c'est la seule « clé » de la famille.

**« J'ai déjà un code »** (depuis A ou depuis l'écran de bienvenue) → modale :
```
 ┌────────────────────────────────────────────┐
 │ Entre le code famille                       │
 │ ┌────────────────────────────────────────┐ │
 │ │ PIANO-                                  │ │  ← input text, autocapitalize="characters",
 │ └────────────────────────────────────────┘ │    autocomplete="off", spellcheck="false",
 │ (message d'erreur éventuel, --ink-soft)     │    inputmode="text", 24 px
 │                                             │
 │ [ Annuler ]              [ Rejoindre ▶ ]    │
 └────────────────────────────────────────────┘
```
- Pendant la vérification : bouton « Rejoindre » désactivé, texte « Je vérifie… ». Délai max 10 s.
- Succès depuis le coin des parents → modale fermée, toast « ✓ Progression partagée », section en état C, carte rafraîchie au retour.

**Partager** : `navigator.share({ title, text, url })` si disponible (iPhone : feuille de partage → Messages, AirDrop, WhatsApp) ; sinon `navigator.clipboard.writeText(text)` + toast « Code copié ✓ » ; sinon (aucun des deux) le code est déjà sélectionnable (`user-select: all`). Une annulation de la feuille de partage (`AbortError`) n'affiche rien.

**Quitter la synchronisation** → confirmation :
« Ce téléphone ne sera plus synchronisé. La progression reste ici, et aussi sur les autres téléphones. » [Annuler] [Quitter]. Effet : on oublie le code **sur ce téléphone** (`sync = defaults`) ; les profils locaux restent intacts ; le document distant n'est pas touché (la suppression est de toute façon interdite par les règles). On peut revenir plus tard avec le même code.

**Tout réinitialiser** quand le téléphone est dans une famille : le texte de confirmation devient « Effacer ce téléphone ? La progression reste sur les autres téléphones de la famille. » Effet : quitter la famille + réinitialisation locale v1. (Sinon la fusion suivante ferait revenir les données, ce qui serait déroutant.) Il n'y a **pas** de suppression d'un profil ou de sa progression à distance en v2.

### 9.3 Écran de bienvenue (E1) — « J'ai déjà un code »

```
 ┌────────────────────────┐
 │      🎹 Petit Piano     │
 │  Salut ! Comment tu    │
 │  t'appelles ?          │
 │ ┌────────────────────┐ │
 │ │                    │ │
 │ └────────────────────┘ │
 │  [   C'est parti ! ▶  ] │
 │                        │
 │ J'ai déjà un code      │  ← lien discret (--ink-soft, 16 px, cible ≥ 56 px de haut)
 │ famille ›              │
 └────────────────────────┘
```
- Ouvre la même modale que §9.2. Aucun profil local n'existe → la fusion revient à prendre les profils distants.
- Succès :
  - **0 profil** dans la famille (cas théorique) : on garde le code, on reste sur le formulaire prénom ; le profil créé sera envoyé.
  - **1 profil** : il devient actif ; toast « Retrouvé : {prenom} {avatar} ! » puis parcours normal d'un 1er lancement sur ce téléphone : Réglage du micro (le micro et l'accordage sont propres au téléphone) → Carte.
  - **≥ 2 profils** : écran « Qui joue ? » (§9.4), puis Réglage du micro → Carte.
- Échec : message dans la modale, le formulaire prénom reste utilisable (on ne coince jamais l'enfant).

### 9.4 E7 — « Qui joue ? »

Prévu au §7, activé en v2. Affiché :
- après avoir rejoint une famille qui a ≥ 2 profils ;
- **au démarrage** s'il y a ≥ 2 profils sur le téléphone (le dernier joueur est pré-sélectionné visuellement, halo `--primary`) ;
- au tap sur « Salut {prenom} ! » en haut de la carte, s'il y a ≥ 2 profils (sinon ce tap ne fait rien).

```
 ┌────────────────────────┐
 │       Qui joue ?        │
 │                        │
 │  ┌──────┐   ┌──────┐   │
 │  │  🦊  │   │  🐰  │   │  ← tuiles 120 × 140 px, avatar 56 px,
 │  │ Léo  │   │ Zoé  │   │    prénom 22 px 600 ; 2 par ligne (téléphone)
 │  │⭐ 14 │   │⭐ 3  │   │  ← total d'étoiles (petit, --ink-soft)
 │  └──────┘   └──────┘   │
 └────────────────────────┘
```
- Un tap = choisir : `activeProfile = id` (local, non synchronisé), `body.dataset.mode = profile.mode`, → Carte (ou Réglage du micro si le téléphone n'est pas calibré et que l'entrée est `mic`).
- Ordre des tuiles : `createdAt` croissant, puis `id` (stable sur tous les téléphones).
- Pas de bouton « Ajouter » ici (écran d'enfant). L'ajout d'un enfant reste dans le coin des parents (« + Ajouter un enfant » → formulaire prénom E1 ; nouvel id aléatoire §9.5). *Facultatif en v2 si le temps manque : la sœur n'a pas encore de profil.*

### 9.5 Identifiants de profil

- **Existant conservé** : `p1` (et tout `pN` v1) garde son id tel quel, à vie.
- **Nouveaux profils** (à partir de v2) : `'p-' + 8 caractères base36` tirés avec `crypto.getRandomValues` (repli `Math.random`), ex. `p-k3x9q02m`. On boucle tant que l'id existe déjà localement.
- **Collision d'ids à la jonction** (uniquement quand ce téléphone rejoint une famille, jamais pendant une synchro ordinaire) : pour chaque id présent **à la fois** en local et à distance :

| Local vs distant (même id) | Décision |
|---|---|
| Id aléatoire `p-xxxxxxxx` | Même enfant (collision impossible en pratique) → fusion. |
| Prénoms « identiques » après normalisation (trim, minuscules, sans accents : « Léo » = « leo ») | Même enfant → fusion. |
| Prénoms différents **et** `createdAt` différents | Enfants différents → le profil **local** reçoit un nouvel id aléatoire (et `activeProfile` suit s'il pointait dessus), puis fusion normale (il est simplement ajouté). |
| Prénoms différents **mais** `createdAt` identique | Aussi traité comme enfants différents (re-id du local). Raison : `createdAt` v1 n'a que la précision du jour ; deux enfants créés le même jour sur deux téléphones est plausible. En cas de doute, **dupliquer** est sans risque (rien n'est perdu, un profil en trop se voit tout de suite) alors que **fusionner deux enfants** mélangerait leurs étoiles. |

  Pourquoi seulement à la jonction : une fois dans la même famille, les deux téléphones partagent les mêmes profils ; un prénom modifié par un parent est alors un **renommage** (règle « dernier modifié », §9.6), pas un autre enfant.
- Implémentation : fonction pure `resolveJoinCollisions(localProfiles, remoteProfiles, newId)` → `{ profiles, renamed: { ancienId: nouvelId } }`, séparée de `mergeFamilies` (qui reste symétrique).

### 9.6 Règles de fusion — `mergeFamilies(local, remote)`

Fonction **pure** (`js/sync.js`, testée dans `tests/sync.test.js`), qui prend deux objets `profiles` (`{ id: profil }`, champs éventuellement manquants, formes v1) et renvoie un nouvel objet `profiles`. Aucune date « maintenant » n'y est lue.

**Nouveau champ local** : `profile.updatedAt` (nombre, ms depuis 1970) = date de la dernière modification **par un parent** du prénom, de l'avatar, de `mode`/`curriculum` ou d'un réglage (`settings`). Absent (profil v1) → `0`. Jouer une leçon ne le modifie pas.

| Donnée | Règle | Si absent / invalide |
|---|---|---|
| Profil présent d'un seul côté | Gardé tel quel (union des ids) | — |
| `id` | Clé de la map (identique des deux côtés) | pris de la clé |
| `createdAt` | Le plus ancien (min en chaîne `AAAA-MM-JJ`) | l'autre ; sinon absent |
| `updatedAt` | Max | `0` |
| `name`, `avatar`, `mode`, `curriculum`, `settings` (bloc entier) | Côté au `updatedAt` le plus grand. **Égalité** : champ par champ, la valeur dont le JSON est le plus grand (ordre de chaînes) — arbitraire mais identique sur tous les téléphones (commutatif) | valeur de l'autre côté ; sinon défaut v1 |
| `progress` | Union des ids de leçon ; par leçon, règles ci-dessous (ids inconnus gardés) | `{}` |
| `progress[l].stars` | **Max** (0 à 3) | `0` |
| `progress[l].bestErrors` | **Min** | valeur de l'autre ; les deux absents → absent |
| `progress[l].plays` | **Max** (pas la somme : la somme doublerait à chaque synchro) | `0` |
| `progress[l].lastPlayed` | La plus récente (max en chaîne `AAAA-MM-JJ`) | l'autre |
| `streak` | Gagnant = `last` le plus récent. Même `last` → `days` max. Si le perdant a `last` = veille du gagnant → `days = max(gagnant.days, perdant.days + 1)` (série jouée sur deux téléphones qui se suivent) | `{ days: 0, last: null }` ; `last: null` perd toujours |
| Champs inconnus (futurs) | Pris du côté gagnant `updatedAt` ; à défaut de l'autre | — |

Valeurs : un nombre invalide (`NaN`, chaîne, négatif) est traité comme absent ; `stars` borné à [0 ; 3] ; les entiers sont des `Number` JS.

**Propriétés exigées (tests)** :
- **Idempotente** : `merge(a, a)` ≡ `a` (à la normalisation près) et `merge(merge(a, b), b)` ≡ `merge(a, b)`.
- **Commutative** : `merge(a, b)` ≡ `merge(b, a)` (y compris en cas d'égalité d'`updatedAt`).
- **Associative** sur trois téléphones : `merge(merge(a, b), c)` ≡ `merge(a, merge(b, c))` pour la progression des leçons (pas exigée pour la série 🔥, dont la règle « veille + 1 » dépend de l'ordre).
- **Monotone** : pour tout profil et toute leçon, `stars` du résultat ≥ `stars` de chaque entrée ; `bestErrors` ≤ ; `plays` ≥ ; aucun id de profil ni de leçon ne disparaît.
- **Robuste** : entrées `undefined`/`null`/`{}`, profil v1 sans `updatedAt`, `settings` sans `unlockAll`, `streak.last` à `null`, progression sans `bestErrors` → pas d'exception, résultat complet.
- **Pure** : les objets d'entrée ne sont pas modifiés.

Limite assumée : si Léo joue la même leçon hors ligne sur les deux téléphones, `plays` vaut le max, pas la somme (compteur indicatif, jamais affiché à l'enfant).

### 9.7 Algorithme de synchro

État local nouveau (dans `petitpiano.v1`, **non synchronisé**) :
```js
sync: {
  familyCode: null,     // "PIANO-7KQ3M-XH9PT-R4WZC" ou null
  lastSyncAt: null,     // ms, dernière synchro réussie
  lastState: "idle"     // "idle" | "syncing" | "ok" | "offline" | "error" | "tooNew"
}
```

`PP.sync.run()` (sans effet si `familyCode` est null) :
1. **Un seul à la fois** : si une synchro tourne, on note `again = true` et on relance une fois à la fin.
2. **GET** du document (timeout 10 s via `AbortController`).
   - 404 → le document n'existe pas (ne devrait pas arriver hors jonction) : écrire avec `currentDocument: { exists: false }`.
   - Réseau absent / timeout / `TypeError` → `offline`, fin (réessai au prochain déclencheur).
3. Décoder `profiles` (§9.8). Si `v` distant > `v` géré → `tooNew`, **aucune écriture**, fin.
4. `merged = mergeFamilies(local.profiles, remote.profiles)`.
5. **Appliquer et sauver en local d'abord** (`store.applyMerged(merged)` + `save()`), si `merged` ≠ local.
6. Si `merged` ≡ `remote` (comparaison JSON canonique, clés triées) → pas d'écriture. Sinon **commit** avec `currentDocument: { updateTime: <updateTime du GET> }` et la transformation `updatedAt = REQUEST_TIME`.
7. Conflit de précondition (HTTP 400 `FAILED_PRECONDITION`, 409 `ABORTED`/`ALREADY_EXISTS`) → recommencer à l'étape 2, **3 essais max** (pauses 300 ms, 1 s, 2 s). Au-delà → `error` (réessai au prochain déclencheur ; rien n'est perdu, le local est déjà à jour).
8. 403 `PERMISSION_DENIED` ou autre → `error`.
9. Succès → `lastSyncAt = Date.now()`, `ok`.

**Déclencheurs** :
| Événement | Délai |
|---|---|
| Démarrage de l'appli | après le 1er affichage (`setTimeout` 500 ms) |
| `visibilitychange` → visible | immédiat, sauf si synchro réussie il y a < 30 s |
| `online` | immédiat |
| `recordLesson` (fin de leçon) | anti-rebond 3 s (écran Bravo déjà affiché) |
| Changement par un parent (prénom, réglage, ajout d'enfant) | anti-rebond 3 s |

**Jamais pendant une leçon ne change quoi que ce soit à l'écran** : la synchro peut tourner (données en mémoire + `localStorage`), mais seuls la Carte, « Qui joue ? » et le coin des parents relisent le store en s'affichant. Pendant une leçon, le moteur n'utilise que `store.profile()` au moment d'enregistrer (Bravo) ; comme la fusion est monotone, `recordLesson` garde toujours le meilleur score. Règle de code : ne pas conserver une référence à un objet profil au-delà d'un appel synchrone (toujours repasser par `store.profile()`), car `applyMerged` remplace les entrées de `data.profiles`.
- Si la synchro change quelque chose pendant que la Carte est affichée : re-rendu **silencieux** de la carte (étoiles, cadenas, série) sans animation ni toast, et sans perdre la position de défilement. Si l'écran courant est `lesson`, `bravo` ou `mic` : rien ; le prochain `showMap()` affichera l'état fusionné.
- Si le profil actif n'existe plus localement (impossible par construction, sauf bug) : écran « Qui joue ? ».

**Jonction** (`join(code)`) : GET → 404 : erreur « introuvable » ; OK → `resolveJoinCollisions` puis `mergeFamilies` → sauver en local (avec `familyCode`) → commit avec précondition (boucle de l'étape 7). Le code n'est enregistré qu'après un GET réussi. Si le commit échoue après un GET réussi (réseau coupé entre les deux) : la jonction est quand même validée (le local a déjà tout), la synchro suivante enverra. Tant que ce premier envoi n'a pas réussi, `sync.pendingJoin` (sauvegardé) reste vrai et chaque synchro refait `resolveJoinCollisions` sur le GET frais avant de fusionner : un autre enfant écrit entre-temps sous le même id (« p1 ») par un autre téléphone est ainsi séparé, pas fusionné (test : `tests/sync-scenario.test.js`).

**Création** (`create()`) : génère un code, commit avec `exists: false` ; conflit (improbable) → nouveau code ; hors ligne → message d'erreur, rien n'est enregistré.

**Au démarrage** : `navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(noop)` une fois (réduit le risque d'effacement par iOS).

### 9.8 Code famille

- Format : `PIANO-XXXXX-XXXXX-XXXXX` — 3 groupes de 5 caractères de l'alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 signes : sans 0, O, 1, I, L). 15 × log₂31 ≈ **74 bits**. (3 × 4 = 59 bits ne suffisait pas.) Longueur 23, conforme à `^[A-Za-z0-9-]{16,64}$`.
- Tirage : `crypto.getRandomValues(Uint8Array)`, rejet des octets ≥ 248 (= 8 × 31) pour éviter le biais.
- **Normalisation de la saisie** : majuscules → retirer tout ce qui n'est pas `A-Z0-9` → retirer le préfixe `PIANO` s'il est en tête → il doit rester **exactement 15 signes de l'alphabet** → reformer `PIANO-XXXXX-XXXXX-XXXXX`. Tolère espaces, tirets manquants ou en trop, minuscules, et un message partagé collé en entier si on n'en garde que le code (on cherche d'abord `PIANO[\s-]*…` dans le texte collé).
  - Présence de 0, O, 1, I ou L → « Ce code contient un 0, un O, un 1, un I ou un L : il n'y en a jamais. Vérifie-le. »
  - Mauvaise longueur → « Ce code n'a pas l'air complet. Vérifie-le. »
- Le code est la seule protection : ne l'envoyer qu'entre parents (dit dans le texte de partage).

### 9.9 Données dans Firestore

Document `familles/{CODE}` (le code canonique, avec tirets). Clés **exactement** `v`, `profiles`, `updatedAt` (imposé par les règles).

```json
{
  "fields": {
    "v": { "integerValue": "1" },
    "updatedAt": { "timestampValue": "2026-09-27T18:04:11.201Z" },      // posé par le serveur (REQUEST_TIME)
    "profiles": { "mapValue": { "fields": {
      "p1": { "mapValue": { "fields": {
        "id":         { "stringValue": "p1" },
        "name":       { "stringValue": "Léo" },
        "mode":       { "stringValue": "grand" },
        "curriculum": { "stringValue": "grand" },
        "avatar":     { "stringValue": "🦊" },
        "createdAt":  { "stringValue": "2026-09-20" },
        "updatedAt":  { "integerValue": "1790000000000" },
        "settings":   { "mapValue": { "fields": {
          "voiceAuto": { "booleanValue": false },
          "unlockAll": { "booleanValue": false } } } },
        "progress":   { "mapValue": { "fields": {
          "l01": { "mapValue": { "fields": {
            "stars":      { "integerValue": "3" },
            "bestErrors": { "integerValue": "0" },
            "plays":      { "integerValue": "2" },
            "lastPlayed": { "stringValue": "2026-09-27" } } } } } } },
        "streak":     { "mapValue": { "fields": {
          "days": { "integerValue": "3" },
          "last": { "stringValue": "2026-09-27" } } } }
      } } }
    } } }
  }
}
```

**Encodage générique** (`encodeValue` / `decodeValue`, purs, testés) :
| JS | Firestore |
|---|---|
| `string` | `stringValue` |
| `boolean` | `booleanValue` |
| `null` | `nullValue: null` |
| nombre entier | `integerValue` (**chaîne** en JSON : `"3"`) |
| nombre non entier | `doubleValue` |
| objet | `mapValue: { fields: {...} }` ; objet vide → `mapValue: {}` (pas de `fields`) |
| tableau | `arrayValue: { values: [...] }` ; vide → `arrayValue: {}` |
| `undefined` | champ omis |

Décodage : `integerValue` → `Number(...)` ; `doubleValue` → nombre ; `mapValue` sans `fields` → `{}` ; `arrayValue` sans `values` → `[]` ; `timestampValue` → chaîne ISO ; type inconnu → ignoré (champ omis). Test aller-retour : `decode(encode(x))` ≡ `x` pour un état v1 réel.

- `v` = version du **format du document** (1). Un téléphone qui lit `v` > 1 n'écrit pas (état `tooNew`).
- Les clés de map (ids de profil `p1`, `p-k3x9q02m`, ids de leçon `l01`) sont des chaînes simples, sans `.` ni `/` : acceptées telles quelles.
- Taille : quelques Ko par enfant, très loin de la limite de 1 Mo.

### 9.10 Stockage local (migration en place, sans perte)

- Même clé `petitpiano.v1`. `version` passe à 2 dans l'objet. `load()` (déjà tolérant, fusion avec les défauts) ajoute `sync: { familyCode: null, lastSyncAt: null, lastState: "idle" }` et `updatedAt: 0` aux profils qui n'en ont pas. `p1` inchangé ; progression, série et réglages intacts.
- `activeProfile` et `device` ne sont jamais écrits ni lus à distance.
- Stockage local indisponible : la synchro marche pour la session (en mémoire), mais le code sera oublié au prochain lancement ; l'avertissement v1 de ⚙ suffit.
- Remarque iPhone : une appli « ajoutée à l'écran d'accueil » a un stockage **séparé** de Safari. Le code famille permet aussi de retrouver la progression entre les deux (utile si le parent a d'abord utilisé Safari).

### 9.11 Cas limites

| Situation | Comportement |
|---|---|
| Pas de réseau au démarrage / pendant une leçon | Rien ne change pour l'enfant. Statut ⚙ « Hors ligne ». Synchro au retour du réseau (`online`), au retour dans l'appli ou au démarrage suivant. |
| Pas de réseau pendant « Créer un code » / « Rejoindre » | Message dans la modale/section : « Pas de connexion internet. Réessaie plus tard. » Rien n'est enregistré. |
| Code inconnu (GET 404) | « Je ne trouve pas ce code. Vérifie-le sur l'autre téléphone. » |
| Code mal formé | Messages §9.8 ; pas d'appel réseau. |
| Deux téléphones écrivent en même temps | Précondition `updateTime` : le second échoue, relit, fusionne (monotone), réécrit. 3 essais. Aucune perte, quel que soit l'ordre. |
| Léo joue la même leçon sur les deux téléphones hors ligne | À la synchro : meilleures étoiles, moins d'erreurs, dernière date gardées. |
| Série 🔥 jouée lundi sur le téléphone A, mardi sur B hors ligne | Règle `streak` §9.6 : la série continue (`days` = A.days + 1 au minimum). |
| Parents renomment l'enfant sur les deux téléphones | Le renommage le plus récent (`updatedAt`) gagne partout. |
| Ids `p1` identiques pour deux enfants différents (chaque téléphone a créé son `p1`) | À la jonction : re-id du profil local (§9.5). Les deux enfants apparaissent ; « Qui joue ? » s'affiche. |
| Même enfant créé deux fois (`p1` « Léo » et `p1` « leo ») | Même enfant → fusion. Si ids différents (ex. `p1` et `p-…` « Léo ») : deux profils « Léo » coexistent (rien de perdu). Fusion manuelle de profils : hors périmètre v2. |
| Synchro qui arrive pendant une leçon | La leçon continue sans aucun changement visible ; le Bravo enregistre avec `max` ; la carte affiche l'état fusionné au retour. |
| Synchro qui arrive sur la carte | Re-rendu silencieux (pas de toast, pas d'animation, pas de saut de défilement). |
| Profil sélectionné sur l'autre téléphone | `activeProfile` est local : chaque téléphone garde son dernier joueur. |
| Document distant d'un format plus récent (`v` > 1) | Pas d'écriture ; ⚙ « Mets à jour Petit Piano sur ce téléphone pour synchroniser. » (recharger la page). |
| « Tout réinitialiser » dans une famille | Quitte la famille + efface ce téléphone seulement (§9.2). |
| Téléphone perdu / changé | Nouveau téléphone : « J'ai déjà un code » avec le code gardé → tout revient. |
| Fermeture de l'appli pendant une écriture | Le local est déjà sauvé (étape 5) ; l'écriture sera refaite à la synchro suivante (le distant est « en retard », jamais « en avance »). |

### 9.12 Textes (`js/strings.js`)

```js
// E1 — Bienvenue
'welcome.haveCode': 'J\'ai déjà un code famille ›',

// E7 — Qui joue ?
'who.title': 'Qui joue ?',
'who.found': 'Retrouvé : {prenom} {avatar} !',

// E6 — Plusieurs téléphones
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
'sync.resetConfirmFamily': 'Effacer ce téléphone ? La progression reste sur les autres téléphones de la famille.',

// Statut (petit, --ink-soft, sous le code)
'sync.statusNow': '✓ Synchronisé à l\'instant',
'sync.statusMin': '✓ Synchronisé il y a {n} min',
'sync.statusHour': '✓ Synchronisé il y a {n} h',
'sync.statusDay': '✓ Synchronisé le {date}',          // date locale « 27/09 »
'sync.statusSyncing': 'Synchronisation…',
'sync.statusOffline': 'Hors ligne, sera synchronisé plus tard',
'sync.statusError': 'Pas encore synchronisé, nouvel essai bientôt',
'sync.statusTooNew': 'Mets à jour Petit Piano sur ce téléphone pour synchroniser.',

// Profils
'parents.addChild': '+ Ajouter un enfant',   // facultatif v2
```
Statut : < 1 min → « à l'instant » ; < 60 min → min ; < 24 h → h ; sinon date. Rafraîchi à l'ouverture du coin des parents et à la fin de chaque synchro si la section est visible.

### 9.13 Fichiers et découpage (pour le développeur)

- `js/sync.js` (nouveau, après `storage.js`) : fonctions pures `encodeValue`/`decodeValue`, `encodeProfiles`/`decodeProfiles`, `mergeFamilies`, `resolveJoinCollisions`, `normalizeCode`, `generateCode`, `newProfileId` ; plus la partie réseau `PP.sync = { run, create, join, leave, status, onChange }`. Exporté aussi pour Node (`module.exports`) comme `notes.js`, pour les tests.
- `js/storage.js` : `sync` et `updatedAt` dans les défauts ; `createProfile` → id aléatoire ; `applyMerged(profiles)` ; `touchProfile()` (pose `updatedAt = Date.now()` sur un changement parent) ; hook « modifié » pour l'anti-rebond de synchro ; `reset()` inchangé (la sortie de famille est faite par l'appelant).
- `js/app.js` : section « Plusieurs téléphones », lien sur E1, écran E7 « Qui joue ? », déclencheurs, `storage.persist()`.
- `tests/sync.test.js` (Node, sans dépendance, style de `curriculum.test.js`) : encodage aller-retour, toutes les lignes du tableau §9.6, propriétés (idempotence, commutativité, associativité, monotonie sur des cas générés aléatoirement), formes v1 incomplètes, collisions §9.5, normalisation du code (espaces, minuscules, sans tirets, message collé, 0/O/1/I/L, longueurs), entropie/format de `generateCode` (regex des règles).
- `tests/sync-scenario.test.js` : plusieurs téléphones simulés + faux Firestore (préconditions) : jonction dont l'envoi échoue puis collision d'id, jonctions simultanées, même enfant fusionné, coupure pendant la lecture → « hors ligne », nouvel essai après échec.

### 9.14 Terminé quand…

- [ ] Le téléphone de papa, mis à jour, garde `p1` et toute la progression de Léo **sans rien faire**.
- [ ] « Créer un code » → « Partager » (feuille iPhone) → sur le téléphone de maman, « J'ai déjà un code » depuis l'écran de bienvenue → Léo retrouve ses étoiles.
- [ ] Une leçon finie sur un téléphone apparaît sur l'autre au retour dans l'appli.
- [ ] Mode avion : aucune différence pour l'enfant ; statut « Hors ligne » dans ⚙ ; tout part au retour du réseau.
- [ ] Deux téléphones qui finissent une leçon à la même seconde : les deux résultats sont conservés.
- [ ] Aucune étoile ne diminue jamais, dans aucun scénario de `tests/sync.test.js`.
- [ ] Rien ne bouge à l'écran pendant une leçon quand une synchro arrive.

---

## Revue du critique

Relecture exigeante : pédagogie (9 ans, débutant complet), UX tablette/téléphone sur pupitre, faisabilité de la détection au micro sur piano acoustique. Chaque mélodie a été vérifiée note par note.

### Mélodies (vérifiées note à note)

| Morceau | Verdict |
|---------|---------|
| Au clair de la lune | ✅ Do Do Do Ré Mi(2) Ré(2) · Do Mi Ré Ré Do(4), ×2 = 22 notes, rythmes justes. **Corrigé** : découpage des paroles « pour · é · crire · un · mot » → « pour · é · cri · r'un · mot » (5 syllabes chantées = 5 notes ; « crire » sur une seule note était faux). |
| Frère Jacques (début, L6) | ✅ Do Ré Mi Do ×2, Mi Fa Sol(2) ×2 ; 14 notes. |
| Ode à la joie (L7) | ✅ Les deux phrases de 15 notes, rythme pointé Mi(1,5) Ré(0,5) Ré(2) / Ré(1,5) Do(0,5) Do(2) correct. Doigtés en position de Do corrects. |
| Gamme de Do (L8) | ✅ Montée 1-2-3-1-2-3-4-5, descente 5-4-3-2-1-3-2-1 : doigtés standards. |
| Frère Jacques entier (L9) | ✅ Sol La Sol Fa (croches) Mi Do ×2, Do Sol(grave) Do(2) ×2 ; total 32 notes. |

### Problèmes trouvés et résolutions

1. **Leçon 1 : 5 cartes d'info avant de jouer** — trop long pour un enfant de 9 ans qui veut toucher le piano. → **Corrigé** : accueil et posture fusionnés (6 étapes, 4 infos). L'illustration `hello` n'est plus utilisée.
2. **Surlignage des groupes de touches noires en orange (`#FB8C00`) et bleu (`#0277BD`)** = les couleurs de Ré et de Sol → l'enfant associe une couleur à une note qui n'est pas là. → **Corrigé** : surlignage neutre (contour plein / pointillé), nouveau champ `groups`.
3. **Modèle de données incohérent** : `keys: "C#3 … C#5 D#5"` hors de la plage Do3–Do5 ; `groups` mentionné dans `keys` sans syntaxe ; `accept` en solfège dans le §4 et en anglais dans le §6. → **Corrigé** : champ `groups` séparé, touches hors plage ignorées, `accept` = noms anglais internes (précisé), `keyboard` ajouté à l'exemple l01.
4. **Clavier trop étroit sur téléphone** : Do3–Do5 (15 blanches) sur 390 px = 24 px/touche ; Sol3–Do5 en leçon 9 = 30 px. Inutilisable au doigt en mode écran. → **Corrigé** : largeur minimale 40 px, repli automatique Do4–Do5, `phone` ajouté aux leçons 1 et 2, leçon 9 téléphone = Sol3–La4 (toutes les notes du morceau y sont).
5. **Leçon 9 : changement de position non entraîné** — « Dormez-vous » finit sur Sol au doigt 5, « Sonnez » commence sur Sol au doigt 4 : la main doit glisser d'une touche, ce qu'un débutant ne devinera pas en plein morceau. → **Corrigé** : nouvelle étape 4 « Dormez-vous → Sonnez les matines » (9 notes) avant le Sol grave.
6. **Textes trop longs** (règle « ≤ 15 mots ») : L5 é5, L8 é5, L9 é2 et é4 dépassaient. → **Corrigé** (raccourcis ; le `say` garde la version longue).
7. **Piano désaccordé** : un piano familial peut être 30 à 50 cents trop bas ; l'arrondi « au demi-ton le plus proche » ferait alors basculer des notes d'un demi-ton → fausses notes injustes. → **Corrigé** : mesure de `tuningCents` pendant le test micro (médiane, bornée à [-70 ; +30]), appliquée avant l'arrondi.
8. **Son qui résonne après la suspension du micro** : après la démo ou la note-indice, le détecteur réactivé verrait une hauteur stable et déclencherait une note. → **Corrigé** : reprise toujours **désarmée** ; suspension jusqu'à la fin réelle de l'enveloppe + 300 ms (pas seulement « +300 ms » après le début).
9. **Notes liées manquées** : avec la règle « silence ou remontée ×1,6 », un Do→Ré joué legato (le Do résonne, le Ré est doux) n'est pas réarmé → l'enfant joue juste et rien ne se passe. → **Corrigé** : 3e condition de réarmement = classe de hauteur différente stable 6 trames.
10. **Fausses notes fantômes à l'attaque** (bruit de marteau, harmoniques instables dans les 50 premières ms) → punissent un enfant qui a joué juste. → **Corrigé** : asymétrie 4 trames pour la bonne note, 8 trames pour déclarer une fausse note ; gate de clarté YIN ≥ 0,8.
11. **Fréquence d'échantillonnage supposée** : → **Corrigé** : utiliser `ctx.sampleRate` (48 kHz sur iOS).
12. **États manquants** : mise en veille de l'écran pendant une leçon (tablette posée, jamais touchée → s'éteint au bout de 30 s–2 min !), retour d'arrière-plan (AudioContext suspendu), piste micro coupée, permission révoquée, stockage indisponible sans aucun signal au parent. → **Corrigé** : §5.4 (Wake Lock, voile « Touche l'écran pour continuer », bandeau micro arrêté, message dans ⚙).
13. **Réglages du micro rangés par enfant** : `noiseFloor` et `input` dépendent de l'appareil et du piano, pas de l'enfant → avec la sœur, il faudrait recalibrer. → **Corrigé** : objet `device` partagé ; `load()` fusionne avec les défauts (migration future sans perte).
14. **Série de jours faussée** si les dates viennent de `toISOString()` (UTC) : une leçon jouée à 00 h 30 en France compte pour la veille. → **Corrigé** : dates locales.
15. **Parent bloqué** : impossible de tester une leçon avancée ou de rattraper un profil perdu sans rejouer tout. → **Corrigé** : « Débloquer toutes les leçons » dans ⚙ ; indication « Appui long pour les parents » sur appui court.
16. **Octave ignorée** : « Le Do du milieu » (L2) et « le Sol grave » (L9) ne peuvent pas être vérifiés au micro. → **Assumé et documenté** (§5.3, L9 é6) : c'est le prix de la robustesse aux erreurs d'octave ; l'écran montre la bonne touche.

### Points laissés ouverts (à vérifier sur le vrai matériel)

- **iPhone/iPad : sortie audio quand le micro est ouvert.** iOS peut passer en mode « appel » et baisser le volume (voire l'écouteur sur iPhone). À tester ; mitigation prévue : gain de démo élevé. Pas de solution garantie en web pur.
- **Installation https pour la tablette** (déjà signalé §5.2) : `python3 -m http.server` sur l'ordinateur ne suffit pas pour la tablette. Décision à prendre avec le parent (hébergement statique gratuit recommandé). Hors du périmètre du code.
- **Seuils numériques** (porte 3× bruit, clarté 0,8, ×1,6, 4/6/8 trames) : valeurs de départ raisonnables, mais à régler sur le piano réel avec `?debug=1`.
- **Leçon 8 (passage du pouce)** : c'est le saut technique le plus dur du niveau et la leçon a 9 étapes sans chanson. Gardée telle quelle (le mode « attente » laisse le temps, et le doigté n'est de toute façon pas vérifiable au micro), mais si l'enfant bloque, la scinder en « La et Si » + « La gamme » est la 1re piste.
- **Doigtés non vérifiables** : le micro ne voit pas les doigts ; l'appli les montre seulement. Le parent peut jeter un œil ; rien à faire techniquement.
- **Harmonique de quinte** (YIN qui renvoie parfois la 3e harmonique sur les notes graves) : le seuil YIN 0,15 + premier creux la rend rare ; à surveiller sur Sol3.

---

## 10. Niveau 2 — « Les deux mains » 🙌

> **Révisé : musiques plus modernes.** Le parent trouve les comptines françaises (Au clair de la lune, Frère Jacques, Ah ! vous dirai-je maman…) « ringardes ». Le Niveau 2 garde **le même squelette pédagogique** (main gauche seule → deux mains chacune leur tour → nouvelle position → premières touches noires) mais avec des airs qu'un garçon de 9 ans a envie de jouer : jazz, musique de jeu vidéo, Beethoven, Grieg. **Uniquement du domaine public** (compositeur mort depuis plus de 70 ans, ou air traditionnel) — aucune musique de film, de jeu, de télé ou de pop.
>
> Le Niveau 2 = **9 leçons `l10` → `l18`**, ajoutées **après `l09`** dans `CURRICULA.grand.lessons`. **Rien ne change dans `l01`–`l09`** (ids, étapes, textes) : la progression est stockée par id et synchronisée. `l10` s'ouvre dès que `l09` a ≥ 1 étoile (règle §6.4, inchangée) → le Niveau 2 apparaît **ouvert** dès la mise à jour, sans migration. Le Niveau 2 n'a jamais été publié : l'ordre et les titres de `l10`–`l18` peuvent encore changer librement (aucune étoile stockée sur ces ids).

### 10.0 Choix pédagogiques

1. **La main gauche seule d'abord** (L10–L11), en **position de Do gauche** (petit doigt `g5` sur Do3 … pouce `g1` sur Sol3), sur ***When the Saints Go Marching In*** : un air de jazz de La Nouvelle-Orléans qui tient **entièrement dans 5 notes Do–Sol** → la seule nouveauté est la main.
2. **Les deux mains chacune leur tour** en **position du Do du milieu** (L12 exercices, L13 *Joyeux anniversaire*) : les **deux pouces partagent le Do4** ; main droite Do4–Sol4, main gauche Fa3–Do4 (`g1` Do4, `g2` Si3, `g3` La3, `g4` Sol3, `g5` Fa3). On ne joue jamais deux notes à la fois (le micro n'en détecte qu'une).
3. **Les mains côte à côte** (L14–L15, *Korobeïniki*, l'air russe devenu la musique d'un célèbre jeu vidéo de briques) : le pouce gauche **garde** le Do4 (`g3` La3, `g2` Si3, `g1` Do4) et la main droite **glisse d'une touche**, pouce sur Ré4 (`1` Ré4 … `5` La4). C'est le seul déplacement nouveau, entraîné à part (L14 étapes 2–3). Tout l'air (La3–La4) se joue sans jamais bouger les mains. La même installation sert à nouveau en L18.
4. **Une nouvelle position de main droite** : la **position de Sol** (L16, *Jingle Bells*, touches blanches seulement) — inchangée.
5. **Les premières touches noires en musique** (L17–L18) :
   - L17 *La Lettre à Élise* (Beethoven) : le **Ré♯**, joué par le doigt 4 dans la **position de La** (pouce La4 … petit doigt Mi5). Le célèbre balancement Mi–Ré♯–Mi–Ré♯ = doigts 5–4–5–4, exactement le doigté des pianistes.
   - L18 *Dans l'antre du roi de la montagne* (Grieg), grand final : mains côte à côte (comme L14–L15) + **deux** touches noires, Ré♯ (doigt 2 droit) et **La♯** (doigt 2 gauche). Le morceau accélère : dernière étape rejouée avec une démo plus rapide.
   - *Pourquoi La♯ et pas Si♭* : l'appli affiche toujours les touches noires en dièses (`PP.NOTES[10].fr = 'La♯'`) ; les textes disent donc « La♯ » pour rester cohérents avec les bulles. Aucune notion de bémol au Niveau 2.
6. **Versions simplifiées mais reconnaissables** : on garde le thème principal, quelques phrases, dans une position de 5 doigts (+ relais entre les mains). Deux simplifications assumées : (a) *Lettre à Élise* : la réponse « Do Mi La Si » devient « Mi La Si » (le Do grave ferait 10 touches blanches, trop pour un iPhone) et la phrase « Mi Sol♯ Si Do » est omise ; (b) *Roi de la montagne* : seulement les 8 premières mesures (le thème + sa réponse), pas la partie en majeur.
7. **Domaine public** : *When the Saints* (spiritual traditionnel afro-américain, fin XIXe s., popularisé par le jazz de La Nouvelle-Orléans ; on n'utilise que l'air, jamais un enregistrement ou un arrangement moderne) ; *Joyeux anniversaire* (*Good Morning to All*, 1893) ; *Korobeïniki* (chanson populaire russe, poème de Nekrassov 1861, air populaire fixé fin XIXe s. — domaine public quelle que soit l'attribution ; **seulement l'air traditionnel**, jamais un arrangement de jeu ; le nom du jeu **n'apparaît nulle part**, on dit « un célèbre jeu vidéo de briques ») ; *Jingle Bells* (Pierpont 1857, paroles anglaises d'origine, pas « Vive le vent ») ; Beethoven († 1827) ; Grieg († 1907).
8. Même rythme que le Niveau 1 : 6 à 9 étapes, phrases séparées puis morceau entier, textes ≤ 15 mots, le `say` garde la version longue. Paroles seulement là où chaque syllabe tombe sûrement sur une note (sinon pas de `lyrics` : le champ est optionnel).
9. Le rythme n'est pas vérifié (l'appli attend la bonne note) : les durées ne servent qu'à la démo. Les durées écrites reproduisent le rythme réel, simplifié.

Notation (rappel §4) : `NOTE-doigt:durée` ; doigt sans préfixe = main droite ; `g1`…`g5` = main gauche (1 = pouce, 5 = petit doigt). La validation ignore l'octave : l'octave sert à l'affichage et à la démo.

### 10.1 Vue d'ensemble

| id | num | Titre | Emoji | Mains / position | Morceau | Clavier tablette | Clavier téléphone (blanches) |
|----|-----|-------|-------|------------------|---------|------------------|------------------------------|
| l10 | 10 | La main gauche | 🤚 | MG, position de Do (Do3–Sol3) | When the Saints (1re ligne) | Do3–Do5 | **Do3–Do4** (8) |
| l11 | 11 | When the Saints | 🎺 | MG, position de Do | When the Saints (en entier) | Do3–Do5 | **Do3–Do4** (8) |
| l12 | 12 | Les deux pouces sur Do | 🪞 | MD + MG, Do du milieu | — (exercices) | Do3–Do5 | **Fa3–Sol4** (9) |
| l13 | 13 | Joyeux anniversaire | 🎂 | idem | Joyeux anniversaire (en Do) | Do3–Do5 | **Fa3–Sol4** (9) |
| l14 | 14 | L'air des briques | 🧱 | MG La3–Do4 + MD Ré4–La4 (côte à côte) | Korobeïniki (1re partie) | Do3–Do5 | **Sol3–La4** (9) |
| l15 | 15 | Korobeïniki en entier | 🕹️ | idem | Korobeïniki (1re + 2e partie) | Do3–Do5 | **Sol3–La4** (9) |
| l16 | 16 | Jingle Bells | 🛷 | MD, position de Sol (Sol4–Ré5) | Jingle Bells (refrain) | Do4–Mi5 | **Do4–Ré5** (9) |
| l17 | 17 | La Lettre à Élise | 💌 | MD position de La (La4–Mi5) + pouce gauche Mi4 | Lettre à Élise (thème) | Do4–Sol5 | **Mi4–Mi5** (8) |
| l18 | 18 | Le roi de la montagne | 👹 | côte à côte (comme l14) + Ré♯ et La♯ | Dans l'antre du roi de la montagne | Do3–Do5 | **Sol3–La4** (9) |

Données `keyboard` exactes :
```js
var LH_RANGE   = { from: 'C3', to: 'C5', phone: { from: 'C3', to: 'C4' } };   // l10, l11
var MID_RANGE  = { from: 'C3', to: 'C5', phone: { from: 'F3', to: 'G4' } };   // l12, l13
var SIDE_RANGE = { from: 'C3', to: 'C5', phone: { from: 'G3', to: 'A4' } };   // l14, l15, l18
// l16 : { from: 'C4', to: 'E5', phone: { from: 'C4', to: 'D5' } }
// l17 : { from: 'C4', to: 'G5', phone: { from: 'E4', to: 'E5' } }
```
Toutes les notes **et** toutes les touches `keys` de chaque leçon sont dans la plage téléphone (≤ 9 blanches). Touches noires utilisées : Ré♯5 (l17, entre Ré5 et Mi5), Ré♯4 et La♯3 (l18, dans Sol3–La4).

Constantes (en tête de `curriculum.js`, à côté de celles du Niveau 1 — **ne pas modifier** les constantes existantes ; **supprimer** les constantes Niveau 2 devenues inutiles : `LH_ACL_*`, `LH_FJ_*`, `LH_ODE_*`, `ACL_LY_1`, `AVD_*`, `ACLM_*`, `POSITION_RE`, `ACL_RE`, `FJ_RE`, `ODE_RE_*`) :
```js
// ---- Main gauche, position de Do (Do3–Sol3) ----
var LH_POSITION_DO = 'C3-g5 D3-g4 E3-g3 F3-g2 G3-g1';

// When the Saints Go Marching In (en Do, main gauche)
var SAINTS_OH   = 'C3-g5 E3-g3 F3-g2 G3-g1:4';                                            // Oh when the saints
var SAINTS_GO   = 'C3-g5 E3-g3 F3-g2 G3-g1:2 E3-g3:2 C3-g5:2 E3-g3:2 D3-g4:4';            // Oh when the saints go marching in
var SAINTS_A    = [SAINTS_OH, SAINTS_OH, SAINTS_GO].join(' ');                            // 16 notes
var SAINTS_LORD = 'E3-g3:2 E3-g3 D3-g4 C3-g5:3 C3-g5 E3-g3:2 G3-g1:2 G3-g1 F3-g2:3';     // Oh Lord, I want to be in that number (9)
var SAINTS_END  = 'E3-g3 F3-g2 G3-g1:2 E3-g3:2 C3-g5:2 D3-g4:2 C3-g5:4';                  // when the saints go marching in (7)
var SAINTS_OH_LY  = 'Oh|when|the|saints';
var SAINTS_GO_LY  = 'Oh|when|the|saints|go|mar|ching|in';
var SAINTS_END_LY = 'when|the|saints|go|mar|ching|in';

// ---- Position du Do du milieu (deux pouces sur Do4) ----
var MID_RH = 'C4-1 D4-2 E4-3 F4-4 G4-5';
var MID_LH = 'C4-g1 B3-g2 A3-g3 G3-g4 F3-g5';

// Joyeux anniversaire (en Do) — inchangé par rapport à la 1re version du §10
var JA_1 = 'G3-g4:0.75 G3-g4:0.25 A3-g3 G3-g4 C4-1 B3-g2:2';
var JA_2 = 'G3-g4:0.75 G3-g4:0.25 A3-g3 G3-g4 D4-2 C4-1:2';
var JA_3 = 'G3-g4:0.75 G3-g4:0.25 G4-5 E4-3 C4-1 B3-g2 A3-g3:2';
var JA_4 = 'F4-4:0.75 F4-4:0.25 E4-3 C4-1 D4-2 C4-1:2';
var JA_LY = 'Jo|yeux|an|ni|ver|saire';
var JA_3_LY = 'Jo|yeux|an|ni|ver|saire|🎂';

// ---- Mains côte à côte : pouce gauche Do4, pouce droit Ré4 ----
var SIDE_HANDS = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2';
var SIDE_ALL   = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 F4-3 G4-4 A4-5';

// Korobeïniki (en La mineur)
var KORO_A1 = 'E4-2 B3-g2:0.5 C4-g1:0.5 D4-1 C4-g1:0.5 B3-g2:0.5 A3-g3 A3-g3:0.5 C4-g1:0.5 E4-2 D4-1:0.5 C4-g1:0.5'; // 12
var KORO_A2 = 'B3-g2:1.5 C4-g1:0.5 D4-1 E4-2 C4-g1 A3-g3 A3-g3:2';                                                   // 7
var KORO_A  = KORO_A1 + ' ' + KORO_A2;                                                                                 // 19
var KORO_B1 = 'D4-1:1.5 F4-3:0.5 A4-5 G4-4:0.5 F4-3:0.5 E4-2:1.5 C4-g1:0.5 E4-2 D4-1:0.5 C4-g1:0.5';                 // 10
var KORO_B2 = 'B3-g2 B3-g2:0.5 C4-g1:0.5 D4-1 E4-2 C4-g1 A3-g3 A3-g3:2';                                              // 8
var KORO_B  = KORO_B1 + ' ' + KORO_B2;                                                                                 // 18

// ---- Jingle Bells (refrain, en Sol, position de Sol) — inchangé ----
var POSITION_SOL = 'G4-1 A4-2 B4-3 C5-4 D5-5';
var JB_1 = 'B4-3 B4-3 B4-3:2 B4-3 B4-3 B4-3:2 B4-3 D5-5 G4-1:1.5 A4-2:0.5 B4-3:4';
var JB_1_LY = 'Jin|gle|bells|jin|gle|bells|jin|gle|all|the|way';
var JB_FUN = 'C5-4 C5-4 C5-4:1.5 C5-4:0.5 C5-4 B4-3 B4-3 B4-3:0.5 B4-3:0.5';
var JB_FUN_LY = 'Oh|what|fun|it|is|to|ride|in|a';
var JB_2 = JB_FUN + ' B4-3 A4-2 A4-2 B4-3 A4-2:2 D5-5:2';
var JB_2_LY = JB_FUN_LY + '|one|horse|o|pen|sleigh|hey';
var JB_3 = JB_FUN + ' D5-5 D5-5 C5-4 A4-2 G4-1:4';
var JB_3_LY = JB_FUN_LY + '|one|horse|o|pen|sleigh';

// ---- La Lettre à Élise (en La mineur, position de La, Ré♯ au doigt 4) ----
var POSITION_LA = 'A4-1 B4-2 C5-3 D#5-4 E5-5';
var ELISE_BALANCE = 'E5-5 D#5-4 E5-5 D#5-4 E5-5:2';                                                                  // 5
var ELISE_M  = 'E5-5:0.5 D#5-4:0.5 E5-5:0.5 D#5-4:0.5 E5-5:0.5 B4-2:0.5 D5-4:0.5 C5-3:0.5 A4-1:1.5';              // 9
var ELISE_R1 = 'E4-g1:0.5 A4-1:0.5 B4-2:1.5';                                                                        // 3
var ELISE_R2 = 'E4-g1:0.5 C5-3:0.5 B4-2:0.5 A4-1:1.5';                                                               // 4
var ELISE_ALL = [ELISE_M, ELISE_R1, ELISE_M, ELISE_R1, ELISE_R2].join(' ');                                         // 28

// ---- Dans l'antre du roi de la montagne (en La mineur, mains côte à côte) ----
var TROLL_1 = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 C4-g1 E4-2:2';                                                            // 7
var TROLL_2 = 'D#4-2 B3-g2 D#4-2:2 D4-1 A#3-g2 D4-1:2';                                                              // 6
var TROLL_A = TROLL_1 + ' ' + TROLL_2;                                                                               // 13
var TROLL_B = 'A3-g3 B3-g2 C4-g1 D4-1 E4-2 C4-g1 E4-2 A4-5 G4-4 E4-2 C4-g1 E4-2 G4-4:2';                           // 13
var TROLL_ALL = TROLL_A + ' ' + TROLL_B;                                                                             // 26
```

### 10.2 Les leçons, étape par étape

#### Leçon 10 — La main gauche 🤚
Clavier : `LH_RANGE` (téléphone Do3–Do4). *Objectif : numéros des doigts de la main gauche, position de Do gauche, premier air à gauche.*

| # | Type | Texte affiché | Texte parlé (`say`) | Détails |
|---|------|---------------|---------------------|---------|
| 1 | info | Ta main **gauche** aussi a des numéros : 1 = pouce … 5 = petit doigt. | Nouveau niveau, {prenom} ! On réveille ta main gauche. Elle aussi a des numéros : le pouce, c'est 1, le petit doigt, c'est 5. | illus `leftHand` |
| 2 | info | Petit doigt gauche sur le **Do grave**, pouce sur Sol : la position de Do, à gauche ! | Pose ta main gauche sur le Do grave, un Do plus bas que le Do du milieu. Petit doigt sur Do, pouce sur Sol : c'est la position de Do, à gauche. | keys `LH_POSITION_DO` |
| 3 | find | Petit doigt gauche (5) sur le Do grave. Joue-le 3 fois. | Petit doigt gauche sur le Do grave. Joue-le trois fois. | accept `["C"]`, count 3, keys `C3-g5` ; hint « Le Do grave : un Do plus à gauche que le Do du milieu. » |
| 4 | sequence | Monte : Do Ré Mi Fa Sol, du petit doigt au pouce. | On monte avec la main gauche : Do, Ré, Mi, Fa, Sol. Du petit doigt jusqu'au pouce. | `C3-g5 D3-g4 E3-g3 F3-g2 G3-g1` |
| 5 | sequence | Redescends : Sol Fa Mi Ré Do. | Et on redescend, du pouce au petit doigt. | `G3-g1 F3-g2 E3-g3 D3-g4 C3-g5:2` |
| 6 | sequence (song) | Du jazz ! Do, Mi, Fa, Sol… deux fois. 🎺 | Un air de jazz de La Nouvelle-Orléans : When the Saints ! Do, Mi, Fa, Sol : petit doigt, doigt trois, doigt deux, pouce. Deux fois. Écoute d'abord ! | `SAINTS_OH + ' ' + SAINTS_OH` (8) · lyrics `SAINTS_OH_LY + '\|' + SAINTS_OH_LY` · title « When the Saints » |
| 7 | sequence (song) | Toute la 1re ligne ! 🎺 | Et maintenant, toute la première ligne. À la fin, ça redescend : Mi, Do, Mi, Ré. | `SAINTS_A` (16) · lyrics `[SAINTS_OH_LY, SAINTS_OH_LY, SAINTS_GO_LY].join('\|')` |

`doneText` : « Ta main gauche joue du jazz ! 🤚 »

#### Leçon 11 — When the Saints 🎺
Clavier : `LH_RANGE`. *Objectif : fluidité de la main gauche ; tout l'air (32 notes) dans la même position.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | La suite de « When the Saints », toujours à gauche ! | Aujourd'hui, toute la chanson When the Saints, avec la main gauche. Petit doigt sur le Do grave ! | keys `LH_POSITION_DO` |
| 2 | sequence (song) | La 1re ligne. Tu la connais ! | D'abord la première ligne. Tu la connais déjà ! | `SAINTS_A` (16) · lyrics comme l10/7 · title « When the Saints » |
| 3 | sequence (song) | Mi Mi Ré Do… puis ça monte jusqu'au Sol ! | La deuxième ligne : Mi, Mi, Ré, Do, puis ça monte jusqu'au Sol, avec le pouce, et on finit sur Fa. | `SAINTS_LORD` (9) |
| 4 | sequence (song) | La fin : Mi Fa Sol, Mi Do, Ré Do. | La fin : Mi, Fa, Sol, puis Mi, Do, Ré, et Do avec le petit doigt. | `SAINTS_END` (7) · lyrics `SAINTS_END_LY` |
| 5 | sequence (song) | La 2e ligne et la fin, à la suite ! | La deuxième ligne et la fin, à la suite. | `SAINTS_LORD + ' ' + SAINTS_END` (16) |
| 6 | sequence (song) | Toute la chanson ! 🎺🎷 | Et maintenant, toute la chanson, comme un vrai jazzman ! | `SAINTS_A + ' ' + SAINTS_LORD + ' ' + SAINTS_END` (32) |

`doneText` : « Tu joues du jazz à la main gauche ! 🎺 »

#### Leçon 12 — Les deux pouces sur Do 🪞
Clavier : `MID_RANGE` (téléphone Fa3–Sol4). **Inchangée** par rapport à la 1re version (déjà codée) : 7 étapes d'exercices, position du Do du milieu.

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Nouvelle position : les **deux pouces** sur le Do du milieu ! | Nouvelle position ! Tes deux pouces se partagent le Do du milieu. La main droite part vers la droite, la main gauche vers la gauche. | keys `MID_RH` |
| 2 | sequence | Main droite : Do Ré Mi Fa Sol ⬆️ | Main droite : Do, Ré, Mi, Fa, Sol. Tu connais ! | `C4-1 D4-2 E4-3 F4-4 G4-5:2` |
| 3 | info | Main gauche : pouce sur Do, puis **Si, La, Sol, Fa** vers la gauche. | Main gauche maintenant : le pouce sur le même Do. Les autres doigts descendent vers la gauche : Si, La, Sol, Fa. | keys `MID_LH` |
| 4 | sequence | Main gauche : Do Si La Sol Fa ⬇️ | Avec la main gauche : Do, Si, La, Sol, Fa. On descend ! | `C4-g1 B3-g2 A3-g3 G3-g4 F3-g5:2` |
| 5 | sequence | Et remonte avec la main gauche ⬆️ | Et on remonte avec la main gauche, du petit doigt au pouce. | `F3-g5 G3-g4 A3-g3 B3-g2 C4-g1:2` |
| 6 | sequence | Chacun son tour : 3 notes à droite, 3 à gauche ! | Chacun son tour : trois notes avec la main droite, puis trois avec la main gauche. | `C4-1 E4-3 G4-5 C4-g1 A3-g3 F3-g5:2` |
| 7 | sequence | Du Fa grave au Sol : la main droite prend le relais ! | On monte du Fa grave jusqu'au Sol. La main gauche commence, et la main droite prend le relais sur le Do. | `F3-g5 G3-g4 A3-g3 B3-g2 C4-1 D4-2 E4-3 F4-4 G4-5:2` |

`doneText` : « Tes deux mains jouent chacune leur tour ! 🪞 »

#### Leçon 13 — Joyeux anniversaire 🎂
Clavier : `MID_RANGE`. Position du Do du milieu. **Contenu identique à l'ancienne L15** (déjà codée), seuls `id`/`num` changent (`l13`, 13). *Tonalité de Do, départ sur Sol3 : Sol/La/Si à gauche, Do→Sol à droite. Nouveauté : le grand saut Sol3 → Sol4.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | La chanson des anniversaires, à deux mains ! 🎂 | Voici la chanson des anniversaires. Tu pourras la jouer pour toute la famille ! Deux pouces sur le Do du milieu. | keys `G3-g4 A3-g3 B3-g2 C4-1 D4-2 E4-3 F4-4 G4-5` |
| 2 | sequence (song) | Sol Sol La Sol à gauche, puis Do et Si. | Joyeux anniversaire : Sol, Sol, La, Sol avec la main gauche, puis Do à droite et Si à gauche. Écoute d'abord ! | `JA_1` · lyrics `JA_LY` · title « Joyeux anniversaire » |
| 3 | sequence (song) | Presque pareil, mais ça finit sur Ré puis Do. | Presque pareil, mais cette fois ça finit sur Ré, puis Do. | `JA_2` · lyrics `JA_LY` |
| 4 | info | Le grand saut : le **Sol aigu**, avec le petit doigt droit ! | Attention, dans la phrase suivante il y a un grand saut : du Sol grave au Sol aigu, avec le petit doigt de la main droite. | keys `G3-g4 G4-5` |
| 5 | sequence (song) | Le grand saut, puis ça redescend ! | Le grand saut, puis ça redescend doucement jusqu'au La. | `JA_3` · lyrics `JA_3_LY` |
| 6 | sequence (song) | La dernière phrase : toute à la main droite. | La dernière phrase se joue toute avec la main droite. Fa avec le doigt quatre ! | `JA_4` · lyrics `JA_LY` |
| 7 | sequence (song) | Toute la chanson ! 🎂 | Et maintenant, toute la chanson ! | `[JA_1, JA_2, JA_3, JA_4].join(' ')` (25) · lyrics `[JA_LY, JA_LY, JA_3_LY, JA_LY].join('\|')` |

`doneText` : « Tu peux jouer Joyeux anniversaire à toute la famille ! 🎂 »

#### Leçon 14 — L'air des briques 🧱
Clavier : `SIDE_RANGE` (téléphone Sol3–La4). *Nouvelle installation : mains côte à côte. Korobeïniki, 1re partie (19 notes), en La mineur : La/Si/Do à gauche, Ré/Mi à droite — beaucoup d'allers-retours entre les mains, c'est le jeu.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Un vieil air russe… devenu la musique d'un célèbre jeu vidéo de briques ! 🧱 | Voici Korobeïniki, une vieille chanson russe. Tu la connais sûrement : c'est devenu la musique d'un célèbre jeu vidéo où des briques tombent ! | keys `SIDE_HANDS` |
| 2 | info | Pouce gauche sur Do. Main droite : glisse d'une touche, **pouce sur Ré** ! | Nouvelle installation ! Ton pouce gauche garde le Do du milieu. Ta main droite glisse d'une touche vers la droite : le pouce sur Ré. Tes deux mains sont côte à côte ! | keys `SIDE_HANDS` |
| 3 | sequence | La Si Do à gauche, Ré Mi à droite… et retour ! | On essaie : La, Si, Do avec la main gauche, Ré, Mi avec la main droite. Puis on redescend. | `A3-g3 B3-g2 C4-g1 D4-1 E4-2 D4-1 C4-g1 B3-g2 A3-g3:2` |
| 4 | sequence (song) | Le début : Mi à droite, puis Si Do à gauche… | Le début de l'air. Il commence sur Mi, avec le doigt deux de la main droite. Écoute d'abord ! | `KORO_A1` (12) · title « Korobeïniki » |
| 5 | sequence (song) | La fin de la phrase : elle finit sur La, deux fois. | La fin de la phrase. Elle finit sur La, deux fois, avec le doigt trois de la main gauche. | `KORO_A2` (7) |
| 6 | sequence (song) | Toute la 1re partie ! 🧱 | Et maintenant, toute la première partie ! | `KORO_A` (19) |

`doneText` : « Les briques tombent en musique ! 🧱 »

#### Leçon 15 — Korobeïniki en entier 🕹️
Clavier : `SIDE_RANGE`. Mains côte à côte. *La 2e partie monte jusqu'au La4 (Fa-3, Sol-4, La-5 de la main droite), sans bouger les mains.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | La 2e partie monte plus haut : Fa, Sol, **La** avec les doigts 3, 4, 5 ! | La deuxième partie monte plus haut. Garde tes mains côte à côte : Fa, Sol et La, avec les doigts trois, quatre et cinq de la main droite. | keys `SIDE_ALL` |
| 2 | sequence (song) | D'abord la 1re partie. Tu la connais ! | D'abord, la première partie. Tu la connais déjà ! | `KORO_A` (19) · title « Korobeïniki » |
| 3 | sequence (song) | Ré, Fa, **La**… puis ça redescend ! | La deuxième partie : Ré, Fa, La, tout en haut avec le petit doigt, puis ça redescend. Écoute d'abord ! | `KORO_B1` (10) |
| 4 | sequence (song) | La fin ressemble à la 1re partie ! | La fin ressemble beaucoup à la fin de la première partie : Si, Si, Do, Ré, Mi, Do, La, La. | `KORO_B2` (8) |
| 5 | sequence (song) | Toute la 2e partie ! | Toute la deuxième partie, à la suite. | `KORO_B` (18) |
| 6 | sequence (song) | Tout Korobeïniki ! 🕹️ | Et maintenant, tout l'air, du début à la fin ! | `KORO_A + ' ' + KORO_B` (37) |

`doneText` : « Tu joues tout l'air des briques ! 🕹️ »

#### Leçon 16 — Jingle Bells 🛷
Clavier : Do4–Mi5 (téléphone Do4–Ré5). **Inchangée** par rapport à la 1re version (déjà codée). Position de Sol (pouce Sol4 … petit doigt Ré5). Paroles anglaises d'origine.

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Déplace ta main droite : pouce sur **Sol**. C'est la **position de Sol** ! | Nouvelle position ! Déplace ta main droite : le pouce sur le Sol juste au-dessus du Do du milieu, le petit doigt sur Ré. C'est la position de Sol. | keys `POSITION_SOL` |
| 2 | sequence | Sol La Si Do Ré… et retour ! | Monte, Sol, La, Si, Do, Ré, et redescends. | `G4-1 A4-2 B4-3 C5-4 D5-5 C5-4 B4-3 A4-2 G4-1:2` |
| 3 | sequence (song) | Jingle Bells ! Presque tout sur **Si**, doigt 3. | Tu la connais sûrement : Jingle Bells, c'est l'air de Vive le vent ! Presque tout se joue sur Si, avec le doigt trois. Écoute d'abord ! | `JB_1` (11) · lyrics `JB_1_LY` · title « Jingle Bells » |
| 4 | sequence (song) | La suite : le Do avec le doigt 4. | La suite. Le Do se joue avec le doigt quatre. | `JB_2` (15) · lyrics `JB_2_LY` |
| 5 | sequence (song) | La fin est différente : elle finit sur Sol ! | La fin du refrain est un peu différente : elle finit sur Sol, avec le pouce. | `JB_3` (14) · lyrics `JB_3_LY` |
| 6 | sequence (song) | La deuxième moitié : elle finit sur Sol ! | La deuxième moitié du refrain, jusqu'au Sol final. | `JB_1 + ' ' + JB_3` (25) · lyrics `JB_1_LY + '\|' + JB_3_LY` |
| 7 | sequence (song) | Tout le refrain ! 🛷🔔 | Et maintenant, tout le refrain ! | `[JB_1, JB_2, JB_1, JB_3].join(' ')` (51) · lyrics `[JB_1_LY, JB_2_LY, JB_1_LY, JB_3_LY].join('\|')` |

`doneText` : « Jingle Bells ! Tu connais la position de Sol ! 🛷 »

#### Leçon 17 — La Lettre à Élise 💌
Clavier : `{ from: 'C4', to: 'G5', phone: { from: 'E4', to: 'E5' } }` (8 blanches). *Première touche noire dans une mélodie : le Ré♯5. Position de La : pouce La4, 2 Si4, 3 Do5, 4 Ré5 **ou** Ré♯5, 5 Mi5 (doigté réel de Beethoven : Mi-5 Ré♯-4 Mi-5 Ré♯-4 Mi-5 Si-2 Ré-4 Do-3 La-1). La réponse « Mi » grave est jouée par le **pouce gauche** (Mi4), comme le Sol grave de L9.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Ta 1re touche noire en musique : le **Ré♯**, entre Ré et Mi ! | Voici ta première touche noire en musique : le Ré dièse. Dièse veut dire un tout petit peu plus haut. C'est la touche noire juste à droite du Ré, entre Ré et Mi. | keys `D5 D#5 E5`, groups `"2"` |
| 2 | find | Joue un Ré♯ ! | Joue un Ré dièse : la deuxième touche noire du groupe de deux. | accept `["D#"]`, count 3, keys `D#5-4` ; hint « La 2e touche noire du groupe de 2. » |
| 3 | info | Pouce droit sur **La**, petit doigt sur Mi. Le doigt 4 va sur le Ré♯. | Une musique très célèbre de Beethoven : la Lettre à Élise ! Pose ton pouce droit sur le La au-dessus du Do du milieu, le petit doigt sur Mi. Le doigt quatre se pose sur la touche noire, Ré dièse. | keys `POSITION_LA` |
| 4 | sequence (song) | Mi, Ré♯, Mi, Ré♯, Mi : doigts 5 et 4, ça se balance ! | Le début se balance : Mi, Ré dièse, Mi, Ré dièse, Mi. Doigt cinq, doigt quatre, doigt cinq… Écoute d'abord ! | `ELISE_BALANCE` (5) · title « La Lettre à Élise » |
| 5 | sequence (song) | Puis ça descend : Si, Ré, Do, **La** ! | Après le balancement, ça descend : Si, Ré, Do, et La avec le pouce. Le doigt quatre revient sur la touche blanche, Ré. | `ELISE_M` (9) |
| 6 | info | Le pouce **gauche** sur le Mi du bas : il répond ! | Maintenant, la réponse. Pose le pouce de ta main gauche sur le Mi, plus bas, à gauche de ta main droite. Il répond à la main droite ! | keys `E4-g1 A4-1 B4-2` ; illus `leftThumb` |
| 7 | sequence (song) | La mélodie, puis la réponse : Mi à gauche, La Si à droite. | La mélodie, puis la réponse : Mi avec le pouce gauche, puis La et Si avec la main droite. | `ELISE_M + ' ' + ELISE_R1` (12) |
| 8 | sequence (song) | La fin : après la réponse, Mi… Do, Si, La ! | La fin du thème : la mélodie, la réponse, puis encore Mi avec le pouce gauche, et Do, Si, La pour finir. | `[ELISE_M, ELISE_R1, ELISE_R2].join(' ')` (16) |
| 9 | sequence (song) | Toute la Lettre à Élise ! 💌 | Et maintenant, tout le thème, deux fois la mélodie ! | `ELISE_ALL` (28) |

`doneText` : « Tu joues la Lettre à Élise de Beethoven ! 💌 »

#### Leçon 18 — Le roi de la montagne 👹
Clavier : `SIDE_RANGE` (téléphone Sol3–La4). Mains côte à côte (comme L14–L15). *Grand final : Dans l'antre du roi de la montagne (Grieg, Peer Gynt), 8 premières mesures en La mineur. Deux touches noires : Ré♯4 (doigt 2 droit, qui glisse de Mi vers la touche noire) et La♯3 (doigt 2 gauche, qui glisse de Si vers la touche noire). Le vrai morceau accélère sans arrêt : dernière étape = même suite, démo à tempo 144.*

| # | Type | Texte affiché | Texte parlé | Détails |
|---|------|---------------|-------------|---------|
| 1 | info | Le grand final : **Dans l'antre du roi de la montagne** ! 👹 | Le grand final ! Une musique de Grieg : Dans l'antre du roi de la montagne. Des trolls avancent sur la pointe des pieds, puis de plus en plus vite ! Mains côte à côte, comme pour l'air des briques : pouce gauche sur Do, pouce droit sur Ré. | keys `SIDE_HANDS` |
| 2 | sequence (song) | Les trolls avancent : La Si Do à gauche, Ré Mi à droite. | Les trolls avancent : La, Si, Do avec la main gauche, Ré, Mi avec la main droite, puis Do, Mi. Écoute d'abord ! | `TROLL_1` (7) · title « Le roi de la montagne » |
| 3 | info | Deux touches noires : **Ré♯** (doigt 2 droit) et **La♯** (doigt 2 gauche). | Deux touches noires arrivent. Le Ré dièse, tu le connais : avec le doigt deux de la main droite. Et le La dièse, la touche noire entre La et Si, avec le doigt deux de la main gauche. | keys `A#3-g2 D#4-2` |
| 4 | find | Joue un La♯, doigt 2 gauche. | Joue un La dièse, avec le doigt deux de la main gauche. C'est la touche noire entre La et Si. | accept `["A#"]`, count 3, keys `A#3-g2` ; hint « La 3e touche noire du groupe de 3, entre La et Si. » |
| 5 | sequence (song) | Ça se faufile sur les touches noires ! | Maintenant, ça se faufile sur les touches noires : Ré dièse, Si, Ré dièse, puis Ré, La dièse, Ré. | `TROLL_2` (6) |
| 6 | sequence (song) | Toute la 1re partie ! | Toute la première partie, à la suite. | `TROLL_A` (13) |
| 7 | sequence (song) | La 2e partie monte jusqu'au **La**, petit doigt ! | La deuxième partie commence pareil, puis monte jusqu'au La, tout en haut, avec le petit doigt. Elle finit sur Sol. | `TROLL_B` (13) |
| 8 | sequence (song) | Tout le morceau ! 👹 | Et maintenant, tout le morceau ! | `TROLL_ALL` (26) |
| 9 | sequence (song) | Encore, **plus vite** ! Comme les trolls ! 🔥 | Dans la vraie musique, ça va de plus en plus vite. Écoute la démo rapide, et joue aussi vite que tu peux ! | `TROLL_ALL` (26) · tempo 144 |

`doneText` : « Tu as échappé au roi de la montagne ! 👹 »

### 10.3 Ce qui change dans l'appli (hors `curriculum.js`)

Inchangé par rapport à la 1re version du §10, sauf **f)**, **g)** (déjà en partie codé dans la copie de travail : on garde).

**a) Niveaux dans les données** — nouveau champ de programme (les leçons ne bougent pas) :
```js
grand: {
  id: 'grand', title: 'Niveau 1', tempo: 96,   // title conservé (compatibilité)
  levels: [
    { num: 1, title: 'Niveau 1', subtitle: 'La main droite', emoji: '🖐️', first: 'l01' },
    { num: 2, title: 'Niveau 2', subtitle: 'Les deux mains',  emoji: '🙌', first: 'l10' }
  ],
  lessons: [ /* l01 … l09 inchangées, puis l10 … l18 */ ]
}
```
Le niveau d'une leçon = le dernier niveau dont `first` est à un index ≤ celui de la leçon. « Dernière leçon d'un niveau » = la leçon juste avant le `first` du niveau suivant, ou la dernière du tableau. Si `levels` est absent : comportement actuel.

**b) Carte (E3) — bandeau de niveau.** Avant la 1re leçon de chaque niveau, une ligne « bandeau » (pas une pastille) :
```
 Téléphone                               Tablette (5 colonnes)
 ┌────────────────────────┐              ┌──────────────────────────────────────────────┐
 │ 🖐️ Niveau 1 · La main droite │        │        🖐️ Niveau 1 · La main droite           │
 │   (1) … (9) ⭐⭐⭐        │              │  (1) ── (2) ── (3) ── (4) ── (5)              │
 │      │                 │              │  (9) ── (8) ── (7) ── (6)                     │
 │ ╭────────────────────╮ │              │  ╭──────────────────────────────────────────╮ │
 │ │ 🙌 Niveau 2        │ │              │  │ 🙌 Niveau 2 · Les deux mains   Nouveau ! │ │
 │ │  Les deux mains    │ │              │  ╰──────────────────────────────────────────╯ │
 │ ╰────────────────────╯ │              │  (10) ── (11) ── (12) ── (13) ── (14)         │
 │      │                 │              │  (18) ── (17) ── (16) ── (15)                 │
 │ ╔═(10) La main gauche═╗│              └──────────────────────────────────────────────┘
 └────────────────────────┘
```
- Bandeau : pleine largeur du chemin moins 32 px, hauteur 64 px (téléphone) / 56 px (tablette), coins 28 px, fond `--surface` avec bordure 2 px `--primary`, texte 20 px gras « {emoji} {title} », sous-titre 16 px `--soft` « {subtitle} » (sur une seule ligne « · » en tablette). Rôle `heading` (`<h2>`), pas cliquable.
- **Chaque niveau commence sur une nouvelle rangée** (tablette : le serpentin repart de la colonne de gauche ; le numéro de rangée est compté *dans* le niveau).
- La ligne qui relie `l09` à `l10` passe **derrière** le bandeau.
- Niveau verrouillé : bandeau grisé, emoji remplacé par 🔒, sous-titre « Termine le Niveau 1 pour l'ouvrir ».
- Pastille « **Nouveau !** » sur le bandeau d'un niveau ouvert dont aucune leçon n'a encore d'étoile.
- Défilement automatique vers la leçon courante comme avant.

**c) Écran Bravo (E5).**
- Fin de `l09` : titre `bravo.levelDone` (« Tu as fini le Niveau 1 ! 🏆 ») ; ligne `bravo.levelUnlocked` si le niveau suivant vient d'être débloqué ; bouton principal `bravo.nextLevel` (« Niveau 2 ▶ ») qui lance `l10`.
- Fin de `l18` : « Tu as fini le Niveau 2 ! 🏆 », pas de bouton suivant, ligne `bravo.moreSoon`.

**d) Consigne sous les bulles (E4)** :
- main gauche, doigt 1 → `lesson.playLeftThumb` (inchangé) ;
- main gauche, doigt 2–5 → `lesson.playLeftFinger` « Joue le {note} avec le doigt {finger} **gauche** » ;
- main droite, dans une étape dont la suite contient **aussi** des notes de main gauche → `lesson.playRightFinger` « … doigt {finger} **droit** » ;
- sinon → `lesson.playFinger` (Niveau 1 identique).
Bulles de main gauche : petit liseré pointillé sous le doigt.

**e) Illustration `leftHand`** (`js/illus.js`) : `fingerNumbers` en miroir, chiffres à l'endroit, mot « gauche » sous la paume. `leftThumb` (existant, L9) est réutilisée en l17/6.

**f) Textes (`js/strings.js`)** — `hint.F#` **remplacé** (plus aucun Fa♯ au Niveau 2) par :
```js
'map.levelLocked': 'Termine le {prev} pour l\'ouvrir',
'map.levelNew': 'Nouveau !',
'bravo.levelUnlocked': 'Le {level} est ouvert : {subtitle} {emoji}',
'bravo.nextLevel': '{level} ▶',
'bravo.moreSoon': 'D\'autres leçons arrivent bientôt ! 🎹',
'lesson.playLeftFinger': 'Joue le {note} avec le doigt {finger} gauche',
'lesson.playRightFinger': 'Joue le {note} avec le doigt {finger} droit',
'hint.D#': 'Le Ré♯ est la touche noire entre Ré et Mi.',
'hint.A#': 'Le La♯ est la touche noire entre La et Si.',
```
(Aide par note = `'hint.' + PP.NOTES[pc].en`. Sans ces clés, une erreur sur Ré♯/La♯ en séquence afficherait une clé brute. On peut garder `hint.F#` en plus, inoffensif.)

**g) Tests (`tests/curriculum.test.js`)** :
- `cur.lessons.length === 18` ; ids `l01`…`l18` dans l'ordre ; `num` = index + 1 ; titres l10–l18 comme au §10.1.
- `levels` : `first` existants, dans l'ordre ; `first` du niveau 2 = `l10`.
- Plage téléphone de **chaque** leçon ≤ 9 blanches ; toutes les notes et `keys` du Niveau 2 dedans.
- Longueurs : `l10/6` 8, `l10/7` 16, `l11/2` 16, `l11/3` 9, `l11/4` 7, `l11/5` 16, `l11/6` 32, `l12/7` 9, `l13/7` 25, `l14/3` 9, `l14/4` 12, `l14/5` 7, `l14/6` 19, `l15/3` 10, `l15/4` 8, `l15/5` 18, `l15/6` 37, `l16/6` 25, `l16/7` 51, `l17/4` 5, `l17/5` 9, `l17/7` 12, `l17/8` 16, `l17/9` 28, `l18/2` 7, `l18/5` 6, `l18/6` 13, `l18/7` 13, `l18/8` 26, `l18/9` 26.
- Mélodies (classes de hauteur, §10.4) : au moins `l11/6`, `l13/7`, `l15/6`, `l16/7`, `l17/9`, `l18/8`.
- `l17/2` accepte `D#` ; `l18/4` accepte `A#` ; en l17 tout `D#` a le doigt 4 (main droite) ; en l18 tout `D#` a le doigt 2 droit et tout `A#` le doigt `g2`.
- `lyrics` : quand présent, même nombre d'éléments que `seq` (l10/6, l10/7, l11/2, l11/4, l13/*, l16/*).
- `l18/9.tempo === 144`.
- Plus aucune chanson française traditionnelle au Niveau 2 : aucun `title` de l10–l18 parmi « Au clair de la lune », « Frère Jacques », « Ah ! vous dirai-je maman », « Ode à la joie ».

**h) Version** : `?v=3` sur tous les `<link>`/`<script>` de `index.html` (déjà fait dans la copie de travail).

### 10.4 Mélodies écrites note à note

(Notes en solfège ; ₃ = octave 3 ; durées entre parenthèses quand ≠ 1.)

| Morceau | Notes | Vérification |
|---------|-------|--------------|
| **When the Saints Go Marching In** (L10–L11), en Do, MG Do3–Sol3 | Do Mi Fa Sol(4) · Do Mi Fa Sol(4) · Do Mi Fa Sol(2) Mi(2) Do(2) Mi(2) Ré(4) · Mi(2) Mi Ré Do(3) Do Mi(2) Sol(2) Sol Fa(3) · Mi Fa Sol(2) Mi(2) Do(2) Ré(2) Do(4) | ✅ Version standard en Do (« Oh when the saints / oh when the saints / oh when the saints go marching in / oh Lord I want to be in that number / when the saints go marching in ») ; 4+4+8+9+7 = **32**. Uniquement Do Ré Mi Fa Sol → position de Do gauche : Do g5, Ré g4, Mi g3, Fa g2, Sol g1. Paroles seulement sur les lignes 1, 2, 3 et 5 (syllabes = notes : 4, 4, 8, 7) ; ligne 4 sans paroles (10 syllabes pour 9 notes selon les éditions). |
| **Joyeux anniversaire** (L13), en Do | Sol₃ Sol₃ La₃ Sol₃ Do Si₃(2) · Sol₃ Sol₃ La₃ Sol₃ Ré Do(2) · Sol₃ Sol₃ Sol Mi Do Si₃ La₃(2) · Fa Fa Mi Do Ré Do(2) | ✅ inchangé (25). |
| **Korobeïniki** (L14–L15), en La mineur | A : Mi Si₃ Do Ré Do Si₃ La₃ La₃ Do Mi Ré Do · Si₃ Do Ré Mi Do La₃ La₃(2) · B : Ré Fa La Sol Fa Mi Do Mi Ré Do · Si₃ Si₃ Do Ré Mi Do La₃ La₃(2) | ✅ Air traditionnel dans sa forme connue (A = « E B C D C B A A C E D C B C D E C A A », B = « D F A G F E C E D C B B C D E C A A » en notation anglaise) ; 19 + 18 = **37**. Vérifié note à note et mesure par mesure (4 temps chacune). Rythme : noire / 2 croches ; dans l'original, B commence par un demi-soupir puis Ré noire + Fa croche : ici le demi-soupir est absorbé dans un Ré pointé (le modèle n'a pas de silence ; démo seulement). MG : La₃ g3, Si₃ g2, Do g1 ; MD : Ré 1, Mi 2, Fa 3, Sol 4, La 5. Aucune touche noire. |
| **Jingle Bells** (L16), refrain en Sol | inchangé | ✅ (51). |
| **La Lettre à Élise** (L17), La mineur, octave réelle (Mi5) | M = Mi Ré♯ Mi Ré♯ Mi Si₄ Ré Do La₄ · R1 = Mi₄ La₄ Si₄ · M · R1 · R2 = Mi₄ Do Si₄ La₄ | ✅ Thème original = M · Do₄ Mi₄ La₄ Si₄ · Mi₄ Sol♯₄ Si₄ Do₅ · M · Do₄ Mi₄ La₄ Si₄ · Mi₄ Do₅ Si₄ La₄. Simplifié : Do₄ enlevé de la réponse (sinon Do4–Mi5 = 10 blanches) et phrase « Mi Sol♯ Si Do » omise (une seule touche noire nouvelle par leçon). Le motif M, la partie reconnaissable, est **intact** avec son doigté d'origine (5-4-5-4-5-2-4-3-1). 9+3+9+3+4 = **28**. |
| **Dans l'antre du roi de la montagne** (L18), La mineur (original en Si mineur, transposé d'un ton vers le bas) | A = La₃ Si₃ Do Ré · Mi Do Mi(2) · Ré♯ Si₃ Ré♯(2) · Ré La♯₃ Ré(2) · B = La₃ Si₃ Do Ré · Mi Do Mi La · Sol Mi Do Mi · Sol(2) | ✅ Original (Si mineur) : Si Do♯ Ré Mi · Fa♯ Ré Fa♯ · Mi♯ Do♯ Mi♯ · Mi Do Mi · Si Do♯ Ré Mi · Fa♯ Ré Fa♯ Si · La Fa♯ Ré Fa♯ · La — chaque note −2 demi-tons (Mi♯→Ré♯, Do→La♯). 13 + 13 = **26**. MG : La₃ g3, La♯₃ g2, Si₃ g2, Do g1 ; MD : Ré 1, Ré♯ 2, Mi 2, Sol 4, La 5. |

Doigtés : tous dans la position annoncée (un doigt par touche ; seuls les doigts qui glissent sur une touche noire voisine : 4 sur Ré♯ en L17, 2 sur Ré♯ / g2 sur La♯ en L18). Changements de main : relais au Do du milieu (L12–L13), mains côte à côte (L14–L15, L18), pouce gauche sur Mi4 (L17). **Aucun passage de pouce, aucun déplacement de main en cours de morceau.**

### 10.5 Points à vérifier sur le vrai piano

- **Notes graves de la main gauche (Do3–Sol3, 131–196 Hz, L10–L11)** : surveiller avec `?debug=1` les erreurs de quinte (§5.3). Une erreur d'octave est sans conséquence ; une erreur de quinte serait comptée fausse → si fréquent, baisser le seuil YIN sous 200 Hz.
- **L14–L15 et L18 alternent très vite les mains** (La₃/Si₃/Do à gauche, Ré/Mi à droite, souvent une note sur deux) : c'est le cœur de l'exercice ; en mode attente, aucun souci de rythme.
- **L17 : Mi5–Ré♯5 répétés** (659/622 Hz, un demi-ton) : bien au-dessus de la zone délicate ; la répétition rapide de deux notes voisines est gérée par l'attente note par note (il faut juste que chaque attaque soit détectée ; si le fils enchaîne trop vite, le micro peut rater une attaque → surveiller).
- **L16, L15 et L17 restent longues** (51, 37, 28 notes en dernière étape). Si le fils se lasse, scinder une étape (les ids ne bougent pas, on ajoute des étapes).
- **Reconnaissance** : faire écouter au fils la démo de L14/6, L17/5 et L18/8 : s'il reconnaît « le jeu de briques », « Beethoven » et « les trolls », c'est gagné.

### Révisé : musiques plus modernes

Le parent a jugé les comptines françaises « ringardes » : la 1re version du §10 (Au clair de la lune, Frère Jacques, Ode à la joie à gauche, Ah ! vous dirai-je maman, Au clair de la lune complet, Frère Jacques/Ode en Ré avec Fa♯) est **remplacée** par When the Saints (L10–L11), Korobeïniki (L14–L15), La Lettre à Élise (L17) et Dans l'antre du roi de la montagne (L18). *Joyeux anniversaire* (utile en famille, avancé de L15 à L13), *Jingle Bells* (L16) et les exercices de L12 sont gardés tels quels. Même squelette : main gauche seule → deux mains chacune leur tour → nouvelle installation des mains → position de Sol → premières touches noires (Ré♯, puis Ré♯ + La♯). Tout est du domaine public ; aucun nom de jeu vidéo n'est cité.

### Revue du critique (niveau 2, playlist)

**Mélodies comparées note à note au vrai thème (après transposition) :**
- *When the Saints* (Do, MG) : Do Mi Fa Sol ×2, Do Mi Fa Sol Mi Do Mi Ré, Mi Mi Ré Do Do Mi Sol Sol Fa, Mi Fa Sol Mi Do Ré Do = version standard. ✅ 32 notes, 5 notes Do–Sol, doigté MG correct (g5 Do … g1 Sol), paroles 4/4/8/7 = notes. Ligne 4 sans paroles : bon choix (éditions divergentes).
- *Joyeux anniversaire* : ✅ exact (3/4, Sol pointé-double croche). Domaine public en Europe (Mildred Hill † 1916, Patty Hill † 1946).
- *Korobeïniki* : ✅ A (19) et B (18) identiques à l'air connu, durées = 4 temps par mesure. Tout tient dans « mains côte à côte » sans déplacement. Deux pouces sur touches voisines (Do4 / Ré4) : serré mais faisable pour un enfant de 9 ans (les pouces se touchent) — à observer.
- *Jingle Bells* (Sol) : ✅ refrain exact, paroles d'origine alignées (11/15/14).
- *Lettre à Élise* : ✅ motif M exact avec le doigté réel 5-4-5-4-5-2-4-3-1 ; réponses Mi La Si / Mi Do Si La exactes à la note grave Do₄ près. Simplifications acceptables (reconnaissable dès les 5 premières notes). Omission de « Mi Sol♯ Si Do » : assumée (une seule nouvelle touche noire).
- *Roi de la montagne* : ✅ Si mineur → La mineur (−2 demi-tons) vérifié note par note : Fa♯ Ré Fa♯ → Mi Do Mi, Mi♯ Do♯ Mi♯ → Ré♯ Si Ré♯, Mi Do Mi → Ré La♯ Ré, Si Fa♯ … La → La Mi … Sol. 26 notes.

**Domaine public :** tout est OK (Beethoven † 1827, Grieg † 1907, Pierpont † 1893, airs traditionnels). Précision ajoutée au §10.0.7 pour *Saints* et *Korobeïniki* (l'air seulement, jamais un arrangement de jeu/disque). Aucun nom de jeu vidéo : ✅. Citer « Vive le vent » en L16 n'est qu'une référence de titre (les paroles françaises de Francis Blanche, protégées, ne sont pas utilisées) : OK.

**Doigtés / plages :** chaque note est sous un doigt de la position annoncée ; seuls glissements sur touche noire voisine (4→Ré♯ en L17, 2→Ré♯ et g2→La♯ en L18). Numérotation MG correcte partout. Plages téléphone recalculées : 8, 8, 9, 9, 9, 9, 9, 8, 9 blanches, toutes les notes et `keys` dedans. ✅
**Longueurs :** tous les totaux du §10.3g recomptés : ✅.
**Niveau 1 :** `l01`–`l09` intacts dans la copie de travail (seul changement : ajout de `levels` au niveau du programme). ✅
**`?v=3`** déjà en place dans `index.html`. ✅

**Remarques (non bloquantes) :**
1. L17 installe une nouvelle position (La) sans séquence d'échauffement (9 étapes, plafond atteint) : acceptable car L17/4 n'utilise que les doigts 5 et 4 ; si le fils bute sur L17/5, ajouter une étape « La Si Do Ré Mi et retour ».
2. Le Ré♯ change de doigt entre L17 (doigt 4) et L18 (doigt 2) : le `say` de L18/3 le dit explicitement ✅ ; les bulles le montrent.
3. L18/9 « joue aussi vite que tu peux » : en alternance rapide Ré♯4/Si3 (311/247 Hz) le micro peut rater une attaque → surveiller avec `?debug=1`.
4. La copie de travail contient encore **l'ancienne** version Niveau 2 (Au clair de la lune, Frère Jacques, Fa♯ : `POSITION_RE`, `ACL_RE`, `FJ_RE`, `ODE_RE_*`…) : le développeur doit la remplacer entièrement par les constantes du §10.1 et supprimer les anciennes.
