import { SITE } from "@/lib/site";

export default function ContactPage() {
  return (
    <div className="article">
      <article>
        <h1>Contact</h1>
        <p>
          Une question, une suggestion de produit à tester ? Écrivez-nous :
        </p>
        <p>
          <strong>contact@{SITE.name.toLowerCase()}.fr</strong>
        </p>
        <p>
          {`Nous répondons généralement sous 48h. Nous ne répondons pas aux
          demandes de publicité non sollicitée.`}
        </p>
      </article>
    </div>
  );
}
