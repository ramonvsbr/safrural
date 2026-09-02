# SAF-PP · Sistema de Análise Financeira de Projetos Produtivos

**Caderno de Campo Digital** para análise de viabilidade financeira de empreendimentos rurais, adaptado do SAF-PP (Meloni, 2017).

Uma ferramenta 100% front-end (HTML + CSS + JavaScript puro, sem frameworks e sem back-end) pensada para produtores rurais, técnicos de assistência técnica e extensão rural (ATER), agentes de crédito e associações que precisam montar — de forma acessível e sem jargão financeiro — a análise de viabilidade de um projeto produtivo: investimentos, dívidas, custos, receitas, fluxo de caixa, indicadores (VPL, TIR, Payback, Ponto de Equilíbrio) e cenários de sensibilidade.

---

## ✨ Principais funcionalidades

- **Guia "Como Usar" integrado** — passo a passo de preenchimento e um glossário que traduz termos técnicos (VPL, TIR, Payback etc.) para linguagem simples, sem esconder a sigla original.
- **Dois tipos de projeto**
  - *Projeto do Zero*: considera investimento inicial e capital de giro no Ano 0.
  - *Projeto em Andamento*: não cobra novo aporte nem capital de giro inicial, pois a estrutura já está em operação.
- **Painel Geral (Dashboard)** com semáforo de viabilidade (🔴🟡🟢) e KPIs principais.
- **Investimentos** — controle de bens novos (próprios/financiados) e já existentes, com cálculo automático de vida útil restante, depreciação anual e reposição futura.
- **Dívidas Ativas / Financiamentos** — lançamento de parcelas anuais com separação entre juros (despesa) e amortização (devolução de capital), incluindo conferência cruzada com os investimentos financiados.
- **Custos Operacionais** — classificados em fixos e variáveis (usados no cálculo do ponto de equilíbrio).
- **Capital de Giro** — cálculo automático (meses de custo × custo mensal) ou valor manual.
- **Receitas Projetadas** — por produto, com separação entre venda (gera caixa) e autoconsumo (informativo).
- **Fluxo de Caixa** completo, Ano 0 a Ano 5, com recuperação do capital de giro no último ano.
- **Indicadores & Cenários**
  - VPL (Valor Presente Líquido)
  - TIR (Taxa Interna de Retorno)
  - Payback simples
  - Ponto de Equilíbrio
  - Lucratividade e Renda mensal por beneficiário
  - Simulação de cenário **Otimista / Realista / Pessimista** com parâmetros configuráveis
- **Mensagens explicativas em vez de erros matemáticos** — em vez de "NaN" ou "não converge", o sistema explica em linguagem simples por que um indicador não pôde ser calculado.
- **Persistência automática dos dados** — salva localmente no dispositivo (via `window.storage` ou `localStorage`, com fallback automático), sem necessidade de servidor ou login.
- **Exportação em PDF** (via jsPDF + AutoTable) — relatório completo e formatado, pronto para levar a um técnico, banco ou linha de crédito.
- **Exportação/Importação em JSON** — backup dos dados e migração entre dispositivos/navegadores.
- **Dados de exemplo** prontos para demonstração e botão de reset com opção de desfazer (undo).
- **Totalmente responsivo** — layout adaptado para celular, tablet e desktop.

---

## 🚀 Como usar

Não é necessária instalação, build ou servidor. O projeto é um único arquivo HTML autocontido.

1. Baixe o arquivo `.html` do repositório.
2. Abra-o em qualquer navegador moderno (Chrome, Firefox, Edge, Safari).
3. Preencha as abas na ordem sugerida (01 a 08) — cada etapa alimenta os cálculos da seguinte.
4. Acompanhe o semáforo de viabilidade e os indicadores no **Painel Geral** e em **Indicadores & Cenários**.
5. Exporte o relatório em PDF quando quiser compartilhar a análise, ou em JSON para fazer backup/continuar em outro dispositivo.

> 💡 Também é possível publicar o arquivo em qualquer serviço de hospedagem estática (GitHub Pages, Cloudflare Pages, Netlify, Vercel etc.), já que ele funciona de forma independente com fallback para `localStorage`.

---

## 🧮 Metodologia dos cálculos

- **VPL (Valor Presente Líquido)**: traz os fluxos de caixa futuros a valor presente, descontados pela TMA (Taxa Mínima de Atratividade) definida pelo usuário.
- **TIR (Taxa Interna de Retorno)**: calculada por busca (bisseção) sobre os fluxos de caixa do projeto.
- **Payback**: tempo (em anos) necessário para o saldo de caixa acumulado se tornar positivo.
- **Ponto de Equilíbrio**: receita mínima necessária para cobrir custos fixos e variáveis do ano de análise.
- **Semáforo de viabilidade**: combina o sinal do VPL com a folga entre TIR e TMA e com o Payback, usando limites configuráveis pelo usuário (folga mínima em pontos percentuais e prazo de payback considerado aceitável).
- **Financiamentos**: cada parcela é separada entre juros (despesa financeira real, entra no lucro contábil) e amortização de principal (devolução de capital, não é despesa).
- **Bens existentes** não geram novo desembolso — apenas depreciação e, quando a vida útil se esgota dentro do horizonte de 5 anos, uma reposição futura.

---

## 🛠️ Tecnologias

- HTML5 + CSS3 (design "caderno de campo", tipografia Zilla Slab + IBM Plex Sans/Mono via Google Fonts)
- JavaScript puro (vanilla), sem frameworks ou dependências de build
- [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) para exportação em PDF (via CDN)
- API de armazenamento com fallback automático (`window.storage` → `localStorage`)

---

## 📂 Estrutura

Projeto single-file: todo o HTML, CSS e JavaScript estão em um único arquivo `.html`, sem necessidade de bundlers, dependências de `node_modules` ou etapas de build.

---

## ⚠️ Aviso

Esta ferramenta é um **apoio à decisão** e não substitui a orientação de um técnico de ATER, contador ou agente de crédito. A precisão dos resultados depende diretamente da qualidade dos dados informados em cada aba. O tratamento tributário simplificado (percentual direto sobre a receita comercializada) não substitui a análise do regime fiscal específico de cada atividade/região.

---

## 📄 Licença

GPL-3.0

---

## 🙏 Créditos

Metodologia adaptada do **SAF-PP** (Meloni, 2017), aplicada a empreendimentos produtivos rurais.
