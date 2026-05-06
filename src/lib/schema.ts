// src/lib/schema.ts
export const SITE = "https://burs.me";
export const BRAND = "BURS";

const ORG = {
  "@type": "Organization",
  "@id": `${SITE}#org`,
  name: BRAND,
  url: SITE,
  logo: `${SITE}/logo-512.png`,
  sameAs: [] as string[],
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@burs.me",
    availableLanguage: ["English", "Swedish"]
  }]
};

const WEBSITE = {
  "@type": "WebSite",
  "@id": `${SITE}#website`,
  url: SITE,
  name: BRAND,
  publisher: { "@id": `${SITE}#org` }
};

export function organization() { return wrap(ORG); }
export function website() { return wrap(WEBSITE); }

export function softwareApplication() {
  return wrap({
    "@type": "SoftwareApplication",
    name: BRAND,
    applicationCategory: "LifestyleApplication",
    operatingSystem: "iOS, Android",
    description: "An AI wardrobe stylist. Scans your closet, reads the day, recommends one outfit.",
    offers: [
      offerObject("EUR", 10.99, "P1M"),
      offerObject("EUR", 89.99, "P1Y"),
      offerObject("SEK", 119, "P1M"),
      offerObject("SEK", 899, "P1Y")
    ]
  });
}

export function product() {
  return wrap({
    "@type": "Product",
    name: "BURS Premium",
    brand: { "@type": "Brand", name: BRAND },
    description: "Wardrobe scanning, context-aware outfit of the day, AI Stylist chat, week planner, travel capsule builder.",
    offers: [
      offerObject("EUR", 10.99, "P1M"),
      offerObject("EUR", 89.99, "P1Y"),
      offerObject("SEK", 119, "P1M"),
      offerObject("SEK", 899, "P1Y")
    ]
  });
}

export function article(input: {
  headline: string; description: string; url: string;
  datePublished: string; dateModified?: string; image?: string;
}) {
  return wrap({
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    image: input.image ?? `${SITE}/og-image.png`,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { "@id": `${SITE}#org` },
    publisher: { "@id": `${SITE}#org` },
    mainEntityOfPage: input.url
  });
}

export function faqPage(qa: Array<{ q: string; a: string }>) {
  return wrap({
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  });
}

export function howTo(input: { name: string; description: string; steps: Array<{ name: string; text: string }>; }) {
  return wrap({
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text
    }))
  });
}

export function breadcrumbs(items: Array<{ name: string; url: string }>) {
  return wrap({
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url
    }))
  });
}

function offerObject(currency: string, price: number, duration: "P1M" | "P1Y") {
  return {
    "@type": "Offer",
    price,
    priceCurrency: currency,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: currency,
      billingDuration: duration,
      unitCode: duration === "P1M" ? "MON" : "ANN"
    }
  };
}

function wrap(obj: Record<string, unknown>) {
  return { "@context": "https://schema.org", ...obj };
}
