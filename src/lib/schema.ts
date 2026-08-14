// src/lib/schema.ts
import { PRICES, FOUNDING, TRIAL_DAYS } from "./prices";

export const SITE = "https://www.burs.me";
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
    offers: standardOffers()
  });
}

export function product() {
  return wrap({
    "@type": "Product",
    name: "BURS Premium",
    brand: { "@type": "Brand", name: BRAND },
    description: "Wardrobe scanning, context-aware outfit of the day, AI Stylist chat, week planner, travel capsule builder.",
    offers: standardOffers()
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

/**
 * Every plan we sell, each carrying the 30-day trial, plus the founding
 * membership for the launch year. Driven off prices.ts so the advertised
 * price and the structured data can never drift apart.
 */
function standardOffers() {
  const month = PRICES.find(p => p.period === "month")!;
  const year = PRICES.find(p => p.period === "year")!;
  return [
    offerObject(month.currency, month.amount, "P1M", { trialDays: TRIAL_DAYS }),
    offerObject(year.currency, year.amount, "P1Y", { trialDays: TRIAL_DAYS }),
    offerObject(FOUNDING.currency, FOUNDING.amount, "P1Y", {
      name: "Founding membership — first year",
      trialDays: TRIAL_DAYS
    })
  ];
}

function offerObject(
  currency: string,
  price: number,
  duration: "P1M" | "P1Y",
  opts: { name?: string; trialDays?: number } = {}
) {
  const offer: Record<string, unknown> = {
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
  if (opts.name) offer.name = opts.name;
  // The trial is expressed as a zero-price introductory term on the same
  // offer, so the advertised price and the free period travel together
  // rather than reading as a separate free product.
  if (opts.trialDays) {
    offer.eligibleDuration = {
      "@type": "QuantitativeValue",
      value: opts.trialDays,
      unitCode: "DAY",
      name: `${opts.trialDays}-day free trial`
    };
  }
  return offer;
}

// Generic so the returned type keeps the caller's own keys. Typed as
// `Record<string, unknown>` the spread was erased down to `{ "@context" }`,
// which made every property access on a built schema a type error.
function wrap<T extends Record<string, unknown>>(obj: T) {
  return { "@context": "https://schema.org" as const, ...obj };
}
