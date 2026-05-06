import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register Skinner brand fonts.
// We use full TTF files from the @fontsource jsdelivr CDN (not woff2 subsets) because:
//   1. fontkit (used by @react-pdf) handles TTFs more reliably than woff2 in some cases
//   2. The TTF files include the full latin range (with all Portuguese accents),
//      avoiding "Offset is outside the bounds of the DataView" errors when subsets miss glyphs
//   3. Italic variants must be registered explicitly — react-pdf does not synthesize italics
Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-300-normal.ttf", fontWeight: 300 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-600-normal.ttf", fontWeight: 600 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-300-italic.ttf", fontWeight: 300, fontStyle: "italic" },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/poppins@latest/latin-400-italic.ttf", fontWeight: 400, fontStyle: "italic" },
  ],
});

Font.register({
  family: "Lora",
  fonts: [
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-400-normal.ttf", fontWeight: 400 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-700-normal.ttf", fontWeight: 700 },
    { src: "https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-400-italic.ttf", fontWeight: 400, fontStyle: "italic" },
  ],
});

const colors = {
  blancCasse: "#F7F3EE",
  carbone: "#1C1917",
  pierre: "#7C7269",
  sable: "#C8BAA9",
  ivoire: "#EDE6DB",
  terre: "#3D342C",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: colors.blancCasse,
    padding: 50,
    fontFamily: "Poppins",
    fontSize: 9,
    color: colors.carbone,
  },
  // Cover
  coverPage: {
    backgroundColor: colors.blancCasse,
    padding: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontFamily: "Lora",
    fontSize: 28,
    color: colors.carbone,
    fontStyle: "italic",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontFamily: "Poppins",
    fontSize: 8,
    color: colors.pierre,
    letterSpacing: 4,
    textTransform: "uppercase",
    fontWeight: 300,
  },
  coverLine: {
    width: 40,
    height: 1,
    backgroundColor: colors.sable,
    marginVertical: 20,
  },
  coverLogo: {
    maxWidth: 180,
    maxHeight: 60,
    marginBottom: 16,
    objectFit: "contain",
  },
  coverInfo: {
    fontFamily: "Poppins",
    fontSize: 8,
    color: colors.pierre,
    fontWeight: 300,
    marginTop: 4,
  },
  // Section headers
  sectionTitle: {
    fontFamily: "Lora",
    fontSize: 16,
    color: colors.carbone,
    marginBottom: 12,
  },
  label: {
    fontFamily: "Poppins",
    fontSize: 7,
    color: colors.pierre,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: 300,
    marginBottom: 4,
  },
  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    border: `1 solid ${colors.sable}40`,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    color: colors.carbone,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 8,
    color: colors.pierre,
    fontWeight: 300,
    lineHeight: 1.5,
  },
  // Severity bar
  severityBar: {
    flexDirection: "row",
    gap: 2,
    marginTop: 6,
  },
  severitySegment: {
    height: 2,
    flex: 1,
  },
  // Divider
  divider: {
    width: "100%",
    height: 0.5,
    backgroundColor: colors.sable,
    marginVertical: 16,
  },
  // Product
  productRow: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: "#FFFFFF",
    border: `1 solid ${colors.sable}40`,
    marginBottom: 8,
  },
  productIndex: {
    width: 28,
    height: 28,
    backgroundColor: colors.ivoire,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 10,
    color: colors.carbone,
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 7,
    color: colors.pierre,
    fontWeight: 300,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  productReason: {
    fontSize: 8,
    color: colors.pierre,
    fontWeight: 300,
    marginTop: 4,
    lineHeight: 1.4,
  },
  productPrice: {
    fontSize: 10,
    color: colors.carbone,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6,
    color: colors.sable,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: 300,
  },
  // Phase card
  phaseCard: {
    backgroundColor: "#FFFFFF",
    border: `1 solid ${colors.sable}40`,
    padding: 14,
    marginBottom: 6,
  },
  phaseLabel: {
    fontSize: 8,
    color: colors.carbone,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  phasePeriod: {
    fontSize: 7,
    color: colors.pierre,
    fontWeight: 300,
    marginBottom: 6,
  },
  phaseText: {
    fontSize: 8,
    color: colors.pierre,
    fontWeight: 300,
    lineHeight: 1.5,
  },
  // Alert
  alertBox: {
    backgroundColor: colors.ivoire,
    border: `1 solid ${colors.sable}60`,
    padding: 14,
    marginTop: 12,
  },
  alertTitle: {
    fontSize: 7,
    color: colors.terre,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  alertItem: {
    fontSize: 8,
    color: colors.terre,
    fontWeight: 300,
    marginBottom: 2,
  },
});

// Localized PDF chrome strings. Per-locale block, looked up via `pdfStr(locale)`.
// REVIEW_TRANSLATION_HUMAN: dermatology/medical terminology in es/en review
// recommended. Severity scale and section headers are safe to AI-translate.
type Locale = "pt-BR" | "es" | "en";

const PDF_STRINGS: Record<
  Locale,
  {
    severity: string[]; // index 1/2/3
    skinType: Record<string, string>;
    condition: Record<string, string>;
    step: Record<string, string>;
    barrier: Record<string, string>;
    coverTitle: string;
    coverSubtitle: string;
    sectionDiagnosis: string;
    sectionDiagnosisTitle: (skinType: string) => string;
    barrierLabel: string;
    skinTypeLabel: string;
    conditionsLabel: string;
    actionPlanLabel: string;
    actionPlanTitle: string;
    phasePeriod: { p1: string; p2: string; p3: string };
    phaseName: { p1: string; p2: string; p3: string };
    expectations: string;
    weeks: { w4: string; w8: string; w12: string };
    alertSigns: string;
    recommendations: string;
    productsTitle: string;
    confidential: string;
  }
> = {
  "pt-BR": {
    severity: ["", "Leve", "Moderado", "Severo"],
    skinType: { oily: "Oleosa", dry: "Seca", combination: "Mista", normal: "Normal", sensitive: "Sensivel" },
    condition: {
      acne: "Acne", hyperpigmentation: "Hiperpigmentacao", aging: "Envelhecimento",
      dehydration: "Desidratacao", sensitivity: "Sensibilidade", rosacea: "Rosacea",
      pores: "Poros dilatados", dullness: "Opacidade", dark_circles: "Olheiras", oiliness: "Oleosidade",
    },
    step: {
      cleanser: "Limpeza", toner: "Tonico", serum: "Serum",
      moisturizer: "Hidratante", SPF: "Protetor Solar", treatment: "Tratamento",
    },
    barrier: { healthy: "Saudavel", compromised: "Comprometida", needs_attention: "Atencao necessaria" },
    coverTitle: "Analise de Pele",
    coverSubtitle: "Skinner — Skin Tech",
    sectionDiagnosis: "Diagnostico",
    sectionDiagnosisTitle: (s) => `Sua pele e ${s}`,
    barrierLabel: "Barreira cutanea",
    skinTypeLabel: "Tipo de pele",
    conditionsLabel: "Condicoes identificadas",
    actionPlanLabel: "Plano de acao",
    actionPlanTitle: "Tratamento personalizado",
    phasePeriod: { p1: "Semanas 1-2", p2: "Semanas 3-8", p3: "Mes 3+" },
    phaseName: { p1: "Fase 1", p2: "Fase 2", p3: "Fase 3" },
    expectations: "Expectativas",
    weeks: { w4: "4 semanas", w8: "8 semanas", w12: "12 semanas" },
    alertSigns: "Sinais de Alerta",
    recommendations: "Recomendacoes",
    productsTitle: "Produtos selecionados",
    confidential: "Confidencial",
  },
  es: {
    severity: ["", "Leve", "Moderado", "Severo"],
    skinType: { oily: "Grasa", dry: "Seca", combination: "Mixta", normal: "Normal", sensitive: "Sensible" },
    condition: {
      acne: "Acne", hyperpigmentation: "Hiperpigmentacion", aging: "Envejecimiento",
      dehydration: "Deshidratacion", sensitivity: "Sensibilidad", rosacea: "Rosacea",
      pores: "Poros dilatados", dullness: "Opacidad", dark_circles: "Ojeras", oiliness: "Oleosidad",
    },
    step: {
      cleanser: "Limpieza", toner: "Tonico", serum: "Serum",
      moisturizer: "Hidratante", SPF: "Protector Solar", treatment: "Tratamiento",
    },
    barrier: { healthy: "Saludable", compromised: "Comprometida", needs_attention: "Necesita atencion" },
    coverTitle: "Analisis de Piel",
    coverSubtitle: "Skinner — Skin Tech",
    sectionDiagnosis: "Diagnostico",
    sectionDiagnosisTitle: (s) => `Tu piel es ${s}`,
    barrierLabel: "Barrera cutanea",
    skinTypeLabel: "Tipo de piel",
    conditionsLabel: "Condiciones identificadas",
    actionPlanLabel: "Plan de accion",
    actionPlanTitle: "Tratamiento personalizado",
    phasePeriod: { p1: "Semanas 1-2", p2: "Semanas 3-8", p3: "Mes 3+" },
    phaseName: { p1: "Fase 1", p2: "Fase 2", p3: "Fase 3" },
    expectations: "Expectativas",
    weeks: { w4: "4 semanas", w8: "8 semanas", w12: "12 semanas" },
    alertSigns: "Senales de Alerta",
    recommendations: "Recomendaciones",
    productsTitle: "Productos seleccionados",
    confidential: "Confidencial",
  },
  en: {
    severity: ["", "Mild", "Moderate", "Severe"],
    skinType: { oily: "Oily", dry: "Dry", combination: "Combination", normal: "Normal", sensitive: "Sensitive" },
    condition: {
      acne: "Acne", hyperpigmentation: "Hyperpigmentation", aging: "Aging",
      dehydration: "Dehydration", sensitivity: "Sensitivity", rosacea: "Rosacea",
      pores: "Enlarged pores", dullness: "Dullness", dark_circles: "Dark circles", oiliness: "Oiliness",
    },
    step: {
      cleanser: "Cleanser", toner: "Toner", serum: "Serum",
      moisturizer: "Moisturizer", SPF: "Sunscreen", treatment: "Treatment",
    },
    barrier: { healthy: "Healthy", compromised: "Compromised", needs_attention: "Needs attention" },
    coverTitle: "Skin Analysis",
    coverSubtitle: "Skinner — Skin Tech",
    sectionDiagnosis: "Diagnosis",
    sectionDiagnosisTitle: (s) => `Your skin is ${s}`,
    barrierLabel: "Skin barrier",
    skinTypeLabel: "Skin type",
    conditionsLabel: "Identified conditions",
    actionPlanLabel: "Action plan",
    actionPlanTitle: "Personalized treatment",
    phasePeriod: { p1: "Weeks 1-2", p2: "Weeks 3-8", p3: "Month 3+" },
    phaseName: { p1: "Phase 1", p2: "Phase 2", p3: "Phase 3" },
    expectations: "Expectations",
    weeks: { w4: "4 weeks", w8: "8 weeks", w12: "12 weeks" },
    alertSigns: "Alert signs",
    recommendations: "Recommendations",
    productsTitle: "Selected products",
    confidential: "Confidential",
  },
};

function pdfStr(locale: Locale = "pt-BR") {
  return PDF_STRINGS[locale] ?? PDF_STRINGS["pt-BR"];
}

type ReportData = {
  tenantName: string;
  tenantLogoUrl?: string;
  clientName?: string;
  date: string;
  disclaimer?: string;
  analysis: {
    skin_type: string;
    conditions: { name: string; severity: number; description: string }[];
    barrier_status: string;
    summary: string;
    action_plan: { phase1: string; phase2: string; phase3: string };
    alert_signs: string[];
    timeline: { weeks4: string; weeks8: string; weeks12: string };
  };
  recommendations: {
    name: string;
    sku: string;
    price: number | null;
    stepRoutine: string | null;
    matchScore: number;
    reason: string;
    howToUse: string;
  }[];
};

export function SkinReport({
  data,
  locale = "pt-BR",
}: {
  data: ReportData;
  locale?: Locale;
}) {
  const { analysis, recommendations } = data;
  const L = pdfStr(locale);
  const skinTypeText = L.skinType[analysis.skin_type] ?? analysis.skin_type;
  const barrierText = L.barrier[analysis.barrier_status] ?? analysis.barrier_status;

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={s.coverPage}>
        {data.tenantLogoUrl && (
          // Tenant logo on the cover when configured. If the URL fails to load
          // at render time, react-pdf throws — wrap the whole route handler in
          // try/catch (already done in /api/report) so we degrade to a 500 with
          // a friendly Portuguese error rather than corrupting the PDF stream.
          <Image src={data.tenantLogoUrl} style={s.coverLogo} />
        )}
        <Text style={s.coverTitle}>{L.coverTitle}</Text>
        <Text style={s.coverSubtitle}>{L.coverSubtitle}</Text>
        <View style={s.coverLine} />
        {data.clientName && <Text style={s.coverInfo}>{data.clientName}</Text>}
        <Text style={s.coverInfo}>{data.date}</Text>
        <Text style={{ ...s.coverInfo, marginTop: 8 }}>{data.tenantName}</Text>
      </Page>

      {/* Diagnosis page */}
      <Page size="A4" style={s.page}>
        <Text style={s.label}>{L.sectionDiagnosis}</Text>
        <Text style={s.sectionTitle}>{L.sectionDiagnosisTitle(skinTypeText)}</Text>
        <Text style={s.cardText}>{analysis.summary}</Text>
        <View style={s.divider} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View>
            <Text style={s.label}>{L.barrierLabel}</Text>
            <Text style={{ fontSize: 10, color: colors.carbone }}>{barrierText}</Text>
          </View>
          <View>
            <Text style={s.label}>{L.skinTypeLabel}</Text>
            <Text style={{ fontSize: 10, color: colors.carbone }}>{skinTypeText}</Text>
          </View>
        </View>

        <Text style={s.label}>{L.conditionsLabel}</Text>
        {analysis.conditions.map((c) => (
          <View key={c.name} style={s.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={s.cardTitle}>{L.condition[c.name] ?? c.name}</Text>
              <Text style={{ fontSize: 7, color: colors.pierre }}>{L.severity[c.severity]}</Text>
            </View>
            <Text style={s.cardText}>{c.description}</Text>
            <View style={s.severityBar}>
              {[1, 2, 3].map((level) => (
                <View
                  key={level}
                  style={{
                    ...s.severitySegment,
                    backgroundColor: level <= c.severity ? colors.carbone : `${colors.sable}40`,
                  }}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>Skinner — Skin Tech</Text>
          <Text style={s.footerText}>{L.confidential}</Text>
        </View>
      </Page>

      {/* Action plan page */}
      <Page size="A4" style={s.page}>
        <Text style={s.label}>{L.actionPlanLabel}</Text>
        <Text style={s.sectionTitle}>{L.actionPlanTitle}</Text>

        {[
          { phase: L.phaseName.p1, period: L.phasePeriod.p1, text: analysis.action_plan.phase1 },
          { phase: L.phaseName.p2, period: L.phasePeriod.p2, text: analysis.action_plan.phase2 },
          { phase: L.phaseName.p3, period: L.phasePeriod.p3, text: analysis.action_plan.phase3 },
        ].map(({ phase, period, text }) => (
          <View key={phase} style={s.phaseCard}>
            <Text style={s.phaseLabel}>{phase}</Text>
            <Text style={s.phasePeriod}>{period}</Text>
            <Text style={s.phaseText}>{text}</Text>
          </View>
        ))}

        <View style={s.divider} />

        <Text style={s.label}>{L.expectations}</Text>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>{L.weeks.w4}</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks4}</Text>
        </View>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>{L.weeks.w8}</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks8}</Text>
        </View>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>{L.weeks.w12}</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks12}</Text>
        </View>

        {analysis.alert_signs.length > 0 && (
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>{L.alertSigns}</Text>
            {analysis.alert_signs.map((sign, i) => (
              <Text key={i} style={s.alertItem}>{sign}</Text>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Skinner — Skin Tech</Text>
          <Text style={s.footerText}>{L.confidential}</Text>
        </View>
      </Page>

      {/* Products page */}
      {recommendations.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.label}>{L.recommendations}</Text>
          <Text style={s.sectionTitle}>{L.productsTitle}</Text>

          {recommendations.map((rec, idx) => (
            <View key={idx} style={s.productRow}>
              <View style={s.productIndex}>
                <Text style={{ fontSize: 8, color: colors.pierre }}>#{idx + 1}</Text>
              </View>
              <View style={s.productInfo}>
                <Text style={s.productName}>{rec.name}</Text>
                <Text style={s.productMeta}>
                  {rec.stepRoutine ? L.step[rec.stepRoutine] ?? rec.stepRoutine : ""}{" "}
                  {rec.sku}
                </Text>
                <Text style={s.productReason}>{rec.reason}</Text>
                <Text
                  style={{
                    ...s.productReason,
                    fontFamily: "Lora",
                    fontStyle: "italic",
                    fontWeight: 400,
                    marginTop: 2,
                  }}
                >
                  {rec.howToUse}
                </Text>
              </View>
              {rec.price && <Text style={s.productPrice}>R$ {rec.price.toFixed(2)}</Text>}
            </View>
          ))}

          {data.disclaimer && (
            <>
              <View style={s.divider} />
              <Text
                style={{
                  fontSize: 7,
                  color: colors.pierre,
                  fontFamily: "Lora",
                  fontStyle: "italic",
                  fontWeight: 400,
                }}
              >
                {data.disclaimer}
              </Text>
            </>
          )}

          <View style={s.footer}>
            <Text style={s.footerText}>Skinner — Skin Tech</Text>
            <Text style={s.footerText}>Confidencial</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
