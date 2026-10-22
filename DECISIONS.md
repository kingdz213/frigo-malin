# Décisions — Frigo Malin (business n°1, 22/10/2026)

| Décision | Pourquoi |
|---|---|
| Niche : recettes anti-gaspi « que faire avec X (et Y) ? » | Recherche réelle et récurrente, contenu que l'IA écrit bien sans inventer de faits risqués, programmatique (des milliers de combinaisons), liens affiliés naturels (ustensiles). |
| Public belge francophone (`fr-BE`, chicon, etc.) | Moins de concurrence que la France, et l'utilisateur est en Belgique. |
| Site statique maison (Node, zéro framework) | Le plus simple et rapide possible : pas de serveur, Lighthouse élevé, hébergement gratuit. |
| GitHub Actions + Cloudflare Pages | 100 % automatique, gratuit, tourne sans PC allumé ni VPS. |
| Claude Opus 5.5 (`claude-opus-5-5`), effort `medium`, sortie structurée Zod | Qualité de rédaction ; le schéma garantit un JSON valide. Pas de fallback serveur ajouté (recettes = pas de refus attendus) : un refus fait juste échouer le run du jour. |
| Contrôle qualité + tests avant chaque publication | Une page faible ou un build cassé n'est jamais mis en ligne. |
| JSON-LD Recipe + FAQPage + BreadcrumbList, sitemap, canonical | Résultats enrichis Google (étoiles/temps) = plus de clics. |
| Pages « ingrédient » auto-générées | Maillage interne + pages qui ciblent « que faire avec X ». |
| Animations sans opacité 0 | Le contenu reste visible pour Google et si l'animation ne joue pas. |
| Pas de photos pour l'instant | Pas de photos réelles disponibles ; design typographique. Option : photos Unsplash libres de droits ou génération d'images par recette (à ajouter plus tard). |
| Mention IA + affiliation sur « À propos » et en pied de page | Transparence (règles Google sur le contenu IA, obligation UE pour l'affiliation). |
