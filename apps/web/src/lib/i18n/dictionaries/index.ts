import type { Locale } from "../types";
import { ptBR } from "./pt-BR";
import { es } from "./es";
import { en } from "./en";

export const dictionaries = {
  "pt-BR": ptBR,
  es,
  en,
} as const;

export type Dictionary = typeof ptBR;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? ptBR;
}
