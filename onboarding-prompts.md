# Prompts para Claude Design — Onboarding Skinner

Dos prompts auto-contenidos. Pegar el bloque completo (incluyendo contexto + instrucción) en una conversación de Claude Design. El output esperado del cliente final está en **português brasileiro**, alinhado ao brand book de Skinner (sem emojis, sem exclamações, tom editorial).

---

## PROMPT 1 — Documento de Onboarding (PDF / web interativa)

```
Você vai criar um documento de onboarding completo para novos clientes B2B da plataforma Skinner. O documento será entregue logo após o signup e deve permitir que o cliente (uma clínica de dermatologia, farmácia ou laboratório) configure sua conta e extraia valor sem precisar de uma ligação de implementação.

# Contexto da plataforma

Skinner ("Skin Tech") é um SaaS B2B multi-tenant que oferece análise de pele assistida por IA (Claude Sonnet) + recomendação automática de produtos do catálogo do próprio cliente. O paciente final responde um questionário, faz upload de uma foto, e recebe em ~30s um diagnóstico (tipo de pele, condições detectadas, severidade, barreira cutânea), uma rotina em 3 fases, projeção visual de melhora em 8/12 semanas (Gemini), e a lista de produtos da clínica que melhor atendem o caso. A clínica monetiza via venda dos produtos (com comissão Skinner de 2% ou 3% conforme o plano) ou consultas presenciais.

Idioma: português brasileiro. Audiência: gestor da clínica/farmácia, geralmente não-técnico, que precisa entender O QUE cada aba faz, POR QUE ela existe e COMO se mede o resultado dela. Posicionamento: editorial, clínico, sóbrio. Não usar emojis nem exclamações.

# Brand book (aplicar literalmente)

- Cores: Blanc Casse #F7F3EE (fundo), Carbone #1C1917 (texto principal e CTAs), Pierre #7C7269 (texto secundário), Sable #C8BAA9 (bordas e divisores finos), Ivoire #EDE6DB (cards e destaques sutis), Terre #3D342C (alertas).
- Tipografia: Lora (serif) para títulos. Poppins Light (300) para corpo e UI. Labels em Poppins, 10px, uppercase, tracking amplo (~0.15em).
- Layout: sem cantos arredondados, divisores em linhas finas (1px), espaçamento generoso, hierarquia construída por escala tipográfica e não por cor saturada.
- Linguagem: precisa, autoritativa, calorosa. Sem clichês de SaaS ("revolucione", "potencialize"). Frases curtas. Verbos no presente. Nunca "Skinners" — sempre "Skinner".

# Estrutura obrigatória do documento

1. **Capa** — logo Skinner, título "Manual de configuração", subtítulo "Da assinatura à primeira análise", nome do plano contratado (placeholder).
2. **Sumário executivo (1 página)** — em 5 linhas: o que o cliente acabou de comprar, o que vai entregar para os pacientes, qual o ganho de conversão esperado, em quanto tempo a primeira análise pode rodar.
3. **Glossário rápido (1 página)** — definições curtas de: Análise, Tenant, Catálogo, Kit, Canal, Conversão, Pixel, Tom da análise, Comissão, Limite mensal, ROI.
4. **Walkthrough das 11 abas do portal B2B**, na ordem do menu lateral. Para cada aba, gerar um bloco padronizado:
   - **Nome da aba** (Lora, grande)
   - **O que é** — 2 a 3 linhas, sem jargão, definindo o objetivo da tela
   - **O que se faz aqui** — bullet list de ações concretas (verbos no infinitivo)
   - **Como se mede** — KPI ou indicador associado, fórmula quando existe, frequência de leitura recomendada
   - **Erro comum** — armadilha que clientes cometem nessa aba (crítico — não pular)
   - **Captura de tela ilustrativa** — placeholder retangular com dimensões 16:10, borda Sable 1px, legenda em Poppins 10px uppercase
5. **Apêndice de checklist de go-live** — 12 itens objetivos que precisam estar verdes antes de divulgar o link de análise para pacientes.
6. **Apêndice de troubleshooting** — 6 problemas mais comuns e como resolver sozinho (ex.: "minha foto retorna erro 429", "o produto não aparece na recomendação", "a projeção de imagem não gerou").

# Conteúdo de cada aba (use literalmente)

1. **Dashboard** — Visão analítica consolidada do tenant. Mede: nº de análises no período, taxa de conclusão do questionário, taxa de conversão (análise → venda), ticket médio, ROI da assinatura, distribuição geográfica por estado/cidade (mapa em mosaico do Brasil), perfil de pacientes (tipo de pele, faixa etária, objetivo), top condições detectadas, índice de discrepância entre tipo de pele auto-relatado vs observado, gaps de catálogo (condições recorrentes sem produto associado), conversion lift por persona, sazonalidade de condições em 12 meses, engajamento (download de PDF e taxa de e-mail), benchmark cross-tenant (apenas para quem opta-in, mínimo 3 tenants contribuintes para preservar anonimato). Filtro de período de 1 a 365 dias. Botão de exportar CSV no header. Erro comum: ler o dashboard sem fixar uma janela de comparação — sempre comparar mesmo período do mês anterior.

2. **Catalogo** — Banco de produtos da clínica que alimentam a recomendação. Cada produto carrega: nome, marca, categoria, preço, foto, ingredientes ativos, tags de tipo de pele (skinTypeTags), tags de objetivo (objectiveTags), tags de preocupação (concernTags), nível de severidade indicado, etapa da rotina (cleanser → toner → serum → moisturizer → SPF → treatment), contraindicações (ex.: gravidez/amamentação), priorityRank (ranking manual para desempate). Sub-páginas: Importar (CSV ou integração Nuvemshop/Shopify) e Novo produto. Mede: nº de produtos ativos, cobertura por etapa de rotina, cobertura por concernTag (quantas das condições detectadas pela IA têm pelo menos 1 produto), nº de recomendações geradas por produto. Erro comum: deixar concernTags em branco — produto sem tags nunca é recomendado.

3. **Relatorios** — Histórico granular de cada análise individual. Permite abrir uma análise específica, ver foto, questionário, output da IA, produtos recomendados, e baixar o PDF clínico. Mede: total de análises, conversões vinculadas via pixel, tempo médio de análise. Erro comum: confundir Relatórios (granular, paciente a paciente) com Dashboard (agregado).

4. **Kits** — Protocolos pré-montados de produtos. Útil para quando a clínica quer empacotar uma rotina fixa (ex.: "Kit Anti-Acne 8 semanas") fora do fluxo de análise individual. Sub-páginas: Novo kit, Editar kit. Mede: nº de kits ativos, nº de redirecionamentos via link público de kit. Erro comum: criar kits genéricos que competem com a recomendação personalizada — usar kits apenas para casos onde a personalização não agrega.

5. **Analise** — Centro de configuração da inteligência. Aqui o cliente define: tom da análise (humanizado vs técnico — humanizado traduz "comedões" para "cravos pretos e brancos", técnico preserva o vocabulário clínico), regras adicionais do prompt da IA (sufixo customizado), condições restritas (a IA é instruída a não recomendar produtos para esses casos), opt-in do benchmark cross-tenant (off por padrão), toggles de questões opcionais do questionário (alergias, medicamentos, etc.). Mede: índice de aderência ao tom (qualitativo, validado em amostra mensal). Erro comum: misturar regras conflitantes no sufixo e degradar a qualidade da análise — sempre testar o sufixo com 3 análises de teste antes de propagar.

6. **Marca** — Personalização visual do fluxo público de análise: logo, cor primária, mensagem de boas-vindas, copy de finalização, link de WhatsApp/agendamento exibido no fim da análise. Mede: CTR do CTA final (clique → agendamento). Erro comum: subir um logo de baixa resolução — a renderização no PDF clínico pixela.

7. **Canais** — Geração e gestão dos links públicos de análise (slug) e dos canais de distribuição (QR code para o consultório, link para Instagram, embed para o site da clínica). Mede: análises por canal, conversão por canal (qual canal traz pacientes que efetivamente compram). Erro comum: divulgar um único link genérico — sem UTMs, fica impossível atribuir corretamente.

8. **Integracoes** — Conexões com e-commerce (Nuvemshop, Shopify) para sincronizar catálogo automaticamente, e instruções do pixel de conversão (POST /api/pixel) que a clínica instala na página de obrigado da loja. Sem PII, sem cookies de terceiros, LGPD-friendly. Mede: status da última sincronização do catálogo, nº de eventos de conversão recebidos via pixel nos últimos 30 dias. Erro comum: instalar o pixel sem testar — fazer uma compra de teste e validar que a conversão apareceu no dashboard.

9. **Usuarios** — Gestão de membros da clínica com acesso ao portal. Três papéis: b2b_admin (controle total), b2b_analyst (análises e catálogo, sem billing), b2b_viewer (apenas leitura). Mede: nº de usuários ativos vs limite do plano. Erro comum: deixar todo mundo como admin — limitar acessos a billing e exclusão de conta.

10. **Faturamento** — Plano contratado, limite mensal de análises, uso atual no ciclo, histórico de faturas, link para o Customer Portal da Stripe (atualizar cartão, baixar nota), opção de upgrade. Planos: Growth (R$ 490/mês, 200 análises, 3% comissão), Pro (R$ 1.490/mês, 1.000 análises, 2% comissão), Enterprise (negociado, comissão e limites customizados). Alertas automáticos por e-mail aos 80% e 100% do limite. Mede: % de uso do plano, projeção de overflow, ROI (receita gerada / custo do plano). Erro comum: ignorar o alerta de 80% e ser bloqueado em meio a uma campanha — fazer upgrade preventivo.

11. **Minha Conta** — Perfil pessoal do usuário logado: nome, e-mail, troca de senha, exclusão da própria conta (LGPD). Mede: nada agregado — é uma aba de configuração individual. Erro comum: o admin único excluir a própria conta sem nomear um substituto — fica sem acesso administrativo.

# Recursos visuais a gerar

- Para cada uma das 11 abas, um placeholder de captura de tela com dimensões 16:10, borda Sable 1px, fundo Ivoire, legenda em label-style. Indicar que o cliente Skinner vai substituir esse placeholder pela captura real antes de imprimir.
- Um diagrama de fluxo do paciente (questionário → foto → IA → resultado → conversão) ocupando 1 página inteira, em estilo editorial (linhas finas, sem ícones cartunescos, tipografia como protagonista).
- Um diagrama da arquitetura de dados (Tenant → Catálogo → Análise → Conversão) em 1 página, mesmo estilo.
- Uma tabela de comparação dos 3 planos (Growth / Pro / Enterprise) em 1 página, sem cores saturadas, apenas hierarquia tipográfica e check-marks finos.

# Especificações de entrega

- Formato: PDF A4, retrato, 30 a 45 páginas no total.
- Tipografia incorporada (Lora 400/700/italic, Poppins 300/400/600/300-italic/400-italic) — não substituir por fontes do sistema.
- Cabeçalho de cada página: logo Skinner à esquerda, número da página à direita, em label-style.
- Rodapé: "Skinner — Skin Tech" centralizado, label-style.
- Margens generosas (mínimo 25mm laterais).
- Sumário clicável, com âncoras em cada aba.

Antes de começar, me confirme em 3 linhas: (a) o entendimento do brand, (b) a estrutura final que você vai seguir, (c) qualquer ambiguidade que precise resolver. Só então gere o documento.
```

---

## PROMPT 2 — Vídeo / Onboarding guiado interativo

```
Você vai criar um onboarding em vídeo (ou alternativamente um walkthrough interativo passo-a-passo dentro do app) para novos clientes B2B de Skinner. O objetivo é reduzir o time-to-first-analysis para menos de 20 minutos após o primeiro login.

# Contexto da plataforma

[Mesmo bloco de contexto do prompt do documento — copiar literalmente: SaaS B2B multi-tenant, análise de pele com Claude, recomendação de produtos do catálogo do cliente, pacientes finais respondem questionário + foto + recebem rotina em 3 fases + projeção 8/12 semanas, monetização via produtos, comissão 2-3%. Idioma: português brasileiro. Audiência: gestor não-técnico de clínica/farmácia/laboratório.]

# Brand book

[Mesmo bloco do prompt anterior — Blanc Casse #F7F3EE, Carbone #1C1917, Pierre #7C7269, Sable #C8BAA9, Ivoire #EDE6DB, Terre #3D342C, Lora + Poppins Light, sem cantos arredondados, sem emojis, sem exclamações, tom editorial.]

# Formato pretendido

Você deve me devolver DUAS opções para eu escolher:

**Opção A — Vídeo gravado (motion graphics + screencast)**
- Duração total: 7 a 9 minutos.
- 11 capítulos curtos (um por aba do portal), entre 30s e 60s cada.
- Estrutura por capítulo: (1) frame de abertura com nome da aba em Lora grande sobre fundo Blanc Casse, (2) screencast real da tela com cursor amplificado e ações destacadas, (3) voice-over editorial em português brasileiro neutro, (4) lower-third em label-style explicando "O que se mede aqui", (5) transição em corte seco (sem fade exagerado).
- Áudio: trilha instrumental discreta (piano + cordas, baixa intensidade), -18 LUFS. Sem música pop, sem stings.
- Legendas embutidas (queimadas) em Poppins 18pt, posição inferior, fundo Carbone com 70% de opacidade.
- Capítulos navegáveis (chapter markers) compatíveis com YouTube e Vimeo.
- Frame final: CTA estático "Comece sua primeira análise" com link app.skinner.lat/dashboard, 5 segundos.

**Opção B — Walkthrough interativo no produto (product tour)**
- Implementado como overlay tipo coachmark sobre o portal real.
- 11 etapas, uma por aba, ativadas em sequência ou navegáveis livremente.
- Cada etapa contém: tooltip com título (Lora), descrição (Poppins, 2 a 3 linhas), botão primário "Próximo" (Carbone), botão secundário "Pular" (Pierre).
- Progresso visível: "3 de 11" em label-style, no canto inferior direito.
- Estado persistente: o cliente pode pausar e retomar de onde parou (cookie + flag no perfil).
- Trigger inicial: primeiro login do usuário, com opção de re-disparar via "Refazer tour" no menu de Minha Conta.
- Hotspot visual: borda Sable 2px ao redor do elemento destacado, restante da tela com overlay Carbone 40% de opacidade.

# Conteúdo por capítulo / etapa (exato, na ordem)

[Para cada uma das 11 abas, escrever roteiro de 60-90 palavras (vídeo) ou 25-40 palavras (tooltip). Conteúdo factual igual ao prompt do documento — Dashboard, Catalogo, Relatorios, Kits, Analise, Marca, Canais, Integracoes, Usuarios, Faturamento, Minha Conta. Para cada aba incluir: o que é, ação principal a executar agora, métrica que vai aparecer no dashboard depois.]

Conteúdo factual de referência (NÃO inventar features além disto):

1. Dashboard — agrega ROI, conversão, geo, personas, sazonalidade, benchmark opt-in.
2. Catalogo — produto precisa de concernTags, skinTypeTags, objectiveTags, ingredientes ativos, etapa de rotina e priorityRank para entrar na recomendação.
3. Relatorios — análise individual com PDF clínico baixável.
4. Kits — protocolos fixos, alternativos à recomendação personalizada.
5. Analise — tom humanizado vs técnico, sufixo de prompt, condições restritas, opt-in benchmark.
6. Marca — logo, cor primária, copy de boas-vindas e finalização, CTA WhatsApp.
7. Canais — link público da análise + UTMs por canal de distribuição.
8. Integracoes — Nuvemshop, Shopify, pixel de conversão LGPD-friendly.
9. Usuarios — papéis admin/analyst/viewer, limite por plano.
10. Faturamento — Growth R$490 / Pro R$1490 / Enterprise; alertas em 80% e 100%.
11. Minha Conta — perfil, troca de senha, exclusão LGPD.

# Critérios de qualidade (vai ser avaliado nestes pontos)

- Toda afirmação numérica (preço, comissão, limite) precisa estar literalmente correta — qualquer divergência invalida o entregável.
- O voice-over (vídeo) ou copy (tour) precisa caber no tempo/espaço sem cortar a métrica de mensuração — esse é o pedaço crítico.
- Nenhum capítulo pode passar de 90 segundos no vídeo, nem de 40 palavras no tooltip.
- Nenhum frame com mais de 3 elementos simultâneos — densidade visual baixa, hierarquia clara.
- Brand consistente: nada de gradient, neon, shadow grande, ícones coloridos, ilustrações cartunescas.

# Entregáveis

Para a Opção A:
- Storyboard frame-a-frame em PDF (1 página por capítulo + abertura + encerramento).
- Roteiro de voice-over em .docx, marcado por timecode.
- Lista de assets necessários (screencasts, fontes, trilha) com formatos esperados.
- Versão final em MP4 H.264 1080p 30fps + arquivo de legendas .srt.

Para a Opção B:
- Especificação funcional em .md com (a) sequência das 11 etapas, (b) seletores DOM esperados para cada hotspot, (c) cópia exata de cada tooltip, (d) eventos de telemetria a disparar em cada etapa (started, completed, skipped).
- Mockups de alta-fidelidade (Figma ou imagem PNG) das 11 etapas em desktop e mobile.
- Checklist de QA de 10 itens para validar antes do go-live.

Antes de começar, me devolva: (1) qual das duas opções você recomenda como prioritária para um SaaS B2B com clientes não-técnicos e por quê, (2) o esqueleto da opção recomendada (capítulos/etapas listados sem conteúdo), (3) qualquer dúvida factual que você precise resolver consultando-me. Só depois da minha confirmação, gere o entregável completo.
```

---

## Notas críticas sobre os prompts

**O que estes prompts fazem bem.** Forçam Claude Design a confirmar entendimento antes de executar (reduz retrabalho), travam o brand book literalmente (cores em hex, tipografia com pesos), listam as 11 abas exatas do sidebar atual (`apps/web/src/app/(dashboard)/layout.tsx`), e exigem que cada bloco entregue O QUE / O QUE SE FAZ / COMO SE MEDE / ERRO COMUM — o quarto item é o que separa um manual genérico de um onboarding acionável.

**Onde os prompts podem falhar.** Se Skinner adicionar uma aba nova (ex.: integração com WhatsApp Business) sem atualizar este documento, o conteúdo gerado fica desatualizado silenciosamente. Recomendo versionar este arquivo junto do `CLAUDE.md` e revisitar a cada release que toque o sidebar.

**O que NÃO incluí de propósito.** Capturas de tela reais — porque mudam a cada deploy e geram dívida de manutenção. O prompt obriga placeholders e responsabiliza o cliente por substituir. Se a preferência for entregar com screenshots reais, adicionar um passo 0 antes do prompt: "antes de gerar, abra um tenant de demo, capture as 11 telas em viewport 1440x900, suba como anexos e referencie por nome de arquivo".

[Ver os prompts](computer:///Users/nicolascapozzi/skinner/onboarding-prompts.md)
