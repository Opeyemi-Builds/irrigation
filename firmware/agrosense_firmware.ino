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
#define DHT_TYPE      DHT21    // AM2301A is DHT21 compatible

// ── Soil moisture calibration ─────────────────────────────────
// Run a quick test: Serial.println(analogRead(34)) with sensor
// in dry air, then submerged in water — replace these values
#define SOIL_DRY            3300   // ADC reading in dry air  (0%  moisture)
#define SOIL_WET            1200   // ADC reading in water    (100% moisture)
#define RELAY_ON_THRESHOLD  60     // Turn relay ON  at/below this moisture %
#define RELAY_OFF_THRESHOLD 75     // Turn relay OFF at/above this moisture %

// ── Water level calibration ────────────────────────────────────
// Distance reading (cm) from the ultrasonic sensor at each extreme.
// 10cm = empty (0% full), 0cm = full (100% full) — adjust if you
// reposition the sensor or use a different container.
#define WATER_EMPTY_CM      10.0f
#define WATER_FULL_CM       2.0f

// ── Ultrasonic noise filtering ──────────────────────────────────
// Raw single-shot ultrasonic readings are noisy. Each cycle we take
// several samples, keep the median (kills random spikes/outliers),
// then smooth that across cycles with an exponential moving average
// (kills residual jitter). Adapted from the AquaCare firmware.
#define NUM_SAMPLES          7       // samples taken per reading cycle
#define EMA_ALPHA            0.15f   // 0-1: lower = smoother but slower to react
#define MAX_SAMPLE_ATTEMPTS  (NUM_SAMPLES * 4)  // safety cap — see readme below

// ── Network & API Config ──────────────────────────────────────
const char* ssid     = "KIMZY";
const char* password = "00112233";

// AgroSense backend on Render. Points at the telemetry endpoint.
const char* api_url  = "https://agrosense-api-g4nb.onrender.com/api/v1/sensors/telemetry";

// ── Objects ───────────────────────────────────────────────────
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
DHT dht(DHT_PIN, DHT_TYPE);

// ── Timing ────────────────────────────────────────────────────
unsigned long lastSensorRead  = 0;
unsigned long lastChargeAnim  = 0;
unsigned long lastApiPost     = 0;
const long    SENSOR_INTERVAL = 1000;   // read sensors every 2s
const long    ANIM_INTERVAL   = 500;    // charging animation frame every 500ms
const long    API_INTERVAL    = 5000;   // POST to backend every 5s

// ── State ─────────────────────────────────────────────────────
float    temperature   = 0;
float    humidity      = 0;
int      soilPercent   = 0;
long     distanceCm    = 0;
int      waterPercent  = 0;
float    emaDistance   = -1.0f;   // -1 = not yet initialized
bool     relayOn       = false;
bool     isCharging    = false;
uint8_t  chargeFrame   = 0;   // 0-4 animation frames

// Pump control mode, received from the backend in each telemetry POST response.
//   "auto" — soil-moisture hysteresis below (the default)
//   "on"   — dashboard forced the pump ON
//   "off"  — dashboard forced the pump OFF
// Defaults to "auto" so the device waters itself even before the first response
// (and if the backend is ever unreachable).
String   pumpMode      = "auto";

// ── Ultrasonic core (median filter + EMA smoothing) ─────────────
// A single pulseIn() reading jitters a lot on these sensors — one
// bad echo can swing the reported distance by several cm. This
// takes several readings, throws out outliers via median, then
// smooths across cycles with an EMA so the on-screen number and
// the value sent to the server don't jump around.
float readUltrasonicCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  if (duration == 0) return NAN;  // no echo
  return (duration * 0.0343f) / 2.0f;
}

// Collects NUM_SAMPLES valid readings, takes the median, then folds
// it into emaDistance. Returns false (leaving emaDistance untouched)
// if the sensor can't produce enough valid readings within
// MAX_SAMPLE_ATTEMPTS — this caps how long a failing/disconnected
// sensor can block the loop, instead of retrying forever.
bool updateFilteredDistance() {
  float samples[NUM_SAMPLES];
  int   count    = 0;
  int   attempts = 0;

  while (count < NUM_SAMPLES && attempts < MAX_SAMPLE_ATTEMPTS) {
    float d = readUltrasonicCM();
    if (!isnan(d)) samples[count++] = d;
    attempts++;
    delay(5);
  }

  if (count < NUM_SAMPLES) return false;  // sensor failing this cycle

  // Median filter (bubble sort — fine for a handful of samples)
  for (int i = 0; i < NUM_SAMPLES - 1; i++) {
    for (int j = i + 1; j < NUM_SAMPLES; j++) {
      if (samples[j] < samples[i]) {
        float temp = samples[i];
        samples[i] = samples[j];
        samples[j] = temp;
      }
    }
  }
  float median = samples[NUM_SAMPLES / 2];

  // Exponential moving average across cycles
  if (emaDistance < 0) emaDistance = median;
  else emaDistance = EMA_ALPHA * median + (1.0f - EMA_ALPHA) * emaDistance;

  return true;
}

// ── Draw static UI frame (called once) ───────────────────────
void drawFrame() {
  tft.fillScreen(ST77XX_BLACK);

  // Header bar
  tft.fillRect(0, 0, 160, 18, 0x0410);  // dark green
  tft.setTextColor(ST77XX_CYAN);
  tft.setTextSize(1);
  tft.setCursor(18, 5);
  tft.print("AGROSENSE DASHBOARD");

  // Divider lines
  tft.drawFastHLine(0, 19, 160, 0x2945);
  tft.drawFastHLine(0, 46, 160, 0x2945);
  tft.drawFastHLine(0, 73, 160, 0x2945);
  tft.drawFastHLine(0, 100, 160, 0x2945);
  tft.drawFastVLine(80, 19, 27, 0x2945);   // splits temp | humidity
  tft.drawFastVLine(80, 100, 28, 0x2945);  // splits relay | charge

  // Static labels
  tft.setTextColor(0x7BEF);  // grey
  tft.setTextSize(1);

  tft.setCursor(2, 21);   tft.print("TEMP");
  tft.setCursor(82, 21);  tft.print("HUMIDITY");
  tft.setCursor(2, 48);   tft.print("SOIL MOISTURE");
  tft.setCursor(2, 75);   tft.print("WATER LEVEL");
  tft.setCursor(2, 102);  tft.print("RELAY");
  tft.setCursor(82, 102); tft.print("POWER");
}

// ── Update temperature ────────────────────────────────────────
// (full fillRect clear before redraw — avoids stale-pixel artifacts)
void updateTemp() {
  tft.fillRect(2, 31, 76, 14, ST77XX_BLACK);
  tft.setTextSize(1);
  if (isnan(temperature)) {
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(2, 33);
    tft.print("ERR");
  } else {
    tft.setTextColor(ST77XX_WHITE);
    tft.setCursor(2, 33);
    tft.print(temperature, 1);
    tft.print(" C");
  }
}

// ── Update humidity ───────────────────────────────────────────
void updateHumidity() {
  tft.fillRect(82, 31, 76, 14, ST77XX_BLACK);
  tft.setTextSize(1);
  if (isnan(humidity)) {
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(82, 33);
    tft.print("ERR");
  } else {
    tft.setTextColor(ST77XX_WHITE);
    tft.setCursor(82, 33);
    tft.print(humidity, 0);
    tft.print(" %");
  }
}

// ── Update soil moisture bar ──────────────────────────────────
void updateSoil() {
  // Clear value and bar area
  tft.fillRect(2, 58, 156, 14, ST77XX_BLACK);

  // Choose color based on moisture level
  uint16_t barColor;
  if      (soilPercent < 30) barColor = ST77XX_RED;
  else if (soilPercent < 60) barColor = ST77XX_YELLOW;
  else                       barColor = ST77XX_GREEN;

  // Progress bar (max width 120px)
  int barWidth = map(soilPercent, 0, 100, 0, 120);
  tft.fillRect(2,   59, 120, 10, 0x2945);         // background track
  tft.fillRect(2,   59, barWidth, 10, barColor);   // filled portion

  // Percentage text
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(1);
  tft.setCursor(126, 60);
  tft.print(soilPercent);
  tft.print("%");
}

// ── Update water level (ultrasonic distance mapped to %) ───────
void updateDistance() {
  tft.fillRect(2, 83, 156, 14, ST77XX_BLACK);
  tft.setTextSize(1);

  if (emaDistance < 0) {
    // Sensor has never produced a valid reading — show error, skip the bar
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(2, 85);
    tft.print("Out of range");
    return;
  }

  // Bar color by fill level
  uint16_t barColor;
  if      (waterPercent < 20) barColor = ST77XX_RED;
  else if (waterPercent < 50) barColor = ST77XX_YELLOW;
  else                        barColor = ST77XX_GREEN;

  // Progress bar (max width 120px), same layout as soil moisture
  int barWidth = map(waterPercent, 0, 100, 0, 120);
  tft.fillRect(2, 84, 120, 10, 0x2945);         // background track
  tft.fillRect(2, 84, barWidth, 10, barColor);   // filled portion

  // Percentage text
  tft.setTextColor(ST77XX_WHITE);
  tft.setCursor(126, 85);
  tft.print(waterPercent);
  tft.print("%");
}

// ── Update relay status ───────────────────────────────────────
void updateRelay() {
  tft.fillRect(2, 110, 76, 16, ST77XX_BLACK);
  tft.setTextSize(1);
  if (relayOn) {
    tft.fillRect(2, 110, 76, 14, 0x0320);   // dark green bg
    tft.setTextColor(ST77XX_GREEN);
    tft.setCursor(8, 113);
    tft.print("ON  [PUMP]");
  } else {
    tft.fillRect(2, 110, 76, 14, 0x3000);   // dark red bg
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(8, 113);
    tft.print("OFF [PUMP]");
  }
}

// ── Charging animation ────────────────────────────────────────
void updateChargeAnim() {
  tft.fillRect(82, 108, 76, 18, ST77XX_BLACK);

  if (!isCharging) {
    tft.setTextColor(0x7BEF);  // grey
    tft.setTextSize(1);
    tft.setCursor(84, 113);
    tft.print("BATTERY");
    return;
  }

  // Battery outline
  tft.drawRect(84, 110, 44, 14, ST77XX_GREEN);
  tft.fillRect(128, 114, 3, 6, ST77XX_GREEN);  // battery tip

  // Fill segments based on frame (4 segments)
  int segWidth = 9;
  for (int i = 0; i <= chargeFrame; i++) {
    uint16_t col = (i < 2) ? ST77XX_YELLOW : ST77XX_GREEN;
    tft.fillRect(86 + i * segWidth, 112, segWidth - 1, 10, col);
  }

  // Charging bolt symbol
  tft.setTextColor(ST77XX_WHITE);
  tft.setTextSize(1);
  tft.setCursor(132, 112);
  tft.print("CHG");

  // Advance frame
  chargeFrame = (chargeFrame + 1) % 5;
}

// ── Setup ─────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("\n=== AGROSENSE DASHBOARD ===");

  // Pin modes
  pinMode(TRIG_PIN,   OUTPUT);
  pinMode(ECHO_PIN,   INPUT);
  pinMode(RELAY_PIN,  OUTPUT);
  pinMode(CHARGE_PIN, INPUT);

  // Relay OFF on boot
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(TRIG_PIN,  LOW);

  // Init display
  tft.initR(INITR_BLACKTAB);
  tft.setRotation(1);
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextColor(ST77XX_CYAN);
  tft.setTextSize(1);
  tft.setCursor(30, 55);
  tft.print("Initializing...");
  Serial.println("Display: OK");

  // Connect WiFi
  tft.fillRect(0, 48, 160, 20, ST77XX_BLACK);
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

  tft.fillRect(0, 48, 160, 20, ST77XX_BLACK);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    tft.setTextColor(ST77XX_GREEN);
    tft.setCursor(10, 55);
    tft.print("WiFi Connected!");
  } else {
    Serial.println("\nWiFi FAILED — running offline");
    tft.setTextColor(ST77XX_RED);
    tft.setCursor(10, 55);
    tft.print("WiFi Failed");
  }
  delay(1000);

  // Init DHT
  dht.begin();
  Serial.println("DHT: OK");

  // Draw static UI
  drawFrame();
  Serial.println("UI: Ready");
}

// ── Loop ──────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  // ── 1. Read sensors & update display every 2 seconds ───────
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;

    // Temperature and humidity
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    if (!isnan(t)) temperature = t;
    if (!isnan(h)) humidity    = h;

    // Soil moisture
    int rawSoil   = analogRead(SOIL_PIN);
    soilPercent   = map(rawSoil, SOIL_DRY, SOIL_WET, 0, 100);
    soilPercent   = constrain(soilPercent, 0, 100);

    // Relay logic. A manual command from the dashboard ("on"/"off") overrides
    // everything; in "auto" the pump runs on soil-moisture hysteresis, which
    // avoids the rapid on/off chatter you'd get from a single threshold.
    if (pumpMode == "on") {
      if (!relayOn) {
        relayOn = true;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.println("Manual override — Relay ON");
      }
    } else if (pumpMode == "off") {
      if (relayOn) {
        relayOn = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.println("Manual override — Relay OFF");
      }
    } else {  // "auto"
      if (soilPercent <= RELAY_ON_THRESHOLD && !relayOn) {
        relayOn = true;
        digitalWrite(RELAY_PIN, HIGH);
        Serial.printf("Soil %d%% <= %d%% — Relay ON\n", soilPercent, RELAY_ON_THRESHOLD);
      } else if (soilPercent >= RELAY_OFF_THRESHOLD && relayOn) {
        relayOn = false;
        digitalWrite(RELAY_PIN, LOW);
        Serial.printf("Soil %d%% >= %d%% — Relay OFF\n", soilPercent, RELAY_OFF_THRESHOLD);
      }
    }

    // Distance / water level (median-filtered + EMA-smoothed)
    if (updateFilteredDistance()) {
      float d = constrain(emaDistance, WATER_FULL_CM, WATER_EMPTY_CM);
      float percent = (WATER_EMPTY_CM - d) / (WATER_EMPTY_CM - WATER_FULL_CM) * 100.0f;
      waterPercent = (int)round(constrain(percent, 0.0f, 100.0f));
      distanceCm   = (long)round(emaDistance);
    }
    // else: sensor failed to produce enough valid samples this cycle —
    // keep the last known waterPercent/distanceCm rather than showing
    // a misleading 0% or 100%

    // Charging detect
    isCharging = (analogRead(CHARGE_PIN) > 1241);

    // Serial debug
    Serial.printf("Temp: %.1f C  Hum: %.0f%%  Soil: %d%%  Water: %d%% (%ld cm)  Charging: %s\n",
      temperature, humidity, soilPercent, waterPercent, distanceCm, isCharging ? "YES" : "NO");

    // Update display (clean fillRect-based redraw)
    updateTemp();
    updateHumidity();
    updateSoil();
    updateDistance();
    updateRelay();
  }

  // ── 2. HTTP POST to AgroSense backend every 5 seconds ───────
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
      doc["soil_moisture"]      = soilPercent;
      doc["water_level_percent"] = waterPercent;
      doc["water_level_cm"]     = distanceCm;
      doc["pump_status"]    = relayOn;
      doc["is_charging"]    = isCharging;

      String body;
      serializeJson(doc, body);

      int code = http.POST(body);
      if (code > 0) {
        String resp = http.getString();
        Serial.printf("POST %d — %s\n", code, resp.c_str());

        // The backend echoes the current pump command in its response, so we
        // pick up dashboard on/off/auto changes here without a second request.
        StaticJsonDocument<256> respDoc;
        if (deserializeJson(respDoc, resp) == DeserializationError::Ok) {
          const char* cmd = respDoc["pump_command"] | "";
          if (strlen(cmd) > 0) pumpMode = String(cmd);
        }
      } else {
        Serial.printf("POST failed: %s\n", http.errorToString(code).c_str());
      }
      http.end();
    } else {
      Serial.println("WiFi disconnected — skipping POST");
      WiFi.reconnect();
    }
  }

  // ── 3. Charging animation every 500ms ───────────────────────
  if (now - lastChargeAnim >= ANIM_INTERVAL) {
    lastChargeAnim = now;
    updateChargeAnim();
  }
}