import Image from "next/image";
import Link from "next/link";
import { resolveLocale } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";

// Localized copy for the home page. Adding a new locale: add a top-level
// key here AND in es.ts/en.ts dictionaries (handled separately for chrome
// strings). REVIEW_TRANSLATION_HUMAN: es/en done by AI — review with
// native speakers before high-traffic launches in those markets.
type HomeCopy = {
  heroPill: string;
  heroTitleLine1: string;
  heroTitleHighlight: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  stripStats: { v: string; l: string }[];
  diagnosticLabel: string;
  diagnosticType: string;
  diagnosticTypeValue: string;
  diagnosticPhototype: string;
  diagnosticAcne: string;
  diagnosticHyperpig: string;
  diagnosticBarrier: string;
  diagnosticBarrierValue: string;
  routineLabel: string;
  routineItems: { name: string; meta: string; score: number }[];
  faceCardTimestamp: string;
  faceCardName: string;
  processEyebrow: string;
  processTitleLine1: string;
  processTitleLine2: string;
  steps: { n: string; t: string; d: string }[];
  reportEyebrow: string;
  reportTitleStart: string;
  reportTitleHighlight: string;
  reportTitleEnd: string;
  reportBodyPart1: string;
  reportBodyEmphasis: string;
  reportBodyPart2: string;
  reportBullets: string[];
  mockReportLabel: string;
  mockSkinTitleStart: string;
  mockSkinHighlight: string;
  mockSkinTitleEnd: string;
  mockConditionsCount: string;
  mockConditionsLabel: string;
  mockConditions: { name: string; sub: string; sev: number[] }[];
  mockTzone: string;
  mockMancha: string;
  dashEyebrow: string;
  dashTitleStart: string;
  dashTitleHighlight: string;
  dashTitleEnd: string;
  dashBody: string;
  dashGreeting: string;
  dashPanelLabel: string;
  dashKpis: { l: string; v: string; d: string }[];
  hlStats: { value: string; label: string }[];
  projEyebrow: string;
  projTitleStart: string;
  projTitleHighlight: string;
  projTitleEnd: string;
  projBody: string;
  projCards: { when: string; title: string; pct: string | null; src: string; alt: string }[];
  projDisclaimer: string;
  segmentsEyebrow: string;
  segmentsTitleLine1: string;
  segmentsTitleLine2Start: string;
  segmentsTitleLine2Highlight: string;
  segments: { num: string; title: string; desc: string; href: string; feat: boolean }[];
  segmentsCta: string;
  resultsEyebrow: string;
  resultsTitleStart: string;
  resultsTitleHighlight: string;
  resultsTitleEnd: string;
  stats: { value: string; label: string }[];
  quotes: { text: string; author: string; role: string }[];
  finalEyebrow: string;
  finalTitleLine1: string;
  finalTitleLine2: string;
  finalBody: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;
};

const COPY: Record<Locale, HomeCopy> = {
  "pt-BR": {
    heroPill: "skin tech",
    heroTitleLine1: "A pele é ",
    heroTitleHighlight: "dados",
    heroTitleLine2: ".\nNós lemos.",
    heroSubtitle: "IA que analisa a pele em 3 minutos, recomenda produtos do seu catálogo e mede a venda. Para clínicas, farmácias, laboratórios e retailers.",
    heroCtaPrimary: "Solicitar demo →",
    heroCtaSecondary: "Ver o produto",
    stripStats: [
      { v: "+38%", l: "Conversão Média" },
      { v: "3 min", l: "Análise Completa" },
      { v: "0.87", l: "Match Score IA" },
    ],
    diagnosticLabel: "Diagnóstico",
    diagnosticType: "Tipo",
    diagnosticTypeValue: "Mista",
    diagnosticPhototype: "Fototipo",
    diagnosticAcne: "Acne leve",
    diagnosticHyperpig: "Hiperpigmentação",
    diagnosticBarrier: "Barreira",
    diagnosticBarrierValue: "forte",
    routineLabel: "Rotina recomendada",
    routineItems: [
      { name: "Sérum Vit. C 15%", meta: "Mancha · Antioxidante", score: 94 },
      { name: "Hidratante Ceramidas", meta: "Mancha · Barreira", score: 91 },
      { name: "FPS 50+ Fluido", meta: "Mancha · Fotoproteção", score: 98 },
    ],
    faceCardTimestamp: "Análise · 14:32 BRT",
    faceCardName: "Mariana, 32",
    processEyebrow: "Processo · 4 etapas",
    processTitleLine1: "Da foto ao plano de tratamento.",
    processTitleLine2: "Em três minutos.",
    steps: [
      { n: "01", t: "Questionário", d: "7 perguntas sobre tipo de pele, preocupações e objetivos." },
      { n: "02", t: "Foto facial", d: "Frontal com boa luz. Processada e descartada após análise." },
      { n: "03", t: "Análise IA", d: "Identifica condições, severidade e estado da barreira cutânea." },
      { n: "04", t: "Recomendação", d: "Produtos do seu catálogo, ordenados por match score." },
    ],
    reportEyebrow: "Relatório do paciente",
    reportTitleStart: "Um diagnóstico que ",
    reportTitleHighlight: "vende sozinho",
    reportTitleEnd: ".",
    reportBodyPart1: "Cada análise gera um relatório dermatológico claro: condições detectadas, severidade e a rotina ideal — montada com produtos do ",
    reportBodyEmphasis: "seu",
    reportBodyPart2: " catálogo. Pronto para enviar por WhatsApp, exportar em PDF ou imprimir no PDV.",
    reportBullets: [
      "Match score por produto baseado em 142 atributos",
      "Severidade em escala clínica de 5 níveis",
      "Compatível com receituário e prontuário eletrônico",
      "Marca branca — fica com a identidade do seu negócio",
    ],
    mockReportLabel: "Relatório de pele",
    mockSkinTitleStart: "Pele ",
    mockSkinHighlight: "mista",
    mockSkinTitleEnd: ", fototipo III",
    mockConditionsCount: "7 condições detectadas · barreira íntegra",
    mockConditionsLabel: "Condições",
    mockConditions: [
      { name: "Acne leve", sub: "T-zone", sev: [1,1,1,0,0] },
      { name: "Hiperpigmentação", sub: "pós-inflamatória", sev: [1,1,0,0,0] },
      { name: "Oleosidade", sub: "moderada", sev: [1,1,1,0,0] },
      { name: "Linhas finas", sub: "periorbital", sev: [1,0,0,0,0] },
    ],
    mockTzone: "T-zone · oleosidade 0.71",
    mockMancha: "Mancha · 4mm",
    dashEyebrow: "Painel de gestão",
    dashTitleStart: "Dados duros sobre ",
    dashTitleHighlight: "cada venda",
    dashTitleEnd: ".",
    dashBody: "Atribuição completa: qual produto foi recomendado, em qual canal, para qual tipo de pele, e o que converteu em receita. Métricas que conselho consultivo e diretor comercial entendem na primeira reunião.",
    dashGreeting: "Boa tarde, Dra. Helena",
    dashPanelLabel: "Painel · Abril 2026",
    dashKpis: [
      { l: "Análises", v: "1.842", d: "+24% mês" },
      { l: "Conversão", v: "8,9%", d: "+1,2pp" },
      { l: "Receita", v: "R$ 47k", d: "+38%" },
      { l: "Match", v: "0.81", d: "+0.04" },
    ],
    hlStats: [
      { value: "1.842", label: "análises / mês (média growth)" },
      { value: "8.9%", label: "taxa de conversão recomend → venda" },
      { value: "R$ 47k", label: "receita atribuída média / mês" },
      { value: "+38%", label: "vs. recomendação humana" },
    ],
    projEyebrow: "Projeção de evolução",
    projTitleStart: "O paciente ",
    projTitleHighlight: "vê o futuro",
    projTitleEnd: " da pele dele.",
    projBody: "Visualizações de 8 e 12 semanas com aderência à rotina recomendada. É o gatilho de compra mais forte que existe: ver o resultado antes.",
    projCards: [
      { when: "Hoje · semana 0", title: "Estado atual", pct: null, src: "/marketing/projection/state-current.jpg", alt: "Estado atual da pele com manchas e acne ativa" },
      { when: "Projeção · 8 semanas", title: "Melhora moderada", pct: "-52%", src: "/marketing/projection/state-week-8.jpg", alt: "Projeção de melhora em 8 semanas" },
      { when: "Projeção · 12 semanas", title: "Aderência alta", pct: "-81%", src: "/marketing/projection/state-week-12.jpg", alt: "Projeção de melhora em 12 semanas" },
    ],
    projDisclaimer: "Imagens ilustrativas geradas por IA. Resultados reais variam conforme aderência ao protocolo, biotipo e condições individuais.",
    segmentsEyebrow: "Para quem é",
    segmentsTitleLine1: "Quatro jeitos de usar.",
    segmentsTitleLine2Start: "Mesma ",
    segmentsTitleLine2Highlight: "tecnologia",
    segments: [
      { num: "I", title: "Laboratórios", desc: "Seu catálogo virando recomendação personalizada em milhares de pontos de contato — direto na ponta com o consumidor final.", href: "/segmentos?tab=laboratorios", feat: false },
      { num: "II", title: "Clínicas", desc: "Diagnóstico IA antes da consulta: o paciente chega 70% mais educado e a venda do tratamento fica muito mais fluida.", href: "/segmentos?tab=clinicas", feat: true },
      { num: "III", title: "Farmácias", desc: "Tablet no balcão. Análise em 3 minutos. Ticket médio de skincare 2.4x maior comparado a clientes sem análise.", href: "/segmentos?tab=farmacias", feat: false },
      { num: "IV", title: "Varejo", desc: "Análise no e-commerce ou loja. O cliente entende o que precisa e finaliza no carrinho com mais confiança e ticket maior.", href: "/segmentos?tab=varejo", feat: false },
    ],
    segmentsCta: "Ver caso →",
    resultsEyebrow: "Resultados — base de clientes ativos",
    resultsTitleStart: "Os ",
    resultsTitleHighlight: "números",
    resultsTitleEnd: " que importam.",
    stats: [
      { value: "+38%", label: "conversão recomendação → venda\nvs. baseline humano" },
      { value: "2.4x", label: "ticket médio em skincare\ncom análise vs. sem análise" },
      { value: "0.87", label: "match score médio\n(escala 0—1)" },
      { value: "91%", label: "satisfação do consumidor final\nNPS pós-análise" },
    ],
    quotes: [
      { text: "Em 4 meses, o Skinner virou o nosso melhor canal de venda de skincare. A conversão por sessão é 3x a da abordagem tradicional.", author: "Dra. Helena Rocha", role: "Diretora · Clínica Pele Bela · SP" },
      { text: "Consegui ativar 380 farmácias em 6 meses. O painel de atribuição mata qualquer discussão sobre ROI no comitê.", author: "Rafael Andrade", role: "VP Comercial · Laboratório (NDA)" },
    ],
    finalEyebrow: "Próximo passo",
    finalTitleLine1: "Pronto pra ler a pele",
    finalTitleLine2: "dos seus clientes?",
    finalBody: "Demo de 25 minutos com o time de produto. Saímos com um plano-piloto desenhado pro seu negócio.",
    finalCtaPrimary: "Solicitar demo",
    finalCtaSecondary: "Ver planos →",
  },
  es: {
    heroPill: "skin tech",
    heroTitleLine1: "La piel son ",
    heroTitleHighlight: "datos",
    heroTitleLine2: ".\nNosotros los leemos.",
    heroSubtitle: "IA que analiza la piel en 3 minutos, recomienda productos de tu catálogo y mide la venta. Para clínicas, farmacias, laboratorios y retailers.",
    heroCtaPrimary: "Solicitar demo →",
    heroCtaSecondary: "Ver el producto",
    stripStats: [
      { v: "+38%", l: "Conversión Media" },
      { v: "3 min", l: "Análisis Completo" },
      { v: "0.87", l: "Match Score IA" },
    ],
    diagnosticLabel: "Diagnóstico",
    diagnosticType: "Tipo",
    diagnosticTypeValue: "Mixta",
    diagnosticPhototype: "Fototipo",
    diagnosticAcne: "Acné leve",
    diagnosticHyperpig: "Hiperpigmentación",
    diagnosticBarrier: "Barrera",
    diagnosticBarrierValue: "fuerte",
    routineLabel: "Rutina recomendada",
    routineItems: [
      { name: "Sérum Vit. C 15%", meta: "Mancha · Antioxidante", score: 94 },
      { name: "Hidratante Ceramidas", meta: "Mancha · Barrera", score: 91 },
      { name: "FPS 50+ Fluido", meta: "Mancha · Fotoprotección", score: 98 },
    ],
    faceCardTimestamp: "Análisis · 14:32",
    faceCardName: "Mariana, 32",
    processEyebrow: "Proceso · 4 etapas",
    processTitleLine1: "De la foto al plan de tratamiento.",
    processTitleLine2: "En tres minutos.",
    steps: [
      { n: "01", t: "Cuestionario", d: "7 preguntas sobre tipo de piel, preocupaciones y objetivos." },
      { n: "02", t: "Foto facial", d: "Frontal con buena luz. Procesada y descartada después del análisis." },
      { n: "03", t: "Análisis IA", d: "Identifica condiciones, severidad y estado de la barrera cutánea." },
      { n: "04", t: "Recomendación", d: "Productos de tu catálogo, ordenados por match score." },
    ],
    reportEyebrow: "Reporte del paciente",
    reportTitleStart: "Un diagnóstico que ",
    reportTitleHighlight: "vende solo",
    reportTitleEnd: ".",
    reportBodyPart1: "Cada análisis genera un reporte dermatológico claro: condiciones detectadas, severidad y la rutina ideal — armada con productos de ",
    reportBodyEmphasis: "tu",
    reportBodyPart2: " catálogo. Listo para enviar por WhatsApp, exportar en PDF o imprimir en el PDV.",
    reportBullets: [
      "Match score por producto basado en 142 atributos",
      "Severidad en escala clínica de 5 niveles",
      "Compatible con receta y prontuario electrónico",
      "Marca blanca — queda con la identidad de tu negocio",
    ],
    mockReportLabel: "Reporte de piel",
    mockSkinTitleStart: "Piel ",
    mockSkinHighlight: "mixta",
    mockSkinTitleEnd: ", fototipo III",
    mockConditionsCount: "7 condiciones detectadas · barrera íntegra",
    mockConditionsLabel: "Condiciones",
    mockConditions: [
      { name: "Acné leve", sub: "T-zone", sev: [1,1,1,0,0] },
      { name: "Hiperpigmentación", sub: "post-inflamatoria", sev: [1,1,0,0,0] },
      { name: "Oleosidad", sub: "moderada", sev: [1,1,1,0,0] },
      { name: "Líneas finas", sub: "periorbital", sev: [1,0,0,0,0] },
    ],
    mockTzone: "T-zone · oleosidad 0.71",
    mockMancha: "Mancha · 4mm",
    dashEyebrow: "Panel de gestión",
    dashTitleStart: "Datos duros sobre ",
    dashTitleHighlight: "cada venta",
    dashTitleEnd: ".",
    dashBody: "Atribución completa: qué producto se recomendó, en qué canal, para qué tipo de piel, y qué convirtió en ingresos. Métricas que el consejo consultivo y el director comercial entienden en la primera reunión.",
    dashGreeting: "Buenas tardes, Dra. Helena",
    dashPanelLabel: "Panel · Abril 2026",
    dashKpis: [
      { l: "Análisis", v: "1.842", d: "+24% mes" },
      { l: "Conversión", v: "8,9%", d: "+1,2pp" },
      { l: "Ingresos", v: "$ 47k", d: "+38%" },
      { l: "Match", v: "0.81", d: "+0.04" },
    ],
    hlStats: [
      { value: "1.842", label: "análisis / mes (media growth)" },
      { value: "8.9%", label: "tasa de conversión recomend → venta" },
      { value: "$ 47k", label: "ingresos atribuidos media / mes" },
      { value: "+38%", label: "vs. recomendación humana" },
    ],
    projEyebrow: "Proyección de evolución",
    projTitleStart: "El paciente ",
    projTitleHighlight: "ve el futuro",
    projTitleEnd: " de su piel.",
    projBody: "Visualizaciones de 8 y 12 semanas con adherencia a la rutina recomendada. Es el gatillo de compra más fuerte que existe: ver el resultado antes.",
    projCards: [
      { when: "Hoy · semana 0", title: "Estado actual", pct: null, src: "/marketing/projection/state-current.jpg", alt: "Estado actual de la piel con manchas y acné activo" },
      { when: "Proyección · 8 semanas", title: "Mejora moderada", pct: "-52%", src: "/marketing/projection/state-week-8.jpg", alt: "Proyección de mejora a 8 semanas" },
      { when: "Proyección · 12 semanas", title: "Adherencia alta", pct: "-81%", src: "/marketing/projection/state-week-12.jpg", alt: "Proyección de mejora a 12 semanas" },
    ],
    projDisclaimer: "Imágenes ilustrativas generadas por IA. Los resultados reales varían según adherencia al protocolo, biotipo y condiciones individuales.",
    segmentsEyebrow: "Para quién es",
    segmentsTitleLine1: "Cuatro formas de usar.",
    segmentsTitleLine2Start: "Misma ",
    segmentsTitleLine2Highlight: "tecnología",
    segments: [
      { num: "I", title: "Laboratorios", desc: "Tu catálogo convertido en recomendación personalizada en miles de puntos de contacto — directo con el consumidor final.", href: "/segmentos?tab=laboratorios", feat: false },
      { num: "II", title: "Clínicas", desc: "Diagnóstico IA antes de la consulta: el paciente llega 70% más informado y la venta del tratamiento fluye mucho más.", href: "/segmentos?tab=clinicas", feat: true },
      { num: "III", title: "Farmacias", desc: "Tablet en mostrador. Análisis en 3 minutos. Ticket promedio de skincare 2.4x mayor comparado con clientes sin análisis.", href: "/segmentos?tab=farmacias", feat: false },
      { num: "IV", title: "Retail", desc: "Análisis en el e-commerce o tienda. El cliente entiende qué necesita y finaliza en el carrito con más confianza y ticket mayor.", href: "/segmentos?tab=varejo", feat: false },
    ],
    segmentsCta: "Ver caso →",
    resultsEyebrow: "Resultados — base de clientes activos",
    resultsTitleStart: "Los ",
    resultsTitleHighlight: "números",
    resultsTitleEnd: " que importan.",
    stats: [
      { value: "+38%", label: "conversión recomendación → venta\nvs. baseline humano" },
      { value: "2.4x", label: "ticket promedio en skincare\ncon análisis vs. sin análisis" },
      { value: "0.87", label: "match score promedio\n(escala 0—1)" },
      { value: "91%", label: "satisfacción del consumidor final\nNPS post-análisis" },
    ],
    quotes: [
      { text: "En 4 meses, Skinner se convirtió en nuestro mejor canal de venta de skincare. La conversión por sesión es 3x la del enfoque tradicional.", author: "Dra. Helena Rocha", role: "Directora · Clínica Pele Bela · SP" },
      { text: "Logré activar 380 farmacias en 6 meses. El panel de atribución cierra cualquier discusión sobre ROI en el comité.", author: "Rafael Andrade", role: "VP Comercial · Laboratorio (NDA)" },
    ],
    finalEyebrow: "Próximo paso",
    finalTitleLine1: "¿Listo para leer la piel",
    finalTitleLine2: "de tus clientes?",
    finalBody: "Demo de 25 minutos con el equipo de producto. Salimos con un plan piloto diseñado para tu negocio.",
    finalCtaPrimary: "Solicitar demo",
    finalCtaSecondary: "Ver planes →",
  },
  en: {
    heroPill: "skin tech",
    heroTitleLine1: "Skin is ",
    heroTitleHighlight: "data",
    heroTitleLine2: ".\nWe read it.",
    heroSubtitle: "AI that analyzes skin in 3 minutes, recommends products from your catalog and measures sales. For clinics, pharmacies, labs and retailers.",
    heroCtaPrimary: "Request demo →",
    heroCtaSecondary: "View product",
    stripStats: [
      { v: "+38%", l: "Average Conversion" },
      { v: "3 min", l: "Full Analysis" },
      { v: "0.87", l: "AI Match Score" },
    ],
    diagnosticLabel: "Diagnosis",
    diagnosticType: "Type",
    diagnosticTypeValue: "Combination",
    diagnosticPhototype: "Phototype",
    diagnosticAcne: "Mild acne",
    diagnosticHyperpig: "Hyperpigmentation",
    diagnosticBarrier: "Barrier",
    diagnosticBarrierValue: "strong",
    routineLabel: "Recommended routine",
    routineItems: [
      { name: "Vit. C 15% Serum", meta: "Spot · Antioxidant", score: 94 },
      { name: "Ceramides Moisturizer", meta: "Spot · Barrier", score: 91 },
      { name: "SPF 50+ Fluid", meta: "Spot · Sun protection", score: 98 },
    ],
    faceCardTimestamp: "Analysis · 14:32",
    faceCardName: "Mariana, 32",
    processEyebrow: "Process · 4 steps",
    processTitleLine1: "From photo to treatment plan.",
    processTitleLine2: "In three minutes.",
    steps: [
      { n: "01", t: "Questionnaire", d: "7 questions about skin type, concerns and goals." },
      { n: "02", t: "Facial photo", d: "Front-facing with good light. Processed and discarded after analysis." },
      { n: "03", t: "AI Analysis", d: "Identifies conditions, severity and skin barrier status." },
      { n: "04", t: "Recommendation", d: "Products from your catalog, ranked by match score." },
    ],
    reportEyebrow: "Patient report",
    reportTitleStart: "A diagnosis that ",
    reportTitleHighlight: "sells itself",
    reportTitleEnd: ".",
    reportBodyPart1: "Each analysis generates a clear dermatological report: detected conditions, severity and the ideal routine — built with products from ",
    reportBodyEmphasis: "your",
    reportBodyPart2: " catalog. Ready to send via WhatsApp, export to PDF or print at the POS.",
    reportBullets: [
      "Per-product match score based on 142 attributes",
      "Severity on a 5-level clinical scale",
      "Compatible with prescriptions and electronic medical records",
      "White label — keeps your business identity",
    ],
    mockReportLabel: "Skin report",
    mockSkinTitleStart: "Skin ",
    mockSkinHighlight: "combination",
    mockSkinTitleEnd: ", phototype III",
    mockConditionsCount: "7 conditions detected · barrier intact",
    mockConditionsLabel: "Conditions",
    mockConditions: [
      { name: "Mild acne", sub: "T-zone", sev: [1,1,1,0,0] },
      { name: "Hyperpigmentation", sub: "post-inflammatory", sev: [1,1,0,0,0] },
      { name: "Oiliness", sub: "moderate", sev: [1,1,1,0,0] },
      { name: "Fine lines", sub: "periorbital", sev: [1,0,0,0,0] },
    ],
    mockTzone: "T-zone · oiliness 0.71",
    mockMancha: "Spot · 4mm",
    dashEyebrow: "Management dashboard",
    dashTitleStart: "Hard data on ",
    dashTitleHighlight: "every sale",
    dashTitleEnd: ".",
    dashBody: "Full attribution: which product was recommended, on which channel, for which skin type, and what converted to revenue. Metrics that boards and commercial directors understand in the first meeting.",
    dashGreeting: "Good afternoon, Dr. Helena",
    dashPanelLabel: "Dashboard · April 2026",
    dashKpis: [
      { l: "Analyses", v: "1,842", d: "+24% mo" },
      { l: "Conversion", v: "8.9%", d: "+1.2pp" },
      { l: "Revenue", v: "$ 47k", d: "+38%" },
      { l: "Match", v: "0.81", d: "+0.04" },
    ],
    hlStats: [
      { value: "1,842", label: "analyses / month (growth average)" },
      { value: "8.9%", label: "recommendation → sale conversion rate" },
      { value: "$ 47k", label: "average attributed revenue / month" },
      { value: "+38%", label: "vs. human recommendation" },
    ],
    projEyebrow: "Outcome projection",
    projTitleStart: "The patient ",
    projTitleHighlight: "sees the future",
    projTitleEnd: " of their skin.",
    projBody: "8- and 12-week visualizations with routine adherence. The strongest purchase trigger that exists: seeing the result before.",
    projCards: [
      { when: "Today · week 0", title: "Current state", pct: null, src: "/marketing/projection/state-current.jpg", alt: "Current skin state with spots and active acne" },
      { when: "Projection · 8 weeks", title: "Moderate improvement", pct: "-52%", src: "/marketing/projection/state-week-8.jpg", alt: "8-week improvement projection" },
      { when: "Projection · 12 weeks", title: "High adherence", pct: "-81%", src: "/marketing/projection/state-week-12.jpg", alt: "12-week improvement projection" },
    ],
    projDisclaimer: "Illustrative AI-generated images. Real outcomes vary with protocol adherence, skin biotype and individual conditions.",
    segmentsEyebrow: "Who it's for",
    segmentsTitleLine1: "Four ways to use it.",
    segmentsTitleLine2Start: "Same ",
    segmentsTitleLine2Highlight: "technology",
    segments: [
      { num: "I", title: "Laboratories", desc: "Your catalog turned into personalized recommendation across thousands of touchpoints — directly with the end consumer.", href: "/segmentos?tab=laboratorios", feat: false },
      { num: "II", title: "Clinics", desc: "AI diagnosis before the consultation: the patient arrives 70% more informed and the treatment sale flows much better.", href: "/segmentos?tab=clinicas", feat: true },
      { num: "III", title: "Pharmacies", desc: "Tablet at the counter. 3-minute analysis. Skincare AOV 2.4x higher than customers without analysis.", href: "/segmentos?tab=farmacias", feat: false },
      { num: "IV", title: "Retail", desc: "Analysis in the e-commerce or store. The customer understands what they need and checks out with more confidence and a higher ticket.", href: "/segmentos?tab=varejo", feat: false },
    ],
    segmentsCta: "View case →",
    resultsEyebrow: "Results — active customer base",
    resultsTitleStart: "The ",
    resultsTitleHighlight: "numbers",
    resultsTitleEnd: " that matter.",
    stats: [
      { value: "+38%", label: "recommendation → sale conversion\nvs. human baseline" },
      { value: "2.4x", label: "average skincare ticket\nwith analysis vs. without" },
      { value: "0.87", label: "average match score\n(0—1 scale)" },
      { value: "91%", label: "end-consumer satisfaction\npost-analysis NPS" },
    ],
    quotes: [
      { text: "In 4 months, Skinner became our best skincare sales channel. Per-session conversion is 3x the traditional approach.", author: "Dr. Helena Rocha", role: "Director · Clínica Pele Bela · SP" },
      { text: "I activated 380 pharmacies in 6 months. The attribution panel ends any ROI discussion in the committee.", author: "Rafael Andrade", role: "VP Commercial · Laboratory (NDA)" },
    ],
    finalEyebrow: "Next step",
    finalTitleLine1: "Ready to read your",
    finalTitleLine2: "customers' skin?",
    finalBody: "25-minute demo with the product team. We leave with a pilot plan tailored to your business.",
    finalCtaPrimary: "Request demo",
    finalCtaSecondary: "View plans →",
  },
};

export default async function HomePage() {
  const locale = await resolveLocale();
  const c = COPY[locale];

  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-0">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Copy */}
          <div className="max-w-[540px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">
              {c.heroPill}
            </p>
            <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone whitespace-pre-line">
              {c.heroTitleLine1}<i className="text-terre">{c.heroTitleHighlight}</i>{c.heroTitleLine2}
            </h1>
            <p className="text-lg font-light text-terre mt-6 leading-relaxed">
              {c.heroSubtitle}
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre hover:-translate-y-px transition-all">
                {c.heroCtaPrimary}
              </Link>
              <Link href="/como-funciona" className="px-7 py-4 border border-sable text-carbone text-sm hover:bg-ivoire hover:border-carbone transition-all">
                {c.heroCtaSecondary}
              </Link>
            </div>
            {/* Strip stats */}
            <div className="flex items-center gap-5 mt-12 pt-7 border-t border-sable/40">
              {c.stripStats.map((s, i) => (
                <div key={i} className="flex items-center gap-5">
                  {i > 0 && <div className="w-px h-8 bg-sable/50" />}
                  <div className="flex flex-col">
                    <b className="font-serif text-[28px] italic text-carbone leading-none">{s.v}</b>
                    <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-pierre mt-1">{s.l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — cards stack */}
          <div className="relative h-[560px] p-8 hidden lg:block">
            <span className="absolute top-0 left-0 w-3 h-3 border border-sable/60" />
            <span className="absolute top-0 right-0 w-3 h-3 border border-sable/60" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border border-sable/60" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border border-sable/60" />

            {/* Face card */}
            <div className="absolute top-4 left-4 w-[62%] bg-white border border-pierre/20 p-4 z-[1]">
              <div className="aspect-[4/5] bg-gradient-to-b from-ivoire to-[#e0d8cc] border border-pierre/15 relative flex items-center justify-center">
                <svg viewBox="0 0 200 240" width="60%" style={{position:'absolute', opacity:0.65}}>
                  <ellipse cx="100" cy="120" rx="58" ry="78" fill="none" stroke="#3D342C" strokeWidth="1" strokeDasharray="3 4"/>
                  <line x1="100" y1="20" x2="100" y2="50" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="100" y1="190" x2="100" y2="220" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="20" y1="120" x2="42" y2="120" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="158" y1="120" x2="180" y2="120" stroke="#3D342C" strokeWidth="1"/>
                </svg>
              </div>
              <div className="flex justify-between items-baseline mt-3 font-mono text-[9px] tracking-[0.1em] uppercase text-terre">
                <span>{c.faceCardTimestamp}</span>
                <b className="font-serif italic text-[13px] normal-case tracking-normal text-carbone font-normal">{c.faceCardName}</b>
              </div>
            </div>

            {/* Diagnostic data card */}
            <div className="absolute top-20 right-4 w-[50%] bg-carbone text-blanc-casse p-[18px] z-[2]">
              <div className="flex justify-between items-baseline mb-2.5">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable">{c.diagnosticLabel}</span>
                <span className="font-serif italic text-[13px] text-terre">0.87</span>
              </div>
              {[
                { l: c.diagnosticType, v: c.diagnosticTypeValue },
                { l: c.diagnosticPhototype, v: "III" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] py-1.5 border-t border-sable/[0.18]">
                  <span className="text-sable font-light">{r.l}</span>
                  <span className="text-blanc-casse font-mono">{r.v}</span>
                </div>
              ))}
              {[
                { l: c.diagnosticAcne, v: "62%", w: "62%" },
                { l: c.diagnosticHyperpig, v: "48%", w: "48%" },
                { l: c.diagnosticBarrier, v: c.diagnosticBarrierValue, w: "78%" },
              ].map((r, i) => (
                <div key={i} className="flex flex-col py-1.5 border-t border-sable/[0.18]">
                  <div className="flex justify-between text-[11px] w-full">
                    <span className="text-sable font-light">{r.l}</span>
                    <span className="text-blanc-casse font-mono">{r.v}</span>
                  </div>
                  <div className="h-0.5 bg-sable/20 mt-1.5 w-full">
                    <div className="h-full bg-blanc-casse" style={{ width: r.w }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Product card */}
            <div className="absolute bottom-4 left-[12%] w-[70%] bg-white border border-pierre/20 p-4 z-[3]">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-terre">{c.routineLabel}</span>
              </div>
              {c.routineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-[32px_1fr_auto] gap-3 items-center py-2 border-t border-sable/25 first:border-0">
                  <span className="w-8 h-8 bg-ivoire border border-pierre/15" />
                  <div>
                    <div className="text-xs text-carbone">{item.name}</div>
                    <div className="font-mono text-[9px] tracking-[0.08em] uppercase text-pierre mt-0.5">{item.meta}</div>
                  </div>
                  <span className="font-mono text-sm text-carbone bg-ivoire px-2 py-1 border border-pierre/20">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROCESSO ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.processEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              {c.processTitleLine1}<br /><i className="text-terre">{c.processTitleLine2}</i>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 border border-sable/40 bg-white">
            {c.steps.map((s, i) => (
              <div key={s.n} className={`p-9 ${i < 3 ? "border-r border-sable/40" : ""}`}>
                <span className="font-serif text-[40px] italic text-sable block mb-4">{s.n}</span>
                <h3 className="font-serif text-xl text-carbone mb-2">{s.t}</h3>
                <p className="text-[13px] text-pierre font-light leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RELATORIO DO PACIENTE ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.reportEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.reportTitleStart}<i className="text-terre">{c.reportTitleHighlight}</i>{c.reportTitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              {c.reportBodyPart1}
              <em className="text-carbone not-italic font-normal">{c.reportBodyEmphasis}</em>
              {c.reportBodyPart2}
            </p>
            <ul className="flex flex-col gap-3 mt-6">
              {c.reportBullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          {/* Analysis screen mock */}
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">analise.skinner.lat/clinica-pele-bela/r/8c2a</span>
            </div>
            <div className="grid grid-cols-2 min-h-[460px]">
              <div className="relative bg-gradient-to-br from-ivoire to-[#ddd2c4] border-r border-pierre/15 p-6">
                <span className="absolute border border-terre/40 rounded-full w-16 h-16" style={{top:'32%',left:'38%'}} />
                <span className="absolute border border-terre/40 rounded-full w-7 h-7" style={{top:'56%',right:'30%'}} />
                <span className="absolute border border-terre/40 rounded-full w-10 h-10" style={{top:'28%',right:'22%'}} />
                <span className="absolute font-mono text-[9px] tracking-[0.08em] text-carbone bg-white/90 px-2 py-1 border border-pierre/30" style={{top:'26%',left:'50%'}}>{c.mockTzone}</span>
                <span className="absolute font-mono text-[9px] tracking-[0.08em] text-carbone bg-white/90 px-2 py-1 border border-pierre/30" style={{top:'60%',right:'12%'}}>{c.mockMancha}</span>
                <div className="absolute bottom-4 left-4 font-mono text-[10px] text-terre tracking-[0.08em]">
                  ID 8c2a · 12.04.26 · 14:32
                </div>
              </div>
              <div className="p-7 flex flex-col gap-6 overflow-hidden">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-1">{c.mockReportLabel}</p>
                  <h3 className="font-serif text-[28px] text-carbone tracking-[-0.005em]">
                    {c.mockSkinTitleStart}<i className="text-terre">{c.mockSkinHighlight}</i>{c.mockSkinTitleEnd}
                  </h3>
                  <p className="text-xs text-pierre font-mono tracking-[0.04em] mt-1">{c.mockConditionsCount}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-3">{c.mockConditionsLabel}</p>
                  {c.mockConditions.map((cond, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 mb-2 border-b border-pierre/15">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-carbone">{cond.name}</span>
                        <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-pierre">{cond.sub}</span>
                      </div>
                      <div className="flex gap-[3px]">
                        {cond.sev.map((v, j) => (
                          <span key={j} className={`w-3 h-1 ${v ? "bg-carbone" : "bg-pierre/20"}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-20 items-center">
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">app.skinner.lat/dashboard</span>
            </div>
            <div className="p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">{c.dashPanelLabel}</p>
              <h3 className="font-serif text-2xl italic text-carbone mb-4">{c.dashGreeting}</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {c.dashKpis.map((k, i) => (
                  <div key={i} className="p-3.5 bg-ivoire border border-pierre/[0.12] flex flex-col gap-1">
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-pierre">{k.l}</span>
                    <span className="font-serif text-[28px] italic text-carbone leading-none">{k.v}</span>
                    <span className="font-mono text-[9px] tracking-[0.04em] text-[#5C6B4E]">↗ {k.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.dashEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              {c.dashTitleStart}<i className="text-terre">{c.dashTitleHighlight}</i>{c.dashTitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">{c.dashBody}</p>
            <div className="grid grid-cols-2 border-t border-l border-sable/40 mt-6">
              {c.hlStats.map((s, i) => (
                <div key={i} className="p-5 border-b border-r border-sable/40">
                  <b className="font-serif text-[32px] italic text-carbone block leading-none">{s.value}</b>
                  <span className="text-[11px] text-pierre block mt-2 leading-snug">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROJECAO ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.projEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-4">
              {c.projTitleStart}<i className="text-terre">{c.projTitleHighlight}</i>{c.projTitleEnd}
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed max-w-[620px] mx-auto">{c.projBody}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {c.projCards.map((p, i) => (
              <div key={i} className="bg-white border border-pierre/20">
                <div className="relative aspect-[3/4] border-b border-pierre/15 bg-ivoire">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    loading="lazy"
                    className="object-cover"
                  />
                  {p.pct && (
                    <span className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.12em] text-carbone bg-white/90 px-2 py-1 border border-pierre/20">
                      {p.pct}
                    </span>
                  )}
                </div>
                <div className="p-[18px] flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-pierre">{p.when}</span>
                  <span className="font-serif text-lg italic text-carbone">{p.title}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-pierre/70 font-light text-center mt-8 max-w-[760px] mx-auto leading-relaxed">
            {c.projDisclaimer}
          </p>
        </div>
      </section>

      {/* ─── SEGMENTOS ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.segmentsEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              {c.segmentsTitleLine1}<br />{c.segmentsTitleLine2Start}<i className="text-terre">{c.segmentsTitleLine2Highlight}</i>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {c.segments.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`p-10 border transition-all hover:-translate-y-0.5 ${
                  s.feat
                    ? "bg-carbone text-blanc-casse border-carbone hover:border-terre"
                    : "bg-white border-sable/40 hover:border-carbone"
                }`}
              >
                <span className={`font-serif text-sm italic ${s.feat ? "text-blanc-casse" : "text-terre"}`}>{s.num}</span>
                <h3 className={`font-serif text-[30px] italic mt-3 mb-3 ${s.feat ? "text-blanc-casse" : "text-carbone"}`}>{s.title}</h3>
                <p className={`text-sm font-light leading-relaxed ${s.feat ? "text-sable" : "text-pierre"}`}>{s.desc}</p>
                <span className={`font-mono text-[11px] tracking-[0.1em] uppercase mt-4 inline-block pb-1 border-b ${
                  s.feat ? "text-blanc-casse border-blanc-casse" : "text-carbone border-carbone"
                }`}>{c.segmentsCta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESULTADOS (DARK) ────────────────────────────────── */}
      <section className="py-24 bg-carbone text-blanc-casse">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sable mb-4">{c.resultsEyebrow}</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-blanc-casse">
              {c.resultsTitleStart}<i>{c.resultsTitleHighlight}</i>{c.resultsTitleEnd}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-sable/30">
            {c.stats.map((s, i) => (
              <div key={i} className="p-9 border-b border-r border-sable/30">
                <b className="font-serif text-[64px] italic text-blanc-casse leading-none block">{s.value}</b>
                <span className="text-xs text-sable mt-4 block leading-snug whitespace-pre-line">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-20">
            {c.quotes.map((q, i) => (
              <figure key={i} className="m-0 pt-8 border-t border-sable/40">
                <p className="font-serif text-[22px] italic text-blanc-casse leading-[1.4] mb-6">"{q.text}"</p>
                <figcaption className="flex flex-col">
                  <b className="text-blanc-casse text-xs font-normal">{q.author}</b>
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable mt-1">{q.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">{c.finalEyebrow}</p>
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-2">
            {c.finalTitleLine1}<br />{c.finalTitleLine2}
          </h2>
          <p className="text-base font-light text-pierre leading-relaxed max-w-[620px] mx-auto mt-4 mb-8">
            {c.finalBody}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre hover:-translate-y-px transition-all">
              {c.finalCtaPrimary}
            </Link>
            <Link href="/planos" className="px-7 py-4 border border-sable text-carbone text-sm hover:bg-blanc-casse hover:border-carbone transition-all">
              {c.finalCtaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
