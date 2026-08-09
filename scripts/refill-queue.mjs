/**
 * Auto-recharge de la file d'articles.
 *
 * Quand il reste moins de REFILL_THRESHOLD sujets dans la queue,
 * ajoute de nouveaux sujets (titre, mot-clé de recherche Amazon, slug)
 * à partir d'un catalogue, pour que la publication hebdomadaire ne
 * s'arrête jamais. Les anciens sujets ne sont pas dupliqués.
 *
 * Usage : node scripts/refill-queue.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_FILE = path.join(__dirname, "..", "content", "queue.json");

const REFILL_THRESHOLD = Number(process.env.REFILL_THRESHOLD || 5);
const REFILL_COUNT = Number(process.env.REFILL_COUNT || 8);

const YEAR = new Date().getFullYear();

const TOPICS = [
  // Accessoires chien
  { category: "Chien", keyword: "gamelle anti glouton chien", title: "Gamelle anti-glouton" },
  { category: "Chien", keyword: "harnais chien", title: "Harnais de traction" },
  { category: "Chien", keyword: "collier chien étrangleur", title: "Colliers d'éducation" },
  { category: "Chien", keyword: "laisse chien extensible", title: "Laisses extensibles" },
  { category: "Chien", keyword: "sac à dos chien", title: "Sacs de transport" },
  { category: "Chien", keyword: "brosse chien poils courts", title: "Brosses poils courts" },
  { category: "Chien", keyword: "coupe griffe chien", title: "Coupe-griffes" },
  { category: "Chien", keyword: "shampooing chien démêlant", title: "Shampoings" },
  { category: "Chien", keyword: "manteau chien hiver", title: "Vêtements d'hiver" },
  { category: "Chien", keyword: "chaussures chien", title: "Bottes de protection" },
  { category: "Chien", keyword: "ramasse crottes chien", title: "Sacs et distributeurs" },
  { category: "Chien", keyword: "brosse électrique chien", title: "Brosses électriques" },
  { category: "Chien", keyword: "dents chien brosse à dents", title: "Hygiène dentaire" },
  { category: "Chien", keyword: "portail chien sécurité", title: "Barrières et portails" },
  { category: "Chien", keyword: "glacière gamelle chien", title: "Gamelles fraîcheur" },
  { category: "Chien", keyword: "sifflet dressage chien", title: "Accessoires de dressage" },
  { category: "Chien", keyword: "jouet kong chien", title: "Jouets à mâcher" },
  { category: "Chien", keyword: "coussin chien canapé", title: "Coussins confort" },
  { category: "Chien", keyword: "cage chien intérieur", title: "Cages de repos" },
  { category: "Chien", keyword: "barrières escalier chien", title: "Barrières de sécurité" },

  // Accessoires chat
  { category: "Chat", keyword: "arbre à chat", title: "Arbres et griffoirs" },
  { category: "Chat", keyword: "fontaine à eau chat", title: "Fontaines à eau" },
  { category: "Chat", keyword: "griffoir carton chat", title: "Griffoirs en carton" },
  { category: "Chat", keyword: "litière végétale chat", title: "Litières végétales" },
  { category: "Chat", keyword: "litière silice chat", title: "Litières au silice" },
  { category: "Chat", keyword: "transporteur chat", title: "Transporteurs" },
  { category: "Chat", keyword: "collier grelot chat", title: "Colliers à grelot" },
  { category: "Chat", keyword: "brosse chat démêlant", title: "Brosses et étrilles" },
  { category: "Chat", keyword: "jouet canne à pêche chat", title: "Jouets interactifs" },
  { category: "Chat", keyword: "tunnel chat", title: "Tunnels de jeu" },
  { category: "Chat", keyword: "gamelle chat antibactérienne", title: "Gamelles" },
  { category: "Chat", keyword: "hamac chat radiateur", title: "Hamacs chauffants" },
  { category: "Chat", keyword: "plateau d'herbe à chat", title: "Herbe à chat" },
  { category: "Chat", keyword: "sac à dos chat", title: "Sacs de transport" },
  { category: "Chat", keyword: "piste jeux chat", title: "Circuits de jeux" },

  // Alimentation
  { category: "Chien", keyword: "croquettes chien sans céréales", title: "Croquettes sans céréales" },
  { category: "Chien", keyword: "croquettes chiot", title: "Croquettes pour chiots" },
  { category: "Chien", keyword: "croquettes chien stérilisé", title: "Croquettes chien stérilisé" },
  { category: "Chien", keyword: "pâtée chien sénior", title: "Pâtées pour seniors" },
  { category: "Chien", keyword: "friandises chien naturelles", title: "Friandises naturelles" },
  { category: "Chien", keyword: "os à moelle chien", title: "Os et mâchoires" },
  { category: "Chat", keyword: "croquettes chat stérilisé", title: "Croquettes chat stérilisé" },
  { category: "Chat", keyword: "pâtée chaton", title: "Pâtées pour chatons" },
  { category: "Chat", keyword: "croquettes chat sans céréales", title: "Croquettes sans céréales" },
  { category: "Chat", keyword: "thé friandises chat", title: "Friandises et snacks" },

  // Santé et bien-être
  { category: "Chien", keyword: "anti tique chien naturel", title: "Anti-tiques naturels" },
  { category: "Chien", keyword: "complément articulations chien", title: "Compléments articulaires" },
  { category: "Chien", keyword: "gouttes anti stress chien", title: "Anti-stress" },
  { category: "Chien", keyword: "soutien vétérinaire chien", title: "Soutiens orthopédiques" },
  { category: "Chat", keyword: "comprimé anti puces chat", title: "Anti-puces et anti-tiques" },
  { category: "Chat", keyword: "antiparasitaire chat", title: "Pipettes et sprays" },
  { category: "Chat", keyword: "herbe à chat graines", title: "Graines et cultures" },
  { category: "Petits animaux", keyword: "litière lapin", title: "Litières pour lapins" },
  { category: "Petits animaux", keyword: "cage hamster", title: "Cages pour rongeurs" },
  { category: "Petits animaux", keyword: "jardin cage lapin", title: "Enclos et parcs" },
  { category: "Petits animaux", keyword: "bouteille eau rongeur", title: "Biberons et abreuvoirs" },
  { category: "Petits animaux", keyword: "roue hamster", title: "Roues d'exercice" },
];

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function main() {
  const queue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
  const existing = new Set(queue.topics.map((t) => t.title.toLowerCase()));
  const used = new Set(queue.topics.map((t) => t.slug));

  const missing = TOPICS.filter((t) => !existing.has(t.title.toLowerCase()));
  const toAdd = missing.slice(0, REFILL_COUNT);

  const currentCount = queue.topics.length;
  console.log(
    `Queue actuelle : ${currentCount} sujets. Seuil de recharge : ${REFILL_THRESHOLD}.`,
  );

  if (currentCount > REFILL_THRESHOLD || toAdd.length === 0) {
    console.log("Aucun ajout nécessaire.");
    return;
  }

  const added = toAdd.map((t, i) => ({
    slug: `${slugify(t.keyword)}-${YEAR}`,
    title: `Les meilleurs ${t.title.toLowerCase()} en ${YEAR}`,
    category: t.category,
    keyword: t.keyword,
    amazonProducts: [`https://www.amazon.fr/dp/B0REFILL${String(i).padStart(2, "0")}`],
  }));

  for (const item of added) {
    if (used.has(item.slug)) {
      item.slug = `${item.slug}-2`;
    }
    used.add(item.slug);
  }

  queue.topics.push(...added);
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2) + "\n");
  console.log(`✅ ${added.length} nouveaux sujets ajoutés.`);
  for (const item of added) {
    console.log(`   - ${item.title} (${item.keyword})`);
  }
}

main();
