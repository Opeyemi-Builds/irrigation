#include <Adafruit_GFX.h>
#include <Adafruit_ST7735.h>
#include <SPI.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ── Pin definitions ───────────────────────────────────────────
#define TFT_CS        5
#define TFT_DC        27
#define TFT_RST       4
#define DHT_PIN       13
#define SOIL_PIN      34
#define TRIG_PIN      26
#define ECHO_PIN      25
#define RELAY_PIN     14
#define CHARGE_PIN    32

// ── Sensor config ─────────────────────────────────────────────
#define DHT_TYPE      DHT21

// ── Soil moisture calibration & Hysteresis ────────────────────
#define SOIL_DRY      3300
#define SOIL_WET      1200
#define RELAY_ON_THRESHOLD  60
#define RELAY_OFF_THRESHOLD 75

// ── Network & API Config ──────────────────────────────────────
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// AgroSense backend on Render. Points at the telemetry endpoint.
const char* api_url  = "https://agrosense-api-g4nb.onrender.com/api/v1/sensors/telemetry";

// ── Objects ───────────────────────────────────────────────────
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
DHT dht(DHT_PIN, DHT_TYPE);

// ── Timing ────────────────────────────────────────────────────
unsigned long lastSensorRead  = 0;
unsigned long lastChargeAnim  = 0;
unsigned long lastApiPost     = 0;
const long    SENSOR_INTERVAL = 2000;
const long    ANIM_INTERVAL   = 500;
const long    API_INTERVAL    = 5000;

// ── State ─────────────────────────────────────────────────────
float    temperature   = 0;
float    humidity      = 0;
int      soilPercent   = 0;
long     distanceCm    = 0;
bool     relayOn       = false;
bool     isCharging    = false;
uint8_t  chargeFrame   = 0;

// ── Ultrasonic read ───────────────────────────────────────────
long readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1;
  return duration * 0.034 / 2;
}

// ── Draw static UI frame ──────────────────────────────────────
void drawFrame() {
  tft.fillScreen(ST77XX_BLACK);
  tft.fillRect(0, 0, 160, 18, 0x0410);
  tft.setTextColor(ST77XX_CYAN);
  tft.setTextSize(1);
  tft.setCursor(18, 5);
  tft.print("AGROSENSE DASHBOARD");

  tft.drawFastHLine(0, 19, 160, 0x2945);
  tft.drawFastHLine(0, 46, 160, 0x2945);
  tft.drawFastHLine(0, 73, 160, 0x2945);
  tft.drawFastHLine(0, 100, 160, 0x2945);
  tft.drawFastVLine(80, 19, 27, 0x2945);
  tft.drawFastVLine(80, 100, 28, 0x2945);

  tft.setTextColor(0x7BEF);
  tft.setTextSize(1);
  tft.setCursor(2, 21);   tft.print("TEMP");
  tft.setCursor(82, 21);  tft.print("HUMIDITY");
  tft.setCursor(2, 48);   tft.print("SOIL MOISTURE");
  tft.setCursor(2, 75);   tft.print("WATER LEVEL");
  tft.setCursor(2, 102);  tft.print("RELAY");
  tft.setCursor(82, 102); tft.print("POWER");
}

// ── Update UI Elements ────────────────────────────────────────
void updateTemp() {
  tft.setTextSize(1);
  tft.setCursor(2, 33);
  if (isnan(temperature)) {
    tft.setTextColor(ST77XX_RED, ST77XX_BLACK);
    tft.print("ERR     ");
  } else {
    tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
    tft.print(temperature, 1);
    tft.print(" C   ");
  }
}

void updateHumidity() {
  tft.setTextSize(1);
  tft.setCursor(82, 33);
  if (isnan(humidity)) {
    tft.setTextColor(ST77XX_RED, ST77XX_BLACK);
    tft.print("ERR     ");
  } else {
    tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
    tft.print(humidity, 0);
    tft.print(" %   ");
  }
}

void updateSoil() {
  uint16_t barColor = (soilPercent < 30) ? ST77XX_RED : (soilPercent < 60) ? ST77XX_YELLOW : ST77XX_GREEN;
  int barWidth = map(soilPercent, 0, 100, 0, 120);
  tft.fillRect(2, 59, barWidth, 10, barColor);
  tft.fillRect(2 + barWidth, 59, 120 - barWidth, 10, 0x2945);
  tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setCursor(126, 60);
  if (soilPercent < 100) tft.print(" ");
  if (soilPercent < 10)  tft.print(" ");
  tft.print(soilPercent);
  tft.print("%");
}

void updateDistance() {
  tft.setTextSize(1);
  tft.setCursor(2, 85);
  if (distanceCm < 0) {
    tft.setTextColor(ST77XX_RED, ST77XX_BLACK);
    tft.print("Out of range   ");
  } else {
    tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
    tft.print(distanceCm);
    tft.print(" cm       ");
  }
}

void updateRelay() {
  tft.setTextSize(1);
  tft.setCursor(8, 113);
  if (relayOn) {
    tft.setTextColor(ST77XX_GREEN, 0x0320);
    tft.print("ON  [PUMP]");
  } else {
    tft.setTextColor(ST77XX_RED, 0x3000);
    tft.print("OFF [PUMP]");
  }
}

void updateChargeAnim() {
  if (!isCharging) {
    tft.setTextColor(0x7BEF, ST77XX_BLACK);
    tft.setTextSize(1);
    tft.setCursor(84, 113);
    tft.print("BATTERY     ");
    tft.fillRect(84, 110, 47, 14, ST77XX_BLACK);
    return;
  }
  tft.drawRect(84, 110, 44, 14, ST77XX_GREEN);
  tft.fillRect(128, 114, 3, 6, ST77XX_GREEN);
  int segWidth = 9;
  for (int i = 0; i < 4; i++) {
    uint16_t col = ST77XX_BLACK;
    if (i <= chargeFrame) col = (i < 2) ? ST77XX_YELLOW : ST77XX_GREEN;
    tft.fillRect(86 + i * segWidth, 112, segWidth - 1, 10, col);
  }
  tft.setTextColor(ST77XX_WHITE, ST77XX_BLACK);
  tft.setTextSize(1);
  tft.setCursor(132, 112);
  tft.print("CHG");
  chargeFrame = (chargeFrame + 1) % 4;
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== AGROSENSE DASHBOARD ===");

  pinMode(TRIG_PIN,   OUTPUT);
  pinMode(ECHO_PIN,   INPUT);
  pinMode(RELAY_PIN,  OUTPUT);
  pinMode(CHARGE_PIN, INPUT);

  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(TRIG_PIN,  LOW);

  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(ST77XX_BLACK);

  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(10, 55);
  tft.print("Connecting to Wi-Fi...");

  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    tft.fillRect(0, 48, 160, 20, ST77XX_BLACK);
    tft.setTextColor(ST77XX_GREEN);
    tft.setCursor(10, 55);
    tft.print("WiFi Connected!");
    delay(1000);
  } else {
    Serial.println("\nWiFi FAILED — running offline");
    tft.fillRect(0, 48, 160, 20, ST77XX_BLACK);
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(10, 55);
    tft.print("WiFi Failed");
    delay(1000);
  }

  dht.begin();
  drawFrame();
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // 1. Read sensors & update display (every 2s)
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;

    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity    = h;

    int rawSoil = analogRead(SOIL_PIN);
    soilPercent = map(rawSoil, SOIL_DRY, SOIL_WET, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    // Hysteresis logic
    if (soilPercent <= RELAY_ON_THRESHOLD && !relayOn) {
      relayOn = true;
      digitalWrite(RELAY_PIN, HIGH);
      Serial.printf("Soil %d%% <= %d%% — Relay ON\n", soilPercent, RELAY_ON_THRESHOLD);
    } else if (soilPercent >= RELAY_OFF_THRESHOLD && relayOn) {
      relayOn = false;
      digitalWrite(RELAY_PIN, LOW);
      Serial.printf("Soil %d%% >= %d%% — Relay OFF\n", soilPercent, RELAY_OFF_THRESHOLD);
    }

    distanceCm = readDistanceCm();
    isCharging = (analogRead(CHARGE_PIN) > 1241);

    updateTemp();
    updateHumidity();
    updateSoil();
    updateDistance();
    updateRelay();
  }

  // 2. HTTP POST to AgroSense backend (every 5s)
  if (now - lastApiPost >= API_INTERVAL) {
    lastApiPost = now;

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure();
      HTTPClient http;
      http.begin(client, api_url);
      http.addHeader("Content-Type", "application/json");

      StaticJsonDocument<256> doc;
      doc["temperature"]    = temperature;
      doc["humidity"]       = humidity;
      doc["soil_moisture"]  = soilPercent;
      doc["water_level_cm"] = distanceCm;
      doc["pump_status"]    = relayOn;
      doc["is_charging"]    = isCharging;

      String body;
      serializeJson(doc, body);

      int code = http.POST(body);
      if (code > 0) {
        Serial.printf("POST %d — %s\n", code, http.getString().c_str());
      } else {
        Serial.printf("POST failed: %s\n", http.errorToString(code).c_str());
      }
      http.end();
    } else {
      Serial.println("WiFi disconnected — skipping POST");
      WiFi.reconnect();
    }
  }

  // 3. Charging animation (every 500ms)
  if (now - lastChargeAnim >= ANIM_INTERVAL) {
    lastChargeAnim = now;
    updateChargeAnim();
  }
}
