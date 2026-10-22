// Agent quotidien : choisit un sujet, écrit une recette avec Claude, la vérifie,
// l'enregistre dans content/recettes/. Lancé chaque nuit par GitHub Actions.
// Usage : ANTHROPIC_API_KEY=... npm run agent      (PAGES_PER_RUN=1 par défaut)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import { Recipe, RecipeDraft, slugify } from "../src/schema.mjs";
import { loadRecipes } from "../src/build.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const recipesDir = path.join(root, "content/recettes");
const topicsFile = path.join(root, "content/topics.json");
const MODEL = "claude-opus-5-5";

const SYSTEM = `Tu écris pour « Frigo Malin », un site belge francophone de recettes anti-gaspi.
Lecteur : quelqu'un qui ouvre son frigo le soir et veut cuisiner ce qui reste, vite, sans courses.
Règles :
- Recettes réalistes et faisables, techniques classiques, quantités précises, temps honnêtes (total ≤ 45 min).
- Ingrédients courants en Belgique ; placard de base supposé (sel, poivre, huile, beurre, farine, oignon, ail).
- Ton simple et chaleureux, tutoiement, phrases courtes. Pas de superlatifs creux, pas d'emojis.
- Aucune allégation santé ou médicale. Sécurité alimentaire correcte (cuisson des œufs, volaille, restes).
- 6 à 10 ingrédients, 4 à 8 étapes, 2 à 4 astuces, 2 à 3 variantes, 2 à 4 questions FAQ utiles.`;

let client; // créé à la demande : les tests importent ce fichier sans clé API

// Appel Claude avec sortie structurée validée par Zod.
async function ask(schema, prompt) {
  client ??= new Anthropic();
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: zodOutputFormat(schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (res.stop_reason === "refusal") throw new Error(`Refus du modèle : ${res.stop_details?.explanation ?? "?"}`);
  if (!res.parsed_output) throw new Error(`Sortie illisible (stop_reason=${res.stop_reason})`);
  return res.parsed_output;
}

// Remplit la file de sujets quand elle se vide.
async function refillTopics(topics, existing) {
  const done = existing.map((r) => r.mainIngredients.join(" et "));
  const { topics: fresh } = await ask(
    z.object({ topics: z.array(z.string()) }),
    `Propose 30 nouvelles combinaisons de restes du frigo que les gens cherchent sur Google
sous la forme « que faire avec X » ou « que faire avec X et Y » (1 à 2 ingrédients du quotidien).
Varie : légumes, féculents, produits laitiers, œufs, pain rassis, restes de viande cuite, fruits trop mûrs.
Réponds avec juste les ingrédients, ex. « courgette et riz », « pain rassis ».
Déjà traités, à éviter : ${[...done, ...topics].join(" ; ") || "aucun"}.`
  );
  const seen = new Set([...done, ...topics].map(slugify));
  return [...topics, ...fresh.filter((t) => !seen.has(slugify(t)))];
}

// Contrôles qualité en plus du schéma : une page faible ne doit pas être publiée.
export function qualityProblems(d) {
  const problems = [];
  if (d.mainIngredients.length < 1 || d.mainIngredients.length > 3) problems.push("1 à 3 ingrédients principaux");
  if (d.ingredients.length < 4) problems.push("au moins 4 ingrédients");
  if (d.steps.length < 3) problems.push("au moins 3 étapes");
  const total = d.prepMinutes + d.cookMinutes;
  if (total <= 0 || total > 60) problems.push("temps total entre 1 et 60 min");
  if (d.servings < 1 || d.servings > 8) problems.push("1 à 8 personnes");
  if (d.seoTitle.length > 70) problems.push("seoTitle trop long");
  if (d.metaDescription.length < 70 || d.metaDescription.length > 170) problems.push("metaDescription 70-170 caractères");
  return problems;
}

export function uniqueSlug(title, taken) {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

async function writeOne() {
  const existing = loadRecipes(recipesDir);
  let topics = fs.existsSync(topicsFile) ? JSON.parse(fs.readFileSync(topicsFile, "utf8")) : [];
  if (topics.length < 5) topics = await refillTopics(topics, existing);
  const topic = topics.shift();
  if (!topic) throw new Error("Aucun sujet disponible");

  const draft = await ask(
    RecipeDraft,
    `Écris la meilleure recette pour la recherche « que faire avec ${topic} ».
Les ingrédients principaux (mainIngredients) doivent être ceux de la recherche.
Titres déjà publiés (pour varier) : ${existing.slice(0, 40).map((r) => r.title).join(" ; ") || "aucun"}.`
  );
  draft.mainIngredients = draft.mainIngredients.map((i) => i.trim().toLowerCase());

  const problems = qualityProblems(draft);
  if (problems.length) throw new Error(`Recette refusée (${topic}) : ${problems.join(", ")}`);

  const recipe = Recipe.parse({
    ...draft,
    slug: uniqueSlug(draft.title, new Set(existing.map((r) => r.slug))),
    datePublished: new Date().toISOString().slice(0, 10),
  });
  fs.writeFileSync(path.join(recipesDir, `${recipe.slug}.json`), JSON.stringify(recipe, null, 2) + "\n");
  fs.writeFileSync(topicsFile, JSON.stringify(topics, null, 2) + "\n");
  console.log(`Publiée : /recette/${recipe.slug}/  (sujet : ${topic})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = Number(process.env.PAGES_PER_RUN ?? 1);
  for (let i = 0; i < count; i++) await writeOne();
}
