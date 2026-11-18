/*
  Vizi - Sensor de bairro (CitizenTech IoT) - GS 2026.2 Edge Computing
  "Quando falta, o bairro avisa"

  Grupo PentaCode - Turma 1ESPH - FIAP
    Andre Luiz                   RM 573575
    Arthur Jircik Cronemberger   RM 570754
    Felipe Garcia                RM 571741
    Guilherme Amorim             RM 569024
    Matheus Marcelino Morais     RM 571472

  O que e:
    Um coletor de dados preso no poste da rua. Ele mede tres servicos do
    bairro (energia, sinal de internet e nivel da agua na rua), DECIDE
    SOZINHO o estado de cada um e publica um relato automatico no Vizi
    (via MQTT -> FIWARE) sempre que algo muda. Nao e um atuador: as unicas
    respostas locais sao discretas, para o tecnico da manutencao:
      - LED RGB de status (verde normal, amarelo atencao, vermelho falha,
        azul piscando = sem rede, guardando eventos para enviar depois)
      - um bipe unico quando algum servico entra em falha
      - display OLED com as leituras e os estados

  Sensores (simulados no Wokwi):
    Potenciometro 1 (GPIO 34) -> tensao do poste, 0 a 150 V
                                 (faz o papel de um sensor ZMPT101B)
    Potenciometro 2 (GPIO 35) -> latencia da rede, 0 a 2000 ms
    Chave deslizante (GPIO 27) -> "simular queda de rede"
    HC-SR04 (TRIG 13 / ECHO 14) -> distancia ate a rua; nivel da agua =
                                 altura de instalacao - distancia

  Limites escolhidos (e por que):
    Energia (rede 127 V da Enel SP, faixas da ANEEL PRODIST Modulo 8):
      NORMAL      117 a 133 V   (tensao adequada)
      INSTAVEL    110 a 117 V ou acima de 133 V (tensao precaria)
      SEM ENERGIA abaixo de 110 V (tensao critica / queda)
    Sinal (tempo para alcancar o servidor):
      OK          abaixo de 300 ms
      INSTAVEL    300 a 1000 ms, ou falha recente
      SEM SINAL   3 falhas seguidas (ou chave de queda ligada)
    Agua (meio-fio padrao de SP tem cerca de 15 cm):
      NORMAL      abaixo de 8 cm
      ATENCAO     8 a 15 cm  (agua enchendo a sarjeta)
      ALAGAMENTO  acima de 15 cm (agua passa do meio-fio e invade a calcada)

  Lógica de borda:
    - leitura a cada 1 s, tudo com millis() (sem delay no loop)
    - suavizacao: media movel das ultimas 5 leituras validas
    - leitura invalida (eco ausente, distancia impossivel, ADC saturado) e
      descartada; 5 invalidas seguidas levam o sensor a ERRO_SENSOR
    - troca de estado so depois de 3 leituras seguidas confirmando, e com
      histerese na volta, para nao ficar oscilando no limite
    - publica a cada 5 s e imediatamente quando um estado muda
    - sem rede, os eventos vao para uma fila e sao enviados quando volta

  Payload UltraLight 2.0 em /TEF/vizi001/attrs (contrato dos dados do Vizi):
    e|127.0|es|normal|n|42|ns|ok|a|3.1|as|normal|g|normal|te|0|tn|0|q|0
      e  = tensao media (V)          es = estado da energia
      n  = latencia media (ms)       ns = estado do sinal
      a  = nivel da agua (cm)        as = estado da agua
      g  = estado geral do aparelho  q  = eventos na fila offline
      te = minutos sem energia (acumulado)
      tn = minutos sem sinal (acumulado)
    Evento (relato automatico), no mesmo topico:
      ev|energia,sem_energia,38.0,0
      (servico , novo estado , valor , segundos de atraso, >0 se veio da fila)
      Separador e a virgula: o Orion recusa ";" dentro de um valor.
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ===================== CONFIGURACAO =====================

const char* WIFI_SSID     = "Wokwi-GUEST";   // rede do simulador
const char* WIFI_PASSWORD = "";
const int   WIFI_CANAL    = 6;              // canal fixo: no Wokwi conecta bem mais rapido
// Broker MQTT. Em desenvolvimento usamos um broker publico ligado por ponte
// ao FIWARE local (docker). Na entrega final: trocar pelo IP publico da EC2.
const char* BROKER_MQTT   = "broker.hivemq.com";
const int   BROKER_PORT   = 1883;
const char* ID_MQTT       = "vizi_pentacode_001";
const char* TOPICO_ATTRS  = "/TEF/vizi001/attrs";

// Pinos
const int PINO_TENSAO   = 34;  // potenciometro: tensao do poste
const int PINO_LATENCIA = 35;  // potenciometro: latencia da rede
const int PINO_QUEDA    = 27;  // chave: simular queda de rede
const int PINO_TRIG     = 13;  // HC-SR04
const int PINO_ECHO     = 14;  // HC-SR04
const int PINO_LED_R    = 26;  // LED RGB catodo comum
const int PINO_LED_G    = 25;
const int PINO_LED_B    = 33;
const int PINO_BUZZER   = 32;
// Display OLED I2C. SDA e SCL trocados em relacao ao padrao (21/22) so
// para o diagrama ficar sem fios cruzados; o ESP32 aceita I2C em qualquer pino.
const int PINO_SDA      = 22;
const int PINO_SCL      = 21;

// Tempos (ms)
const unsigned long INTERVALO_LEITURA    = 1000;
const unsigned long INTERVALO_PUBLICACAO = 5000;
const unsigned long INTERVALO_RECONEXAO  = 5000;
const unsigned long INTERVALO_WIFI       = 15000;  // nova tentativa de Wi-Fi
const unsigned long INTERVALO_DISPLAY    = 500;
const unsigned long INTERVALO_PISCA      = 400;

// Escalas dos sensores simulados
const float TENSAO_MAXIMA_V      = 150.0;   // potenciometro no maximo
const float LATENCIA_MAXIMA_MS   = 2000.0;
const float ALTURA_INSTALACAO_CM = 200.0;   // sensor a 2 m da rua, apontado para baixo
const float DISTANCIA_MIN_CM     = 2.0;     // limite fisico do HC-SR04
const unsigned long TIMEOUT_ECO_US = 30000; // ~5 m ida e volta

// Limites de energia (V)
const float V_SEM_ENERGIA   = 110.0;
const float V_INSTAVEL_MIN  = 117.0;
const float V_INSTAVEL_MAX  = 133.0;
const float HISTERESE_V     = 2.0;

// Limites de sinal
const float LAT_INSTAVEL_MS  = 300.0;
const float LAT_FALHA_MS     = 1000.0;  // acima disso a tentativa conta como falha
const float HISTERESE_MS     = 30.0;
const int   FALHAS_SEM_SINAL = 3;

// Limites de agua (cm)
const float AGUA_ATENCAO_CM    = 8.0;
const float AGUA_ALAGAMENTO_CM = 15.0;
const float HISTERESE_CM       = 1.5;

// Logica de borda
const int JANELA_MEDIA        = 5;  // media movel
const int CONFIRMACOES_ESTADO = 3;  // leituras seguidas para trocar de estado
const int INVALIDAS_PARA_ERRO = 5;  // leituras invalidas seguidas -> ERRO_SENSOR
const int TAMANHO_FILA        = 20; // eventos guardados sem rede

// ===================== TIPOS =====================

// Estados possiveis de cada servico (os nomes viram texto no payload)
enum Estado { NORMAL, ATENCAO, FALHA, ERRO_SENSOR };

// Media movel simples com janela fixa
struct MediaMovel {
  float valores[JANELA_MEDIA];
  int quantidade = 0;
  int posicao = 0;

  void adicionar(float v) {
    valores[posicao] = v;
    posicao = (posicao + 1) % JANELA_MEDIA;
    if (quantidade < JANELA_MEDIA) quantidade++;
  }

  float media() const {
    if (quantidade == 0) return 0;
    float soma = 0;
    for (int i = 0; i < quantidade; i++) soma += valores[i];
    return soma / quantidade;
  }
};

// Um servico monitorado: media, estado atual e candidato a novo estado
struct Servico {
  const char* nome;
  const char* textos[4];   // texto de cada Estado no payload
  MediaMovel media;
  Estado estado = NORMAL;
  Estado candidato = NORMAL;
  int confirmacoes = 0;
  int invalidasSeguidas = 0;
  unsigned long msEmFalha = 0;  // tempo acumulado em FALHA

  Servico(const char* n, const char* normal, const char* atencao, const char* falha)
    : nome(n), textos{normal, atencao, falha, "erro_sensor"} {}
};

// Evento guardado enquanto nao ha rede
struct Evento {
  const char* servico;
  const char* estado;
  float valor;
  unsigned long quando;
};

// ===================== ESTADO GLOBAL =====================

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
Adafruit_SSD1306 display(128, 64, &Wire, -1);
bool displayOk = false;

Servico energia("energia", "normal", "instavel", "sem_energia");
Servico sinal("sinal", "ok", "instavel", "sem_sinal");
Servico agua("agua", "normal", "atencao", "alagamento");

void bipe();  // declarada antes porque a maquina de estados usa

int falhasRedeSeguidas = 0;   // tentativas seguidas sem alcancar o servidor
bool quedaSimulada = false;

Evento fila[TAMANHO_FILA];
int filaInicio = 0;
int filaTamanho = 0;

unsigned long ultimaLeitura = 0;
unsigned long ultimaPublicacao = 0;
unsigned long ultimaReconexao = 0;
unsigned long ultimaTentativaWifi = 0;
unsigned long ultimoDisplay = 0;
unsigned long ultimoPisca = 0;
bool piscaLigado = false;
bool publicarAgora = false;

// ===================== LEITURA DOS SENSORES =====================

// Tensao do poste. Retorna -1 se a leitura for invalida (ADC saturado no
// maximo indica sensor em curto ou desconectado do divisor).
float lerTensao() {
  int bruto = analogRead(PINO_TENSAO);
  if (bruto >= 4095) return -1;
  return bruto * TENSAO_MAXIMA_V / 4095.0;
}

// Latencia simulada da rede, em ms.
float lerLatencia() {
  return analogRead(PINO_LATENCIA) * LATENCIA_MAXIMA_MS / 4095.0;
}

// Nivel da agua em cm. Retorna -1 se a leitura for invalida: sem eco
// (timeout) ou distancia fisicamente impossivel para a altura instalada.
float lerNivelAgua() {
  digitalWrite(PINO_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PINO_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PINO_TRIG, LOW);

  unsigned long duracao = pulseIn(PINO_ECHO, HIGH, TIMEOUT_ECO_US);
  if (duracao == 0) return -1;                      // sem eco

  float distancia = duracao * 0.0343 / 2.0;         // velocidade do som
  if (distancia < DISTANCIA_MIN_CM) return -1;
  if (distancia > ALTURA_INSTALACAO_CM + 5) return -1;  // mais longe que o chao

  float nivel = ALTURA_INSTALACAO_CM - distancia;
  return nivel < 0 ? 0 : nivel;
}

// ===================== CLASSIFICACAO (com histerese) =====================

// Cada funcao recebe o valor suavizado e o estado atual. A histerese faz o
// valor precisar "voltar um pouco mais" para sair de um estado pior.

Estado classificarEnergia(float v, Estado atual) {
  float margem = (atual != NORMAL) ? HISTERESE_V : 0;
  if (v < V_SEM_ENERGIA + (atual == FALHA ? margem : 0)) return FALHA;
  if (v < V_INSTAVEL_MIN + margem || v > V_INSTAVEL_MAX - margem) return ATENCAO;
  return NORMAL;
}

Estado classificarSinal(float latencia, int falhas, Estado atual) {
  if (falhas >= FALHAS_SEM_SINAL) return FALHA;
  float margem = (atual != NORMAL) ? HISTERESE_MS : 0;
  if (falhas > 0 || latencia >= LAT_INSTAVEL_MS - margem) return ATENCAO;
  return NORMAL;
}

Estado classificarAgua(float nivel, Estado atual) {
  float margem = (atual != NORMAL) ? HISTERESE_CM : 0;
  if (nivel > AGUA_ALAGAMENTO_CM - (atual == FALHA ? margem : 0)) return FALHA;
  if (nivel >= AGUA_ATENCAO_CM - margem) return ATENCAO;
  return NORMAL;
}

// ===================== FILA OFFLINE =====================

void enfileirar(const char* servico, const char* estado, float valor) {
  if (filaTamanho == TAMANHO_FILA) {               // fila cheia: descarta o mais antigo
    filaInicio = (filaInicio + 1) % TAMANHO_FILA;
    filaTamanho--;
  }
  int pos = (filaInicio + filaTamanho) % TAMANHO_FILA;
  fila[pos] = {servico, estado, valor, millis()};
  filaTamanho++;
}

bool redeDisponivel() {
  return !quedaSimulada && mqtt.connected();
}

// Envia um evento; se nao houver rede, guarda na fila.
void publicarEvento(const char* servico, const char* estado, float valor, unsigned long quando) {
  char msg[96];
  unsigned long atrasoS = (millis() - quando) / 1000;
  snprintf(msg, sizeof(msg), "ev|%s,%s,%.1f,%lu", servico, estado, valor, atrasoS);

  if (redeDisponivel() && mqtt.publish(TOPICO_ATTRS, msg)) {
    Serial.printf("[MQTT] evento enviado: %s\n", msg);
  } else {
    enfileirar(servico, estado, valor);
    Serial.printf("[FILA] sem rede, evento guardado (%d na fila): %s\n", filaTamanho, msg);
  }
}

// Esvazia a fila quando a rede volta.
void enviarFila() {
  while (filaTamanho > 0 && redeDisponivel()) {
    Evento& e = fila[filaInicio];
    char msg[96];
    snprintf(msg, sizeof(msg), "ev|%s,%s,%.1f,%lu",
             e.servico, e.estado, e.valor, (millis() - e.quando) / 1000);
    if (!mqtt.publish(TOPICO_ATTRS, msg)) return;
    Serial.printf("[FILA] reenviado: %s\n", msg);
    filaInicio = (filaInicio + 1) % TAMANHO_FILA;
    filaTamanho--;
  }
}

// ===================== MAQUINA DE ESTADOS =====================

// Aplica a confirmacao: o novo estado so vale depois de N leituras seguidas.
// Retorna true quando o estado realmente mudou.
bool confirmarEstado(Servico& s, Estado novo) {
  if (novo == s.estado) {
    s.confirmacoes = 0;
    s.candidato = s.estado;
    return false;
  }
  if (novo != s.candidato) {
    s.candidato = novo;
    s.confirmacoes = 1;
  } else {
    s.confirmacoes++;
  }
  if (s.confirmacoes < CONFIRMACOES_ESTADO) return false;

  Estado anterior = s.estado;
  s.estado = novo;
  s.confirmacoes = 0;
  Serial.printf("[ESTADO] %s: %s -> %s\n", s.nome, s.textos[anterior], s.textos[novo]);

  if (novo == FALHA) bipe();                       // bipe unico ao entrar em falha
  publicarEvento(s.nome, s.textos[novo], s.media.media(), millis());
  publicarAgora = true;
  return true;
}

// Trata uma leitura (valida ou nao) de um sensor com media movel.
void processarLeitura(Servico& s, float valor, Estado (*classificar)(float, Estado)) {
  if (valor < 0) {                                  // leitura invalida
    s.invalidasSeguidas++;
    Serial.printf("[AVISO] leitura invalida de %s (%d seguidas)\n", s.nome, s.invalidasSeguidas);
    if (s.invalidasSeguidas >= INVALIDAS_PARA_ERRO) confirmarEstado(s, ERRO_SENSOR);
    return;
  }
  s.invalidasSeguidas = 0;
  s.media.adicionar(valor);
  Estado atual = (s.estado == ERRO_SENSOR) ? NORMAL : s.estado;
  confirmarEstado(s, classificar(s.media.media(), atual));
}

// Le todos os sensores e atualiza os estados.
void cicloDeLeitura() {
  processarLeitura(energia, lerTensao(), classificarEnergia);
  processarLeitura(agua, lerNivelAgua(), classificarAgua);

  // Sinal: a tentativa falha se a chave de queda estiver ligada, se o
  // servidor estiver lento demais ou se a conexao MQTT real caiu.
  quedaSimulada = digitalRead(PINO_QUEDA) == HIGH;
  float latencia = lerLatencia();
  bool falhou = quedaSimulada || latencia >= LAT_FALHA_MS || !mqtt.connected();
  falhasRedeSeguidas = falhou ? falhasRedeSeguidas + 1 : 0;
  sinal.media.adicionar(latencia);
  confirmarEstado(sinal, classificarSinal(sinal.media.media(), falhasRedeSeguidas, sinal.estado));

  // Tempo acumulado em falha (base das "horas sem servico" do Vizi)
  if (energia.estado == FALHA) energia.msEmFalha += INTERVALO_LEITURA;
  if (sinal.estado == FALHA)   sinal.msEmFalha   += INTERVALO_LEITURA;
  if (agua.estado == FALHA)    agua.msEmFalha    += INTERVALO_LEITURA;
}

// Estado geral = o pior entre os tres servicos.
Estado estadoGeral() {
  Estado pior = NORMAL;
  Servico* todos[] = {&energia, &sinal, &agua};
  for (Servico* s : todos) {
    Estado e = (s->estado == ERRO_SENSOR) ? ATENCAO : s->estado;
    if (e > pior) pior = e;
  }
  return pior;
}

const char* textoGeral(Estado e) {
  switch (e) {
    case NORMAL:  return "normal";
    case ATENCAO: return "atencao";
    default:      return "critico";
  }
}

// ===================== SAIDAS LOCAIS =====================

void bipe() {
  tone(PINO_BUZZER, 2000, 250);
}

void corLed(bool r, bool g, bool b) {
  digitalWrite(PINO_LED_R, r);
  digitalWrite(PINO_LED_G, g);
  digitalWrite(PINO_LED_B, b);
}

// Verde/amarelo/vermelho pelo estado geral. Sem rede, alterna com azul
// para mostrar que esta guardando eventos.
void atualizarLed() {
  if (millis() - ultimoPisca >= INTERVALO_PISCA) {
    ultimoPisca = millis();
    piscaLigado = !piscaLigado;
  }
  if (!redeDisponivel() && piscaLigado) {
    corLed(false, false, true);
    return;
  }
  switch (estadoGeral()) {
    case NORMAL:  corLed(false, true, false); break;
    case ATENCAO: corLed(true, true, false);  break;
    default:      corLed(true, false, false); break;
  }
}

void atualizarDisplay() {
  if (!displayOk) return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.printf("VIZI VZ-001 %s\n", textoGeral(estadoGeral()));
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);
  display.setCursor(0, 13);
  display.printf("Energia %5.1fV\n %s\n", energia.media.media(), energia.textos[energia.estado]);
  display.printf("Sinal %4.0fms %s\n", sinal.media.media(), sinal.textos[sinal.estado]);
  display.printf("Agua %4.1fcm %s\n", agua.media.media(), agua.textos[agua.estado]);
  display.printf("Rede:%s fila:%d", redeDisponivel() ? "on" : "OFF", filaTamanho);
  display.display();
}

// ===================== REDE =====================

void manterConexao() {
  if (quedaSimulada) return;                        // simulando queda: nao tenta
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - ultimaTentativaWifi >= INTERVALO_WIFI) {
      ultimaTentativaWifi = millis();
      Serial.println("[REDE] Wi-Fi desconectado, tentando de novo...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD, WIFI_CANAL);  // sem bloquear o loop
    }
    return;
  }
  if (millis() - ultimaReconexao < INTERVALO_RECONEXAO) return;
  ultimaReconexao = millis();
  Serial.printf("[REDE] conectando ao broker %s...\n", BROKER_MQTT);
  if (mqtt.connect(ID_MQTT)) {
    Serial.println("[REDE] broker conectado");
  } else {
    Serial.printf("[REDE] falhou (rc=%d)\n", mqtt.state());
  }
}

void publicarTelemetria() {
  char msg[160];
  snprintf(msg, sizeof(msg),
           "e|%.1f|es|%s|n|%.0f|ns|%s|a|%.1f|as|%s|g|%s|te|%lu|tn|%lu|q|%d",
           energia.media.media(), energia.textos[energia.estado],
           sinal.media.media(),   sinal.textos[sinal.estado],
           agua.media.media(),    agua.textos[agua.estado],
           textoGeral(estadoGeral()),
           energia.msEmFalha / 60000, sinal.msEmFalha / 60000,
           filaTamanho);

  Serial.printf("[LEITURA] %s\n", msg);
  if (redeDisponivel()) {
    mqtt.publish(TOPICO_ATTRS, msg);
  }
}

// ===================== SETUP E LOOP =====================

void setup() {
  Serial.begin(115200);
  Serial.println("\nVizi - sensor de bairro iniciando...");

  pinMode(PINO_TRIG, OUTPUT);
  pinMode(PINO_ECHO, INPUT);
  pinMode(PINO_QUEDA, INPUT);
  pinMode(PINO_LED_R, OUTPUT);
  pinMode(PINO_LED_G, OUTPUT);
  pinMode(PINO_LED_B, OUTPUT);
  pinMode(PINO_BUZZER, OUTPUT);
  corLed(false, false, true);

  Wire.begin(PINO_SDA, PINO_SCL);
  displayOk = display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!displayOk) Serial.println("[AVISO] display OLED nao encontrado");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, WIFI_CANAL);   // conexao segue em segundo plano
  ultimaTentativaWifi = millis();
  mqtt.setServer(BROKER_MQTT, BROKER_PORT);
  mqtt.setSocketTimeout(2);
}

void loop() {
  unsigned long agora = millis();

  manterConexao();
  mqtt.loop();

  if (agora - ultimaLeitura >= INTERVALO_LEITURA) {
    ultimaLeitura = agora;
    cicloDeLeitura();
    enviarFila();
  }

  if (publicarAgora || agora - ultimaPublicacao >= INTERVALO_PUBLICACAO) {
    ultimaPublicacao = agora;
    publicarAgora = false;
    publicarTelemetria();
  }

  if (agora - ultimoDisplay >= INTERVALO_DISPLAY) {
    ultimoDisplay = agora;
    atualizarDisplay();
  }

  atualizarLed();
}
