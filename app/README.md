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

- `core/` — MQTT client, data models, payload decoding, storage
  (framework-independent, testable without a UI)
- `main.py` — entrypoint

## Running

\`\`\`bash
pip install -r requirements.txt
python main.py
\`\`\`

## Status

Core MQTT + decode layer complete and tested. Console-only for now;
SQLite storage and a graphical UI (PySide6) are in progress.