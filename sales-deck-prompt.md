# Prompt para Claude Design — Apresentação Comercial Skinner (3 segmentos)

Prompt único auto-contido. Pegar o bloco inteiro em uma conversa de Claude Design. Output esperado: **três** decks .pptx independentes (Laboratórios / Clínicas / Farmácias) que compartilham um chassi visual mas têm narrativa, números e features customizados por segmento. Idioma: português brasileiro.

---

```
Você vai criar TRÊS apresentações comerciais separadas em formato .pptx para a plataforma Skinner. Uma para cada segmento de cliente: Laboratórios farmacêuticos, Clínicas de dermatologia, e Farmácias / drogarias. As apresentações compartilham um esqueleto visual idêntico mas têm narrativa, dados e features customizados por segmento. Cada deck deve ser usável de forma autônoma por um vendedor em uma reunião de 30 minutos.

# Contexto da plataforma

Skinner ("Skin Tech") é um SaaS B2B multi-tenant que entrega análise de pele assistida por IA + recomendação automática de produtos. O paciente final responde um questionário, faz upload de uma foto, e em ~30s recebe: diagnóstico (tipo de pele, condições detectadas, severidade, barreira cutânea), rotina em 3 fases, projeção visual de melhora em 8 e 12 semanas (Gemini), e a lista de produtos do catálogo do cliente B2B que melhor atendem o caso. O cliente B2B monetiza vendendo os produtos recomendados. Skinner cobra mensalidade fixa por plano + comissão (2-3%) sobre vendas atribuídas.

Diferenciais técnicos verificáveis: Claude Sonnet 4 com prompt configurável por tenant, KB dermatológica com condições, ingredientes ativos e contraindicações, scoring híbrido (concern match 35% + skin type 20% + objective 15% + severity 10% + ingredient bonus 20%), filtro automático de contraindicações (gravidez, alergias), tom da análise editável (humanizado vs técnico), benchmark cross-tenant opt-in com proteção de anonimato (mín 3 tenants), pixel de conversão LGPD-friendly, marca branca completa, integração nativa Nuvemshop e Shopify, exportação CSV de todos os dados, conformidade LGPD com soft delete, projeção de imagem com Gemini 2.5.

# Posicionamento oficial por segmento (usar LITERALMENTE)

**Laboratórios**
- Claim: "Sua marca como recomendação dermatológica."
- Pitch: Distribua o Skinner como ferramenta de ativação para sua rede de PDVs e farmácias parceiras. O catálogo da marca aparece como recomendação personalizada — não como prateleira.
- Stats típicos: +47% sell-out em 90 dias. 380+ pontos ativados. R$ 1.2M de GMV atribuído por mês.
- Features-chave: Painel master multi-rede. Co-marketing com farmácias. Atribuição por SKU e por região. Insights de demanda por bioma.
- Comprador-alvo: Diretor de marketing, diretor de trade, head de digital de laboratório (Galderma, Isdin, Vichy, Pierre Fabre, Granado, Mantecorp, Cetaphil etc.).
- Dor central: Investem em educação médica e branding mas não conseguem atribuir sell-out granular nem influenciar a recomendação no PDV.

**Clínicas**
- Claim: "O paciente chega educado. A venda flui."
- Pitch: Análise IA antes da consulta dermatológica. O paciente entra no consultório já entendendo o estado da pele, com expectativas alinhadas e mais aberto a recomendação de tratamento e venda de produto.
- Stats típicos: 3.1x venda de produto por consulta. -40% tempo da consulta inicial. NPS 71.
- Features-chave: Marca branca completa. Integração com prontuário (memed, doctor.med). Receituário e PDF assinados. Histórico de evolução do paciente.
- Comprador-alvo: Dermatologista proprietário, gestora de clínica de estética avançada, diretor médico de rede de clínicas.
- Dor central: Consultas longas, paciente desinformado, baixa venda de produto após consulta, dificuldade de mostrar evolução ao longo do tempo.

**Farmácias**
- Claim: "Tablet no balcão. Ticket médio 2.4x maior."
- Pitch: Análise no PDV em 3 minutos. O atendente consulta junto com o cliente e a recomendação aparece em tempo real, com produtos disponíveis no estoque local.
- Stats típicos: 2.4x ticket médio em skincare. +62% cross-sell por atendimento. 89% taxa de aceite da recomendação.
- Features-chave: Modo PDV otimizado pra tablet. Integração com Linx, RM e PDVs próprios. Comissão automática para atendente. Treinamento por vídeo + certificação.
- Comprador-alvo: Diretor comercial de rede de farmácias, gerente regional, dono de farmácia independente premium, head de categoria dermocosméticos.
- Dor central: Atendente sem repertório técnico, recomendação genérica ("leve esse aqui"), cross-sell baixo, ticket médio estagnado em dermocosméticos apesar do crescimento da categoria.

# Brand book (aplicar literalmente em todos os 3 decks)

- Cores: Blanc Casse #F7F3EE (fundo principal), Carbone #1C1917 (texto principal e CTAs), Pierre #7C7269 (texto secundário), Sable #C8BAA9 (bordas e divisores 1px), Ivoire #EDE6DB (cards e blocos secundários), Terre #3D342C (destaques editoriais e itálicos).
- Tipografia: Lora (serif) em títulos, com itálico usado pontualmente em palavras-chave dentro do título (ex.: "Três jeitos de usar Skinner."). Poppins Light (300) em corpo. Labels em Poppins 10px uppercase, tracking ~0.18em, cor Pierre.
- Layout: SEM cantos arredondados em nenhum elemento (cards, botões, imagens). Divisores em linhas finas 1px Sable. Espaçamento generoso. Hierarquia exclusivamente tipográfica.
- Linguagem: precisa, autoritativa, calorosa, editorial. Sem clichês de SaaS ("revolucione", "transforme", "potencialize"). Frases curtas. Verbos no presente. Nunca "Skinners". Sem emojis. Sem exclamações.
- Estatísticas grandes: Lora itálico, peso regular ou bold conforme contraste necessário, em Carbone, deslocadas à esquerda do label que descreve o número.

# Estrutura obrigatória de cada deck (14 slides, mesma ordem nos 3)

1. **Capa** — logo Skinner, título "Skinner para [Segmento]", subtítulo com o claim oficial do segmento, nome do prospect (placeholder "[Nome do prospect]"), data (placeholder).
2. **O contexto do mercado** — 3 dados macro do mercado dermatológico brasileiro relevantes para o segmento. Layout em 3 colunas com label + número grande + frase curta. Fonte citada no rodapé (placeholder editável).
3. **A dor que estamos resolvendo** — descrição da dor central do comprador-alvo desse segmento, em 1 parágrafo curto + 3 sintomas observáveis em bullets curtos. Sem tom apocalíptico — diagnóstico frio.
4. **O que é Skinner** — 1 frase em Lora grande + 4 atributos em grid 2x2 (IA clínica, marca branca, recomendação por catálogo, mensuração de funil). Mesma slide nos 3 decks.
5. **Como funciona — fluxo do paciente** — diagrama horizontal com 5 estágios: Questionário → Foto → Análise Claude → Resultado + Rotina → Conversão. Linhas finas, tipografia como protagonista. Mesma slide nos 3 decks.
6. **Por que isso muda o jogo para [Segmento]** — claim oficial do segmento como título grande, descrição (pitch oficial) à esquerda, ilustração ou screenshot do produto à direita. Custom por segmento.
7. **Features que importam para [Segmento]** — os 4 bullets oficiais do segmento, cada um com microcopy de 2-3 linhas explicando por quê aquela feature é crítica para esse comprador. Custom por segmento.
8. **Resultados típicos** — os 3 stats oficiais do segmento como números grandes em Lora itálico (ex.: "+47%", "3.1x", "2.4x"), cada um com label e nota de rodapé indicando "média entre clientes ativos há 90+ dias" (placeholder ajustável).
9. **Estudo de caso** — placeholder de case real do segmento. Estrutura: nome do cliente, contexto de partida, o que mudou com Skinner, números antes/depois, citação do tomador de decisão. Indicar onde o vendedor substitui pelos dados do case mais relevante.
10. **Como se integra à sua operação** — diagrama específico do segmento mostrando onde Skinner se encaixa no fluxo existente. Laboratório: pivô entre marca, PDVs e consumidor. Clínica: antes da consulta + reforço pós-consulta + recompra. Farmácia: tablet no balcão + integração de PDV + comissionamento.
11. **Implementação em 14 dias** — timeline horizontal com os 5 marcos do site (Dia 1-2 Setup técnico / Dia 3-5 Catálogo / Dia 6-9 Treinamento / Dia 10-14 Piloto / Mês 2 Otimização). Mesma slide nos 3 decks.
12. **Investimento** — tabela dos 3 planos (Growth R$ 490/mês 200 análises 3% comissão / Pro R$ 1.490/mês 1.000 análises 2% comissão / Enterprise sob consulta para volume customizado). Sem cores saturadas, apenas hierarquia tipográfica e check-marks finos. Indicar plano sugerido para o segmento (Farmácia rede grande → Pro ou Enterprise; Clínica boutique → Growth; Laboratório → Enterprise).
13. **Por que Skinner e não [alternativa]** — comparação curta contra alternativas que esse comprador costuma considerar. Laboratório: vs ferramentas de trade marketing tradicional + apps de marca isolados. Clínica: vs questionário em papel + venda no boca a boca + apps genéricos. Farmácia: vs script de atendente + treinamento presencial + nada. Tabela com 5 critérios e marcação visual sóbria.
14. **Próximos passos** — 3 opções concretas para o prospect: (a) piloto de 30 dias com X análises gratuitas, (b) demo guiada com a equipe de vendas, (c) enviar acesso ao tenant de sandbox. CTA principal "Falar com vendas" com link skinner.lat/contato. Rodapé com nome + e-mail + telefone do vendedor (placeholders).

# Especificações técnicas dos arquivos .pptx

- 3 arquivos: `skinner-deck-laboratorios.pptx`, `skinner-deck-clinicas.pptx`, `skinner-deck-farmacias.pptx`.
- Aspect ratio 16:9. Resolução base 1920x1080.
- Fontes embutidas (Lora 400/400-italic/700, Poppins 300/400/600). Não substituir por Calibri ou fontes de sistema — quebra brand.
- Slide master único compartilhado entre os 3 decks: cabeçalho com logo Skinner em alto-esquerda (12px de altura), número da página em baixo-direita, label "Skinner para [Segmento] — Confidencial" em baixo-esquerda. Tudo em label-style.
- Cada slide com no máximo 3 elementos visuais simultâneos. Densidade baixa.
- Imagens placeholders (capturas de produto, ilustrações de fluxo, fotos de uso) marcadas como `[PLACEHOLDER: descrição]` em retângulos com borda Sable, para o time de design substituir depois.
- Notas do apresentador preenchidas em CADA slide, com 60-100 palavras: o que dizer, qual transição usar para o próximo slide, qual objeção comum esperar e como responder.

# O que NÃO fazer

- Não inventar features que não estão no contexto. Se a feature não está descrita aqui, não inclua.
- Não usar números diferentes dos oficiais — os stats por segmento são literais e não-negociáveis.
- Não introduzir cores fora da paleta. Nenhum azul, vermelho, verde de "alerta".
- Não usar ícones cartunescos, ilustrações 3D, gradientes, sombras grandes ou animações em swoosh.
- Não criar slides redundantes. Se um conteúdo já apareceu, não repita "para reforçar".
- Não terminar com slide de "obrigado" decorativo — o último slide é de ação concreta.

# Fluxo de execução pedido

Antes de gerar os arquivos, me devolva 4 itens:

1. Confirmação de entendimento do brand em 3 linhas.
2. Esqueleto dos 14 slides aplicado a UM dos segmentos (recomendo começar por Clínicas — é o ICP atual da Skinner). Quero ver os títulos finais e a frase central de cada slide antes de você gerar os 3 .pptx.
3. Quais elementos você vai compartilhar 100% entre os 3 decks (slides 4, 5, 11) e quais vão variar (slides 1, 2, 3, 6, 7, 8, 9, 10, 12, 13, 14). Lista explícita.
4. Qualquer dúvida factual ou ambiguidade que precise resolver — assumir nada sem checar.

Só depois da minha aprovação você gera os 3 arquivos. Se eu pedir alteração no esqueleto, ela se aplica aos 3 decks simultaneamente para preservar paridade entre os segmentos.
```

---

## Notas críticas

**Por que três decks separados e não um deck "universal" com tabs.** Em reunião de venda, switch de tab quebra o ritmo e dilui o foco do prospect. Três arquivos enxutos vencem um arquivo gordo com filtros — mesmo que duplique conteúdo nos slides 4, 5 e 11.

**Por que forço Claude Design a parar e mostrar o esqueleto antes de gerar.** PPTX é caro de regenerar. Erro de narrativa pego no esqueleto custa 1 mensagem; pego depois do .pptx exportado custa 3 ciclos de revisão. O passo de aprovação intermediário é o ponto de maior ROI do prompt.

**O que fica fragil.** Os números dos segmentos (`+47%`, `3.1x`, `2.4x`) vêm da página de marketing — se forem aspiracionais e não médias reais de clientes ativos, qualquer prospect criterioso vai pedir o estudo de fundo. Antes de mandar o deck a um lead enterprise sério, validar esses números com clientes-âncora ou substituir por dados auditáveis. O prompt instrui a colocar nota de rodapé "média entre clientes ativos há 90+ dias" — se essa afirmação não for verdadeira, removê-la antes do envio.

**O que deixei de fora deliberadamente.** Roteiro de demo ao vivo (é outro artefato — pede uma sessão dedicada com gravação de tela), calculadora de ROI customizada (idealmente é um Excel anexo, não slide), e tradução para inglês ou espanhol (Skinner roda em PT-BR no MVP, traduzir prematuramente é desperdício).

[Ver el prompt](computer:///Users/nicolascapozzi/skinner/sales-deck-prompt.md)
