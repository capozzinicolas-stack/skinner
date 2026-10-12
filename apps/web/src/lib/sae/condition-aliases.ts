// The knowledge base holds two vocabularies for the same skin concerns:
// simple IDs used by the questionnaire and catalog tags ("aging",
// "hyperpigmentation"...) and clinical IDs from the dermatology KB
// ("envelhecimento_cronologico", "melasma"...). Claude may answer with
// either. Catalog items are tagged with the simple IDs, so the matcher and
// the projection translate clinical IDs to their simple equivalents before
// comparing. Unknown IDs map to themselves.
const CLINICAL_TO_SIMPLE: Record<string, string[]> = {
  acne_vulgaris: ["acne"],
  melasma: ["hyperpigmentation"],
  hiperpigmentacao_pos_inflamatoria: ["hyperpigmentation", "acne_scars"],
  eritema_pos_inflamatorio: ["sensitivity", "acne_scars"],
  envelhecimento_cronologico: ["aging"],
  envelhecimento_fotoinducido: ["aging", "hyperpigmentation"],
  dermatite_atopica: ["sensitivity"],
  dermatite_seborreica: ["sensitivity", "oiliness"],
  dermatite_contato: ["sensitivity"],
  dermatite_perioral: ["sensitivity"],
  desidratacao_cutanea: ["dehydration"],
  barreira_comprometida: ["sensitivity", "dehydration"],
  pele_sensivel: ["sensitivity"],
  poros_dilatados: ["pores", "texture"],
  oleosidade_excessiva: ["oiliness"],
  olheiras: ["dark_circles"],
  opacidade_textura_irregular: ["dullness", "texture"],
  keratosis_pilaris: ["texture"],
  milia: ["texture"],
};

/** Simple concern IDs equivalent to a condition name (itself included). */
export function concernEquivalents(name: string): string[] {
  return [name, ...(CLINICAL_TO_SIMPLE[name] ?? [])];
}
