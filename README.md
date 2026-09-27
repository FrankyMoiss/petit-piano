# Petit Piano 🎹

Une petite application pour apprendre le piano à la maison, sur un **vrai piano (acoustique)**.
La tablette ou le téléphone est posé sur le pupitre : l'appli **écoute avec le micro** et avance quand la bonne note est jouée.

Version 1 : le parcours de votre fils (9 leçons, du clavier jusqu'à « Frère Jacques » en entier).
Le mode « petit » pour votre fille viendra dans une prochaine version.

## Lancer l'appli sur l'ordinateur

1. Ouvrez le **Terminal** (Applications › Utilitaires › Terminal).
2. Tapez ces deux lignes (Entrée après chacune) :
   ```
   cd chemin/vers/le/dossier/Simply
   python3 -m http.server 8000
   ```
3. Ouvrez **Chrome** ou **Safari** à l'adresse : **http://localhost:8000**
4. Pour arrêter : revenez dans le Terminal et appuyez sur `Ctrl` + `C`.

La première fois, l'appli demande le prénom, puis l'accès au **micro** : cliquez sur « Autoriser ».
Elle écoute ensuite 2 secondes de silence, puis vous demande de jouer 3 notes (cela sert aussi à mesurer l'accordage du piano).

Pas de micro ? Choisissez « Jouer sans micro (avec l'écran) » : on joue alors en touchant le clavier dessiné à l'écran.

## Sur l'iPad / la tablette : à faire plus tard ⚠️

Les navigateurs n'autorisent le micro que sur une adresse **sécurisée** (`https://…`) ou sur `localhost` (l'ordinateur lui-même).
Ouvrir `http://192.168.x.x:8000` depuis l'iPad **ne fonctionnera pas** pour le micro.
Il faudra donc **héberger l'appli en https** (par exemple GitHub Pages ou Netlify, gratuits : ce ne sont que des fichiers).
On s'en occupera à l'étape suivante.

## Coin des parents

Sur la carte des leçons, **appui long (2 secondes) sur ⚙** :
changer le prénom, refaire le test du micro, passer en mode écran, lecture des consignes à voix haute,
**débloquer toutes les leçons**, tout réinitialiser.

## Plusieurs téléphones (papa, maman…)

La progression peut être partagée entre les téléphones de la famille.
Sur le téléphone où votre enfant a déjà joué : **⚙ (appui long) › Plusieurs téléphones › Créer un code famille**, puis **Partager le code**.
Sur l'autre téléphone : ouvrez Petit Piano, puis **« J'ai déjà un code famille »** (écran d'accueil) ou la même section du coin des parents.
Ensuite tout se synchronise seul (au démarrage, au retour dans l'appli, au retour du réseau, après chaque leçon). Sans réseau, l'appli marche comme avant.
Gardez ce code entre parents : il permet aussi de tout récupérer sur un nouveau téléphone.

## Si l'appli n'entend pas bien le piano

- Rapprochez la tablette du piano, jouez un peu plus fort, coupez la télé.
- Refaites le test du micro depuis le coin des parents.
- Pour voir ce que le micro entend (fréquence, note, niveau), ajoutez `?debug=1` à l'adresse :
  http://localhost:8000/?debug=1

La progression (étoiles, leçons faites) est enregistrée **dans le navigateur de l'appareil**.

---

## Pour les développeurs

- Application web statique, sans étape de compilation : `index.html`, `css/`, `js/` (scripts classiques).
- La spécification complète est dans `DESIGN.md`.
- Tests (Node.js) :
  ```
  node tests/pitch.test.js       # détection de hauteur (YIN) sur des sons de piano synthétiques
  node tests/onset.test.js       # « une frappe = une note » (Do Do Do, notes tenues, legato…)
  node tests/curriculum.test.js  # cohérence des données des leçons
  ```
