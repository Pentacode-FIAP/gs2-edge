# Uso de Inteligência Artificial

Este arquivo registra como o grupo Pentacode usou IA no desenvolvimento da aplicação web do Vizi (Front-end Design e Web Development, GS 2026.2).

> **Atenção, grupo:** este rascunho descreve a sessão com o Claude Code em que a base do app foi construída. Antes de entregar, cada integrante que usou IA deve acrescentar as suas próprias interações na seção 2, e todos devem revisar a análise crítica (seção 5) com a opinião real do grupo.

## 1. Ferramentas utilizadas

| Ferramenta | Para quê |
|---|---|
| **Claude Code** (modelo Claude Opus 5.5, da Anthropic), no terminal | Ler o PDF da GS e o projeto de Edge, propor a arquitetura, gerar o código React, rodar build e lint, e testar o app no navegador |
| **Claude in Chrome** (extensão do Claude Code) | Criar o recurso `relatos` no MockAPI e testar o CRUD clicando no app rodando localmente |

## 2. Interações realizadas

Prompts representativos enviados pelo grupo (em português, como foram escritos):

1. **Início**
   > "claude, quero fazer a entrega de front/web da gs, da uma olhada, se voce precisar de mais informações me fala"

   **Resposta:** a IA leu o PDF do desafio, extraiu os requisitos das duas disciplinas (8 componentes, useState/useEffect, 2 custom hooks, CRUD em API externa, 15 commits, README, AI.md, deploy) e leu o `contrato-dados.md` do projeto de Edge. Depois perguntou qual API usar, se Next.js ou Vite, qual protótipo seguir e como seriam os commits.

2. **Decisão sobre dados mockados**
   > "o professor de front/web não vai ter tudo isso rodando só pra corrigir a entrega dele [...] pensamos em usar dados falsos ou mockados (já confirmei com o professor) [...] oque voce sugere com isso em base?"

   **Resposta:** a IA alertou que só JSON local não cumpriria o requisito "consumir API externa com CRUD". Sugeriu usar o MockAPI.io para os relatos de morador (CRUD real) e simular os sensores no navegador com o mesmo formato da API Vizi, deixando a troca para a API real isolada em um único arquivo (`sensoresService.js`).

3. **Protótipo**
   O grupo passou o arquivo `vizi_prototipo.html` (protótipo de média fidelidade da disciplina de Experiência). A IA reaproveitou as cores, os ícones, os textos ("Quando falta, o bairro avisa", "Isso ainda acontece aí?", "Sim, ainda / Já voltou") e as 5 telas principais.

4. **Infraestrutura**
   > "depois abre uma sessão no claude in chrome e cria essas coisas que precisarem"

   **Resposta:** a IA criou o recurso `relatos` no painel do MockAPI pelo navegador, populou com relatos de exemplo e testou criar, editar, votar e apagar um aviso no app.

## 3. Aplicação no projeto

Com auxílio da IA foram gerados:

- a estrutura de pastas `services/` (dados), `domain/` (regras), `hooks/` (estado), `components/` e `pages/`;
- a imitação da API Vizi (`services/mock/apiViziFake.js`), traduzindo para JavaScript as regras de `edge/app/backend/vizi_api/alertas.py`;
- as regras de negócio em `domain/` (validação, votos, confirmação com 2 vizinhos, encerramento, resumo de horas, texto da reclamação, CSV);
- os 12 custom hooks e os 21 componentes;
- o mapa com Leaflet, o gráfico em SVG e o script `scripts/popular-relatos.mjs`;
- o README e este rascunho de AI.md.

Decisões tomadas pelo grupo, e não pela IA: o tema (Vizi), o protótipo, usar dados mockados (combinado com o professor), Vite em vez de Next.js e a conta do MockAPI.

## 4. Validação das respostas

- **Build e lint a cada etapa:** `npm run build` e `oxlint` rodaram antes de cada commit.
- **Testes das regras:** as funções de `domain/` e da API simulada foram executadas isoladamente com entradas conhecidas (por exemplo, 2 votos "sim" devem virar "confirmado"; 3 votos "já voltou" devem encerrar). Esses testes encontraram **dois erros no código gerado**, que foram corrigidos:
  - o campo `desde` dos alertas de sensor saía sempre com "há 1 minuto" por causa de um `Math.min` errado;
  - o gráfico de alagamento pulava de 16 cm para 25 cm no último ponto. Foi trocado por interpolação entre os eventos.
- **Lint de pureza do React:** o oxlint apontou `new Date()` sendo chamado durante a renderização. A correção foi criar o hook `useAgora`, que também faz o tempo sem serviço atualizar sozinho.
- **Teste manual no navegador:** formulário vazio (as mensagens de erro aparecem), criação de aviso (POST), edição da gravidade (PUT), voto que confirma o aviso (PUT) e exclusão (DELETE), conferindo a resposta da API com `curl`. Também foram conferidos os temas claro e escuro.
- **Revisão do grupo:** _cada integrante deve descrever aqui o que revisou e entendeu do código._

## 5. Análise crítica

**Benefícios**
- Velocidade para montar a estrutura e o código repetitivo (formulários, estados de carregando e erro).
- A IA leu o PDF e o contrato de dados e lembrou de requisitos fáceis de esquecer: README com a ficha, AI.md, 15 commits e o fato de que JSON local não conta como API externa.
- Ajudou a manter o app consistente com o projeto de Edge (mesmos campos e mesmas regras).

**Limitações e dificuldades**
- O código gerado tinha erros de lógica que só apareceram nos testes (ver seção 4). Sem testar, eles teriam ido para a entrega.
- A IA não conhecia detalhes do MockAPI (por exemplo, a lista vazia responde 404), que tiveram de ser tratados depois de testar.
- A IA propôs a ficha da CitizenTech (ODS e indicador de impacto) sem ter dados reais do grupo. O grupo precisou revisar esse conteúdo.
- Existe o risco de o grupo não entender o código gerado. Por isso cada integrante deve conseguir explicar as camadas (`services`, `domain`, `hooks`, `components`) e pelo menos um hook e uma regra de negócio.
