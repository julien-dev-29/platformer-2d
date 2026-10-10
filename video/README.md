# Devlog vidéo — Remotion

Vidéo « D'un rectangle vert au bullet hell » : 1080p30, ~2 min 30,
9 chapitres. Preview possible **sans** voix ni captures (placeholders).

## Commandes (dans `video/`)

```bash
npm install
npm start          # studio Remotion : preview + édition
npm run render     # out/devlog.mp4 (télécharge Chrome ~150 Mo la 1re fois)
```

## Ajouter la voix

1. Enregistrez les 9 pistes (voir `SCRIPT_FR.md`) → `public/voice/*.mp3`
2. Dans `src/chapters.ts`, ajoutez `voice: 'intro.mp3'` (etc.) par chapitre

## Ajouter les captures

1. Filmez selon `GUIDE_CAPTURE.md` → `public/captures/*.mp4`
2. Dans `src/chapters.ts`, ajoutez `capture: 'boss.mp4'` (etc.) par chapitre

## Structure

- `src/chapters.ts` — données : titres, durées, narration, code, voix, captures
- `src/Scene.tsx` — mise en page animée (fond psy, code highlight, sous-titres)
- `src/Main.tsx` — enchaînement des 9 séquences
