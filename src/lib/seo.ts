// src/lib/seo.ts
export interface SeoInput {
  title: string;
  description: string;
  path: string;            // e.g. "/manifesto"
  ogImage?: string;        // absolute or root-relative
  type?: "website" | "article";
}

export const SITE_URL = "https://burs.me";
export const DEFAULT_OG = "/og-image.png";

export function buildSeo(input: SeoInput) {
  const url = new URL(input.path, SITE_URL).toString();
  const ogImage = new URL(input.ogImage ?? DEFAULT_OG, SITE_URL).toString();
  return {
    title: input.title,
    description: input.description,
    canonical: url,
    ogImage,
    type: input.type ?? "website"
  };
}
