# Workflow de Testes e QA (Quality Assurance)
**Projeto:** Caixa Gerencial
**Stack:** Node.js, React, Oracle / Supabase

## Visão Geral
Este documento estabelece a estratégia abrangente de testes e fluxo de aprovação contínua, cobrindo testes unitários, testes de integração, testes end-to-end (E2E) e os Quality Gates para o pipeline de CI/CD.

## Pirâmide de Testes (Estratégia)
Nossa estratégia distribui a automação na seguinte proporção:
- **70% Testes Unitários:** Foco em lógica de negócios isolada e componentes puros.
- **20% Testes de Integração:** Integração entre Node.js, serviços de API e a base de dados (Oracle/Supabase).
- **10% Testes E2E:** Navegação guiada do usuário no fluxo crítico pelo Playwright.

---

## 1. Testes Unitários

### Frontend (React)
- **Ferramentas:** Vitest / Jest + React Testing Library.
- **Foco:** Validar regras de renderização (`is loading`, `is error`), pequenos cálculos de badges, interatividade pura sem chamadas reais.
- **Mock:** Mockar chamadas globais de `fetch` e variáveis do Supabase.

### Backend (Node.js)
- **Ferramentas:** Vitest / Jest.
- **Foco:** Funções de cálculo de caixa, validações de payload de requisições, services limpos de banco.

---

## 2. Testes de Integração

### Banco de Dados (Oracle / Supabase)
- **Oracle:** Testes das `Stored Procedures` utilizando um ambiente que aplica `ROLLBACK` ao término do script de teste para não poluir o banco.
- **Supabase:** Criação de testes que injetam JWTs provisórios para atestar se as regras de RLS (*Row Level Security*) proíbem usuários sem acesso.

### APIs Backend (Node.js)
- **Ferramentas:** Supertest + Vitest.
- **Foco:** Chamar endpoints (ex: `POST /api/entradas`) e validar não só o HTTP 201, como também se a requisição tratou erros de limite (rate-limiting) e schema (Zod/Yup).

---

## 3. Testes End-to-End (E2E) e Browser Automation

- **Ferramenta:** Playwright.
- **Foco (Caminho Feliz):** Simular o login de um gerente, acesso à dashboard principal, criação de uma receita, aprovação de uma despesa, e verificação se os cartões de KPI atualizaram o Saldo Atual.
- **Testes Visuais:** Capturas de tela cruciais garantindo que a topologia responsiva (`md:hidden`) está acionando adequadamente a Sidebar.

---

## 4. Segurança e Tratamento de Erros

- Integração de `SAST` (Static Application Security Testing) para impedir subida de chaves `.env` ou secrets JWT fixos no código.
- Aplicação de automação e análise para garantir firewalls nas APIs (bloqueio de SQL injection, Rate Limiting).
- Erros capturados em Frontend e Backend devem transbordar em painéis limpos, pintados com a identidade visual de erro (`bg-red-100/text-red-600`), ao invés de derrubarem a aplicação globalmente (White Screen of Death).

---

## 5. Quality Gates (Critérios de Aceite para PR)

Nenhum código vai para produção sem passar pelo seguinte fluxo:

- [ ] Linter (ESLint/Prettier) aprovado sem avisos estruturais.
- [ ] Cobertura de testes unitários superior a **80%**.
- [ ] Testes de Integração (Node.js + Bancos efêmeros) passando em `GREEN`.
- [ ] O teste E2E do Playwright do Caminho Crítico (Dashboard/Caixa) não pode estar quebrado.
- [ ] Scanner de dependências e SAST aprovam o Pull Request sem vulnerabilidades CVE altas.
