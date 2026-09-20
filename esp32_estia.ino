/*
  Éstia - exemplo mínimo para ESP32-C3 Mini
  Comunicação USB serial com a aplicação web.
  Este firmware NÃO envia WhatsApp sozinho.

  Para envio automático via WhatsApp Business:
  ESP32 -> HTTPS para seu backend -> WhatsApp Business Platform.
  Não grave tokens permanentes da API no frontend web.
*/
#include <Arduino.h>

void setup() {
  Serial.begin(115200);
  delay(1200);
  Serial.println("{\"type\":\"status\",\"device\":\"ESP32-C3 Mini\",\"ready\":true}");
}

void loop() {
  if (Serial.available()) {
    String line = Serial.readStringUntil('\n');
    line.trim();
    if (line.length()) {
      Serial.print("{\"type\":\"received\",\"payload\":");
      // Apenas eco para teste. Em produção, use ArduinoJson para validar o JSON.
      Serial.print("\"");
      line.replace("\"", "\\\"");
      Serial.print(line);
      Serial.println("\"}");
    }
  }

  // Exemplo para um botão físico:
  // quando acionado:
  // Serial.println("{\"type\":\"help\",\"event\":\"help\"}");
}
