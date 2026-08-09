#!/usr/bin/env node
/**
 * Module Amazon Product Advertising API v5 (PA-API 5.0).
 * Recherche automatique de vrais produits Amazon.fr.
 *
 * Variables d'environnement requises :
 *   PA_ACCESS_KEY  (Access Key ID)
 *   PA_SECRET_KEY  (Secret Access Key)
 *   PA_TAG         (Associates Tracking ID)
 */
import crypto from "crypto";

const HOST = "webservices.amazon.fr";
const REGION = "eu-west-1";
const ENDPOINT = `https://${HOST}/paapi5/searchitems`;
const SERVICE = "ProductAdvertisingAPI";
const TARGET = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";

function hmac(key, data) {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function signRequest(accessKey, secretKey, payload) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);

  const canonicalHeaders = [
    "content-type:application/json; charset=utf-8",
    `host:${HOST}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${TARGET}`,
  ].join("\n");

  const canonicalRequest = [
    "POST",
    "/paapi5/searchitems",
    "",
    canonicalHeaders + "\n",
    "content-type;host;x-amz-date;x-amz-target",
    sha256(payload),
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  return {
    amzDate,
    authorization: [
      "AWS4-HMAC-SHA256",
      `Credential=${accessKey}/${credentialScope}`,
      "SignedHeaders=content-type;host;x-amz-date;x-amz-target",
      `Signature=${signature}`,
    ].join(", "),
  };
}

const SEARCH_INDEX = {
  Chien: "PetSupplies",
  Chat: "PetSupplies",
  "Petits animaux": "PetSupplies",
  Accessoires: "PetSupplies",
};

export async function searchProducts(keyword, category = "Chien", itemCount = 8) {
  const accessKey = process.env.PA_ACCESS_KEY;
  const secretKey = process.env.PA_SECRET_KEY;
  const tag = process.env.PA_TAG;

  if (!accessKey || !secretKey || !tag) {
    throw new Error(
      "Clés PA-API manquantes (PA_ACCESS_KEY / PA_SECRET_KEY / PA_TAG).",
    );
  }

  const payload = JSON.stringify({
    Keywords: keyword,
    SearchIndex: SEARCH_INDEX[category] ?? "PetSupplies",
    ItemCount: Math.min(itemCount, 10),
    SortBy: "Featured",
    Resources: [
      "Images.Primary.Large",
      "ItemInfo.Title",
      "ItemInfo.Features",
      "Offers.Listings.Price",
      "Offers.Listings.Availability",
      "CustomerReviews.StarRating",
      "CustomerReviews.Count",
    ],
  });

  const { amzDate, authorization } = signRequest(accessKey, secretKey, payload);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      host: HOST,
      "x-amz-date": amzDate,
      "x-amz-target": TARGET,
      authorization,
    },
    body: payload,
  });

  if (!res.ok) {
    throw new Error(`PA-API ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const items = data?.SearchResult?.Items ?? [];

  const products = items
    .filter((it) => it?.Offers?.Listings?.[0]?.Price?.Amount != null)
    .map((it) => {
      const price = it.Offers.Listings[0].Price;
      const rating =
        it?.CustomerReviews?.StarRating ??
        it?.CustomerReviews?.StarRating?.[0] ??
        it?.CustomerReviews?.[0];
      const reviews =
        it?.CustomerReviews?.Count ?? it?.CustomerReviews?.[0]?.["Count"];
      return {
        asin: it.ASIN,
        title: it?.ItemInfo?.Title?.DisplayValue ?? it.ASIN,
        price: price.Amount,
        currency: price.Currency,
        image: it?.Images?.Primary?.Large?.URL ?? null,
        rating: rating != null ? Number(rating) : null,
        reviews: reviews != null ? Number(reviews) : 0,
      };
    })
    .sort((a, b) => {
      if (a.rating && b.rating) return b.rating - a.rating;
      return b.reviews - a.reviews;
    });

  return products;
}

if (process.argv[1] && process.argv[1].endsWith("paapi.mjs")) {
  const kw = process.argv[2] ?? "litière automatique chat";
  searchProducts(kw, "Chat")
    .then((p) => console.log(JSON.stringify(p.slice(0, 5), null, 2)))
    .catch((e) => {
      console.error("Erreur:", e.message);
      process.exit(1);
    });
}
