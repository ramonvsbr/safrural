## SAF-PP — Sistema de Análise Financeira de Projetos Produtivos

> **Caderno de Campo Digital** — Ferramenta interativa de apoio à tomada de decisão, elaboração, análise e acompanhamento financeiro de projetos produtivos rurais e da agricultura familiar.

---

## 📋 Sobre o Projeto

O **SAF-PP** é uma aplicação web completa, responsiva e focada na facilidade de uso para técnicos agrícolas, extensionistas rurais, consultores e produtores rurais. Ele permite simular, modelar e avaliar a viabilidade econômica e financeira de empreendimentos rurais ao longo de um horizonte de 5 anos.

A ferramenta foi idealizada como um **Caderno de Campo Digital** adaptado a partir da metodologia e estrutura conceitual desenvolvida por Meloni (2017), oferecendo uma interface acessível e relatórios em PDF para apoio a linhas de crédito (ex.: PRONAF, ABC, etc.).

---

## ✨ Funcionalidades Principais

* **Modos de Projeto Flexíveis**:
  * **Projeto do Zero**: Considera investimentos iniciais no Ano 0 e cálculo automático de capital de giro.
  * **Projeto em Andamento**: Avalia negócios já estruturados sem impor aporte inicial ou exigência imediata de capital de giro no Ano 0.
* **Semáforo de Viabilidade Automático**:
  * Diagnóstico visual imediato (**Verde / Amarelo / Vermelho**) baseado em VPL, TIR e Payback comparados à Taxa Mínima de Atratividade (TMA).
* **Gestão de Investimentos e Depreciação**:
  * Separação por origem dos recursos (*Próprios*, *Financiados* ou *Já Existentes*).
  * Cálculo automático da vida útil restante e da depreciação acumulada/anual.
* **Simulação de Dívidas e Financiamentos**:
  * Projeção de amortização pelo sistema de parcelas com suporte a bônus de adimplência, prazos de carência e taxas de juros personalizadas.
* **Classificação de Custos Operacionais**:
  * Separação clara entre custos fixos e variáveis para cálculo preciso do **Ponto de Equilíbrio**.
  * Atalho para repetir valores do Ano 1 para os demais anos.
* **Receitas e Autoconsumo**:
  * Distinção entre receita de comercialização (gera caixa) e autoconsumo familiar (segurança alimentar/ganho socioeconômico).
* **Fluxo de Caixa de 5 Anos**:
  * Demonstrativo completo com receita líquida, impostos, custos, parcelas de financiamento, reposição de ativos e recuperação de capital de giro no último ano.
* **Análise de Cenários de Sensibilidade**:
  * Simulação comparativa em tempo real entre cenários **Pessimista**, **Realista** e **Otimista**.
* **Relatório Profissional em PDF**:
  * Geração instantânea de relatório completo em PDF contendo dados do produtor, premissas, quadros demonstrativos e parecer de viabilidade.
* **Persistência de Dados**:
  * Salvamento automático local via `localStorage` e integração transparente em ambientes de execução baseados em contêineres/Claude storage.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5 / CSS3**: Layout moderno com variáveis CSS, tipografia responsiva e suporte nativo a impressão/exportação.
* **JavaScript (ES6+)**: Vanilla JS sem dependências pesadas de frameworks, garantindo máxima performance, leveza e facilidade de manutenção.
* **jsPDF & AutoTable**: Biblioteca cliente para geração dinâmica dos relatórios em PDF.

---

## 🚀 Como Executar o Projeto

Como o SAF-PP foi desenvolvido como uma aplicação *Single Page Application* (SPA) em JavaScript puro:

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/saf-pp.git
   ```
2. Navegue até o diretório do projeto:
   ```bash
   cd saf-pp
   ```
3. Abra o arquivo `index.html` (ou utilize o servidor web de sua preferência) diretamente no seu navegador:
   * **Via VS Code**: Use a extensão *Live Server*.
   * **Via Python**:
     ```bash
     python -m http.server 8000
     ```
     Em seguida, acesse `http://localhost:8000` no seu navegador.

---

## 📊 Indicadores Calculados

| Indicador | Sigla | Descrição |
| :--- | :--- | :--- |
| **Valor Presente Líquido** | `VPL` | Mede a riqueza gerada pelo projeto descontada pela TMA a preços de hoje. |
| **Taxa Interna de Retorno** | `TIR` | Taxa percentual anual de rendimento do capital investido. |
| **Período de Retorno** | `Payback` | Tempo necessário (em anos) para recuperar o investimento inicial. |
| **Ponto de Equilíbrio** | `Break-Even` | Volume de receita mínima necessária para cobrir todos os custos. |
| **Renda Mensal por Beneficiário** | — | Retorno mensal efetivo por pessoa (Caixa Líquido + Autoconsumo / 12 meses / Beneficiários). |

---

## 📑 Estrutura de Arquivos

```text
.
├── index.html        # Estrutura base da aplicação e carregamento de scripts
├── app.js            # Engine de cálculos, renderização de abas, gerenciamento de estado e geração de PDF
├── styles.css        # Estilos, sistema de cores, grid responsivo e componentes
└── README.md         # Documentação do projeto
```

---

## 📚 Referência Metodológica

* **MELONI, B. N.** *SAF-PP: Sistema de Análise Financeira de Projetos Produtivos — Manual Metodológico e Operacional*. Dissertação / Guia Técnico de Extensão Rural, 2017.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
