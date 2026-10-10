// The catalog form stores optional category / line / brand metadata as a
// prefix inside Product.description:
//   "[Category: X | Line: Y | Brand: Z] free text"
// (older rows: "[Category: X | Line: Y] free text"). Patient-facing surfaces
// must never show that prefix, so they read descriptions through
// stripDescriptionMeta. The form uses encode/decode to round-trip it.

export const META_PREFIX_RE = /^\[Category: (.*?) \| Line: (.*?) \| Brand: (.*?)\] ?/;
export const META_PREFIX_RE_OLD = /^\[Category: (.*?) \| Line: (.*?)\] ?/;

export function encodeDescription(
  category: string,
  productLine: string,
  brand: string,
  description: string
): string {
  const base = description.replace(META_PREFIX_RE, "").replace(META_PREFIX_RE_OLD, "");
  if (!category && !productLine && !brand) return base;
  return `[Category: ${category} | Line: ${productLine} | Brand: ${brand}] ${base}`;
}

export function decodeDescription(raw: string | null | undefined): {
  category: string;
  productLine: string;
  brand: string;
  description: string;
} {
  if (!raw) return { category: "", productLine: "", brand: "", description: "" };
  const match = raw.match(META_PREFIX_RE);
  if (match) {
    return {
      category: match[1] ?? "",
      productLine: match[2] ?? "",
      brand: match[3] ?? "",
      description: raw.replace(META_PREFIX_RE, ""),
    };
  }
  // Backwards compat with old format without brand
  const oldMatch = raw.match(META_PREFIX_RE_OLD);
  if (oldMatch) {
    return {
      category: oldMatch[1] ?? "",
      productLine: oldMatch[2] ?? "",
      brand: "",
      description: raw.replace(META_PREFIX_RE_OLD, ""),
    };
  }
  return { category: "", productLine: "", brand: "", description: raw };
}

export function stripDescriptionMeta(raw: string | null | undefined): string {
  return decodeDescription(raw).description;
}
