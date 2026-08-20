# Devices

## Inventory

| Device | Model | Identifier | Connectivity | Role |
|---|---|---|---|---|
| BLU Gateway Gen3 | S3GW-1DBT001 | `shellyblugwg3-b81f3f5ffe00` | Wi-Fi + BLE | Hub / business logic |
| BLU Button Tough 1 ZB | — | `bthomedevice:200` | BLE via gateway | Presence detection |
| BLU Door/Window ZB | — | TBD | BLE via gateway | Window: 3-state detection |
| BLU H&T ZB | — | TBD | BLE via gateway | Temperature + humidity monitoring |
| Shelly Plug S Gen3 | — | TBD | Wi-Fi | Humidity control (actuator) |

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