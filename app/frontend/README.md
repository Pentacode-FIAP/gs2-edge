<p align="center"><img src="public/marca/vizi-logo.svg" alt="Vizi" width="220"></p>

# Vizi · Quando falta, o bairro avisa

Aplicação web do **Vizi**, a CitizenTech do grupo **Pentacode** (turma 1ESPH) para a Global Solution FIAP 2026.2. Esta é a entrega das disciplinas de **Front-end Design** e **Web Development**.

> **Todos os dados são simulados.** Os sensores são fictícios e os relatos de morador são exemplos inventados. Nenhum dado pessoal real é usado.

## Ficha da CitizenTech

| | |
|---|---|
| **Nome** | Vizi |
| **Cidade e bairro** | São Paulo, Campo Limpo (zona sul) |
| **Cidadão beneficiado** | Morador de bairro periférico que fica sem energia, sem água, sem sinal de celular ou com a rua alagada, e não tem como provar quanto tempo ficou sem o serviço |
| **Problema, em uma frase** | Quando um serviço essencial falta no bairro, ninguém sabe se é só na sua casa, há quanto tempo está assim nem como cobrar a empresa responsável |
| **Como funciona** | Sensores no poste (ESP32) detectam falta de energia, queda de sinal e alagamento. Moradores avisam pelo app o que o sensor não vê (falta d'água, trânsito). Os vizinhos confirmam ou negam cada aviso. O app soma as horas sem serviço e gera um texto pronto para reclamar na ouvidoria |
| **O que cada parte faz** | **Edge:** sensor que decide o estado sozinho e publica no FIWARE. **Front/Web (este repositório):** mapa, avisos, validação pelos vizinhos, resumo e relatório. **Python:** lógica de estados. **Experiência:** jornada, requisitos e protótipo |
| **Link do repositório** | _preencher com o link do GitHub_ |
| **Indicador de impacto** | Horas sem serviço confirmadas por mês no bairro e quantidade de reclamações enviadas com o texto do relatório |
| **ODS conectados** | **ODS 11** (cidades e comunidades sustentáveis), **ODS 9** (infraestrutura), **ODS 10** (redução das desigualdades), **ODS 13** (ação contra a mudança do clima: alagamentos) |

## Integrantes

| Integrante | RM |
|---|---|
| Arthur Jircik | 570754 |
| Andre Luiz | 573575 |
| Felipe Garcia | 571741 |
| Guilherme Amorim | 569024 |
| Matheus Marcelino | 571472 |

## Links

- **Deploy:** _preencher com o link da Vercel_
- **API externa (MockAPI):** `https://6afa2d6b730c1d152f3209b1.mockapi.io/api/v1/relatos`

## Funcionalidades

| Tela | O que faz |
|---|---|
| **Mapa** (`/`) | Mapa do Campo Limpo (Leaflet + OpenStreetMap) com alertas de sensor (pino quadrado) e avisos de morador (pino redondo). Filtro por tipo, busca por rua e lista ordenada por gravidade |
| **Avisar** (`/avisar`) | Formulário em três escolhas: o que falta, gravidade e onde (toque no mapa ou "usar minha localização"). Valida os campos antes de enviar. **POST** na API |
| **Detalhe do aviso** (`/relatos/:id`) | Tempo sem serviço, que atualiza sozinho, e linha do tempo. Vizinhos votam "Sim, ainda" ou "Já voltou" (**PUT**). Quem fez o aviso pode editar (**PUT**), encerrar (**PUT**) ou apagar (**DELETE**) |
| **Editar aviso** (`/relatos/:id/editar`) | Mesmo formulário, preenchido com os dados atuais |
| **Alerta do sensor** (`/alertas/:id`) | Leitura atual, gráfico dos últimos 30 minutos com as faixas do firmware e eventos do sensor |
| **Bairro** (`/bairro`) | Horas sem cada serviço nos últimos 30 dias e o pior dia |
| **Relatório** (`/relatorio`) | Texto pronto para a ouvidoria (botão copiar) e exportação em CSV |

Também tem tema claro e escuro, layout para celular (abas no rodapé) e para desktop (menu no topo), estados de carregando, erro e vazio, e mensagens de confirmação.

### Regras de negócio

- **RN1:** um aviso nasce como "aguardando vizinhos" e passa para **confirmado** com 2 confirmações.
- **RN2:** com 3 respostas "Já voltou", e mais negações que confirmações, o aviso é **encerrado**.
- **RN3:** um voto por aparelho, e quem fez o aviso não vota no próprio aviso.
- **RN4:** só o aparelho que criou o aviso pode editá-lo, encerrá-lo ou apagá-lo. É uma identidade anônima no `localStorage`, sem login nem dado pessoal.
- **RN5:** o resumo do bairro só conta avisos confirmados e alertas de sensor. Trânsito conta a quantidade de avisos, não horas.
- **RN6:** quem decide o estado do sensor é o ESP32. O app só mostra, nunca recalcula (regra do `contrato-dados.md` do Edge).

Os números de RN1 e RN2 ficam em `src/config.js` (`REGRAS`).

## Tecnologias

- **React 19** com **Vite**
- **Tailwind CSS v4**, com os tokens de cor do protótipo de média fidelidade
- **React Router** para as rotas, com carregamento sob demanda por página
- **Leaflet / React Leaflet** com mapas do OpenStreetMap
- **MockAPI.io** como API externa REST para o CRUD de relatos
- **oxlint** para lint

## Pré-requisitos

- **Node.js 20** ou mais recente (testado no 24) e **npm**
- Internet: a API de relatos e os mapas são online

## Como rodar

```bash
npm install
npm run dev
```

Abra o endereço mostrado no terminal (normalmente http://localhost:5173).

Outros comandos:

```bash
npm run build      # gera a versão de produção em dist/
npm run preview    # serve a versão de produção localmente
npm run lint       # verifica o código com oxlint
npm run popular    # adiciona os relatos de exemplo na API
npm run popular -- --limpar   # apaga todos os relatos e recria os exemplos
```

A URL da API já vem configurada. Para usar outra, copie `.env.example` para `.env` e altere `VITE_API_URL`.

### Deploy (Vercel)

Importe o repositório na Vercel com o preset **Vite** (build `npm run build`, saída `dist`). O `vercel.json` redireciona todas as rotas para o `index.html`, o que permite abrir direto um link como `/relatos/3`.

## Arquitetura

O código separa **dados**, **regras** e **tela**:

```
src/
├── config.js            URL da API, bairro e números das regras de negócio
├── services/            ACESSO A DADOS: único lugar que faz fetch ou lê dados
│   ├── http.js              cliente fetch com tempo limite e mensagens de erro em português
│   ├── relatosService.js    CRUD de relatos na API externa (MockAPI)
│   ├── sensoresService.js   sensores e alertas (simulados nesta entrega)
│   ├── armazenamento.js     localStorage protegido
│   └── mock/                imitação da API Vizi do projeto de Edge
├── domain/              REGRAS DE NEGÓCIO: funções puras, sem React e sem fetch
│   ├── relatos.js           validação, voto, confirmação, encerramento
│   ├── alertas.js           junta sensor + morador, filtra e ordena
│   ├── bairro.js            horas sem serviço, pior dia, texto e CSV
│   ├── tipos.js / tempo.js  tipos de problema e formatação de datas
├── hooks/               ESTADO: custom hooks ligam serviços e regras às telas
├── components/          APRESENTAÇÃO: componentes reutilizáveis
└── pages/               telas (uma por rota)
```

**Custom hooks (12):** `useCarregar`, `useRelatos`, `useRelato`, `useNovoRelato`, `useFormularioRelato`, `useAlertas`, `useAlertaSensor`, `useResumoBairro`, `useAparelho`, `useAgora`, `useTema`, `useToast`.

**Componentes (22):** `Logo`, `Layout`, `BarraNavegacao`, `ToastProvider`, `Icone`, `Botao`, `CabecalhoPagina`, `Estados` (Carregando/Erro/Vazio), `SeloStatus`, `SinalTipo`, `FiltroTipos`, `AlertaCard`, `MapaBairro`, `SeletorTipo`, `SeletorGravidade`, `SeletorLocal`, `FormularioRelato`, `PainelVoto`, `AcoesAutor`, `LinhaDoTempo`, `GraficoSerie`, `BarraHoras`.

### Por que os sensores são simulados

O projeto de Edge depende de ESP32 no Wokwi, Docker com FIWARE e uma API em Python, e não tem como ficar no ar para a correção. Por isso, combinado com o professor, nesta entrega:

- os **relatos de morador** usam uma API externa de verdade (MockAPI), com CRUD completo;
- os **sensores** são simulados no navegador por `services/mock/apiViziFake.js`, que segue as mesmas regras e campos da API Vizi (`edge/docs/contrato-dados.md`).

Para a entrega de Edge, basta trocar o corpo das funções de `services/sensoresService.js` por chamadas à API real. Hooks e telas não mudam, porque o formato dos dados é o mesmo.

### Formato de um relato

```json
{
  "id": "1",
  "tipo": "energia",
  "titulo": "Sem energia",
  "local": "Rua Campo Limpo, perto do mercado",
  "lat": -23.6478,
  "lng": -46.7633,
  "desde": "2026-11-15T20:12:04.878Z",
  "gravidade": "alta",
  "status": "confirmado",
  "fonte": "morador",
  "sensorId": null,
  "valor": null,
  "unidade": null,
  "descricao": "Caiu tudo depois do barulho no poste da esquina.",
  "confirmacoes": 2,
  "negacoes": 0,
  "autorId": "exemplo",
  "encerradoEm": null,
  "linhaDoTempo": [{ "t": "2026-11-15T20:12:04.878Z", "texto": "Aviso feito por morador" }]
}
```

Os campos são os mesmos de um alerta de sensor, mais os campos próprios do morador: `confirmacoes`, `negacoes`, `descricao`, `autorId`, `encerradoEm` e `linhaDoTempo`. O status `resolvido` é uma extensão desta entrega ao contrato.

## Uso de IA

Veja [AI.md](AI.md).
