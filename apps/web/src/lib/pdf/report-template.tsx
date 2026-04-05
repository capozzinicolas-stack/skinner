import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Register Skinners brand fonts
Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLGT9Z1JlFd2JQEl8qw.woff2", fontWeight: 300 },
    { src: "https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrJJfecg.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6Z1JlFd2JQEl8qw.woff2", fontWeight: 600 },
  ],
});

Font.register({
  family: "Lora",
  fonts: [
    { src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq0.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/lora/v35/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkq0.woff2", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/lora/v35/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq92nA.woff2", fontWeight: 400, fontStyle: "italic" },
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

const severityLabels = ["", "Leve", "Moderado", "Severo"];
const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa", dry: "Seca", combination: "Mista", normal: "Normal", sensitive: "Sensivel",
};
const conditionLabels: Record<string, string> = {
  acne: "Acne", hyperpigmentation: "Hiperpigmentacao", aging: "Envelhecimento",
  dehydration: "Desidratacao", sensitivity: "Sensibilidade", rosacea: "Rosacea",
  pores: "Poros dilatados", dullness: "Opacidade", dark_circles: "Olheiras", oiliness: "Oleosidade",
};
const stepLabels: Record<string, string> = {
  cleanser: "Limpeza", toner: "Tonico", serum: "Serum",
  moisturizer: "Hidratante", SPF: "Protetor Solar", treatment: "Tratamento",
};

type ReportData = {
  tenantName: string;
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

export function SkinReport({ data }: { data: ReportData }) {
  const { analysis, recommendations } = data;
  const barrierLabel = {
    healthy: "Saudavel",
    compromised: "Comprometida",
    needs_attention: "Atencao necessaria",
  }[analysis.barrier_status] ?? analysis.barrier_status;

  return (
    <Document>
      {/* Cover page */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverTitle}>Analise de Pele</Text>
        <Text style={s.coverSubtitle}>Skinners</Text>
        <View style={s.coverLine} />
        {data.clientName && <Text style={s.coverInfo}>{data.clientName}</Text>}
        <Text style={s.coverInfo}>{data.date}</Text>
        <Text style={{ ...s.coverInfo, marginTop: 8 }}>{data.tenantName}</Text>
      </Page>

      {/* Diagnosis page */}
      <Page size="A4" style={s.page}>
        <Text style={s.label}>Diagnostico</Text>
        <Text style={s.sectionTitle}>
          Sua pele e {skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}
        </Text>
        <Text style={s.cardText}>{analysis.summary}</Text>
        <View style={s.divider} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
          <View>
            <Text style={s.label}>Barreira cutanea</Text>
            <Text style={{ fontSize: 10, color: colors.carbone }}>{barrierLabel}</Text>
          </View>
          <View>
            <Text style={s.label}>Tipo de pele</Text>
            <Text style={{ fontSize: 10, color: colors.carbone }}>
              {skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}
            </Text>
          </View>
        </View>

        <Text style={s.label}>Condicoes identificadas</Text>
        {analysis.conditions.map((c) => (
          <View key={c.name} style={s.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={s.cardTitle}>{conditionLabels[c.name] ?? c.name}</Text>
              <Text style={{ fontSize: 7, color: colors.pierre }}>{severityLabels[c.severity]}</Text>
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
          <Text style={s.footerText}>Skinners — Skin Intelligence</Text>
          <Text style={s.footerText}>Confidencial</Text>
        </View>
      </Page>

      {/* Action plan page */}
      <Page size="A4" style={s.page}>
        <Text style={s.label}>Plano de acao</Text>
        <Text style={s.sectionTitle}>Tratamento personalizado</Text>

        {[
          { phase: "Fase 1", period: "Semanas 1-2", text: analysis.action_plan.phase1 },
          { phase: "Fase 2", period: "Semanas 3-8", text: analysis.action_plan.phase2 },
          { phase: "Fase 3", period: "Mes 3+", text: analysis.action_plan.phase3 },
        ].map(({ phase, period, text }) => (
          <View key={phase} style={s.phaseCard}>
            <Text style={s.phaseLabel}>{phase}</Text>
            <Text style={s.phasePeriod}>{period}</Text>
            <Text style={s.phaseText}>{text}</Text>
          </View>
        ))}

        <View style={s.divider} />

        <Text style={s.label}>Expectativas</Text>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>4 semanas</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks4}</Text>
        </View>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>8 semanas</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks8}</Text>
        </View>
        <View style={s.card}>
          <Text style={{ ...s.phaseLabel, marginBottom: 4 }}>12 semanas</Text>
          <Text style={s.cardText}>{analysis.timeline.weeks12}</Text>
        </View>

        {analysis.alert_signs.length > 0 && (
          <View style={s.alertBox}>
            <Text style={s.alertTitle}>Sinais de Alerta</Text>
            {analysis.alert_signs.map((sign, i) => (
              <Text key={i} style={s.alertItem}>{sign}</Text>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <Text style={s.footerText}>Skinners — Skin Intelligence</Text>
          <Text style={s.footerText}>Confidencial</Text>
        </View>
      </Page>

      {/* Products page */}
      {recommendations.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.label}>Recomendacoes</Text>
          <Text style={s.sectionTitle}>Produtos selecionados</Text>

          {recommendations.map((rec, idx) => (
            <View key={idx} style={s.productRow}>
              <View style={s.productIndex}>
                <Text style={{ fontSize: 8, color: colors.pierre }}>#{idx + 1}</Text>
              </View>
              <View style={s.productInfo}>
                <Text style={s.productName}>{rec.name}</Text>
                <Text style={s.productMeta}>
                  {rec.stepRoutine ? stepLabels[rec.stepRoutine] ?? rec.stepRoutine : ""}{" "}
                  {rec.sku}
                </Text>
                <Text style={s.productReason}>{rec.reason}</Text>
                <Text style={{ ...s.productReason, fontStyle: "italic", marginTop: 2 }}>
                  {rec.howToUse}
                </Text>
              </View>
              {rec.price && <Text style={s.productPrice}>R$ {rec.price.toFixed(2)}</Text>}
            </View>
          ))}

          {data.disclaimer && (
            <>
              <View style={s.divider} />
              <Text style={{ fontSize: 7, color: colors.pierre, fontStyle: "italic", fontWeight: 300 }}>
                {data.disclaimer}
              </Text>
            </>
          )}

          <View style={s.footer}>
            <Text style={s.footerText}>Skinners — Skin Intelligence</Text>
            <Text style={s.footerText}>Confidencial</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
