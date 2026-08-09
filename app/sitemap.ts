import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";
import { SITE, CATEGORIES } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const articles = getArticles();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/mentions-legales/`, lastModified: new Date() },
    { url: `${base}/contact/`, lastModified: new Date() },
  ];

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${base}/categorie/${encodeURIComponent(c.name)}/`,
    lastModified: new Date(),
  }));

  const articlePages = articles.map((a) => ({
    url: `${base}/articles/${a.slug}/`,
    lastModified: new Date(a.date),
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
