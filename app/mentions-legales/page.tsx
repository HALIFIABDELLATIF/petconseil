export default function LegalPage() {
  return (
    <div className="article">
      <article>
        <h1>Mentions légales</h1>
        <p>
          {`Ce site édite des contenus informatifs et des recommandations de
          produits. Il est édité à titre personnel.`}
        </p>
        <h2>Affiliation</h2>
        <p>
          {`Ce site participe au Programme Partenaires d'Amazon EU, un
          programme d'affiliation conçu pour permettre à des sites de
          percevoir une rémunération grâce à la création de liens vers
          Amazon.fr. En tant que Partenaire Amazon, nous percevons une
          commission sur les achats remplissant les conditions requises.`}
        </p>
        <h2>Propriété intellectuelle</h2>
        <p>
          {`Les contenus de ce site sont la propriété de son éditeur. Toute
          reproduction est interdite sans autorisation préalable.`}
        </p>
        <h2>Données personnelles</h2>
        <p>
          {`Ce site ne collecte aucune donnée personnelle directement.
          Des cookies de mesure d'audience peuvent être déposés via des
          services tiers.`}
        </p>
      </article>
    </div>
  );
}
