import type { Metadata, Viewport } from "next";
import { SITE, CATEGORIES } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header className="header">
          <a href="/" className="brand">
            🐾 {SITE.name}
          </a>
          <nav>
            {CATEGORIES.map((c) => (
              <a key={c.name} href={`/categorie/${encodeURIComponent(c.name)}/`}>
                {c.name}
              </a>
            ))}
            <a href="/contact/">Contact</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <p>
            {SITE.name} — {SITE.tagline}
          </p>
          <p className="affiliate-disclosure">
            Certains liens de ce site sont des liens d&apos;affiliation
            Amazon. Nous pouvons percevoir une commission si vous achetez via
            ces liens, sans coût supplémentaire pour vous.
          </p>
          <nav className="footer-nav">
            <a href="/mentions-legales/">Mentions légales</a>
            <a href="/contact/">Contact</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
