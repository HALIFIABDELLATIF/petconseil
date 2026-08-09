import { getArticles, defaultImage } from "@/lib/articles";
import { CATEGORIES } from "@/lib/site";
import type { Metadata } from "next";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.name }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const category = CATEGORIES.find(
    (c) => c.name.toLowerCase() === params.category.toLowerCase(),
  );
  return {
    title: `Meilleurs produits ${params.category}`,
    description: `Nos recommandations et comparatifs pour ${params.category} : ${
      category?.description ?? "produits testés et sélectionnés"
    }.`,
    alternates: { canonical: `/categorie/${encodeURIComponent(params.category)}/` },
  };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const articles = getArticles().filter(
    (a) => a.category.toLowerCase() === params.category.toLowerCase(),
  );

  return (
    <>
      <section className="hero">
        <h1>Meilleurs produits {params.category}</h1>
        {articles.length === 0 && (
          <p>
            De nouveaux guides pour cette catégorie arrivent bientôt.
            Revenez dans quelques jours !
          </p>
        )}
      </section>
      <section className="article-list">
        {articles.length === 0 ? (
          <div className="empty-state">
            <img
              src={defaultImage(params.category)}
              alt={params.category}
              className="empty-image"
            />
            <p>Cette catégorie est en préparation.</p>
          </div>
        ) : (
          articles.map((a) => (
            <a
              key={a.slug}
              href={`/articles/${a.slug}/`}
              className="article-card"
            >
              <img src={a.image} alt={a.title} className="card-image" />
              <div className="card-body">
                <h3>{a.title}</h3>
                <div className="meta">
                  {a.date} · {a.readingTime}
                </div>
                <p>{a.excerpt}</p>
              </div>
            </a>
          ))
        )}
      </section>
    </>
  );
}
