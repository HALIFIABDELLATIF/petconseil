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

export function defaultImage(category: string): string {
  return DEFAULT_IMAGES[category] ?? "/images/accessoires.svg";
}

export interface Article extends ArticleMeta {
  contentHtml: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

export const AMAZON_TAG = process.env.AMAZON_TAG || "petconseil-20";

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
  const contentHtml = rewriteAmazonLinks(processed.toString());
  return {
    slug: data.slug ?? slug,
    title: data.title ?? slug,
    date: data.date ?? "",
    excerpt: data.excerpt ?? "",
    category: data.category ?? "Animaux",
    readingTime: data.readingTime ?? "5 min",
    image: data.image ?? defaultImage(data.category ?? "Animaux"),
    contentHtml,
  };
}

export function getArticleSlugs(): string[] {
  return getArticles().map((a) => a.slug);
}
