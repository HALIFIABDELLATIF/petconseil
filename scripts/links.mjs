/**
 * Conversion automatique des liens produits.
 *
 * - PA-API disponible : le générateur utilise les vrais ASIN récupérés.
 * - Sinon : tout lien vers un ASIN factice (ex. amazon.fr/dp/B0BROSSE01)
 *   est converti en recherche Amazon réelle (amazon.fr/s?k=...) pour
 *   ne jamais afficher de page d'erreur.
 *
 * Le tag d'affiliation est ajouté au rendu par lib/articles.ts.
 *
 * Les placeholders du projet se terminent systématiquement par 2 chiffres
 * (B0DISTRIB01, B0BROSSE02…) ; les ASIN réels d'Amazon ne suivent pas ce
 * motif. On combine ce test avec la liste explicite de product-map.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadPlaceholders() {
  try {
    const map = JSON.parse(
      fs.readFileSync(path.join(__dirname, "..", "content", "product-map.json"), "utf-8"),
    );
    return new Set((map ?? []).map((p) => p.placeholder));
  } catch {
    return new Set();
  }
}

export const FAKE_ASINS = loadPlaceholders();

export function isFakeAsin(asin) {
  if (!/^[A-Z0-9]{10}$/.test(asin)) return true;
  if (/\d{2}$/.test(asin)) return true;
  return FAKE_ASINS.has(asin);
}

export function toSearchLink(keyword) {
  return `https://www.amazon.fr/s?k=${encodeURIComponent(keyword)}`;
}

export function placeholderToSearch(amazonUrl, keyword) {
  if (!amazonUrl) return amazonUrl;
  const match = amazonUrl.match(/amazon\.fr\/dp\/([A-Z0-9]+)/i);
  if (!match) return amazonUrl;
  if (isFakeAsin(match[1])) return toSearchLink(keyword);
  return amazonUrl;
}
