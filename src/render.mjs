// Gabarits HTML du site. Fonctions pures : données en entrée, HTML en sortie.
import { slugify } from "./schema.mjs";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// JSON-LD dans un <script> : on neutralise "</" pour ne jamais fermer la balise.
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const minutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? m % 60 : ""}`.trim() : `${m} min`);

export function layout(config, { title, description, path, body, schema = [] }) {
  const canonical = config.url + path;
  const ads = config.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(config.adsenseClient)}" crossorigin="anonymous"></script>`
    : "";
  return `<!doctype html>
<html lang="${esc(config.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(config.name)}">
<meta name="theme-color" content="#faf6ef">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Inter:wght@400;600&display=swap">
<link rel="stylesheet" href="/style.css">
${ads}
${schema.map(jsonLd).join("\n")}
</head>
<body>
<a class="skip" href="#contenu">Aller au contenu</a>
<header class="top">
  <a class="logo" href="/"><span class="logo-mark" aria-hidden="true">❄</span>${esc(config.name)}</a>
  <nav aria-label="Principal"><a href="/ingredients/">Ingrédients</a><a href="/a-propos/">À propos</a></nav>
</header>
<main id="contenu">
${body}
</main>
<footer class="foot">
  <p><strong>${esc(config.name)}</strong> — ${esc(config.tagline)}</p>
  <p class="small">Certains liens vers des ustensiles sont des liens affiliés : nous touchons une petite commission si tu achètes, sans surcoût pour toi. <a href="/a-propos/">En savoir plus</a>.</p>
</footer>
</body>
</html>
`;
}

// Étiquette d'ingrédient façon « magnet de frigo ».
const chip = (name, i = 0) =>
  `<a class="chip" style="--i:${i}" href="/ingredient/${slugify(name)}/">${esc(name)}</a>`;

function card(r) {
  return `<article class="card">
  <a href="/recette/${r.slug}/">
    <div class="card-tags">${r.mainIngredients.map((n) => `<span>${esc(n)}</span>`).join("")}</div>
    <h3>${esc(r.title)}</h3>
    <p class="meta">${minutes(r.prepMinutes + r.cookMinutes)} · ${esc(r.difficulty)} · ${r.servings} pers.</p>
  </a>
</article>`;
}

export function homePage(config, recipes, ingredients) {
  const body = `
<section class="hero">
  <p class="eyebrow">Anti-gaspi · moins de 30 min</p>
  <h1>Qu'est-ce qu'il te reste dans le frigo&nbsp;?</h1>
  <p class="lead">${esc(config.description)}</p>
  <div class="fridge" aria-label="Choisis un ingrédient">
    ${ingredients.map(([name], i) => chip(name, i)).join("\n    ")}
  </div>
</section>
<section class="section">
  <h2>Dernières idées</h2>
  <div class="grid">${recipes.slice(0, 24).map(card).join("\n")}</div>
</section>`;
  return layout(config, {
    title: `${config.name} — ${config.tagline}`,
    description: config.description,
    path: "/",
    body,
    schema: [
      { "@context": "https://schema.org", "@type": "WebSite", name: config.name, url: config.url, inLanguage: config.lang },
    ],
  });
}

export function ingredientsIndexPage(config, ingredients) {
  const body = `
<section class="section narrow">
  <h1>Tous les ingrédients</h1>
  <p class="lead">Clique sur ce qui traîne dans ton frigo.</p>
  <div class="fridge">${ingredients.map(([name, list], i) => chip(`${name}`, i) + `<span class="count">${list.length}</span>`).join("\n")}</div>
</section>`;
  return layout(config, {
    title: `Recettes par ingrédient | ${config.name}`,
    description: `Toutes nos recettes anti-gaspi classées par ingrédient : trouve quoi cuisiner avec ce que tu as déjà.`,
    path: "/ingredients/",
    body,
  });
}

export function ingredientPage(config, name, recipes) {
  const slug = slugify(name);
  const body = `
<nav class="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › <a href="/ingredients/">Ingrédients</a> › ${esc(name)}</nav>
<section class="section narrow">
  <h1>Que faire avec ${esc(name)}&nbsp;?</h1>
  <p class="lead">${recipes.length} idée${recipes.length > 1 ? "s" : ""} simple${recipes.length > 1 ? "s" : ""} pour utiliser ${esc(name)} avant qu'il ne se perde.</p>
  <div class="grid">${recipes.map(card).join("\n")}</div>
</section>`;
  return layout(config, {
    title: `Que faire avec ${name} ? ${recipes.length} recettes faciles | ${config.name}`,
    description: `${recipes.length} recettes rapides pour cuisiner ${name} : des idées anti-gaspi prêtes en moins de 30 minutes.`,
    path: `/ingredient/${slug}/`,
    body,
    schema: [breadcrumb(config, [["Ingrédients", "/ingredients/"], [name, `/ingredient/${slug}/`]])],
  });
}

function breadcrumb(config, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Accueil", "/"], ...items].map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: config.url + path,
    })),
  };
}

function toolLink(config, tool) {
  if (!config.amazonTag) return `<li>${esc(tool)}</li>`;
  const href = `https://www.amazon.fr/s?k=${encodeURIComponent(tool)}&tag=${encodeURIComponent(config.amazonTag)}`;
  return `<li><a href="${esc(href)}" rel="sponsored nofollow noopener" target="_blank">${esc(tool)}</a> <span class="small">(lien affilié)</span></li>`;
}

export function recipePage(config, r, related) {
  const path = `/recette/${r.slug}/`;
  const total = r.prepMinutes + r.cookMinutes;
  const body = `
<nav class="crumbs" aria-label="Fil d'Ariane"><a href="/">Accueil</a> › ${chip(r.mainIngredients[0])} › <span>${esc(r.title)}</span></nav>
<article class="recipe">
  <header class="recipe-head">
    <div class="card-tags">${r.mainIngredients.map((n) => `<a href="/ingredient/${slugify(n)}/">${esc(n)}</a>`).join("")}</div>
    <h1>${esc(r.title)}</h1>
    <p class="lead">${esc(r.intro)}</p>
    <dl class="ticket">
      <div><dt>Préparation</dt><dd>${minutes(r.prepMinutes)}</dd></div>
      <div><dt>Cuisson</dt><dd>${minutes(r.cookMinutes)}</dd></div>
      <div><dt>Pour</dt><dd>${r.servings} pers.</dd></div>
      <div><dt>Niveau</dt><dd>${esc(r.difficulty)}</dd></div>
    </dl>
  </header>
  <div class="recipe-body">
    <aside class="panel">
      <h2>Ingrédients</h2>
      <ul class="ingredients">${r.ingredients.map((i) => `<li><span>${esc(i.quantity)}</span> ${esc(i.name)}</li>`).join("")}</ul>
      ${r.tools.length ? `<h3>Ustensiles</h3><ul class="tools">${r.tools.map((t) => toolLink(config, t)).join("")}</ul>` : ""}
    </aside>
    <div>
      <h2>Étapes</h2>
      <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${r.tips.length ? `<h2>Astuces anti-gaspi</h2><ul class="tips">${r.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      ${r.variants.length ? `<h2>Il te manque un ingrédient&nbsp;?</h2><ul>${r.variants.map((v) => `<li>${esc(v)}</li>`).join("")}</ul>` : ""}
      ${r.faq.length ? `<h2>Questions fréquentes</h2>${r.faq.map((f) => `<details><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join("")}` : ""}
    </div>
  </div>
</article>
${related.length ? `<section class="section"><h2>Avec les mêmes restes</h2><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;
  return layout(config, {
    title: r.seoTitle,
    description: r.metaDescription,
    path,
    body,
    schema: [
      {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: r.title,
        description: r.metaDescription,
        datePublished: r.datePublished,
        author: { "@type": "Organization", name: config.name },
        prepTime: `PT${r.prepMinutes}M`,
        cookTime: `PT${r.cookMinutes}M`,
        totalTime: `PT${total}M`,
        recipeYield: `${r.servings} personnes`,
        recipeCategory: "Plat",
        keywords: r.mainIngredients.join(", "),
        recipeIngredient: r.ingredients.map((i) => `${i.quantity} ${i.name}`),
        recipeInstructions: r.steps.map((text) => ({ "@type": "HowToStep", text })),
      },
      breadcrumb(config, [[r.mainIngredients[0], `/ingredient/${slugify(r.mainIngredients[0])}/`], [r.title, path]]),
      ...(r.faq.length
        ? [{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: r.faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }]
        : []),
    ],
  });
}

export function aboutPage(config) {
  const body = `
<section class="section narrow prose">
  <h1>À propos de ${esc(config.name)}</h1>
  <p>${esc(config.name)} t'aide à cuisiner ce qu'il te reste au lieu de le jeter. Chaque page part d'un ou deux ingrédients du quotidien et propose une recette simple, rapide, avec des variantes si tu n'as pas tout.</p>
  <h2>Comment les recettes sont écrites</h2>
  <p>Les recettes sont rédigées avec l'aide d'une intelligence artificielle à partir de techniques de cuisine classiques, puis vérifiées automatiquement (temps, quantités, cohérence). Si tu repères une erreur, dis-le-nous.</p>
  <h2>Liens affiliés et publicité</h2>
  <p>Le site est financé par de la publicité et par des liens affiliés vers des ustensiles (programme Partenaires d'Amazon). Si tu achètes via ces liens, nous touchons une petite commission, sans surcoût pour toi. Cela n'influence pas les recettes.</p>
</section>`;
  return layout(config, {
    title: `À propos | ${config.name}`,
    description: `Qui est derrière ${config.name}, comment les recettes sont écrites et comment le site est financé.`,
    path: "/a-propos/",
    body,
  });
}

export function notFoundPage(config) {
  return layout(config, {
    title: `Page introuvable | ${config.name}`,
    description: config.description,
    path: "/404.html",
    body: `<section class="section narrow"><h1>Cette page a fini à la poubelle.</h1><p class="lead">Mais il reste plein d'idées : <a href="/ingredients/">choisis un ingrédient</a>.</p></section>`,
  });
}
