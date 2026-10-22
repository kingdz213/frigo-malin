# Frigo Malin — site de niche 100 % automatique

Un site de recettes anti-gaspi (« que faire avec … ? ») qui **s'écrit tout seul** :
chaque nuit, un agent IA choisit un sujet, écrit une recette, la vérifie et la publie.
Le site gagne de l'argent avec la publicité (Google AdSense) et les liens affiliés Amazon.

```
GitHub Actions (chaque nuit 04:17 UTC)
  └─ agent/write-page.mjs  → Claude écrit 1 recette → contrôle qualité
  └─ npm test + npm run build → si tout est vert, commit + push
Cloudflare Pages voit le push → reconstruit et met le site en ligne
```

## Ce que TOI seul dois faire, une seule fois (≈ 1 h)

1. **Compte GitHub** (gratuit) → crée un dépôt privé `frigo-malin`, puis pousse ce dossier :
   ```bash
   git remote add origin https://github.com/TON-PSEUDO/frigo-malin.git
   ```
   ```bash
   git push -u origin main
   ```
2. **Clé API Claude** → https://console.anthropic.com → *API Keys* → crée une clé, ajoute 10 € de crédit.
   Dans GitHub : *Settings → Secrets and variables → Actions → New repository secret* :
   nom `ANTHROPIC_API_KEY`, valeur = ta clé. (Coût estimé : quelques centimes par recette.)
3. **Cloudflare Pages** (gratuit) → *Workers & Pages → Create → Pages → Connect to Git* → choisis le dépôt.
   Réglages : *Build command* `npm run build`, *Output directory* `dist`. Le site est en ligne sur `xxx.pages.dev`.
4. **Nom de domaine** (≈ 10 €/an, optionnel au début) → achète-le chez Cloudflare Registrar, branche-le sur le projet Pages,
   puis mets l'adresse dans `site.config.json` → `"url"`.
5. **Google Search Console** → ajoute le site, envoie `https://ton-domaine/sitemap.xml`.
6. **Argent** (quand le site a ~30 pages et un peu de trafic) :
   - Amazon Partenaires (https://partenaires.amazon.fr) → mets ton identifiant dans `"amazonTag"`.
   - Google AdSense → mets ton `ca-pub-…` dans `"adsenseClient"`.
7. Dans GitHub → *Actions* → « Publication quotidienne » → **Run workflow** pour tester une fois.

Ensuite, tu ne fais plus rien. Pour publier plus vite : variable GitHub `PAGES_PER_RUN` = 2 ou 3.

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
