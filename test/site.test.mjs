import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build, loadRecipes } from "../src/build.mjs";
import { slugify } from "../src/schema.mjs";
import { qualityProblems, uniqueSlug } from "../agent/write-page.mjs";

test("slugify gère accents, œ et ponctuation", () => {
  assert.equal(slugify("Œufs & crème fraîche !"), "oeufs-creme-fraiche");
  assert.equal(slugify("  Pâtes cuites  "), "pates-cuites");
});

test("uniqueSlug ajoute un suffixe en cas de doublon", () => {
  assert.equal(uniqueSlug("Gratin", new Set()), "gratin");
  assert.equal(uniqueSlug("Gratin", new Set(["gratin", "gratin-2"])), "gratin-3");
});

test("les recettes de départ passent le contrôle qualité", () => {
  for (const r of loadRecipes()) assert.deepEqual(qualityProblems(r), [], r.slug);
});

test("qualityProblems refuse une recette trop maigre", () => {
  const [r] = loadRecipes();
  assert.ok(qualityProblems({ ...r, steps: ["Mélange."] }).length > 0);
});

test("le build produit pages, sitemap, robots et JSON-LD valide", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  const recipes = loadRecipes();
  const stats = build({ out, recipes });
  assert.equal(stats.recipes, recipes.length);

  const page = fs.readFileSync(path.join(out, "recette", recipes[0].slug, "index.html"), "utf8");
  assert.match(page, /<h1>/);
  assert.match(page, /<link rel="canonical"/);
  const ld = [...page.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.ok(ld.some((d) => d["@type"] === "Recipe"));

  const sitemap = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes(`/recette/${recipes[0].slug}/`));
  assert.ok(fs.existsSync(path.join(out, "robots.txt")));
  assert.ok(fs.existsSync(path.join(out, "404.html")));
});

test("le HTML échappe le contenu (pas d'injection depuis le texte généré)", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "site-"));
  const [r] = loadRecipes();
  build({ out, recipes: [{ ...r, title: "<script>alert(1)</script>" }] });
  const page = fs.readFileSync(path.join(out, "recette", r.slug, "index.html"), "utf8");
  assert.ok(!page.includes("<script>alert(1)</script>"));
});
