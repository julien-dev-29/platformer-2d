# Guide capture gameplay

Les slots `capture/*.mp4` affichent un placeholder tant que le fichier
est absent. Pour remplir la vidéo :

## Réglages OBS (gratuit)

- Source : capture de fenêtre (le navigateur sur `npm run dev`)
- Résolution : 1920×1080, 30 fps (comme la vidéo)
- Format d'enregistrement : MP4

## Quoi filmer (nom de fichier → contenu)

| Fichier | Contenu (10-20 s) |
|---|---|
| `placeholders.mp4` | Ancien platformer si dispo, sinon le top-down en disant « avant c'était ça » — optionnel |
| `topdown.mp4` | Déplacement + tir + une roulade à travers un chaser |
| `patterns.mp4` | Survivre 15 s au déluge sans tirer (montre les patterns) |
| `blank-pompe.mp4` | Ouvrir le coffre, vider la pompe, claquer un blank |
| `salles.mp4` | Nettoyer S1 et monter par la porte |
| `boss.mp4` | Phase 3 du boss (le moment le plus spectaculaire) |
| `juice.mp3`… non : `juice.mp4` | Kill au ralenti à 1 vie + hit-stop visible |

Déposez les MP4 dans `public/captures/` et renseignez
`capture: '<fichier>.mp4'` dans `src/chapters.ts`.

Astuce : `npm run dev`, F11 plein écran, masquez le curseur si besoin.
