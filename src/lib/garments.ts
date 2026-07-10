// src/lib/garments.ts
// Line-art wardrobe, shared by the scroll story and the week reel.
// Every path carries pathLength="1" at the call site so it can be "drawn"
// by scroll via stroke-dashoffset — the same vocabulary as the hero's mark.

export const HANGER = [
  "M60 22c0-7-3-12 3-14 5-1.6 9 2 7.5 6.5",     // hook
  "M60 22 L33 47 Q60 56 87 47 Z",                // triangle bar
];

export interface Garment {
  line: string[];
  gold: string[];
}

export const GARMENTS: Record<string, Garment> = {
  blazer: {
    line: ["M39 47C33 66 32 108 35 150 L57 150 L59 84 L61 84 L63 150 L85 150 C88 108 87 66 81 47"],
    gold: ["M59 52 L51 92", "M61 52 L69 92", "M52 49 L59 63", "M68 49 L61 63"],
  },
  knit: {
    line: ["M39 47C31 60 27 74 30 96 L38 92 C34 118 35 140 38 150 L82 150 C86 140 87 118 82 92 L90 96 C93 74 89 60 81 47"],
    gold: ["M50 48 Q60 58 70 48", "M42 146 L42 150", "M54 146 L54 150", "M66 146 L66 150", "M78 146 L78 150"],
  },
  dress: {
    line: ["M41 47C37 60 39 74 42 86 L30 152 L90 152 L78 86 C81 74 83 60 79 47"],
    gold: ["M42 86 L78 86", "M52 48 Q60 56 68 48"],
  },
  shirt: {
    line: ["M40 47C36 62 35 108 37 150 L83 150 C85 108 84 62 80 47", "M40 47C31 62 29 82 34 96", "M80 47C89 62 91 82 86 96"],
    gold: ["M53 47 L60 57 L67 47", "M60 57 L60 150"],
  },
  coat: {
    line: ["M38 47C32 66 31 116 34 158 L57 158 L59 88 L61 88 L63 158 L86 158 C89 116 88 66 82 47"],
    gold: ["M59 52 L49 98", "M61 52 L71 98", "M35 102 L85 102"],
  },
  tee: {
    line: ["M36 47C33 55 31 63 33 70 L40 66 C38 100 39 130 41 150 L79 150 C81 130 82 100 80 66 L87 70 C89 63 87 55 84 47"],
    gold: ["M50 48 Q60 57 70 48"],
  },
  cardigan: {
    line: ["M39 47C33 64 32 110 35 152 L58 152 L58 66", "M62 66 L62 152 L85 152 C88 110 87 64 81 47"],
    gold: ["M52 49 L58 66", "M68 49 L62 66"],
  },
};
