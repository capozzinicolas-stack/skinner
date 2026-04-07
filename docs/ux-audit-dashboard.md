# Auditoria UX — Dashboard B2B Skinner

**Data:** Abril 2026
**Escopo:** Portal B2B — todas as páginas do dashboard de tenant
**Metodologia:** Revisão de código-fonte (pages + tRPC routers + schema Prisma), análise de fluxo de usuário, avaliação heurística

---

## 1. Avaliação do Estado Atual

### O que existe e funciona

| Página | Rota | Status |
|---|---|---|
| Dashboard principal | `/dashboard` | Existe — muito básico |
| Catálogo de produtos | `/dashboard/catalogo` | Existe — funcional com filtros |
| Histórico de relatórios | `/dashboard/relatorios` | Existe — apenas tabela, sem análise |
| Configuração de marca | `/dashboard/marca` | Existe — funcional com preview |
| Canais de acesso | `/dashboard/canais` | Existe — link + QR Code |
| Usuários | `/dashboard/usuarios` | Existe — CRUD básico |
| Faturamento | `/dashboard/faturamento` | Existe — plano + histórico de uso |

### Pontos positivos identificados

- O sistema de dados é rico: o schema Prisma possui `Analysis`, `Recommendation`, `Conversion`, `Report`, `UsageEvent` — há muito dado disponível que **não está sendo exibido** ao usuário B2B.
- A página de catálogo tem filtros funcionais (busca por nome/SKU, por condição, por etapa da rotina) e a seção de cobertura por condição é um começo de inteligência de produto.
- A página de faturamento tem breakdowns de cobrança detalhados (base + excedente + comissão), o que é transparente e valoriza o produto.
- A página de marca tem um preview ao vivo que é uma boa escolha de UX.
- A arquitetura multi-tenant com roles (`b2b_admin`, `b2b_analyst`, `b2b_viewer`) está implementada no banco — mas os controles de permissão não aparecem em nenhuma interface.

### Problemas estruturais críticos

1. **Inconsistência visual severa.** Metade das páginas usa o design system do Skinner (`font-serif`, `text-carbone`, `bg-ivoire`, `border-sable/20`) e a outra metade usa classes Tailwind genéricas (`text-gray-900`, `rounded-xl`, `shadow-sm`). O catálogo, usuários e canais parecem pertencer a um produto diferente. Um cliente B2B percebe isso como falta de acabamento.

2. **O dashboard principal não serve ao usuário.** Quatro cards estáticos com totais acumulados não permitem nenhuma tomada de decisão. Não há contexto temporal, tendências, nem ações sugeridas.

3. **Zero inteligência sobre o negócio do cliente.** O banco tem `conditions` (diagnósticos), `skinType`, `Recommendation.matchScore`, `Conversion.saleValue`, `latencyMs` — dados que permitem construir inteligência de produto real. Nada disso é surfaced ao usuário B2B.

4. **Estado vazio sem orientação.** Um novo cliente que acabou de criar a conta vê o mesmo dashboard de zeros sem nenhuma instrução do que fazer a seguir. Não há onboarding.

5. **Navegação usa caracteres Unicode como ícones** (`☎`, `☺`, `☆`) em vez de ícones SVG reais. Em telas não-padrão isso quebra completamente a aparência da sidebar.

6. **Ausência de feedback para ações destrutivas.** O botão "Remover" em Usuários usa `confirm()` nativo do browser. A ação de "Desativar" produto não tem confirmação nenhuma.

---

## 2. Features Críticas Ausentes que um Cliente B2B Esperaria

### 2.1 Sem alertas proativos de nenhum tipo
Um cliente B2B que está gastando créditos e gerando análises não recebe nenhum aviso quando:
- Os créditos estão acabando (ex.: abaixo de 20% do limite)
- Ocorreu uma análise com erro (`status: failed`)
- O catálogo está sem produtos para uma condição frequente identificada nas análises
- Uma análise foi gerada mas o relatório nunca foi aberto pelo cliente final

### 2.2 Sem visão de desempenho de produtos
O cliente B2B tem um catálogo de produtos mas não sabe:
- Quais produtos são mais recomendados pela IA
- Quais produtos têm a maior taxa de conversão (clique + compra)
- Quais condições detectadas NÃO têm produtos correspondentes no catálogo (gap de cobertura)
- Qual o ticket médio gerado pelas análises convertidas

### 2.3 Sem perfil dos clientes finais
Os dados de `skinType`, `clientAge`, `conditions`, `fitzpatrick`, `primaryObjective` existem no banco. O cliente B2B (uma clínica, farmácia, e-commerce) não consegue saber:
- Qual é o perfil de pele predominante dos seus consumidores
- Qual a faixa etária mais frequente
- Quais condições são mais diagnosticadas

### 2.4 Sem configurações avançadas de análise
O model `TenantConfig` tem campos para `maxQuestions`, `restrictedConditions`, `customPromptSuffix`, `emailEnabled`, `whatsappEnabled`, `webhookUrl`, `shopifyDomain` — mas não existe nenhuma página de configurações no dashboard para gerenciar isso.

### 2.5 Sem gerenciamento de permissões por role
Existem três roles (`b2b_admin`, `b2b_analyst`, `b2b_viewer`) mas a interface de usuários não explica o que cada role pode fazer. Um admin não consegue mudar o papel de um usuário existente — só pode removê-lo e criar de novo.

### 2.6 Sem exportação de dados
Não há como o cliente B2B exportar o histórico de análises, a lista de clientes que passaram pela análise, ou os dados de conversão. Isso é uma necessidade básica para relatórios internos, auditoria e integração com CRM.

### 2.7 Sem histórico de faturamento real
A página de faturamento mostra `usageHistory` (eventos de uso individuais, limitado a 20 linhas). Não existe uma visão de faturas mensais fechadas com status de pagamento.

---

## 3. Dashboard Principal — Redesign Detalhado

### Estado atual
Quatro `StatCard` com: Análises realizadas (total acumulado), Conversões (total acumulado), Produtos ativos (total), Créditos restantes. Mais uma linha de texto com o nome do plano.

### Problema central
Números absolutos sem contexto temporal não comunicam saúde do negócio. "1.247 análises" não diz se o negócio está crescendo, estagnado ou caindo.

### Redesign proposto

#### Seção A — Barra de saúde contextual (topo)
Um banner condicional que aparece somente quando há uma situação que requer atenção, em ordem de prioridade:

- **Alerta vermelho:** "Seus créditos acabarão em X dias com o ritmo atual. Faça upgrade para não interromper o serviço." (calculado: créditos restantes / média diária de análises dos últimos 7 dias)
- **Alerta amarelo:** "X análises falharam nos últimos 7 dias. Verifique o log de erros."
- **Alerta amarelo:** "Detectamos Y condições frequentes sem produto correspondente no catálogo. Complete sua cobertura."
- **Alerta informativo:** "Você ainda não configurou sua marca. Seus clientes estão vendo a interface padrão Skinner."

#### Seção B — Métricas do período com comparativo (substituir os 4 cards)

Seletor de período: Últimos 7 dias / 30 dias / 90 dias / Mês atual

Seis cards com valor do período selecionado + delta percentual versus período anterior:

1. **Análises realizadas** — ex.: 143 este mês (+12% vs. mês anterior)
2. **Taxa de conversão** — ex.: 8,4% (conversões / análises × 100)
3. **Receita gerada** — ex.: R$ 4.280 (soma de `Conversion.saleValue` onde `type = "purchase"`)
4. **Créditos consumidos** — ex.: 143 de 200 (barra de progresso + previsão de esgotamento)
5. **Ticket médio por análise** — ex.: R$ 29,93 (receita total / conversões)
6. **Análises anônimas vs. identificadas** — ex.: 67% anônimas (afeta a capacidade de CRM do cliente)

#### Seção C — Gráfico de volume diário de análises (linha)

- **Tipo:** Line chart
- **Eixo X:** Dias do período selecionado
- **Eixo Y:** Número de análises por dia
- **Série única:** Volume diário
- **Propósito:** Identificar sazonalidade, picos (campanhas, eventos), quedas (problemas técnicos)
- **Dado disponível:** `Analysis.createdAt` agrupado por dia

#### Seção D — Funil de conversão (funnel ou barra horizontal empilhada)

- **Tipo:** Funil horizontal com 4 etapas
- **Etapas:**
  1. Análises iniciadas (total com qualquer `status`)
  2. Análises concluídas (`status: completed`)
  3. Cliques em produtos (`Recommendation.clickedAt IS NOT NULL`)
  4. Compras confirmadas (`Conversion.type = "purchase"`)
- **Propósito:** Mostrar onde o funil quebra. Se 90% concluem mas apenas 2% clicam, o problema é na apresentação dos produtos. Se 30% clicam mas 0% compram, o problema é no e-commerce.

#### Seção E — Top 5 condições diagnosticadas (barras horizontais)

- **Tipo:** Horizontal bar chart
- **Dados:** Contagem de análises por condição detectada, extraído de `Analysis.conditions` (JSON array), agrupado por ocorrência
- **Propósito:** Dar ao cliente inteligência sobre o perfil de saúde da pele dos seus consumidores. Uma farmácia pode usar isso para decidir qual linha de produto expandir.

#### Seção F — Ações rápidas (sidebar ou rodapé)

Cards de ação contextual que aparecem baseados no estado da conta:
- "Adicionar produtos" (se catálogo < 10 produtos)
- "Configurar e-mail de entrega" (se `emailEnabled` ainda não foi testado)
- "Compartilhar link de análise" (link para `/dashboard/canais`)
- "Ver análises desta semana" (link para `/dashboard/relatorios` com filtro pré-aplicado)

---

## 4. Recomendações Página por Página

### 4.1 Catálogo de Produtos (`/dashboard/catalogo`)

**O que funciona:** Filtros funcionais, tabela com imagem, SKU, etapa, condições, severidade, preço. Seção de cobertura por condição ao final.

**Problemas:**

- **Sem dados de performance por produto.** A tabela mostra atributos do produto mas não mostra quantas vezes cada produto foi recomendado, qual a taxa de clique ou de compra. O cliente não sabe quais produtos performam.
- **A seção "Cobertura por condição" é útil mas está enterrada** no rodapé da página e é só texto. Deveria ser visual e no topo, destacando gaps.
- **Sem ordenação nas colunas da tabela.** Não é possível ordenar por preço, por número de recomendações, ou por taxa de conversão.
- **A URL do e-commerce (`ecommerceLink`) não aparece na tabela.** O cliente não consegue verificar de forma rápida quais produtos têm link de compra configurado — isso impacta diretamente a conversão.
- **Sem paginação.** Com 100+ produtos, a tabela se torna inutilizável.

**Melhorias específicas:**

1. Adicionar à tabela uma coluna "Desempenho" com dois números inline: `X rec. / Y%` (X recomendações, Y% taxa de conversão). Requer nova query no `product.ts` que faça `JOIN` com `Recommendation` e `Conversion`.
2. Transformar a seção "Cobertura por condição" em um grid de chips coloridos: verde (3+ produtos), amarelo (1-2 produtos), vermelho (0 produtos — gap). Mover para o topo da página, acima da tabela.
3. Adicionar coluna "Link loja" com ícone de check verde ou "—" para indicar se `ecommerceLink` está preenchido.
4. Adicionar ordenação por clique no header de cada coluna.
5. Implementar paginação com 25 itens por página ou scroll infinito.

### 4.2 Histórico de Relatórios (`/dashboard/relatorios`)

**O que funciona:** Tabela com data, cliente, tipo de pele, condições, produtos recomendados, latência. Link para PDF.

**Problemas:**

- **Sem filtros.** Com 100+ análises (o router busca `take: 100`), não há como filtrar por data, por tipo de pele, por condição, por status de conversão, nem por cliente.
- **Sem busca por cliente.** Não é possível encontrar a análise de um cliente específico pelo nome ou e-mail.
- **O campo "Condições" mostra apenas 3 tags** com `.slice(0,3)` — as demais são silenciosamente cortadas sem indicação de que existem mais.
- **Latência exibida sem contexto.** "2,3s" não diz se isso é bom ou ruim para o cliente. Deveria haver uma indicação visual (verde/amarelo/vermelho).
- **Sem distinção de análises com conversão.** O cliente não consegue identificar quais análises resultaram em venda — uma das informações mais valiosas.
- **O router limita a 100 registros** sem paginação na UI. Clientes com alto volume perdem acesso ao histórico completo.
- **Sem visualização inline do relatório.** Para ver o conteúdo de uma análise, o usuário precisa abrir o PDF em nova aba. Não há drawer ou modal com o resumo.

**Melhorias específicas:**

1. Adicionar barra de filtros: campo de busca por nome/e-mail do cliente, seletor de período (últimos 7d / 30d / 90d / range customizado), filtro de tipo de pele, filtro de condição, filtro "Só com conversão".
2. Adicionar coluna "Conversão" com ícone de carrinho verde quando `Conversion.type = "purchase"` existir para aquela análise, mostrando o valor ao hover.
3. Mudar o `.slice(0,3)` das condições para mostrar todas, usando wrap de chips. Em casos de muitas condições, usar `+N mais` clicável.
4. Adicionar indicador de latência colorido: verde (< 3s), amarelo (3-6s), vermelho (> 6s).
5. Implementar paginação server-side com cursor pagination no router, removendo o limite hard de 100.
6. Adicionar drawer lateral que se abre ao clicar em uma linha, mostrando: resumo da análise, lista completa de produtos recomendados com scores, status do relatório (enviado/não aberto/aberto).
7. Adicionar botão "Exportar CSV" que gera download do histórico filtrado com todos os campos.

### 4.3 Configuração de Marca (`/dashboard/marca`)

**O que funciona:** Formulário com logo URL, cores primária e secundária, voz de marca e disclaimer. Preview ao vivo com bordas e botão coloridos.

**Problemas:**

- **O preview é muito limitado.** Mostra só um botão e o logo. O cliente não consegue ver como ficará a página real de análise com os produtos recomendados, o cabeçalho e o rodapé. Ele pode salvar configurações que ficam horrível no produto real e só descobrir quando um cliente final reclamar.
- **Upload de logo não existe.** O campo pede uma URL — o cliente precisa hospedar a imagem em algum lugar por conta própria. Isso é uma barreira de adoção muito alta para pequenas clínicas e farmácias.
- **Nenhum campo de tipografia.** A voz de marca é texto mas não há controle de fonte.
- **Sem campo para nome de exibição da marca.** O nome exibido nas análises vem de `tenant.name`, que é o slug/nome técnico. O cliente pode querer exibir "Clínica Dra. Ana Lima" em vez de "clinica-ana-lima".
- **Voz de marca sem orientação.** O placeholder é genérico. Um cliente sem experiência com IA não sabe o que escrever.

**Melhorias específicas:**

1. Expandir o preview para mostrar um mock da página de análise completa: cabeçalho com logo e cor primária, dois cards de produto com nome, imagem e botão "Comprar", rodapé com disclaimer. Usar um iframe ou componente que renderize a estrutura real.
2. Adicionar upload direto de logo com drag-and-drop (upload para storage, retorna URL automaticamente). Exibir dimensões recomendadas e fazer trim automático de espaço em branco.
3. Adicionar campo "Nome de exibição" separado do slug técnico.
4. Adicionar guia contextual para o campo "Voz de marca" com 3 exemplos de tom (formal/científico, acolhedor/humanizado, jovem/descontraído) que o usuário pode clicar para pré-preencher e customizar.
5. Adicionar campo "Cor de fundo" para que o cliente controle o background da página de análise.

### 4.4 Canais de Acesso (`/dashboard/canais`)

**O que funciona:** Link direto com botão copiar, QR Code gerado via API externa, download do QR Code.

**Problemas:**

- **O QR Code usa uma API de terceiros (`api.qrserver.com`)** sem fallback. Se o serviço cair, o QR Code não renderiza. Para um produto B2B, isso é uma dependência frágil.
- **O Widget Embed existe como placeholder** com "Em breve" mas não há nenhuma indicação de quando estará disponível ou como o cliente pode ser notificado.
- **Sem analytics por canal.** O cliente não sabe quantas análises foram iniciadas via link direto versus QR Code versus widget. Isso é informação crítica para decisões de marketing.
- **Sem personalização do link.** O link usa o slug do tenant que foi definido no momento do cadastro. O cliente não pode customizar.
- **O campo `tabletEnabled` existe no schema** (para quiosques em ponto de venda) mas não aparece no dashboard — é uma feature valiosa para clínicas e farmácias físicas que está completamente escondida.
- **Sem snippet de código real para o widget.** Mesmo como preview/teaser, mostrar o código que será disponibilizado aumenta o desejo.

**Melhorias específicas:**

1. Adicionar contador de análises por canal ao lado de cada item: "142 análises via este link" / "38 análises via QR Code". Requer campo `channel` no `Analysis` (já existe no `Report.channel`).
2. Gerar o QR Code internamente (biblioteca `qrcode` no Node, ou `@/lib/qr`) em vez de depender de API externa.
3. Adicionar seção "Modo Quiosque / Tablet" para ativar `tabletEnabled`, com descrição do caso de uso (ponto de venda físico, recepção de clínica).
4. Para Widget Embed, exibir um snippet de código placeholder já com a estrutura `<script src="https://skinner.app/widget.js" data-tenant="SLUG"></script>` e um campo de e-mail para "Me avise quando lançar".
5. Adicionar botão "Testar link" que abre a análise em nova aba para o admin verificar a experiência do cliente final antes de divulgar.

### 4.5 Usuários (`/dashboard/usuarios`)

**O que funciona:** Lista de usuários com nome, e-mail e papel. Formulário de criação inline. Botão de remoção com confirm.

**Problemas:**

- **Criação por senha em vez de convite.** O admin define a senha do novo usuário, o que é uma má prática de segurança (o admin conhece a senha) e cria atrito (precisa comunicar a senha por fora). O padrão B2B é enviar um e-mail de convite com link para o usuário criar sua própria senha.
- **Sem edição de papel.** Para mudar o papel de `b2b_viewer` para `b2b_analyst`, o admin precisa remover e recriar o usuário. Isso é um comportamento destrutivo desnecessário.
- **Os papéis não são explicados.** O dropdown tem "Visualizador", "Analista" e "Admin" mas não há tooltip, hint ou link explicando o que cada papel pode ou não fazer no sistema.
- **Sem data de criação / último acesso.** O admin não sabe quando cada usuário entrou no sistema ou se está ativo.
- **Sem indicação de usuário logado.** O admin não consegue se identificar na lista (qual linha é "você").
- **O `confirm()` nativo do browser para exclusão** é visualmente inconsistente e não pode ser customizado para o design system.

**Melhorias específicas:**

1. Substituir criação por senha por fluxo de convite por e-mail: o admin digita nome + e-mail + papel, o sistema envia um e-mail com link de acesso único (24h de validade) para o usuário criar sua própria senha.
2. Adicionar botão "Editar papel" na linha de cada usuário, abrindo um dropdown inline para alterar o papel sem remover o usuário.
3. Adicionar coluna "Membro desde" com data formatada.
4. Adicionar badge "Você" na linha do usuário atualmente autenticado.
5. Substituir `confirm()` por modal de confirmação dentro do design system, com nome do usuário e aviso das consequências.
6. Adicionar seção de tooltip ou acordeão "Sobre os papéis" explicando: Admin (acesso total + gerenciamento de usuários), Analista (vê relatórios e catálogo, não gerencia usuários nem faturamento), Visualizador (somente relatórios).

### 4.6 Faturamento (`/dashboard/faturamento`)

**O que funciona:** Cards com plano atual, uso de créditos com barra de progresso, fatura estimada com breakdown detalhado (base + excedente + comissão). Comparativo de planos. Histórico de uso.

**Problemas:**

- **A barra de progresso de créditos não tem alerta visual.** A barra usa uma cor sólida (`bg-carbone`) independente do percentual consumido. Ao atingir 80% ou 95% ela deveria mudar para amarelo/vermelho.
- **"Fatura estimada" não tem data de fechamento.** O cliente não sabe quando o mês fecha, quando será cobrado, nem a data do próximo reset de créditos.
- **O histórico de uso está limitado às 20 primeiras linhas** (`.slice(0, 20)` na UI, `take: 50` no router) sem paginação. Clientes com alto volume não têm acesso ao histórico completo.
- **Sem gráfico de consumo mensal.** O histórico é uma tabela crua de eventos. Um gráfico de barras com consumo por mês dos últimos 6 meses seria muito mais útil para o cliente planejar a renovação ou upgrade.
- **"Mudar plano" usa `confirm()` nativo** sem mostrar o impacto financeiro antes de confirmar (diferença de preço, nova data de cobrança, perda de créditos acumulados).
- **Sem informações de pagamento.** Não há indicação de qual cartão está cadastrado, data do próximo débito, nem link para o portal do Stripe onde o cliente gerencia o pagamento. (`portalUrl` existe no retorno do router mas não é usado na UI.)

**Melhorias específicas:**

1. Fazer a barra de créditos mudar de cor: 0-70% cinza/neutro, 70-90% amarelo-âmbar, 90-100% vermelho com mensagem inline "Atenção: créditos quase esgotados".
2. Adicionar linha "Próximo reset: 1° de Maio" abaixo dos cards, calculada a partir de `subscription.currentPeriodEnd`.
3. Adicionar gráfico de barras "Consumo mensal" com os últimos 6 meses, construído a partir de `UsageEvent` agrupado por mês. Eixo Y: análises realizadas. Linha de referência horizontal indicando o limite do plano.
4. Antes de confirmar mudança de plano, exibir um modal de comparação com: novo preço, data de vigência, diferença de créditos incluídos, custo do excedente.
5. Adicionar card "Método de pagamento" com link para `portalUrl` (já retornado pelo router `billing.status`) para o cliente gerenciar o cartão no portal do Stripe.
6. Implementar paginação no histórico de uso ou exportação CSV.

---

## 5. Novas Páginas / Seções Necessárias

### 5.1 Página: Configurações Avançadas (`/dashboard/configuracoes`)

**Justificativa:** O model `TenantConfig` tem campos de configuração de análise, entrega e integrações que não estão expostos em lugar nenhum.

**Conteúdo proposto:**

**Aba "Análise"**
- Número máximo de perguntas no questionário (`maxQuestions`, padrão 7, range 3-12)
- Condições restritas: multi-select para excluir condições específicas do diagnóstico (`restrictedConditions`) — útil para marcas que não querem que a IA recomende tratamentos para condições que não são o foco da linha
- Instrução adicional para a IA (`customPromptSuffix`) — campo de texto com aviso "Avançado: use para adicionar contexto específico da marca às análises"

**Aba "Entrega"**
- Toggle: Envio por e-mail (`emailEnabled`)
- Toggle + campo: Envio por WhatsApp (`whatsappEnabled` + `whatsappNumber`)
- Retenção de PDF em dias (`pdfRetentionDays`, padrão 90)

**Aba "Integrações"**
- Campo: Domínio Shopify (`shopifyDomain`) com instrução de configuração
- Campo: Webhook URL (`webhookUrl`) com descrição do payload enviado
- Campo: HubSpot API Key (`hubspotApiKey`)
- Campo: Salesforce API Key (`salesforceApiKey`)
- Para cada integração, indicador de status: "Conectado" / "Não configurado" / "Erro na última sincronização"

### 5.2 Página: Analytics de Produtos (`/dashboard/catalogo/analytics`)

**Justificativa:** O cliente B2B precisa saber quais produtos performam. Os dados existem em `Recommendation`, `Conversion` e `Analysis`.

**Conteúdo proposto:**

- Tabela ranqueada de produtos por número de recomendações (últimos 30 dias)
- Para cada produto: recomendações, cliques, compras, taxa de conversão clique-para-compra, receita gerada
- Gráfico de barras: Top 10 produtos mais recomendados
- Gráfico de barras: Top 10 produtos com maior receita gerada
- Mapa de calor de condição × produto: qual produto é mais recomendado para cada condição (matrix)
- Alerta de "produtos fantasmas": produtos ativos que nunca foram recomendados nos últimos 30 dias (possível problema de tagging)

### 5.3 Seção: Perfil dos Clientes Finais (dentro de `/dashboard/relatorios`)

**Justificativa:** Dados demográficos e dermatológicos dos consumidores existem no banco e têm alto valor estratégico para o cliente B2B.

**Conteúdo proposto (como aba ou accordion dentro de Relatórios):**

- Distribuição de tipos de pele: Pie chart ou donut chart com `skinType` — ex.: 42% Mista, 31% Oleosa, 15% Seca, 8% Normal, 4% Sensível
- Top 5 condições diagnosticadas: Horizontal bar chart com `conditions` agrupado por frequência
- Distribuição por faixa etária: Bar chart com `clientAge` — mostra o perfil de quem usa o serviço
- % análises identificadas vs. anônimas: Metric card simples com `clientEmail IS NOT NULL / total`
- Evolução temporal: Line chart com volume de análises por semana nos últimos 3 meses

### 5.4 Página: Log de Erros / Saúde do Sistema (`/dashboard/status`)

**Justificativa:** Análises com `status: failed` existem no banco mas o cliente B2B não tem visibilidade sobre isso. Para um serviço que consome créditos, falhas invisíveis são um problema de confiança.

**Conteúdo proposto:**

- Card de status atual: "Sistema operacional" / "Degradado" / "Incidente"
- Contagem de análises falhas nos últimos 7 dias (com botão para ver detalhes)
- Latência média das últimas 24h (de `Analysis.latencyMs`)
- Taxa de sucesso das análises (últimos 30 dias): `completed / (completed + failed) * 100`
- Tabela de análises falhas com: data, erro (se disponível em `rawResponse`), botão "Reprocessar"

---

## 6. Visualizações de Dados — Especificação Completa

| Gráfico | Página | Tipo | Eixo X | Eixo Y | Dado / Query |
|---|---|---|---|---|---|
| Volume diário de análises | Dashboard | Line chart | Dia (últimos 30d) | Nº de análises | `Analysis.createdAt` GROUP BY day |
| Funil de conversão | Dashboard | Funnel/barras | Etapa | Contagem | `Analysis`, `Recommendation.clickedAt`, `Conversion` |
| Top 5 condições | Dashboard | Horizontal bar | Condição | Frequência | `Analysis.conditions` JSON parsed, GROUP BY |
| Distribuição tipo de pele | Relatórios / Perfil | Donut chart | — | % de cada tipo | `Analysis.skinType` GROUP BY |
| Faixa etária dos clientes | Relatórios / Perfil | Bar chart | Faixa etária | Nº de análises | `Analysis.clientAge` GROUP BY |
| Volume por semana (3 meses) | Relatórios / Perfil | Area chart | Semana | Nº de análises | `Analysis.createdAt` GROUP BY week |
| Top 10 produtos recomendados | Analytics de Produtos | Horizontal bar | Produto | Nº recomendações | `Recommendation` GROUP BY `productId` |
| Receita por produto | Analytics de Produtos | Horizontal bar | Produto | R$ receita | `Conversion.saleValue` JOIN `Recommendation` |
| Condition × Produto (matrix) | Analytics de Produtos | Heatmap | Condição | Produto | `Recommendation` JOIN `Analysis.conditions` |
| Consumo mensal de créditos | Faturamento | Bar chart | Mês (6 meses) | Análises realizadas | `UsageEvent` GROUP BY month |
| Cobertura de catálogo | Catálogo | Grid de status | Condição | Status (verde/amarelo/vermelho) | `Product.concernTags` vs. condições válidas |

---

## 7. Experiência de Onboarding — Primeiro Acesso

### Estado atual
Um cliente que acessa o dashboard pela primeira vez vê exatamente o mesmo que um cliente maduro: quatro cards com zeros e nenhuma orientação. Não há distinção entre "conta nova" e "conta em uso".

### Fluxo proposto

#### Checklist de ativação (aparece no dashboard enquanto os itens não estão completos)

Um componente de checklist progressivo fixado no topo do dashboard, que desaparece quando todos os itens são concluídos. Cada item tem um link de ação direto.

```
Comece a gerar resultados com o Skinner
[============          ] 2 de 5 etapas concluídas

[✓] Conta criada
[✓] Marca configurada  →  (Se logoUrl e primaryColor foram editados)
[ ] Adicionar produtos ao catálogo  →  [Ir para Catálogo]
[ ] Testar a análise  →  [Abrir link de análise]
[ ] Compartilhar com seus clientes  →  [Ver canais de acesso]
```

#### Empty states com ação

Cada página deve ter um empty state orientado para a ação, não apenas "Nenhum item encontrado":

- **Dashboard (zero análises):** "Seu link de análise está pronto. Compartilhe com seus clientes para começar a gerar inteligência sobre a pele deles." + botão "Copiar link"
- **Catálogo (zero produtos):** "Adicione os produtos da sua linha para que a IA possa recomendá-los nas análises. Sem produtos no catálogo, a análise funciona mas sem recomendações personalizadas." + botão "Adicionar primeiro produto" + link "Importar via CSV"
- **Relatórios (zero análises):** "Quando seus clientes realizarem análises, o histórico completo aparecerá aqui — tipo de pele, condições diagnosticadas, produtos recomendados e conversões."

#### Tour guiado no primeiro login

Um tooltip sequencial (não modal bloqueante) que percorre os itens da sidebar na primeira sessão:
1. "Este é seu dashboard. Aqui você acompanha análises e conversões."
2. "Primeiro, configure sua marca para que os relatórios mostrem sua identidade."
3. "Depois adicione seus produtos. A IA só pode recomendar o que está no catálogo."
4. "Seu link único está em Canais. Compartilhe com seus clientes."

Um botão "Pular tour" deve estar sempre visível.

---

## 8. Notificações e Alertas

### Estado atual
Não existe nenhum sistema de notificações. Nenhum badge, nenhum sino, nenhum e-mail proativo.

### Notificações in-app propostas (sino no header da sidebar)

| Evento | Mensagem | Prioridade |
|---|---|---|
| Créditos abaixo de 20% | "Atenção: restam apenas X créditos. Com o ritmo atual, duram Y dias." | Alta — vermelho |
| Créditos zerados | "Seus créditos acabaram. As análises estão pausadas. Faça upgrade agora." | Crítica — vermelho com badge |
| 5+ análises falhadas em 24h | "X análises falharam hoje. Clique para ver o log." | Alta — amarelo |
| Plano alterado com sucesso | "Seu plano foi alterado para [Nome]. Novos créditos: X." | Informativa — verde |
| Usuário adicionado | "[Nome] aceitou o convite e entrou na plataforma." | Informativa — cinza |
| Primeiro cliente fez análise | "Primeiro cliente analisado! Veja o relatório." | Celebração — verde |
| Mês fechado — fatura disponível | "Fatura de [Mês] disponível: R$ X,XX." | Informativa — cinza |

### Notificações por e-mail propostas

| Evento | Destinatário | Frequência |
|---|---|---|
| Créditos abaixo de 30% | b2b_admin | Uma vez por período |
| Créditos abaixo de 10% | b2b_admin | Uma vez por período |
| Créditos zerados | b2b_admin | Imediata |
| Resumo semanal de análises | b2b_admin, b2b_analyst | Toda segunda-feira |
| Fatura mensal disponível | b2b_admin | Dia 1 de cada mês |
| Convite para novo usuário | Novo usuário | Imediata ao criar convite |
| Relatório gerado para cliente | Cliente final | Imediata pós-análise |

---

## 9. Matriz de Prioridade — Impacto × Esforço

### Legenda
- **Impacto:** Alto (3), Médio (2), Baixo (1)
- **Esforço:** Alto (3), Médio (2), Baixo (1)
- **Score de prioridade:** Impacto ÷ Esforço (quanto maior, mais prioritário)

| # | Recomendação | Página | Impacto | Esforço | Score | Quadrante |
|---|---|---|---|---|---|---|
| 1 | Alertas de créditos (banner no dashboard + e-mail) | Dashboard / Faturamento | 3 | 1 | 3.0 | Quick Win |
| 2 | Empty states com orientação e ações | Todas | 3 | 1 | 3.0 | Quick Win |
| 3 | Barra de créditos com cor reativa (verde/amarelo/vermelho) | Faturamento | 3 | 1 | 3.0 | Quick Win |
| 4 | Filtro de período e busca por cliente na página de Relatórios | Relatórios | 3 | 1 | 3.0 | Quick Win |
| 5 | Checklist de onboarding no dashboard | Dashboard | 3 | 1 | 3.0 | Quick Win |
| 6 | Corrigir inconsistência visual (unificar design system) | Todas | 2 | 1 | 2.0 | Quick Win |
| 7 | Substituir ícones Unicode por SVG na sidebar | Layout | 2 | 1 | 2.0 | Quick Win |
| 8 | Métricas do período com delta % vs. período anterior (6 cards) | Dashboard | 3 | 2 | 1.5 | Alta prioridade |
| 9 | Gráfico de volume diário de análises (line chart) | Dashboard | 3 | 2 | 1.5 | Alta prioridade |
| 10 | Funil de conversão (4 etapas) | Dashboard | 3 | 2 | 1.5 | Alta prioridade |
| 11 | Top 5 condições diagnosticadas (bar chart) | Dashboard | 3 | 2 | 1.5 | Alta prioridade |
| 12 | Coluna de e-commerce link no catálogo | Catálogo | 2 | 1 | 2.0 | Quick Win |
| 13 | Cobertura de catálogo visual (grid verde/amarelo/vermelho) | Catálogo | 3 | 2 | 1.5 | Alta prioridade |
| 14 | Substituir confirm() por modais do design system | Catálogo / Usuários | 2 | 1 | 2.0 | Quick Win |
| 15 | Gráfico de consumo mensal de créditos (bar chart 6 meses) | Faturamento | 2 | 2 | 1.0 | Normal |
| 16 | Data de fechamento do ciclo e próximo reset | Faturamento | 3 | 1 | 3.0 | Quick Win |
| 17 | Modal de comparação antes de mudar plano | Faturamento | 2 | 1 | 2.0 | Quick Win |
| 18 | Link para portal do Stripe (portalUrl já retornado) | Faturamento | 3 | 1 | 3.0 | Quick Win |
| 19 | Coluna de desempenho no catálogo (rec. + taxa conversão) | Catálogo | 3 | 2 | 1.5 | Alta prioridade |
| 20 | Drawer de detalhes ao clicar em análise | Relatórios | 2 | 2 | 1.0 | Normal |
| 21 | Exportação CSV do histórico de relatórios | Relatórios | 3 | 2 | 1.5 | Alta prioridade |
| 22 | Upload direto de logo (sem URL manual) | Marca | 3 | 2 | 1.5 | Alta prioridade |
| 23 | Preview expandido da análise na página de Marca | Marca | 2 | 2 | 1.0 | Normal |
| 24 | Analytics de canal (análises por link vs. QR vs. widget) | Canais | 2 | 2 | 1.0 | Normal |
| 25 | Fluxo de convite por e-mail (substituir criação por senha) | Usuários | 3 | 2 | 1.5 | Alta prioridade |
| 26 | Edição de papel de usuário sem remover e recriar | Usuários | 2 | 1 | 2.0 | Quick Win |
| 27 | Página de Configurações Avançadas (TenantConfig) | Nova página | 3 | 3 | 1.0 | Backlog estratégico |
| 28 | Página de Analytics de Produtos | Nova página | 3 | 3 | 1.0 | Backlog estratégico |
| 29 | Seção de Perfil dos Clientes Finais | Relatórios | 3 | 2 | 1.5 | Alta prioridade |
| 30 | Página de Status / Log de Erros | Nova página | 2 | 2 | 1.0 | Normal |
| 31 | Notificações in-app (sino + badges) | Layout | 2 | 3 | 0.7 | Backlog estratégico |
| 32 | E-mails proativos (créditos, resumo semanal) | Infra | 3 | 3 | 1.0 | Backlog estratégico |
| 33 | Tour guiado no primeiro login | Onboarding | 2 | 2 | 1.0 | Normal |
| 34 | Modo Quiosque / Tablet nos canais | Canais | 2 | 3 | 0.7 | Backlog estratégico |
| 35 | Paginação server-side em Relatórios | Relatórios | 2 | 2 | 1.0 | Normal |

### Resumo por quadrante

**Quick Wins (fazer primeiro — impacto alto, esforço baixo):**
Itens 1-7, 12, 14, 16, 17, 18, 26. A maioria envolve usar dados que o backend já retorna mas a UI não exibe, corrigir inconsistências visuais, e adicionar feedbacks básicos.

**Alta prioridade (fazer no próximo ciclo — impacto alto, esforço médio):**
Itens 8-11, 13, 19, 21, 22, 25, 29. São as evoluções mais significativas: métricas temporais no dashboard, gráficos fundamentais, inteligência de catálogo, exportação de dados, e o perfil dos clientes finais.

**Normal (planejar para o médio prazo):**
Itens 15, 20, 23, 24, 30, 33, 35. Melhorias de profundidade que elevam a experiência mas não são bloqueantes.

**Backlog estratégico (depende de infra ou esforço alto):**
Itens 27, 28, 31, 32, 34. Funcionalidades complexas com alto valor de retenção B2B mas que requerem arquitetura adicional (e-mails transacionais, sistema de notificações, analytics de produto com queries pesadas).

---

## 10. Observações Finais

### Oportunidade estratégica não explorada

O dado mais valioso que a plataforma produz e que o dashboard não usa é o **`matchScore`** da `Recommendation` — uma pontuação de 0 a 1 que indica o quão bem um produto se adequou ao diagnóstico de um cliente. Exibir esse dado no perfil de cada produto transformaria o Skinner de uma ferramenta de "gerador de relatórios" para uma **plataforma de inteligência de produto** — um posicionamento muito mais defensável em B2B.

### Risco de retenção identificado

A ausência de qualquer alerta proativo sobre créditos é o maior risco de churn identificado. Um cliente B2B que perde o serviço abruptamente porque os créditos zeraram sem aviso não renova — ele procura um concorrente. Implementar o banner de alerta de créditos (item #1 da matriz) e o e-mail proativo (item #32) deve ser tratado como prioridade de negócio, não apenas de UX.

### Dados disponíveis mas subutilizados

O schema Prisma contém dados ricos que a interface atual ignora completamente:

- `Analysis.barrierStatus`, `Analysis.fitzpatrick`, `Analysis.severityScores` — dados clínicos que dariam dimensão ao perfil dos consumidores
- `Recommendation.matchScore` e `Recommendation.reason` — justificativas da IA que podem ser expostas para dar transparência ao cliente B2B
- `AnalysisResult.timelineExpected` e `AnalysisResult.alertSigns` — dados de saída da IA que não estão acessíveis em nenhuma parte do dashboard
- `TenantConfig.webhookUrl`, `shopifyDomain`, `hubspotApiKey` — integrações já modeladas que podem ser ativadas com uma página de configurações

Esses dados representam funcionalidades que já foram projetadas no modelo de dados mas aguardam implementação na interface.
