import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

export interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readingTime: string;
  image: string;
}

const DEFAULT_IMAGES: Record<string, string> = {
  Chien: "/images/chien.svg",
  Chat: "/images/chat.svg",
  "Petits animaux": "/images/petits-animaux.svg",
  Accessoires: "/images/accessoires.svg",
};

/**
 * Extrait le premier ASIN réel présent dans un contenu markdown,
 * pour afficher la photo produit Amazon en couverture d'article.
 */
function firstRealAsin(content: string): string | null {
  const seen = new Set<string>();
  for (const m of content.matchAll(/amazon\.fr\/dp\/([A-Z0-9]{10})/gi)) {
    const asin = m[1];
    if (seen.has(asin)) continue;
    seen.add(asin);
    if (!/\d{2}$/.test(asin)) return asin;
  }
  return null;
}

export function defaultImage(category: string): string {
  return DEFAULT_IMAGES[category] ?? "/images/accessoires.svg";
}

export interface Article extends ArticleMeta {
  contentHtml: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

export const AMAZON_TAG = process.env.AMAZON_TAG || "petconseil-21";

function replaceAmazonTag(url: string): string {
  if (!url.includes("amazon.")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "amzn.to") return url;
    parsed.searchParams.set("tag", AMAZON_TAG);
    return parsed.toString();
  } catch {
    return url;
  }
}

function rewriteAmazonLinks(html: string): string {
  return html.replace(
    /href="(https?:\/\/(?:www\.)?amazon\.[^"]+)"/g,
    (_match, url: string) => `href="${replaceAmazonTag(url)}"`,
  );
}

/**
 * Remplace les liens "Voir le prix sur Amazon" vers une fiche produit
 * (/dp/{ASIN}) par une carte produit avec l'image Amazon correspondante.
 *
 * Convention d'image fiable, sans scraping : https://m.media-amazon.com/images/P/{ASIN}...
 */
function amazonProductCard(html: string): string {
  return html.replace(
    /<a href="(https?:\/\/(?:www\.)?amazon\.[^"]*\/dp\/([A-Z0-9]{10}))(?:\?[^"]*)?">([^<]*Voir le prix sur Amazon[^<]*)<\/a>/gi,
    (_match, url: string, asin: string, label: string) =>
      `<figure class="amazon-product">
  <a href="${url}" target="_blank" rel="nofollow sponsored noopener">
    <img class="amazon-product-image" src="https://m.media-amazon.com/images/P/${asin}._AC_SL1500_.jpg" alt="Voir le produit sur Amazon" loading="lazy" width="300" height="300" />
  </a>
  <figcaption>
    <a class="amazon-product-link" href="${url}" target="_blank" rel="nofollow sponsored noopener">${label}</a>
  </figcaption>
</figure>`,
  );
}

export function getArticles(): ArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      const { data } = matter(raw);
      return {
        slug: data.slug ?? file.replace(/\.md$/, ""),
        title: data.title ?? file,
        date: data.date ?? "",
        excerpt: data.excerpt ?? "",
        category: data.category ?? "Animaux",
        readingTime: data.readingTime ?? "5 min",
        image: data.image ?? defaultImage(data.category ?? "Animaux"),
      } as ArticleMeta;
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getArticle(slug: string): Promise<Article | null> {
  const file = path.join(CONTENT_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  const contentHtml = rewriteAmazonLinks(amazonProductCard(processed.toString()));
  const heroAsin = firstRealAsin(content);
  return {
    slug: data.slug ?? slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    category: data.category ?? "Animaux",
    readingTime: data.readingTime ?? "5 min",
    image: heroAsin
      ? `https://m.media-amazon.com/images/P/${heroAsin}._AC_SL1500_.jpg`
      : data.image ?? defaultImage(data.category ?? "Animaux"),
    contentHtml,
  };
}

export function getArticleSlugs(): string[] {
  return getArticles().map((a) => a.slug);
}
