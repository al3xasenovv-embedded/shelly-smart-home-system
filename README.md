# Shelly Smart Home System

Smart home automation system built on the Shelly BLU ecosystem —
thermostat, presence detection, window state machine and automatic
humidity control.

All business logic runs **on the BLU Gateway Gen3 itself** as on-device
scripts. No cloud services and no logic in the desktop application: the
gateway decides, publishes state to a local MQTT broker, and the
monitoring app is a read-only consumer of that stream.

## Requirements status

The full task text is in [docs/00-overview.md](docs/00-overview.md).

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | All devices added and configured in the Shelly profile | Done | [docs/01-devices.md](docs/01-devices.md) |
| 2 | Each device assigned a clearly defined role | Done | [docs/01-devices.md](docs/01-devices.md) |
| 3 | Thermostat using built-in Shelly components | Done — logical signal | [docs/06-thermostat.md](docs/06-thermostat.md), [ADR-0005](adr/0005-thermostat-as-logical-signal.md) |
| 4 | Presence detection using the Bluetooth button | Done | [docs/04-presence.md](docs/04-presence.md), [ADR-0002](adr/0002-use-button-as-presence-token.md) |
| 5 | Door/window sensor: all three window states | Done | [docs/05-window-state.md](docs/05-window-state.md) |
| 6 | Business logic implemented and stored on the hub | Done | [scripts/gateway/](scripts/gateway/), [ADR-0001](adr/0001-hub-centric-business-logic.md) |
| 7 | Automatic humidity control (hub + Plug S + H&T) | Done | [docs/07-humidity-control.md](docs/07-humidity-control.md) |
| 8 | GitHub repository with all project materials | Done | [docs/](docs/), [diagrams/](diagrams/), [adr/](adr/) |
| 9 | Incremental, logically separated commits (skeleton first) | Done | [CHANGELOG.md](CHANGELOG.md) |
| 10 | Monitoring application visualizing all device data | Done | [app/](app/) |

**Requirement 3 caveat:** the provided hardware includes no heating
relay or TRV, and the only controllable actuator (Shelly Plug S) is
allocated to humidity control. The thermostat therefore computes a
*demand* boolean with full hysteresis logic in both heating and cooling
mode, and exposes it via a virtual component and MQTT, but switches no
physical load. See [ADR-0005](adr/0005-thermostat-as-logical-signal.md)
and [ADR-0006](adr/0006-thermostat-cooling-mode.md).

## Hardware

| Device | Role | Connectivity |
|---|---|---|
| BLU Gateway Gen3 | Hub — runs all business logic | Wi-Fi + BLE |
| BLU Button Tough 1 ZB | Presence token (single press toggles home/away) | BLE via gateway |
| BLU Door/Window ZB | Window state: closed / tilted / open | BLE via gateway |
| BLU H&T ZB | Temperature, humidity, battery | BLE via gateway |
| Shelly Plug S Gen3 | Humidity control actuator | Wi-Fi (direct, not via gateway) |

MQTT broker: a local Mosquitto instance on the LAN. Credentials are
never stored in this repository — see [app/README.md](app/README.md).

## Architecture

```mermaid
flowchart TB
subgraph BLE["BLE Sensors (paired to gateway)"]
Button["BLU Button Tough 1 ZB<br/>bthomedevice:200"]
DoorWindow["BLU Door/Window ZB<br/>bthomedevice:201"]
HT["BLU H&T ZB<br/>bthomedevice:202"]
end

subgraph Gateway["BLU Gateway Gen3 (hub)"]
    S1["button-presence.js"]
    S2["window-state.js"]
    S3["climate-monitor.js<br/>(climate + humidity + thermostat)"]
end

Broker["Mosquitto MQTT Broker<br/>192.168.100.5:1883"]

Plug["Shelly Plug S Gen3<br/>192.168.100.35<br/>(direct Wi-Fi)"]

App["Monitoring App<br/>(Python, read-only)"]

Button -- BLE --> S1
DoorWindow -- BLE --> S2
HT -- BLE --> S3

S1 -- "home/presence" --> Broker
S2 -- "home/window" --> Broker
S3 -- "home/climate, home/thermostat" --> Broker
S3 -- "home/humidity-control" --> Broker
S3 -- "HTTP RPC Switch.Set/GetStatus" --> Plug
Plug -- MQTT --> Broker

Broker -- "subscribe (all topics)" --> App
```

The gateway allows a **hard maximum of three concurrently running
scripts**, which is why climate monitoring, humidity control and the
thermostat live in one combined script rather than three
([ADR-0004](adr/0004-consolidate-climate-scripts.md)).

### Gateway scripts

| Script | Responsibility | Publishes |
|---|---|---|
| [button-presence.js](scripts/gateway/button-presence.js) | Presence toggle on button press, persisted in KVS, mirrored to `boolean:200` | `home/presence` |
| [window-state.js](scripts/gateway/window-state.js) | Combines contact and tilt into a 3-state window machine | `home/window` |
| [climate-monitor.js](scripts/gateway/climate-monitor.js) | Climate readings, humidity control, thermostat | `home/climate`, `home/humidity-control`, `home/thermostat` |

Details and gotchas: [scripts/README.md](scripts/README.md).

## Diagrams

Mermaid sources live in [diagrams/](diagrams/). The architecture diagram
above is the rendered version of `architecture.mmd`.

| Diagram | Shows |
|---|---|
| [architecture.mmd](diagrams/architecture.mmd) | Full system topology: sensors, gateway scripts, broker, app, and the direct HTTP path to the Plug S |
| [presence-state-machine.mmd](diagrams/presence-state-machine.mmd) | Home/Away toggle driven by `single_push`, and what each transition publishes |
| [window-state-machine.mmd](diagrams/window-state-machine.mmd) | Closed / Tilted / Open transitions, including the asynchronous arrival of contact and rotation |
| [thermostat-logic.mmd](diagrams/thermostat-logic.mmd) | Mode selection (Off / Heating / Cooling), hysteresis deadband, and the resulting demand decision |
| [humidity-control-logic.mmd](diagrams/humidity-control-logic.mmd) | Hysteresis thresholds, anti-short-cycle cooldown, and the stale-data fail-safe |

## MQTT topics

All topics are published with `retain=true`, so a subscriber that
connects late immediately receives the current state.

| Topic | Payload |
|---|---|
| `home/presence` | `{"present": bool, "ts": int}` |
| `home/window` | `{"state": "closed" / "tilted" / "open", "ts": int}` |
| `home/climate` | `{"temperature": float, "humidity": float, "battery": float, "ts": int}` |
| `home/humidity-control` | `{"plug_on": bool, "ts": int}` |
| `home/thermostat` | `{"mode": "off"/"heating"/"cooling", "setpoint": float, "heating_demand": bool, "current_temp": float, "ts": int}` |

### Control logic

| Behavior | Thresholds |
|---|---|
| Humidity control | Plug on at 60% RH and above, off at 55% RH and below (hysteresis) |
| Anti short-cycle | Minimum 180 s between plug switches |
| Stale-data fail-safe | Plug forced off if no reading for 600 s |
| Thermostat — heating | Demand on below `setpoint - 0.5 °C`, off above `setpoint + 0.5 °C` |
| Thermostat — cooling | The inverse: demand on above `setpoint + 0.5 °C`, off below `setpoint - 0.5 °C` |
| Thermostat — off | Demand forced off; the setpoint is preserved, not reset |

### Virtual components on the gateway

Created through the gateway web UI (Components → Create new); the
`Boolean.Create` and `Number.Create` RPC methods are unavailable on
this firmware.

| Component | Name | Purpose |
|---|---|---|
| `boolean:200` | Home/Away | Presence state, visible in the Shelly app |
| `number:200` | Thermostat Setpoint | Target temperature, editable in the app |
| `boolean:201` | Heating Demand | Read-only thermostat output (means cooling demand in cooling mode) |
| `boolean:202` | Thermostat HEATING | Mode toggle, mutually exclusive with COOLING |
| `boolean:203` | Thermostat COOLING | Mode toggle, mutually exclusive with HEATING |

## Repository layout

```
adr/       architecture decision records
app/       Python monitoring application (CustomTkinter + paho-mqtt)
diagrams/  Mermaid diagrams of the architecture and the control logic
docs/      project documentation
images/    screenshots and photos
scripts/   gateway scripts (mJS, run on the BLU Gateway Gen3)
```

## Getting started

### 1. Broker

Run a Mosquitto instance on the LAN with username/password
authentication enabled. On Windows, running it from a `.bat` script is
more reliable than installing it as a service — see
[docs/02-network-setup.md](docs/02-network-setup.md) and
[docs/09-troubleshooting.md](docs/09-troubleshooting.md).

### 2. Gateway scripts

Pair the BLU devices with the gateway
([docs/03-pairing-guide.md](docs/03-pairing-guide.md)), then upload each
file from [scripts/gateway/](scripts/gateway/) to the gateway
(Scripts → Add script) and enable auto-start so the script survives a
reboot:

```bash
curl -X POST -d '{"id":1,"method":"Script.SetConfig","params":{"id":1,"config":{"enable":true}}}' http://<gateway-ip>/rpc
```

Pressing "Start" in the web UI is not enough — it only affects the
current session.

### 3. Monitoring application

```bash
cd app
cp .env.example .env      # then set MQTT_PASSWORD
pip install -r requirements.txt
python main.py
```

Full configuration reference: [app/README.md](app/README.md).

## Screenshots

<!--
Add images to images/ and reference them here. Suggested set:

### Monitoring application

![Monitoring application showing live device state](images/app-monitor.png)

### Shelly app

![Virtual components on the gateway](images/shelly-app-components.png)

### Gateway

![The three scripts running on the gateway](images/gateway-scripts.png)

### Hardware

![The BLU devices installed](images/hardware-setup.jpg)
-->

## Documentation

| Document | Covers |
|---|---|
| [00-overview.md](docs/00-overview.md) | Task text, provided devices, architecture summary |
| [01-devices.md](docs/01-devices.md) | Device inventory, identifiers, and roles |
| [02-network-setup.md](docs/02-network-setup.md) | Network layout and Mosquitto broker setup |
| [03-pairing-guide.md](docs/03-pairing-guide.md) | Pairing the BLU devices with the gateway |
| [04-presence.md](docs/04-presence.md) | Presence detection design and behavior |
| [05-window-state.md](docs/05-window-state.md) | Three-state window detection |
| [06-thermostat.md](docs/06-thermostat.md) | Thermostat logic and virtual components |
| [07-humidity-control.md](docs/07-humidity-control.md) | Automatic humidity control |
| [08-testing-plan.md](docs/08-testing-plan.md) | Test plan and recorded results |
| [09-troubleshooting.md](docs/09-troubleshooting.md) | Problems encountered and their fixes |
| [10-future-improvements.md](docs/10-future-improvements.md) | Out-of-scope ideas and known rough edges |

### Architecture decision records

| ADR | Decision |
|---|---|
| [0001](adr/0001-hub-centric-business-logic.md) | Business logic runs on the gateway, not in the cloud or the app |
| [0002](adr/0002-use-button-as-presence-token.md) | BLU Button used as an explicit presence token |
| [0003](adr/0003-mqtt-over-http-polling.md) | MQTT chosen over HTTP polling |
| [0004](adr/0004-consolidate-climate-scripts.md) | Climate, humidity control, and thermostat consolidated into one script |
| [0005](adr/0005-thermostat-as-logical-signal.md) | Thermostat implemented as a logical heating-demand signal |
| [0006](adr/0006-thermostat-cooling-mode.md) | Cooling mode via two mutually-exclusive mode toggles |

## Known limitations

- The thermostat drives no physical actuator, in either heating or
  cooling mode (see requirement 3 above).
- The demand flag is published as `heating_demand` in both modes; in
  cooling mode a true value means cooling demand. Consumers must read
  `mode` alongside it — see [ADR-0006](adr/0006-thermostat-cooling-mode.md).
- Presence is an explicit button toggle, not passive BLE proximity — a
  deliberate choice, see [ADR-0002](adr/0002-use-button-as-presence-token.md).
- The UI shows current values only, with no history or graphs.
- The setpoint slider in the Shelly app may report "Failed to apply
  setting" while the value is in fact applied correctly — an app UI
  quirk with virtual components, not a real fault.
