# Skinner Project - Agent Team

## When to Invoke Agents

The lead agent (Claude main) should invoke specialized agents when:
- A task matches their domain expertise
- Multiple independent tasks can run in parallel
- Deep domain knowledge is needed (dermatology, finance, UX)
- Code review or architecture decisions need a second perspective

## Agent Roster

### 1. Dermatology Specialist
- **Type**: cs-senior-engineer (with dermatology domain prompt)
- **Domain**: Clinical dermatology, skin conditions, ingredients, treatment protocols
- **Invoke when**: Improving SAE prompts, expanding skin condition database, validating treatment plans, reviewing product matching logic, writing medical disclaimers
- **Key tasks**: Expand from 6 to 20+ conditions, build Claude analysis prompt, validate severity scoring, create ingredient interaction rules

### 2. Senior Engineer
- **Type**: cs-senior-engineer
- **Domain**: Architecture, code review, API design, security, performance
- **Invoke when**: Integrating real APIs (Claude, Stripe, Resend), code review, security audit, performance optimization, debugging complex issues

### 3. DevOps Engineer
- **Type**: DevOps Engineer
- **Domain**: Infrastructure, CI/CD, deploy, monitoring, scaling
- **Invoke when**: Vercel deploy issues, Supabase config, environment setup, monitoring (Sentry/PostHog), staging environments

### 4. Product Manager
- **Type**: Product Manager
- **Domain**: Feature specs, prioritization, roadmap, user stories
- **Invoke when**: Planning Fase 1/2 features, writing specs for new modules, prioritizing backlog, defining acceptance criteria

### 5. UX Researcher
- **Type**: cs-ux-researcher
- **Domain**: User research, personas, journey maps, usability testing
- **Invoke when**: Optimizing B2C flow conversion, questionnaire UX, results page design, B2B portal usability

### 6. Growth Strategist
- **Type**: cs-growth-strategist
- **Domain**: Revenue ops, sales, customer success, B2B acquisition
- **Invoke when**: Launch strategy, first customer onboarding, sales playbook, churn prevention, expansion scoring

### 7. Content Creator
- **Type**: cs-content-creator
- **Domain**: Brand voice, SEO, copy, content strategy
- **Invoke when**: Marketing site copy, blog content, email sequences, social media, SEO optimization

### 8. Financial Analyst
- **Type**: cs-financial-analyst
- **Domain**: Financial models, SaaS metrics, pricing, unit economics
- **Invoke when**: Validating pricing tiers, MRR projections, CAC/LTV analysis, investor materials, budget planning

### 9. Product Analyst
- **Type**: cs-product-analyst
- **Domain**: KPIs, dashboards, experiments, data analysis
- **Invoke when**: Defining success metrics, setting up analytics, designing A/B tests, interpreting conversion data
