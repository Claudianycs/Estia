# Éstia — aplicação mobile web (HTML + CSS + JavaScript)

## O que o projeto implementa
- identidade visual lilás e branca e logo Éstia;
- slogan “Proteção discreta e conectada”;
- mapa Leaflet/OpenStreetMap;
- localização do celular;
- tentativa de conexão BLE com dispositivos compatíveis via Web Bluetooth;
- conexão ESP32-C3 Mini via USB usando Web Serial;
- botão SOS;
- abertura do WhatsApp com mensagem + localização;
- comando JSON de alerta para o ESP32;
- histórico local de alertas.

## Limitação importante do iTag Gshield informado
O produto indicado é anunciado pelo fabricante para **Apple Find My** e requer dispositivo Apple.
Isso significa que uma página HTML/JavaScript não recebe automaticamente a posição da rede
Apple Find My. O botão “iTag” deste protótipo usa Web Bluetooth para experimentação com BLE;
o funcionamento GATT depende do firmware/serviços que a tag realmente expõe.

Para uma integração real com esse modelo específico, mantenha o rastreamento Find My no
ecossistema Apple ou utilize hardware BLE cujo protocolo GATT seja documentado/controlado
pelo projeto Éstia.

## ESP32 e WhatsApp
No MVP, a aplicação abre `wa.me` com a mensagem pronta. Para **envio automático**:
1. ESP32-C3 conecta-se à internet por Wi‑Fi;
2. envia HTTPS para um backend do projeto;
3. o backend autenticado chama a WhatsApp Business Platform;
4. o backend registra resultado e horário.

Não coloque token secreto da Meta/WhatsApp em `app.js`.

## Como executar
Web Bluetooth/Web Serial e geolocalização exigem contexto seguro em vários navegadores.
Use HTTPS ou localhost. Exemplo:

    python -m http.server 8000

Abra em Chrome/Edge compatível. No Android, Chrome costuma ser a opção mais adequada.
Safari/iOS não oferece suporte nativo ao Web Bluetooth.

## Protocolo serial sugerido
App -> ESP32:
    {"type":"alert","message":"...","latitude":-28.0,"longitude":-53.0,"whatsapp":"5551..."}

ESP32 -> App (GPS externo, se houver):
    {"type":"location","latitude":-28.0,"longitude":-53.0,"accuracy":10}

ESP32 -> App (botão físico):
    {"type":"help","event":"help"}
