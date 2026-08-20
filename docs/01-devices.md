# Devices

## Inventory

| Device | Model | Identifier | Connectivity | Role |
|---|---|---|---|---|
| BLU Gateway Gen3 | S3GW-1DBT001 | `shellyblugwg3-b81f3f5ffe00` | Wi-Fi + BLE | Hub / business logic |
| BLU Button Tough 1 ZB | SBBT-102C | `bthomedevice:200` | BLE via gateway | Presence detection |
| BLU Door/Window ZB | SBDW-103C | `bthomedevice:201` | BLE via gateway | Window: 3-state detection |
| BLU H&T ZB | SBHT-203C | `bthomedevice:202` | BLE via gateway | Temperature + humidity monitoring |
| Shelly Plug S Gen3 | S3PL-00112EU | `shellyplugsg3-34b7dac84ec0` | Wi-Fi | Humidity control (actuator) |


## Roles

### BLU Gateway Gen3
Central hub. Bridges BLE advertisements from the paired BLU sensors to
MQTT, and hosts the on-device scripts that implement the system's
business logic (presence tracking, window state machine, thermostat
logic, humidity control).

### BLU Button Tough 1 ZB
Used as a manual presence token. A single press toggles the system's
"home / away" state, handled by a script running on the gateway
(see `scripts/gateway/` and `adr/0002-use-button-as-presence-token.md`).

The current state is exposed as:
- MQTT topic `home/presence` (retained)
- a virtual boolean component (`boolean:200`, "Home/Away") on the
  gateway, visible directly in the Shelly Smart Control app

### BLU Door/Window ZB
Reports both contact state (open/closed) and tilt angle. Combined, these
two signals are used to distinguish three window states: closed, tilted
(ventilation position), and fully open. See `docs/04-*` for the state
machine design.

### BLU H&T ZB
Provides temperature and humidity readings used by:
- the thermostat logic (temperature)
- the automatic humidity control system (humidity), together with the
  Shelly Plug S

Exposed via three BTHome sensor components:
- `bthomesensor:207` — temperature (°C)
- `bthomesensor:206` — humidity (%)
- `bthomesensor:205` — battery (%)

Published to MQTT on `home/climate` (retained), see
`scripts/gateway/climate-monitor.js`.

### Thermostat (logical signal)

Implemented as hysteresis-based logic in
`scripts/gateway/climate-monitor.js` (see `adr/0005-*` — no physical
heating actuator is available in this deployment; Shelly Plug S is
already allocated to humidity control).

Exposed via three virtual components on the gateway:
- `number:200` — Setpoint temperature, editable from the Shelly app
- `boolean:201` — Heating Demand, read-only indicator
- `boolean:202` — Thermostat Enabled, Off/Auto toggle

Behavior:
- Auto mode: heating demand turns on when temperature drops below
  `setpoint - 0.5°C`, and off above `setpoint + 0.5°C` (hysteresis
  deadband, prevents rapid toggling).
- Off mode: heating demand is forced off regardless of temperature.
  The setpoint value is preserved (not reset) when switching back to
  Auto.

Published to MQTT on `home/thermostat` (retained).
### Shelly Plug S Gen3
Wi-Fi connected smart plug, used as the actuator for the automatic
humidity control system (e.g. switching a dehumidifier/humidifier on
or off based on readings from the BLU H&T sensor).

## Connectivity notes

- The three BLU sensors (Button, Door/Window, H&T) communicate over
  Bluetooth Low Energy exclusively through the BLU Gateway Gen3 — they
  are not directly reachable over Wi-Fi.
- The Shelly Plug S Gen3 connects directly to the local Wi-Fi network
  and has its own MQTT client, independent of the gateway.

## MQTT

- Broker: local Mosquitto instance running on `<lan-ip>:1883`
- Gateway MQTT topic prefix: `shellyblugwg3-b81f3f5ffe00`
- Authentication: username/password (not stored in this repository)