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
| `illus` | info | non | id d'illustration SVG : `posture`, `bubbleHand`, `fingerNumbers`, `repeatNote`, `cPosition`, `thumbUnder`, `leftThumb` |
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
