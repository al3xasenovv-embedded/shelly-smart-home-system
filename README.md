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
| 3 | Thermostat using built-in Shelly components | Done — logical signal | [climate-monitor.js](scripts/gateway/climate-monitor.js), [ADR-0005](adr/0004-consolidate-climate-scripts.md) |
| 4 | Presence detection using the Bluetooth button | Done | [button-presence.js](scripts/gateway/button-presence.js), [ADR-0002](adr/0002-use-button-as-presence-token.md) |
| 5 | Door/window sensor: all three window states | Done | [window-state.js](scripts/gateway/window-state.js) |
| 6 | Business logic implemented and stored on the hub | Done | [scripts/gateway/](scripts/gateway/) |
| 7 | Automatic humidity control (hub + Plug S + H&T) | Done | [climate-monitor.js](scripts/gateway/climate-monitor.js) |
| 8 | GitHub repository with all project materials | Partial — diagrams pending | this repo |
| 9 | Incremental, logically separated commits (skeleton first) | Done | `git log` |
| 10 | Monitoring application visualizing all device data | Done | [app/](app/) |

**Requirement 3 caveat:** the provided hardware includes no heating
relay or TRV, and the only controllable actuator (Shelly Plug S) is
allocated to humidity control. The thermostat therefore computes a
*heating demand* boolean with full hysteresis logic and exposes it via
a virtual component and MQTT, but switches no physical load. See
[ADR-0005](adr/0004-consolidate-climate-scripts.md).

**Requirement 8 gap:** the `diagrams/` files are still empty
placeholders, as are several `docs/` chapters (see the documentation
index below).

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

```
BLU sensors ──BLE──> BLU Gateway Gen3 ──MQTT──> Mosquitto ──MQTT──> monitoring app
                     (3 on-device scripts)                          (read-only)
                            │
                            └──HTTP RPC──> Shelly Plug S (humidity actuator)
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

## MQTT topics

All topics are published with `retain=true`, so a subscriber that
connects late immediately receives the current state.

| Topic | Payload |
|---|---|
| `home/presence` | `{"present": bool, "ts": int}` |
| `home/window` | `{"state": "closed" / "tilted" / "open", "ts": int}` |
| `home/climate` | `{"temperature": float, "humidity": float, "battery": float, "ts": int}` |
| `home/humidity-control` | `{"plug_on": bool, "ts": int}` |
| `home/thermostat` | `{"enabled": bool, "setpoint": float, "heating_demand": bool, "current_temp": float, "ts": int}` |

### Control logic

| Behavior | Thresholds |
|---|---|
| Humidity control | Plug on at 60% RH and above, off at 55% RH and below (hysteresis) |
| Anti short-cycle | Minimum 180 s between plug switches |
| Stale-data fail-safe | Plug forced off if no reading for 600 s |
| Thermostat | Heating demand on below `setpoint - 0.5 °C`, off above `setpoint + 0.5 °C` |

### Virtual components on the gateway

Created through the gateway web UI (Components → Create new); the
`Boolean.Create` and `Number.Create` RPC methods are unavailable on
this firmware.

| Component | Name | Purpose |
|---|---|---|
| `boolean:200` | Home/Away | Presence state, visible in the Shelly app |
| `number:200` | Thermostat Setpoint | Target temperature, editable in the app |
| `boolean:201` | Heating Demand | Read-only thermostat output |
| `boolean:202` | Thermostat Enabled | Off / Auto mode |

## Repository layout

```
adr/       architecture decision records
app/       Python monitoring application (CustomTkinter + paho-mqtt)
configs/   example configuration files
diagrams/  Mermaid diagrams (pending)
docs/      project documentation
images/    screenshots and photos
logs/      test logs
scripts/   gateway scripts (mJS, run on the BLU Gateway Gen3)
```

## Getting started

### 1. Broker

Run a Mosquitto instance on the LAN with username/password
authentication enabled. On Windows, running it from a `.bat` script is
more reliable than installing it as a service — see
[docs/09-troubleshooting.md](docs/09-troubleshooting.md).

### 2. Gateway scripts

Upload each file from [scripts/gateway/](scripts/gateway/) to the
gateway (Scripts → Add script), then enable auto-start so the script
survives a reboot:

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

## Documentation

| Document | Status |
|---|---|
| [00-overview.md](docs/00-overview.md) — task and architecture summary | Written |
| [01-devices.md](docs/01-devices.md) — inventory and device roles | Written |
| [02-network-setup.md](docs/02-network-setup.md) — network and broker setup | Placeholder |
| [03-pairing-guide.md](docs/03-pairing-guide.md) — pairing the BLU devices | Placeholder |
| [04-presence-concepts.md](docs/04-presence-concepts.md) — presence design | Placeholder |
| [05-manual-presence-with-button.md](docs/05-manual-presence-with-button.md) | Placeholder |
| [06-automatic-ble-presence.md](docs/06-automatic-ble-presence.md) | Placeholder |
| [07-scenes-and-automations.md](docs/07-scenes-and-automations.md) | Placeholder |
| [08-testing-plan.md](docs/08-testing-plan.md) — test plan | Placeholder |
| [09-troubleshooting.md](docs/09-troubleshooting.md) — problems and fixes | Written |
| [10-future-improvements.md](docs/10-future-improvements.md) | Placeholder |

### Architecture decision records

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-use-shelly-smart-control.md) | Hub-centric logic | Empty file |
| [0002](adr/0002-use-button-as-presence-token.md) | Button as an explicit presence token | Written |
| [0003](adr/0003-no-home-assistant-in-v1.md) | No Home Assistant in v1 | Empty file |
| [0004](adr/0004-consolidate-climate-scripts.md) | Consolidate climate scripts (3-script limit) | Not written — see note |
| 0005 | Thermostat as a logical heating-demand signal | Written, currently stored in the 0004 file |

> **Known inconsistency:** `adr/0004-consolidate-climate-scripts.md`
> contains the text of ADR-0005 (thermostat). The ADR about
> consolidating the climate scripts due to the 3-script limit has not
> been written yet, and ADRs 0001 and 0003 are empty files.

## Known limitations

- The thermostat drives no physical actuator (see requirement 3 above).
- Presence is an explicit button toggle, not passive BLE proximity — a
  deliberate choice, see [ADR-0002](adr/0002-use-button-as-presence-token.md).
- The app's connection indicator turns green on a fixed 800 ms timer
  rather than reflecting real broker connection state.
- `app/core/storage.py` is an empty placeholder; the UI shows current
  values only, with no history or graphs.
- The setpoint slider in the Shelly app may report "Failed to apply
  setting" while the value is in fact applied correctly — an app UI
  quirk with virtual components, not a real fault.
