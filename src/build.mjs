// Construit le site statique dans dist/ à partir de content/recettes/*.json.
// Usage : npm run build   (aucune clé requise)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Recipe, slugify } from "./schema.mjs";
import * as html from "./render.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadRecipes(dir = path.join(root, "content/recettes")) {
  const recipes = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const parsed = Recipe.safeParse(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
      // Un fichier invalide casse le build : mieux vaut ne rien publier que publier une page cassée.
      if (!parsed.success) throw new Error(`Recette invalide ${f} : ${parsed.error.message}`);
      return parsed.data;
    });
  return recipes.sort((a, b) => b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug));
}

// { "courgette": [recette, ...], ... } trié par nombre de recettes.
export function groupByIngredient(recipes) {
  const map = new Map();
  for (const r of recipes) for (const ing of r.mainIngredients) map.set(ing, [...(map.get(ing) ?? []), r]);
  return [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}

// Recettes qui partagent au moins un ingrédient principal (maillage interne).
function related(recipe, recipes, n = 3) {
  return recipes
    .filter((r) => r.slug !== recipe.slug)
    .map((r) => [r, r.mainIngredients.filter((i) => recipe.mainIngredients.includes(i)).length])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([r]) => r);
}

export function build({ out = path.join(root, "dist"), recipes = loadRecipes() } = {}) {
  const config = JSON.parse(fs.readFileSync(path.join(root, "site.config.json"), "utf8"));
  const ingredients = groupByIngredient(recipes);
  const imgDir = path.join(root, "src/img");
  html.setImages(new Set(fs.existsSync(imgDir) ? fs.readdirSync(imgDir).map((f) => f.replace(/\.webp$/, "")) : []));
  const pages = new Map([
    ["/", html.homePage(config, recipes, ingredients)],
    ["/ingredients/", html.ingredientsIndexPage(config, ingredients)],
    ["/a-propos/", html.aboutPage(config)],
  ]);
  for (const r of recipes) pages.set(`/recette/${r.slug}/`, html.recipePage(config, r, related(r, recipes)));
  for (const [name, list] of ingredients) pages.set(`/ingredient/${slugify(name)}/`, html.ingredientPage(config, name, list));

  // Site servi dans un sous-dossier (ex. GitHub Pages /frigo-malin) : on préfixe les liens internes.
  const base = new URL(config.url).pathname.replace(/\/$/, "");
  const withBase = (page) => page.replace(/(href|src)="\//g, `$1="${base}/`);

  fs.rmSync(out, { recursive: true, force: true });
  for (const [url, content] of pages) write(out, url + "index.html", withBase(content));
  write(out, "/404.html", withBase(html.notFoundPage(config)));
  fs.copyFileSync(path.join(root, "src/style.css"), path.join(out, "style.css"));
  fs.copyFileSync(path.join(root, "src/favicon.svg"), path.join(out, "favicon.svg"));
  if (fs.existsSync(imgDir)) fs.cpSync(imgDir, path.join(out, "img"), { recursive: true });

  const lastmod = (url) => recipes.find((r) => url === `/recette/${r.slug}/`)?.datePublished ?? recipes[0]?.datePublished;
  write(out, "/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.keys()].map((u) => `  <url><loc>${config.url}${u}</loc>${lastmod(u) ? `<lastmod>${lastmod(u)}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`);
  write(out, "/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);
  return { pages: pages.size, recipes: recipes.length, ingredients: ingredients.length };
}

function write(out, url, content) {
  const file = path.join(out, url);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const stats = build();
  console.log(`Site construit : ${stats.pages} pages (${stats.recipes} recettes, ${stats.ingredients} ingrédients) -> dist/`);
}
