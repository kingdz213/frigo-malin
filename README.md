# Frigo Malin — site de niche 100 % automatique

Un site de recettes anti-gaspi (« que faire avec … ? ») qui **s'écrit tout seul** :
chaque nuit, un agent IA choisit un sujet, écrit une recette, la vérifie et la publie.
Le site gagne de l'argent avec la publicité (Google AdSense) et les liens affiliés Amazon.

En ligne : **https://kingdz213.github.io/frigo-malin/**

```
Routine Claude dans le cloud (chaque nuit 04:17 UTC = 06:17 Bruxelles)
  └─ écrit 1 recette dans content/recettes/, lance les tests, push sur main
GitHub Actions (à chaque push)
  └─ npm test + npm run build → mise en ligne sur GitHub Pages
```

- Routine : https://claude.ai/code/routines/trig_01EX1BApR3szH5CxMUXShZ47 (utilise ton abonnement Claude, pas de clé API).
- Dépôt : https://github.com/kingdz213/frigo-malin (public, nécessaire pour GitHub Pages gratuit).
- Alternative sans routine : mets un secret GitHub `ANTHROPIC_API_KEY`, le workflow lancera `npm run agent` chaque nuit.

## Ce qu'il reste à faire plus tard (toi seul)

1. **Nom de domaine** (≈ 10 €/an, quand le site a ~30 recettes) → GitHub *Settings → Pages → Custom domain*,
   puis mets l'adresse dans `site.config.json` → `"url"`.
2. **Google Search Console** → ajoute le site, envoie `sitemap.xml`.
3. **Argent** (quand il y a du trafic) : Amazon Partenaires → `"amazonTag"` ; Google AdSense → `"adsenseClient"`.

## Commandes

| Commande | Effet |
|---|---|
| `npm install` | installe les dépendances |
| `npm test` | vérifie le build, le SEO de base et le contrôle qualité |
| `npm run build` | construit le site dans `dist/` (sans clé) |
| `npm run agent` | écrit 1 recette (demande `ANTHROPIC_API_KEY`) |

## Fichiers

- `site.config.json` — nom, adresse, identifiants Amazon/AdSense
- `content/recettes/*.json` — une recette = un fichier (écrit par l'agent)
- `content/topics.json` — file des prochains sujets (l'agent la remplit quand elle se vide)
- `src/` — générateur du site (HTML, CSS, sitemap, JSON-LD Recipe/FAQ/Breadcrumb)
- `agent/write-page.mjs` — l'agent IA
- `.github/workflows/publish.yml` — la publication automatique
- `DECISIONS.md` — les choix faits et pourquoi

## Surveiller (2 min par mois, facultatif)

- GitHub → Actions : si un run est rouge, l'agent n'a rien publié ce jour-là (le site reste intact).
- Search Console : pages indexées et clics.
