#!/usr/bin/env node
/**
 * Remplace les ASIN factices (B0GAMELLE01, B0JOUET01, ...) par des liens
 * de recherche Amazon réels (amazon.fr/s?k=...) pour éviter les pages d'erreur.
 *
 * Le tag d'affiliation est ajouté automatiquement au rendu (lib/articles.ts).
 *
 * Usage : node scripts/fix-fake-links.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content", "articles");

const MAPPING = [
  {
    file: "meilleur-gps-chien-perdu-2026.md",
    links: [
      ["B08K3XYZ01", "gps chien traceur"],
      ["B07L8ABCDE2", "gps chien sans abonnement"],
      ["B09X5FGHIJ", "gps chien chasse etanche"],
      ["B06KLMNOP1", "gps chien lampe led"],
      ["B01QRSTUV2", "gps chien petit chien"],
      ["B0AXYZW23", "gps chien longue autonomie"],
    ],
  },
  {
    file: "meilleurs-arbres-a-chat-2026.md",
    links: [
      ["B08K3XYZ01", "arbre a chat xxl"],
      ["B07L8ABCDE2", "arbre a chat mural"],
      ["B09X5FGHIJ", "arbre a chat bois naturel"],
      ["B06KLMNOP1", "arbre a chat economique"],
      ["B01QRSTUV2", "arbre a chat grande race"],
      ["B0AXYZW23", "arbre a chat tunnel"],
    ],
  },
  {
    file: "meilleures-croquettes-chien-2026.md",
    links: [
      ["B06KLMNOP1", "croquettes chien digestion sensible"],
      ["B0AXYZW23", "croquettes chiot croissance"],
      ["B05CDEFG45", "croquettes chien sterilise"],
    ],
  },
  {
    file: "meilleure-litiere-automatique-chat-2026.md",
    links: [
      ["B0LITIERE01", "litiere automatique chat"],
      ["B0LITIERE02", "litiere automatique tambour"],
      ["B0LITIERE03", "litiere automatique racloir"],
      ["B0LITIERE04", "litiere automatique connectee camera"],
      ["B0LITIERE05", "litiere automatique silencieuse"],
    ],
  },
  {
    file: "meilleure-fontaine-a-eau-chat-2026.md",
    links: [
      ["B0FONTAIN01", "fontaine a eau chat filtre"],
      ["B0FONTAIN02", "fontaine a eau chat inox"],
      ["B0FONTAIN03", "fontaine a eau chat detection mouvement"],
      ["B0FONTAIN04", "fontaine a eau chat cascade"],
      ["B0FONTAIN05", "fontaine a eau chat grande capacite"],
      ["B0FONTAIN06", "fontaine a eau chat silencieuse"],
      ["B0FONTAIN07", "fontaine a eau chat filtre"],
    ],
  },
  {
    file: "meilleurs-jouets-casse-croute-chien-2026.md",
    links: [
      ["B0JOUET01", "ballon distributeur friandises chien"],
      ["B0JOUET02", "tapis fouille friandises chien"],
      ["B0JOUET03", "puzzle chien tiroirs"],
      ["B0JOUET04", "kong chien"],
      ["B0JOUET05", "jouet distributeur friandises grand chien"],
      ["B0JOUET06", "jouet sisal suspendre chien"],
      ["B0JOUET07", "jouet distributeur chiot"],
      ["B0JOUET08", "puzzle friandises cache cache chien"],
    ],
  },
  {
    file: "meilleures-gamelles-anti-glouton-2026.md",
    links: [
      ["B0GAMELLE01", "gamelle anti glouton chien"],
      ["B0GAMELLE02", "gamelle anti glouton ventouse"],
      ["B0GAMELLE03", "gamelle anti glouton acier"],
      ["B0GAMELLE04", "gamelle anti glouton grande race"],
      ["B0GAMELLE05", "gamelle distributeur croquettes chien"],
    ],
  },
  {
    file: "meilleur-distributeur-croquettes-2026.md",
    links: [
      ["B0DISTRIB01", "distributeur croquettes automatique"],
      ["B0DISTRIB02", "distributeur croquettes automatique programmable"],
    ],
  },
];

let replaced = 0;

for (const { file, links } of MAPPING) {
  const p = path.join(CONTENT_DIR, file);
  if (!fs.existsSync(p)) {
    console.log(`  ⚠ ${file} introuvable`);
    continue;
  }
  let content = fs.readFileSync(p, "utf-8");
  for (const [placeholder, keyword] of links) {
    const from = `https://www.amazon.fr/dp/${placeholder}`;
    const to = `https://www.amazon.fr/s?k=${encodeURIComponent(keyword)}`;
    const count = content.split(from).length - 1;
    if (count > 0) {
      content = content.split(from).join(to);
      replaced += count;
      console.log(`  ✓ ${file}: ${placeholder} → s?k=${keyword}`);
    }
  }
  fs.writeFileSync(p, content);
}

console.log(`\n${replaced} liens corrigés.`);
