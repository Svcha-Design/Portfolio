# Mini Games — Party Quiz

Petit jeu de quiz a jouer en live entre potes : un ecran "hote" (laptop/TV)
affiche les questions, chacun repond depuis son telephone en rejoignant
avec un code de room. Le scoring recompense la rapidite (comme Kahoot).

## Lancer le jeu

```bash
cd games
npm install
npm start
```

Le serveur tourne sur `http://localhost:3000`.

- Sur l'ecran principal : ouvrir `http://localhost:3000/host.html`
- Sur chaque telephone : ouvrir `http://<IP-du-host>:3000/player.html`
  (il faut etre sur le meme reseau, ou deployer le serveur en ligne pour
  jouer a distance)

## Comment ca marche

- `server.js` : serveur Express + Socket.io, gere les rooms et la logique
  de jeu (questions, timer, scoring, classement).
- `rooms.js` : etat en memoire des parties (pas de base de donnees, une
  partie vit tant que le process tourne).
- `questions.js` : banque de questions du quiz.
- `public/` : les pages (accueil, hote, joueur) en HTML/JS/CSS vanilla.

## Ajouter un autre mini-jeu plus tard

Pour l'instant il n'y a qu'un jeu (le quiz). Si on veut en ajouter
d'autres, l'etape naturelle sera d'ajouter un ecran de choix de jeu cote
hote et d'isoler la logique de chaque jeu dans son propre module (sur le
modele de `questions.js` + la portion "question/reveal" de `server.js`).
