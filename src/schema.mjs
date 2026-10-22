// Format d'une recette. Une seule définition, utilisée par l'agent (génération)
// et par le build (validation des fichiers content/recettes/*.json).
import { z } from "zod/v4";

// Ce que le modèle IA doit produire.
export const RecipeDraft = z.object({
  title: z.string().describe("Titre H1 naturel, ex. « Gratin de courgettes au riz, prêt en 25 min »"),
  seoTitle: z.string().describe("Balise title, 50 à 60 caractères, mot-clé principal au début"),
  metaDescription: z.string().describe("120 à 155 caractères, honnête et donnant envie"),
  mainIngredients: z.array(z.string()).describe("1 à 3 ingrédients principaux, au singulier, en minuscules (ex. « courgette », « riz »)"),
  intro: z.string().describe("2 à 3 phrases : pour qui, quand, pourquoi c'est malin"),
  prepMinutes: z.number().int(),
  cookMinutes: z.number().int(),
  servings: z.number().int(),
  difficulty: z.enum(["facile", "moyen"]),
  ingredients: z.array(z.object({ quantity: z.string(), name: z.string() })),
  steps: z.array(z.string()),
  tips: z.array(z.string()).describe("Astuces anti-gaspi concrètes"),
  variants: z.array(z.string()).describe("Remplacements si un ingrédient manque"),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
  tools: z.array(z.string()).describe("1 à 3 ustensiles utiles (ex. « poêle anti-adhésive »)"),
});

// Ce qui est stocké sur disque : le brouillon + des champs fixés par le code.
export const Recipe = RecipeDraft.extend({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  datePublished: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// « Œufs & crème fraîche » -> « oeufs-creme-fraiche »
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}
