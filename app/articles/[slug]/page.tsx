import { getArticle, getArticleSlugs } from "@/lib/articles";
import type { Metadata } from "next";

export function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug);
  return {
    title: article?.title ?? "Article",
    description: article?.excerpt ?? undefined,
    alternates: { canonical: `/articles/${params.slug}/` },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) return <p>Article introuvable.</p>;

  return (
    <div className="article">
      <article>
        <h1>{article.title}</h1>
        <div className="meta">
          <span className="badge">{article.category}</span>
          {article.date} · {article.readingTime}
        </div>
        <img
          src={article.image}
          alt={article.title}
          className="article-hero"
        />
        <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
      </article>
    </div>
  );
}
