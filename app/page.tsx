import { getArticles } from "@/lib/articles";
import { CATEGORIES, SITE } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE.name,
  description: SITE.description,
};

export default function Home() {
  const articles = getArticles();
  const featured = articles.slice(0, 4);

  return (
    <>
      <section className="hero">
        <h1>Les meilleurs produits pour vos animaux</h1>
        <p>
          Guides testés, comparatifs et recommandations pour chien, chat et
          petits animaux.
        </p>
        <div className="hero-gallery">
          {featured.map((a) => (
            <a key={a.slug} href={`/articles/${a.slug}/`} className="hero-gallery-item">
              <img src={a.image} alt={a.title} loading="lazy" />
              <span>{a.category}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="categories">
        <h2>Nos catégories</h2>
        <div className="category-grid">
          {CATEGORIES.map((c) => (
            <a
              key={c.name}
              href={`/categorie/${encodeURIComponent(c.name)}/`}
              className="category-card"
            >
              <span className="category-emoji">{c.emoji}</span>
              <span className="category-name">{c.name}</span>
              <span className="category-desc">{c.description}</span>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2>Derniers guides</h2>
        <div className="article-list">
          {articles.map((a) => (
            <a
              key={a.slug}
              href={`/articles/${a.slug}/`}
              className="article-card"
            >
              <img src={a.image} alt={a.title} className="card-image" />
              <div className="card-body">
                <h3>{a.title}</h3>
                <div className="meta">
                  {a.date} · {a.readingTime} · {a.category}
                </div>
                <p>{a.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
