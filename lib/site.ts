export const SITE = {
  name: "PetConseil",
  tagline: "Les meilleurs produits pour vos animaux, testés et recommandés",
  url: "https://petconseil.vercel.app",
  description:
    "Guides et recommandations de produits pour chiens, chats et petits animaux : croquettes, jouets, accessoires, santé.",
  locale: "fr_FR",
};

export const CATEGORIES: { name: string; emoji: string; description: string }[] =
  [
    {
      name: "Chien",
      emoji: "🐶",
      description: "Croquettes, GPS, jouets, santé",
    },
    {
      name: "Chat",
      emoji: "🐱",
      description: "Arbres, litières, fontaines, jouets",
    },
    {
      name: "Petits animaux",
      emoji: "🐰",
      description: "Lapins, hamsters, rongeurs",
    },
    {
      name: "Accessoires",
      emoji: "🎒",
      description: "Transport, entretien, bien-être",
    },
  ];
