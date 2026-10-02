# Expérience « film piloté par le scroll »

Landing page où la molette ou le doigt font avancer et reculer une vidéo.
GSAP + ScrollTrigger, HTML/CSS/JS sans framework.

En ligne : https://uploaded.be/experience/ (non indexée, non liée depuis le site).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure : la scène épinglée, la vidéo, les quatre chapitres (hero, story, feature, final) |
| `style.css` | Mise en page, typographie, responsive, mode statique (réduire les animations) |
| `script.js` | Épinglage ScrollTrigger, timeline des textes, pilotage de la vidéo par `requestAnimationFrame` |
| `vendor/` | `gsap.min.js` et `ScrollTrigger.min.js` 3.15, auto-hébergés (licence standard gratuite de GSAP) |
| `media/hero.mp4` · `hero.webm` | Vidéo paysage 1280 × 720, 8 s |
| `media/hero-mobile.mp4` · `.webm` | Vidéo portrait 720 × 1280 pour les téléphones |
| `media/poster*.jpg` | Première image (avant chargement) et image finale (mode statique) |

Les polices et le logo viennent du site (`/fonts`, `/img`) : servez le dossier
racine du dépôt, pas seulement `experience/`.

## Lancer en local

Un serveur qui gère les requêtes « Range » est indispensable : sans elles, le
navigateur ne peut pas sauter dans la vidéo et elle reste figée sur la
première image. `python3 -m http.server` ne les gère pas.

```bash
cd UPLOADED                  # racine du dépôt
npx http-server -p 8080 -c-1 .
# puis ouvrir http://localhost:8080/experience/
```

Autre option : l'extension « Live Server » de VS Code, ouverte à la racine du dépôt.

## Remplacer la vidéo

La vidéo actuelle est provisoire (particules qui forment le logo). Pour mettre la
vôtre, gardez les mêmes noms de fichiers dans `media/` et encodez-la **en
images-clés uniquement** : chaque image se décode seule, le navigateur peut donc
sauter n'importe où sans saccade.

```bash
# paysage
ffmpeg -i source.mov -vf "scale=1280:-2,fps=30" -c:v libx264 -g 1 -crf 26 \
  -preset slow -pix_fmt yuv420p -movflags +faststart -an media/hero.mp4
ffmpeg -i media/hero.mp4 -c:v libvpx-vp9 -g 1 -crf 44 -b:v 0 -an media/hero.webm
# portrait (téléphones)
ffmpeg -i source-portrait.mov -vf "scale=720:-2,fps=30" -c:v libx264 -g 1 -crf 26 \
  -preset slow -pix_fmt yuv420p -movflags +faststart -an media/hero-mobile.mp4
ffmpeg -i media/hero-mobile.mp4 -c:v libvpx-vp9 -g 1 -crf 44 -b:v 0 -an media/hero-mobile.webm
# première et dernière image
ffmpeg -i media/hero.mp4 -frames:v 1 media/poster.jpg
ffmpeg -sseof -0.05 -i media/hero.mp4 -frames:v 1 media/poster-final.jpg
```

Gardez la vidéo courte (5 à 10 s) et sans son : sa durée est simplement étirée
sur les quatre écrans de défilement.

## Réglages

Dans `script.js` :

- `end: "+=400%"` : longueur du film en hauteurs d'écran ;
- `SMOOTH` : douceur du suivi de la vidéo (0,08 très doux, 0,3 très réactif) ;
- les positions de la timeline (`0.15`, `0.27`…) : moment où chaque texte
  apparaît, en fraction du film.

## Comportement

- **Desktop et mobile :** même film. Sur téléphone (écran en portrait), la vidéo
  portrait est chargée et les textes sont recentrés. Sur iOS, la vidéo est
  « réveillée » au premier toucher pour pouvoir être positionnée.
- **Vidéo indisponible :** un halo bleu qui grandit avec le scroll la remplace ;
  les textes et le final restent identiques.
- **Réduire les animations,** JavaScript ou GSAP absents : pas d'épinglage ni
  de vidéo, l'image finale en fond et les textes lus dans l'ordre.
