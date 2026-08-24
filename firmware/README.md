# AgroSense Firmware

Arduino firmware for the ESP32 field unit. It reads the field sensors, drives the pump autonomously, renders a local dashboard on a TFT, and posts telemetry to the AgroSense backend over HTTPS.

The control loop is self-contained: the pump is decided on-device, so watering continues correctly even with no network.

## Required libraries

Install the ESP32 board package (Boards Manager → *esp32 by Espressif*), then these libraries from the Library Manager:

- Adafruit GFX Library
- Adafruit ST7735 and ST7789 Library
- Adafruit Unified Sensor
- DHT sensor library
- ArduinoJson (v6)

## Wiring

| Signal | ESP32 pin | Component | Notes |
|---|---|---|---|
| TFT CS | GPIO5 | ST7735 1.8" TFT | Hardware SPI |
| TFT DC | GPIO27 | | |
| TFT RST | GPIO4 | | |
| TFT SCK | GPIO18 | | Default VSPI clock |
| TFT MOSI (SDA) | GPIO23 | | Default VSPI MOSI |
| DHT data | GPIO13 | DHT21 (AM2301) | 10 kΩ pull-up to 3.3 V |
| Soil moisture | GPIO34 | Analog probe | ADC1, input-only pin |
| Ultrasonic TRIG | GPIO26 | HC-SR04 | |
| Ultrasonic ECHO | GPIO25 | HC-SR04 | **Level-shift 5 V → 3.3 V** (divider) |
| Relay IN | GPIO14 | Pump relay | Active HIGH |
| Charge sense | GPIO32 | Charge/solar rail | Through a divider into the ADC range |

All grounds common. The TFT and sensors run at 3.3 V; the HC-SR04 and relay typically want 5 V for VCC — drop the ECHO line back into the ESP32's 3.3 V logic level.

## Configuration

Set these near the top of [`agrosense_firmware.ino`](agrosense_firmware.ino):

```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* api_url  = "https://<your-backend>/api/v1/sensors/telemetry";
```

`api_url` must point at your deployed backend's telemetry endpoint (Render URL). The sketch posts with `WiFiClientSecure` + `setInsecure()`, which skips certificate pinning while still using TLS — fine for this workload against a standard HTTPS host.

## Calibration

Soil percentage is mapped from the raw ADC reading between two constants — measure your own probe and set them:

```cpp
#define SOIL_DRY   3300   // raw reading with the probe in dry air
#define SOIL_WET   1200   // raw reading with the probe in water
```

Other tunables:

- **Pump thresholds** — `RELAY_ON_THRESHOLD` (60%) and `RELAY_OFF_THRESHOLD` (75%).
- **Charge detection** — `analogRead(CHARGE_PIN) > 1241` marks "charging"; adjust for your divider.
- **Reservoir height** — set the tank height in [`../backend/app/store.py`](../backend/app/store.py); the backend converts the reported distance to a fill percentage.

## Control logic

The pump uses **hysteresis** rather than a single threshold, which prevents rapid switching when the soil reading sits near the setpoint:

```
soil ≤ 60%  → pump ON   (relay HIGH)
soil ≥ 75%  → pump OFF  (relay LOW)
60–75%      → hold current state
```

## Telemetry

Every 5 seconds, when Wi-Fi is connected, the unit POSTs a JSON reading:

```json
{ "temperature": 28.5, "humidity": 65.0, "soil_moisture": 42,
  "water_level_cm": 12, "pump_status": true, "is_charging": false }
```

Sensors are sampled every 2 s and the TFT updates in step; the charge animation ticks every 500 ms. A failed POST is logged and ignored — it never interrupts sensing or pump control — and Wi-Fi auto-reconnects if the link drops.

## Flashing

1. Open the sketch in the Arduino IDE.
2. Select your ESP32 board under **Tools → Board** and the correct serial port.
3. Set your Wi-Fi credentials and `api_url` (above).
4. Upload, then open **Serial Monitor at 115200 baud**.

Expected serial output once running:

```
=== AGROSENSE DASHBOARD ===
WiFi connected!
IP: 192.168.x.x
POST 200 — {"status":"ok","reservoir_pct":60.0,"pump_status":true,"stored":false}
Soil 42% <= 60% — Relay ON
```

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `POST failed` with SSL error `-29312` | The TLS host closed the handshake. Some tunnels (e.g. ngrok's edge) reject the ESP32's handshake even though browsers succeed — point `api_url` at a standard HTTPS host such as your Render URL. |
| `POST failed: connection refused` | Backend unreachable or wrong URL; confirm the endpoint responds in a browser. |
| Temperature/humidity read `ERR` | DHT wiring or missing pull-up; confirm `DHT_TYPE` matches your sensor (DHT21). |
| Water level `Out of range` | HC-SR04 wiring or ECHO not level-shifted; check the 3.3 V divider. |
| Soil stuck at 0% or 100% | Recalibrate `SOIL_DRY` / `SOIL_WET` for your probe. |
