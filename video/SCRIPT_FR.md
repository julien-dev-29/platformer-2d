# Script voix FR — devlog « D'un rectangle vert au bullet hell »

Durée totale : ~2 min 30. Visez le débit indiqué (mots entre parenthèses).
Enregistrez **un MP3 par chapitre** : `public/voice/<id>.mp3` (ex. `intro.mp3`).
Puis renseignez `voice: '<id>.mp3'` dans `src/chapters.ts` pour chaque chapitre.

Conseils : micro proche, pièce calme, 2-3 prises, gardez la meilleure.
Laissez 0,5 s de silence en début et fin de chaque piste.

---

## 1. intro.mp3 — 10 s (~25 mots)

Un rectangle vert. Quelques sessions plus tard : un bullet hell psychédélique,
avec boss, blank et fusil à pompe. Voici comment ce jeu a été construit,
étape par étape.

## 2. placeholders.mp3 — 15 s (~40 mots)

Tout commence avec des placeholders : des formes générées en code,
aucun asset à dessiner. Un joueur vert, des pièces jaunes, un platformer
minimal. La règle : si c'est amusant avec des rectangles, les graphismes
ne feront qu'amplifier.

## 3. topdown.mp3 — 20 s (~50 mots)

Le virage : fini le platformer, direction le twin-stick façon
Enter the Gungeon. Gravité à zéro, déplacement ZQSD, tir vers la souris,
roulade d'esquive avec invincibilité, et rechargement au chargeur.
Le socle du jeu est posé.

## 4. patterns.mp3 — 20 s (~50 mots)

Ensuite, les ennemis ripostent : tir visé, salve de trois, double anneau,
puis spirale continue en fond. Balles teintées, halo lumineux, fond qui
dérive. Le bullet hell est né — et la roulade devient vitale.

## 5. blank-pompe.mp3 — 20 s (~50 mots)

Deux mécaniques cultes : le blank, qui efface tout l'écran en cas de
panique, et un coffre qui cache un fusil à pompe à cinq plombs. Risque,
récompense, et ce petit clic satisfaisant à chaque tir.

## 6. salles.mp3 — 15 s (~40 mots)

Une arène, c'est court. Trois salles en enfilade, une porte qui s'ouvre
au nettoyage, une vie et un blank bonus entre chaque. Un run a désormais
un début, un milieu, et une fin.

## 7. boss.mp3 — 20 s (~50 mots)

Le final : le Grand Mage. Vingt-quatre points de vie, trois phases qui
changent ses patterns et sa couleur, des renforts, une barre de vie.
Le test final de tout ce que le joueur a appris.

## 8. juice.mp3 — 20 s (~50 mots)

Enfin, le feeling : freeze de soixante millisecondes à chaque kill, ralenti
à un point de vie, particules, et une bande-son entièrement synthétisée
en WebAudio. Aucun fichier audio : que du code.

## 9. outro.mp3 — 10 s (~25 mots)

Rectangle vert, bullet hell. Le jeu tourne dans le navigateur.
À toi de jouer — et surtout, de rouler.
