<div align="center">
  <div style="background-color: #BF452A; width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
    <span style="color: white; font-weight: bold; font-size: 32px; font-family: sans-serif;">Q</span>
  </div>
  <h1>QuickFlow</h1>
  <p><strong>Ferramenta client-side para análise de métricas de fluxo ágil</strong></p>
</div>

<br>

O QuickFlow é uma aplicação web desenvolvida para auxiliar equipes de desenvolvimento de software a extrair, visualizar e analisar métricas de fluxo a partir de planilhas exportadas de ferramentas como Azure DevOps, Jira e Trello. A ferramenta opera de forma totalmente client-side, o que significa que nenhum dado é enviado para servidores externos, garantindo a privacidade e a segurança das informações do projeto.

A aplicação foi construída com foco na simplicidade e na eficiência, permitindo que líderes técnicos, Scrum Masters e Agile Coaches obtenham insights rápidos sobre a saúde do fluxo de trabalho. O sistema suporta arquivos nos formatos CSV e XLSX, realizando o processamento localmente no navegador do usuário.

A interface guia o usuário por um processo de quatro etapas. Inicialmente, ocorre o upload da planilha com os dados brutos. Em seguida, o sistema realiza um mapeamento inteligente das colunas, detectando automaticamente campos como identificador, tipo, equipe, data de entrada, data de saída e status atual. Na terceira etapa, o usuário define a política de fluxo, classificando os status em categorias como Backlog, WIP (Work In Progress) e Concluído. Por fim, o dashboard interativo é gerado com base nas configurações estabelecidas.

O dashboard principal oferece uma visão abrangente do desempenho da equipe, apresentando métricas fundamentais como Cycle Time (percentis P50, P85 e P95) e Throughput (mediana). A ferramenta disponibiliza gráficos essenciais para a gestão ágil, incluindo Scatterplot de Cycle Time, Run Chart de Throughput, Aging WIP, Histograma de Cycle Time, Cumulative Flow Diagram (CFD) e Breakdown Chart. Os usuários podem aplicar filtros por período, equipe, tipo de item e status, além de ajustar o agrupamento temporal por dia, semana, mês ou ano.

A arquitetura do projeto baseia-se em tecnologias modernas de front-end. O desenvolvimento utiliza React 18 com TypeScript, garantindo tipagem estática e componentes reutilizáveis. O Vite atua como ferramenta de build, proporcionando inicialização rápida e Hot Module Replacement (HMR). A estilização é gerenciada pelo Tailwind CSS, enquanto a biblioteca Recharts é empregada para a renderização dos gráficos interativos. A aplicação também conta com um sistema de internacionalização nativo, oferecendo suporte aos idiomas Português (pt-BR) e Inglês (en-US).

Para executar o projeto localmente, é necessário ter o Node.js instalado. O processo de instalação envolve clonar o repositório, instalar as dependências e iniciar o servidor de desenvolvimento. O comando `npm install` prepara o ambiente, e `npm run dev` disponibiliza a aplicação no endereço local padrão. Para construir a versão de produção, utiliza-se o comando `npm run build`, que gera os arquivos otimizados na pasta `dist`.

O QuickFlow representa uma solução prática para equipes que buscam compreender e melhorar sua previsibilidade e eficiência, transformando dados brutos em informações acionáveis sem a necessidade de configurações complexas ou integrações de backend.
