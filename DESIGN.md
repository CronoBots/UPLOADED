# Design

## Direction

**Studio obsidienne — réseau vivant**, le monde du client. La structure en trois écrans du brief d'origine s'est élargie pour répondre aux trois questions que le visiteur se posait sans trouver de réponse — ce que je vends, comment ça se passe, combien ça coûte — sans changer ni le monde ni le rythme. Une scène obsidienne filmée dans le noir : une constellation de nœuds reliés en 3D (Canvas temps réel) qui respire et réagit au visiteur, l'accent bleu du logo, les vitrines de verre, le carrousel des réalisations, la signature en particules — la flèche du logo. Aucune requête tierce. Tout respecte `prefers-reduced-motion`.

## Logo

**uploaded.be**, fourni par le client (source : `img/logo-uploaded-source.png`).
Lettres rondes et épaisses en blanc ; le « l » et le « o » forment un bouton
d'alimentation, dont la barre est bleue, comme le point du « .be ». Signature
en capitales : « Création de sites web · Applications mobiles · Référencement ».
Le nom est aussi l'adresse. Déclinaisons :
`img/logo-uploaded.webp` (mot seul, menus et pied de page),
`img/logo-uploaded-full.webp` (avec signature), `og-image.png` (partage),
`favicon.svg` et `apple-touch-icon.png` (le bouton seul, sur bleu nuit).

La couleur d'accent du site est le bleu du logo, `#4884D8`, et toute la gamme
en dérive.

| Rôle | Token | Valeur |
|---|---|---|
| Bleu nuit (fond) | `--bg` | `#0A0D16` |
| Panneau, verre | `--panel` `--glass` | `#12161F` · `rgba(18,22,31,.62)` |
| Encre claire chaude | `--ink` | `#F2EEE6` |
| Secondaire | `--ink-soft` | `#9AA2B4` |
| Bleu du logo — grand affichage, fills | `--heat` | `#4884D8` |
| Bleu profond — liens, connexions | `--heat-2` | `#3B6FC4` |
| Cœur clair | `--heat-core` | `#A9C8F5` |
| Petit texte bleu (8,2:1) | `--heat-txt` | `#7FAAEE` |

## Typographie

- **Bricolage Grotesque** (`--f-display`) — titres, wordmark, chiffres.
- **Libre Franklin** (`--f-body`) — corps, boutons.
- **Spline Sans Mono** (`--f-mono`) — folios, étiquettes, téléphone.
Toutes auto-hébergées (`fonts.css`, `fonts/*.woff2`).

## Accueil (`index.html` + `home.css` + `home.js`)

1. **Qui** — scène obsidienne plein écran, réseau de nœuds 3D derrière le titre *Un site web qui vous ressemble, fait par une seule personne.*, portrait à droite (vignette au-dessus du titre sur mobile), deux pastilles (Sites web, Applications), bouton magnétique + téléphone, faits 25 / 1 / 24 h.
2. **Le travail** — carrousel « vitrine » (maquette ordinateur + téléphone, rotation auto, parallaxe) avec Jayden, Pizzeria Pino, Yuméa, Toukin ; sous le carrousel, trois vitrines de verre (sur mesure, un seul interlocuteur, et après). Puis le moment signature : les particules se reforment en la flèche du logo.
3. **Ce que je fais** (II) — **l'orbite** : six nœuds sur un anneau autour d'un cœur « Vincent · un seul interlocuteur », et un panneau de détail qui change au clic. Chaque nœud est un `<button>` (clavier, `aria-pressed`), le panneau est en `aria-live`. Rotation automatique de 4,2 s tant que le visiteur n'a rien touché, arrêtée dès le premier clic et jamais lancée sous `prefers-reduced-motion`. Deux nœuds portent un lien vers les pages SEO, un troisième vers le budget. Composant porté depuis le dépôt SECR3TLY et retokenisé sur l'obsidienne.
4. **La méthode** (III) — quatre cartes `.route-step` reliées par un filet horizontal qui rappelle les arêtes du réseau de fond ; chacune porte son délai en mono.
5. **Le budget** (IV) — trois vitrines de verre `.tier`, celle du milieu marquée « le plus demandé » (bordure chaude + `--bloom`) ; dessous, trois `.bnote` à filet gauche (après la mise en ligne, pourquoi pas moins cher, payer en plusieurs fois).
6. **Les engagements** (V) — six cartes `.pledge` en grille 3×2, pastille ronde à coche, formulées pour être vérifiables plutôt que promises (domaine à votre nom, prix ferme, validation avant code, pas d'abonnement obligatoire, sortie libre, réponse sous 24 h).
7. **Questions** (VI) — huit `<details>` `.qa-item`, accordéon natif sans JS, indicateur « + » qui pivote.
8. **Le contact** (VII) — formulaire nom / e-mail / téléphone / message, envoi AJAX, repli e-mail ; à côté, téléphone, WhatsApp, adresse.

Le moment signature reste entre les questions et le contact. La numérotation des folios court désormais de I à VII.

Motion : réseau vivant (parallaxe souris, nœud illuminé sous le curseur, pause hors viewport), révélations « la chaleur qui monte », boutons magnétiques, signature qui se trace, fil de progression à gauche, halo au curseur. Tout se fige sous `prefers-reduced-motion`.

## Pages de service, pages locales, blog et légales

`styles.css` + `page-theme.css` (surcharge obsidienne, chargée après) : mêmes tokens, même typo, hero à champ de points, cartes verre, accent bleu.

- **Pages de service et locales** : application mobile, puis Liège, Seraing, Huy et Namur. Même gabarit (hero, `highlights-grid`, cartes métiers, bloc budget, méthode en 4 étapes, FAQ, liens croisés), mais un texte réellement distinct par ville — jamais la même page avec le nom changé.
- **Blog** (`blog.html` + `blog/*.html`) : liste en cartes `.post-card`, article en colonne de lecture de 720 px (`.post`), encadrés `.post-aside` à filet bleu, tableaux `.post-table` à en-têtes mono, bloc de fin `.post-cta`. Styles ajoutés en fin de `page-theme.css`.
- Les liens en plein texte sont soulignés : sans cela, ils ne se distinguaient que par la couleur (WCAG 1.4.1).

## Ce qui n'existe plus

Le Labo et ses cinq outils, les pages crypto / IA / bots, le multilingue. Les sections thèse / artisan / champ de l'ancien accueil ; en revanche `.field-list` et `.qa`, restées dans `home.css`, resservent aux nouvelles sections « Ce que je fais » et « Questions ». Les essais clair / verre liquide / Slate-Mint ont été abandonnés à la demande du client, qui préfère son monde d'origine.
