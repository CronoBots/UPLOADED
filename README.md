# Uploaded

Site de **Uploaded** (uploaded.be) — Vincent Buron, développeur web
indépendant à Neupré près de Liège. Un site web qui vous ressemble, fait par une
seule personne : sites web pour indépendants et artistes, applications mobiles.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil, monde obsidienne : qui (Vincent), le travail (carrousel), ce que je fais, la méthode, le budget, les engagements, les questions, le contact. SEO + JSON-LD |
| `creation-site-web-liege.html` | Page SEO locale — Liège & Neupré |
| `creation-site-web-seraing.html` | Page SEO locale — Seraing, Boncelles, Jemeppe, Ougrée |
| `creation-site-web-huy.html` | Page SEO locale — Huy, Amay, Wanze, Condroz |
| `creation-site-web-namur.html` | Page SEO locale — Namur, Jambes, Bouge, province |
| `creation-application-mobile-belgique.html` | Page SEO — application mobile iOS & Android |
| `blog.html` + `blog/*.html` | Blog — 3 articles de fond (prix, WordPress vs sur mesure, référencement local) |
| `mentions-legales.html` · `conditions-generales.html` · `politique-confidentialite.html` · `politique-cookies.html` | Pages légales |
| `home.css` / `home.js` | Thème et script de l'accueil (autonomes) |
| `styles.css` + `page-theme.css` | Thème des pages SEO et légales (`page-theme.css` chargée après : surcharge obsidienne) |
| `fonts.css` + `fonts/*.woff2` | Bricolage Grotesque, Libre Franklin, Spline Sans Mono, auto-hébergées |
| `cookies.js` | Bandeau et préférences cookies |
| `img/*.webp` | Captures des réalisations et portrait |
| `logo.svg` · `logo-mark.svg` · `logo-mono.svg` | Logo : lockup complet, signe seul, version monochrome — texte vectorisé en Bricolage Grotesque 700 |
| `favicon.svg` · `og-image.png` | Icône et image de partage |
| `CNAME` · `robots.txt` · `sitemap.xml` | Domaine et référencement |

## Optimisations intégrées

- **Zéro requête tierce** : polices auto-hébergées, aucun script externe. Aucune donnée visiteur envoyée à un tiers au chargement.
- **Léger** : ~200 Ko et 14 requêtes pour l'accueil, FCP ≈ 0,36 s en local, CLS 0.
- **Accessible** : 0 violation axe-core sur les 10 pages, contrastes AA, focus visibles, `prefers-reduced-motion`.
- **SEO** : meta, Open Graph, canonical, sitemap, données structurées (`ProfessionalService`,
  `Person`, `Service`, `OfferCatalog`, `FAQPage`, `BlogPosting`, `Blog`, `BreadcrumbList`).

## Lancer en local

Aucune dépendance, aucun build. Ouvrez `index.html` dans un navigateur, ou servez
le dossier :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement

Hébergé sur **GitHub Pages** (workflow `.github/workflows/deploy-pages.yml`), avec
le domaine personnalisé `uploaded.be` (fichier `CNAME`). Hébergeable tel quel
sur n'importe quel hébergement statique (Netlify, Cloudflare Pages…).

## Formulaire de contact

Le formulaire de l'accueil poste en AJAX vers **FormSubmit** (`data-endpoint` du
`<form id="contact-form">`), sans quitter la page. Si l'envoi échoue, un repli propose WhatsApp avec le message déjà rédigé : aucune adresse e-mail n'est écrite sur l'accueil, pour ne rien donner aux robots à spam. L'adresse `contact@uploaded.be` figure dans les pages légales, où le Code de droit économique l'impose, et dans les données structurées. Le champ « Type de projet » est transmis
avec le message pour qualifier la demande d'emblée.

## Tarifs affichés

Les montants apparaissent à quatre endroits — section « Le budget » de l'accueil, bloc budget
des pages locales, tableaux du blog, et `OfferCatalog` du JSON-LD de `index.html`. Ce sont des
**ordres de grandeur**, pas une grille : le devis reste ferme, détaillé et individuel.

| Prestation | Montant affiché |
|---|---|
| Une seule page (landing) | à partir de 690 € |
| Site vitrine, 5 à 10 pages | 1 400 – 2 800 € |
| Boutique ou réservation | à partir de 2 900 € |
| Formule Essentielle | 39 €/mois ou 429 €/an (un mois offert) : hébergement, domaine, e-mail pro, sécurité, maintenance, mises à jour |
| Formule Complète | 59 €/mois ou 649 €/an (un mois offert) : Essentielle + avis Google en direct, réponses automatiques, mur social, tableau de bord |

Pour les modifier, chercher ces montants dans `index.html`, les trois `creation-site-web-*.html`
et `blog/prix-site-web-belgique.html`, sans oublier le `OfferCatalog` en tête de `index.html`.

## Points ouverts

- Pas de témoignages ni de logos clients : rien n'est publié tant que les avis ne sont pas réels.
- Les montants ci-dessus sont des ordres de grandeur de marché : à confirmer par Vincent.
- Français uniquement, par choix.
