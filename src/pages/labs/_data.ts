// src/pages/labs/_data.ts
// Shared act content for the showcase lab variants. Mirrors ActsScroll copy.
export interface LabAct {
  index: number;
  numeral: string;
  eyebrow: string;
  headline: string;
  lede: string;
  image: string;
  imageAlt: string;
  notes: [string, string];
}

export const labActs: LabAct[] = [
  {
    index: 1,
    numeral: "I",
    eyebrow: "ONE — THE CLOSET, READ",
    headline: "A stylist who's memorised your closet.",
    lede: "Every outfit, built from what you already own. Styled for the weather, the occasion, and you.",
    image: "/assets/act-i-wardrobe-screen.jpeg?v=2",
    imageAlt: "BURS wardrobe scan in progress, displaying tagged garments",
    notes: ["Wardrobe scanned — every piece tagged", "Searchable by colour, cut, season"]
  },
  {
    index: 2,
    numeral: "II",
    eyebrow: "TWO — THE DAY, UNDERSTOOD",
    headline: "The weather. Your day. <em>Yesterday's</em> outfit.",
    lede: "Before BURS recommends anything, it reads the weather, your calendar, your location, and yesterday's outfit. The day, understood.",
    image: "/assets/act-ii-context-screen.jpeg?v=2",
    imageAlt: "BURS reading the day's context: weather, calendar, location",
    notes: ["Reads weather, calendar, location", "Remembers yesterday's outfit"]
  },
  {
    index: 3,
    numeral: "III",
    eyebrow: "THREE — TALK TO IT",
    headline: "A stylist that <em>refines</em> in a sentence.",
    lede: "Ask in plain language. The stylist answers using pieces already in your wardrobe.",
    image: "/assets/act-iii-stylist-screen.jpeg?v=2",
    imageAlt: "BURS AI stylist chat showing outfit refinements",
    notes: ["Refine in plain language", "Answers from your closet only"]
  },
  {
    index: 4,
    numeral: "IV",
    eyebrow: "FOUR — THE WEEK, DRAFTED",
    headline: "Monday's pitch. Thursday's dinner. <em>Saturday's</em> off-site.",
    lede: "Sync your calendar and BURS drafts an outfit for every event. Swap any piece with one tap.",
    image: "/assets/act-iv-week-screen.jpeg?v=2",
    imageAlt: "BURS week planner showing outfits for Monday through Sunday",
    notes: ["An outfit drafted for every event", "Swap any piece with one tap"]
  },
  {
    index: 5,
    numeral: "V",
    eyebrow: "FIVE — THE TRIP, PACKED",
    headline: "Pack a city in <em>twelve</em> pieces.",
    lede: "Tell BURS where you're going and for how long. It builds a minimum-viable capsule from your wardrobe — every piece earning its place, every outfit pre-imagined.",
    image: "/assets/act-v-travel-screen.jpeg?v=2",
    imageAlt: "BURS travel capsule builder showing 12-piece capsule for a 4-day trip",
    notes: ["Twelve pieces, sixteen outfits", "Packed for the forecast"]
  }
];
