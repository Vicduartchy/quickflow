# 📊 QuickFlow

[![Deploy Status](https://img.shields.io/badge/deploy-GitHub%20Pages-222?logo=github)](https://vicduartchy.github.io/quickflow/)
[![Tests](https://img.shields.io/badge/testes-45%20passing-brightgreen?logo=vitest)](src/lib)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Ferramenta client-side para análise de métricas de fluxo ágil — sem backend, sem cadastro, seus dados ficam só no seu navegador.

## 🚀 Sobre o Projeto

O QuickFlow transforma planilhas exportadas do Azure DevOps, Jira ou Trello em dashboards interativos com as principais métricas de fluxo ágil. A análise acontece 100% no navegador, sem envio de dados para nenhum servidor.

**🌐 Acesse:** [vicduartchy.github.io/quickflow](https://vicduartchy.github.io/quickflow/)

## ✨ Funcionalidades

- **📁 Upload de dados:** Suporte a arquivos CSV e XLSX diretamente no navegador
- **🔍 Mapeamento inteligente:** Detecção automática de colunas do Azure DevOps e Jira
- **⚙️ Política de fluxo:** Classificação de status em Backlog, WIP e Concluído
- **📈 Dashboard interativo:** 6 gráficos com filtros por período, equipe, tipo e status
- **💡 Insights automáticos:** Alertas gerados a partir dos dados do Kanban
- **🌐 Bilíngue:** Interface em Português (pt-BR) e Inglês (en-US)
- **📸 Exportação:** Download do dashboard como imagem via html2canvas
- **🔒 Privacidade total:** Nenhum dado sai do seu navegador (localStorage)

## 📈 Métricas e Gráficos

| Gráfico | O que mostra |
|---|---|
| **Scatterplot de Cycle Time** | Distribuição do tempo de ciclo por item |
| **Run Chart de Throughput** | Volume de entregas por período |
| **Aging WIP** | Itens em andamento e há quanto tempo estão parados |
| **Histograma de Cycle Time** | Frequência dos tempos de ciclo |
| **Cumulative Flow Diagram (CFD)** | Acúmulo de itens por status ao longo do tempo |
| **Breakdown Chart** | Composição das entregas por tipo ou equipe |

**Métricas-chave:** Cycle Time P50, P85, P95 · Throughput (mediana)

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + TypeScript
- **Build:** Vite 8
- **Estilização:** Tailwind CSS 4
- **Gráficos:** Recharts 3
- **Leitura de planilhas:** SheetJS (xlsx)
- **Exportação de imagem:** html2canvas
- **Testes:** Vitest 4 (45 testes unitários)
- **Deploy:** GitHub Pages via GitHub Actions

## 📁 Estrutura do Projeto

```
quickflow/
├── src/
│   ├── main.tsx                  # Ponto de entrada da aplicação
│   ├── App.tsx                   # Roteamento entre telas
│   ├── types/
│   │   └── index.ts              # Tipos globais (WorkItem, ColumnMapping, etc.)
│   ├── i18n/
│   │   └── translations.ts       # Textos em pt-BR e en-US
│   ├── lib/
│   │   ├── context.tsx           # Estado global com React Context
│   │   ├── mapping.ts            # Lógica de parsing e cálculo de métricas
│   │   ├── mapping.test.ts       # 36 testes unitários de mapping
│   │   ├── storage.ts            # Persistência no localStorage
│   │   └── storage.test.ts       # 9 testes unitários de storage
│   └── components/
│       ├── Navbar.tsx            # Barra de navegação
│       ├── UploadScreen.tsx      # Tela 1 — upload do arquivo
│       ├── MappingScreen.tsx     # Tela 2 — mapeamento de colunas
│       ├── PolicyScreen.tsx      # Tela 3 — política de fluxo
│       ├── DashboardScreen.tsx   # Tela 4 — dashboard com métricas
│       ├── InsightsPanel.tsx     # Painel de insights automáticos
│       ├── Icons.tsx             # Ícones SVG inline
│       └── charts/
│           └── Charts.tsx        # 6 gráficos Recharts
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD para GitHub Pages
├── vite.config.ts                # Config do Vite + Vitest
└── package.json
```

## 🎨 Design

- **Cor principal:** Laranja `#BF452A`
- **Tipografia:** Sistema nativo do navegador (sans-serif)
- **Layout:** Responsivo, mobile-first
- **Tema:** Dark-friendly com Tailwind CSS

## 🚀 Como Executar Localmente

```bash
# Clone o repositório
git clone https://github.com/Vicduartchy/quickflow.git

# Entre no diretório
cd quickflow

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

## 🧪 Testes

```bash
# Rodar todos os testes (45 testes)
npm test

# Modo watch (reexecuta ao salvar)
npm run test:watch

# Relatório de cobertura
npm run test:coverage
```

## 📦 Deploy

O deploy é feito automaticamente no GitHub Pages a cada push na branch `main`.

```bash
# Build de produção
npm run build
```

**URL de produção:** [vicduartchy.github.io/quickflow](https://vicduartchy.github.io/quickflow/)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👩‍💼 Sobre Vic Duarte

**Victoria Duarte** é especialista em gestão de projetos, metodologias ágeis e liderança. Professora de pós-graduação e criadora do QuickFlow — uma ferramenta construída para colocar métricas de fluxo ao alcance de qualquer equipe ágil.

### 🔗 Conecte-se

- **LinkedIn:** [Vic Duarte](https://www.linkedin.com/in/vic-duarte/)
- **Site:** [vicduarte.site](https://vicduarte.site)
- **E-mail:** victoriaduarte.s@gmail.com

---

**Desenvolvido com 💙 por Vic Duarte**
