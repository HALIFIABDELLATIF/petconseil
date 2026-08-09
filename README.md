# 🐾 PetConseil — Site d'affiliation automatique (niche animaux)

Site statique Next.js pour le marketing d'affiliation, 100% gratuit et automatisé.

- **Hébergement** : Vercel ou Netlify (plan gratuit)
- **Contenu** : généré automatiquement chaque semaine via GitHub Actions + IA
- **Revenus** : commission Amazon Associates sur les clics + achats
- **Coût** : 0 € (seule la clé IA coûte quelques centimes par article, ~0,02 €)

## Comment ça marche

```
GitHub Actions (lundi 7h)
        │
        ├── prend le 1er sujet de content/queue.json
        ├── génère l'article avec l'IA (OpenAI ou Claude)
        ├── compile le site (vérifie que rien n'est cassé)
        └── commit + push automatique
              │
              └── Vercel/Netlify détecte le push → publie le site
```

## Mise en route (15 minutes)

### 1. Créer le dépôt GitHub

```bash
git init
git add .
git commit -m "Initialisation du site d'affiliation"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/petconseil.git
git push -u origin main
```

### 2. Obtenir une clé IA (recommandé)

- **OpenAI** : https://platform.openai.com → API keys → créer une clé (`sk-...`)
- **OU Anthropic** : https://console.anthropic.com → API keys

### 3. Configurer les secrets GitHub

Dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Valeur |
|---|---|
| `OPENAI_API_KEY` | ta clé OpenAI (ou mets `ANTHROPIC_API_KEY`) |
| `AMAZON_TAG` | ton tag Amazon Associates (ex: `monsite-21`) |

### 4. Héberger gratuitement sur Vercel

1. Va sur https://vercel.com → New Project → Importe `petconseil`
2. Framework : Next.js (détecté automatiquement)
3. Build Command : `npm run build`, Output Directory : `out`
4. Deploy. Ton site est en ligne sur `https://petconseil.vercel.app`

### 5. Ajouter les vrais produits Amazon

Ouvre `content/queue.json` et remplace les liens `https://www.amazon.fr/dp/B0XXXXXX` par les **vrais codes produits** (ASIN) des produits que tu veux promouvoir.

## Commandes utiles

```bash
npm run dev              # prévisualiser le site en local
npm run build            # construire le site
npm run generate:article # générer le prochain article (mode IA si clé, sinon modèle)
node scripts/generate-article.mjs --force SLUG  # regénérer un article précis
```

## Amazon Associates — comment percevoir des commissions

1. Va sur https://affiliate-program.amazon.fr et crée un compte (gratuit)
2. Accepte les conditions, remplis ton identifiant de site web et tes coordonnées
3. Dans ton espace, récupère ton **ID de suivi** (Tracking ID), ex : `petconseil-21`
4. Mets-le dans le secret GitHub `AMAZON_TAG` (et dans `.env` en local)
5. **Important** : pour toucher tes gains, Amazon exige 3 ventes qualifiées sur les 180 premiers jours (facile une fois le site indexé)

> ⚠️ Le tag est déjà inséré automatiquement dans tous les liens Amazon des articles grâce à `lib/articles.ts`. Tu n'as rien à coder.

## Règles à respecter (légal + Amazon)

- ✅ La mention d'affiliation est déjà dans le footer (obligation légale française)
- ❌ Ne promets pas de gains (interdit en affiliation)
- ❌ Ne copie jamais les descriptions officielles Amazon mot à mot
- ❌ N'utilise pas de vrai produit Amazon sans vérifier que tu es bien affilié

## Stratégie pour rentabiliser

1. **Mois 1-2** : 3 articles de départ + 1 article/semaine automatique (12 sujets déjà en file)
2. **Mois 3** : ajoute le site dans [Google Search Console](https://search.google.com/search-console) (gratuit) et soumets le sitemap
3. **Mois 4+** : les articles commencent à être indexés → premiers clics Amazon
4. **Mois 6+** : premières commissions. Remplace les ASIN placeholder par de vrais produits
5. **Scale** : ajoute de nouveaux sujets dans `content/queue.json`, ils seront traités automatiquement

## Structure du projet

```
app/                    # pages (accueil, articles, catégories, légal, sitemap)
content/
  articles/*.md         # les articles (markdown + métadonnées)
  queue.json            # les sujets à publier automatiquement
scripts/
  generate-article.mjs  # le générateur automatique
lib/
  articles.ts           # lecture des articles + insertion du tag Amazon
  site.ts               # config du site (nom, URL)
.github/workflows/
  publish.yml           # publication automatique hebdomadaire
```
