# Monitoring Application

Python desktop application that visualizes live data from all Shelly
devices in the system (task requirement #10).

Communicates via MQTT with the local broker, consuming the topics
published by the gateway scripts (see scripts/gateway/):

- `home/presence`
- `home/window`
- `home/climate`
- `home/humidity-control`
- `home/thermostat`

## Structure

- `core/` — MQTT client, data models, payload decoding
  (framework-independent, testable without a UI)
- `config.py` — settings, read from the environment or a local `.env`
- `ui.py` — CustomTkinter window with live-updating cards
- `main.py` — entrypoint

## Configuration

Broker credentials are never committed. Copy the example file and fill
in the password:

```bash
cp .env.example .env
# then edit .env and set MQTT_PASSWORD
```

Environment variables override the file, so `MQTT_PASSWORD=... python
main.py` also works. The app refuses to start with an actionable error
if no password is configured.

| Variable | Default | Description |
|---|---|---|
| `MQTT_HOST` | `192.168.100.5` | Broker address |
| `MQTT_PORT` | `1883` | Broker port |
| `MQTT_USER` | `shellyhub` | Broker username |
| `MQTT_PASSWORD` | *(none — required)* | Broker password |

## Running

```bash
pip install -r requirements.txt
python main.py
```

## Status

Working: live MQTT consumption, decoding, and a dark-themed window
showing current values for all five topics.

The UI intentionally shows only *current* values — no history or
graphs. `core/storage.py` is an empty placeholder kept for a possible
future SQLite history layer; nothing imports it today.
