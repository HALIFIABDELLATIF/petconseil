#!/usr/bin/env node
/**
 * Applique la correspondance produits réels définie dans content/product-map.json
 * aux articles et à la file d'attente.
 *
 * Usage : node scripts/apply-product-map.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "articles");
const MAP_FILE = path.join(ROOT, "content", "product-map.json");
const QUEUE_FILE = path.join(ROOT, "content", "queue.json");

const map = JSON.parse(fs.readFileSync(MAP_FILE, "utf-8")).filter(
  (m) => m.real_asin && m.real_asin.trim() !== "",
);

if (map.length === 0) {
  console.log("Aucun real_asin renseigné dans product-map.json.");
  process.exit(0);
}

let replaced = 0;

for (const entry of map) {
  const from = `amazon.fr/dp/${entry.placeholder}`;
  const to = `amazon.fr/dp/${entry.real_asin}`;

  const files = entry.articles.filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const p = path.join(CONTENT_DIR, file);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, "utf-8");
    const updated = content.split(from).join(to);
    if (updated !== content) {
      fs.writeFileSync(p, updated);
      replaced += content.split(from).length - 1;
      console.log(`  ✓ ${file}: ${entry.placeholder} → ${entry.real_asin}`);
    }
  }
}

if (fs.existsSync(QUEUE_FILE)) {
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  for (const topic of queue.topics) {
    topic.amazonProducts = (topic.amazonProducts ?? []).map((url) => {
      for (const entry of map) {
        if (url.includes(entry.placeholder)) {
          replaced++;
          return url.split(entry.placeholder).join(entry.real_asin);
        }
      }
      return url;
    });
  }
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + "\n");
}

console.log(`\n${replaced} liens mis à jour.`);
