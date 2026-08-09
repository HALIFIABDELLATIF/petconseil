#!/usr/bin/env node
/**
 * Générateur d'article automatique.
 *
 * Pipeline :
 *   1. Recherche de VRAIS produits Amazon via la PA-API (si clés configurées)
 *   2. Génération du contenu via IA (si clé) sinon modèle hors-ligne
 *
 * Usage : node scripts/generate-article.mjs [--force slug]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { searchProducts } from "./paapi.mjs";
import { placeholderToSearch } from "./links.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "articles");
const QUEUE_FILE = path.join(ROOT, "content", "queue.json");

const DATE = new Date().toISOString().slice(0, 10);

function readQueue() {
  return JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8")).topics;
}

function writeQueue(topics) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify({ topics }, null, 2) + "\n");
}

function exists(slug) {
  return fs.existsSync(path.join(CONTENT_DIR, `${slug}.md`));
}

function categoryImage(category) {
  const map = {
    Chien: "/images/chien.svg",
    Chat: "/images/chat.svg",
    "Petits animaux": "/images/petits-animaux.svg",
    Accessoires: "/images/accessoires.svg",
  };
  return map[category] ?? "/images/accessoires.svg";
}

async function resolveProducts(topic) {
  const hasKeys = process.env.PA_ACCESS_KEY && process.env.PA_SECRET_KEY && process.env.PA_TAG;
  if (!hasKeys) return;

  console.log(`🔍 Recherche de vrais produits Amazon pour "${topic.keyword}"...`);
  try {
    const products = await searchProducts(topic.keyword, topic.category);
    if (!products.length) {
      console.warn("⚠️  Aucun produit trouvé via PA-API, placeholders conservés.");
      return;
    }
    topic.products = products.slice(0, 8);
    topic.amazonProducts = products
      .slice(0, 8)
      .map((p) => `https://www.amazon.fr/dp/${p.asin}`);
    console.log(`  ✓ ${topic.products.length} produits réels trouvés (${products[0].title.slice(0, 40)}...)`);
  } catch (err) {
    console.warn(`⚠️  PA-API indisponible (${err.message}). Placeholders conservés.`);
  }
}

function frontmatter(topic, { title = topic.title, readingTime = "6 min" } = {}) {
  const image = topic.products?.[0]?.image ?? categoryImage(topic.category);
  return [
    "---",
    `slug: ${topic.slug}`,
    `title: "${title.replace(/"/g, '\\"')}"`,
    `date: "${DATE}"`,
    `category: "${topic.category}"`,
    `excerpt: "Recommandations et comparatif : ${title} (${topic.category}). Produits testés et sélectionnés pour un excellent rapport qualité-prix."`,
    `readingTime: "${readingTime}"`,
    `image: ${image}`,
    "---",
    "",
  ].join("\n");
}

function buildOfflineArticle(topic) {
  const products = topic.products ?? [];
  const productLinks = (products.length ? products : topic.amazonProducts ?? [])
    .map((p, i) => {
      const raw = p.asin ? `https://www.amazon.fr/dp/${p.asin}` : p;
      const url = placeholderToSearch(raw, topic.keyword);
      const image = p.image ? `\n\n![${p.title.replace(/"/g, "")}](${p.image})` : "";
      const price = p.price
        ? `\n- **Prix :** environ ${p.price} ${p.currency}`
        : "";
      const rating = p.rating
        ? `\n- **Note clients :** ${p.rating.toFixed(1)}/5 (${p.reviews} avis)`
        : "";
      const title =
        p.title ??
        topic.keyword.replace(/^\w/, (c) => c.toUpperCase()) +
          (i > 0 ? ` — modèle n°${i + 1}` : "");
      return `### ${i + 1}. ${title}${image}

Ce produit a été sélectionné pour son excellent rapport qualité-prix dans cette catégorie. Vérifiez les avis clients et les promotions en cours avant de commander.${price}${rating}

[Voir le prix sur Amazon](${url})
`;
    })
    .join("\n");

  return `## Pourquoi choisir le bon produit est important

Dans cette catégorie, la qualité fait toute la différence. Un produit adapté améliore le confort et la santé de votre animal, et évite des dépenses inutiles à long terme.

> Astuce : lisez toujours les avis clients, et comparez les prix avant d'acheter. Les promos peuvent varier fortement selon la période.

## Notre sélection de produits

${productLinks}
## Comment bien choisir

1. **Étudiez vos besoins** : la taille de votre animal, son âge et son mode de vie déterminent le bon choix.
2. **Comparez les matériaux** : privilégiez des matériaux robustes, faciles à nettoyer et sans danger.
3. **Vérifiez les dimensions** : un produit trop petit ou trop grand ne rendra pas service.
4. **Consultez les avis** : les retours d'expérience sont précieux pour éviter les mauvaises surprises.

> Notre verdict : commencez par le produit n°1 de la sélection, c'est celui qui offre le meilleur compromis qualité-prix.

## Questions fréquentes

### Quelle est la durée de vie moyenne de ce type de produit ?
Elle dépend beaucoup de la qualité. Les produits d'entrée de gamme durent souvent moins longtemps que les modèles premium bien entretenus.

### Peut-on le laver ?
La plupart des modèles se nettoient facilement. Vérifiez les recommandations du fabricant pour la maintenance.

### Y a-t-il une garantie ?
Cela varie selon les marques et les vendeurs. Consultez la fiche produit pour les conditions exactes.
`;
}

async function generateWithAI(topic) {
  const products = (topic.products ?? []).map(
    (p, i) =>
      `${i + 1}. ${p.title} — ${p.price} ${p.currency} — ${p.rating ? `${p.rating}/5 (${p.reviews} avis)` : ""} — https://www.amazon.fr/dp/${p.asin} — image: ${p.image}`,
  );
  const productSection =
    products.length > 0
      ? products.map((p) => `${p.title} — ${p.price} ${p.currency} — ${p.rating ? `${p.rating}/5 (${p.reviews} avis)` : ""} — https://www.amazon.fr/dp/${p.asin} — image: ${p.image}`).join("\n")
      : (topic.amazonProducts ?? []).map((u, i) => `${i + 1}. ${placeholderToSearch(u, topic.keyword)}`).join("\n");

  const prompt = `Rédige un article SEO complet en français pour un site d'affiliation sur la niche "animaux de compagnie".

Sujet : ${topic.title}
Mot-clé cible : ${topic.keyword}
Catégorie : ${topic.category}
Produits réels à recommander (nom, prix, note, lien Amazon) :
${productSection}

Consignes :
- Structure en markdown.
- Commence par un titre H1 égal au sujet, puis une intro H2 ("Pourquoi ... est important").
- Présente chaque produit avec un H3 (utilise le nom réel du produit), 2-3 lignes d'arguments, des points forts en liste (- **Points forts :** ...), le prix et le lien Amazon en "Voir le prix sur Amazon".
- Termine par une section "Comment bien choisir" (4 conseils en liste numérotée), une section "Questions fréquentes" (3 questions avec réponses), et une conclusion avec "notre verdict".
- Utilise des blocs de citation (>) pour les conseils.
- Longueur : 800 à 1200 mots.
- Écris uniquement le corps de l'article, sans frontmatter.`;

  const apiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey) {
    const res = await fetch(
      process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 3000,
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.content.map((b) => b.text).join("");
  }

  if (apiKey) {
    const res = await fetch(
      process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: "Tu es un expert rédacteur SEO français spécialisé en produits pour animaux." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      },
    );
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  throw new Error("Aucune clé API trouvée (OPENAI_API_KEY ou ANTHROPIC_API_KEY).");
}

async function main() {
  const forceSlug = process.argv.find((a, i) => process.argv[i - 1] === "--force");
  const queue = readQueue();

  const target = forceSlug
    ? queue.find((t) => t.slug === forceSlug)
    : queue.find((t) => !exists(t.slug));

  if (!target) {
    console.log("Aucun article à générer : tous les sujets de la file sont publiés.");
    return;
  }

  if (exists(target.slug) && !forceSlug) {
    console.log(`L'article ${target.slug} existe déjà.`);
    return;
  }

  await resolveProducts(target);

  let body;
  const hasKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (hasKey) {
    console.log(`Génération IA de "${target.title}"...`);
    try {
      body = await generateWithAI(target);
    } catch (err) {
      console.warn(`⚠️  IA indisponible (${err.message}). Utilisation du modèle hors-ligne.`);
      body = buildOfflineArticle(target);
    }
  } else {
    console.log(`Mode hors-ligne (aucune clé IA) : génération modèle pour "${target.title}".`);
    body = buildOfflineArticle(target);
  }

  const file = frontmatter(target) + body.trim() + "\n";
  fs.writeFileSync(path.join(CONTENT_DIR, `${target.slug}.md`), file);

  if (!forceSlug) {
    writeQueue(queue.filter((t) => t.slug !== target.slug));
  }

  console.log(`✅ Article créé : content/articles/${target.slug}.md`);
}

main().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
