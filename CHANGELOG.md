# Changelog

Reverse-chronological log of every commit in this repository.
Times are local (`git log --date=format:'%Y-%m-%d %H:%M'`).

| Date | Time | Commit | Hash | Summary |
|---|---|---|---|---|
| 2026-08-20 | 18:01 | Diagrams update | `428100c` | Filled in all five Mermaid diagrams (architecture, humidity control, presence, thermostat, window state) |
| 2026-08-20 | 17:49 | Docu update - remove and restructure | `da3ccd8` | Reorganised `docs/` and `adr/` to match the shipped design; new ADR-0001/0003/0005, docs split into presence / window-state / thermostat / humidity chapters |
| 2026-08-20 | 16:55 | Fix readme | `5505313` | README corrections — requirements status table and links |
| 2026-08-20 | 16:51 | fix: load MQTT credentials from environment instead of source | `a8e817f` | Secrets moved out of code into `app/config.py` + `.env` (`.env.example` added, `.gitignore` updated) |
| 2026-08-20 | 16:42 | Quick fix for connections status | `7a6472b` | Fixed MQTT connection-status reporting in `app/main.py` |
| 2026-08-20 | 16:13 | Update GUI | `fa5de3d` | Monitoring app UI polish (`app/ui.py`) |
| 2026-08-20 | 16:05 | Working app + real time values | `ebf8bf7` | First fully working monitoring app — live values rendered in a Tk UI, plus `app/README.md` |
| 2026-08-20 | 15:54 | Core application config | `4d4a2f5` | Skeleton of the desktop app: `core/` package (MQTT client, decoder, models, storage), `main.py`, `requirements.txt` |
| 2026-08-20 | 15:25 | Documentation update for climate manager | `4207031` | Documented the consolidated climate script in `docs/01-devices.md` and `scripts/README.md` |
| 2026-08-20 | 15:23 | Climate manager update | `77e6877` | Hysteresis + humidity control logic finalised in `climate-monitor.js` |
| 2026-08-20 | 14:14 | Adr for thermostat concept | `9c9f745` | ADR-0004: consolidate all climate scripts into one gateway script |
| 2026-08-20 | 14:09 | Fix : Climate monitoring concept change | `f16943d` | Reworked the climate monitoring approach; troubleshooting notes updated |
| 2026-08-20 | 13:13 | Climate measuring and sending to MQTT | `86a7add` | New `scripts/gateway/climate-monitor.js` — reads H&T values and publishes them to MQTT |
| 2026-08-20 | 12:24 | Init implement window state | `0ee012d` | New `scripts/gateway/window-state.js` — three-state window state machine |
| 2026-08-20 | 11:59 | Update 01-devices for current state of the button | `8c36d2d` | Device inventory updated with the button's actual behaviour |
| 2026-08-20 | 11:50 | Added virtual button for feedback in the application | `0edb18c` | Virtual component added to `button-presence.js` for UI feedback |
| 2026-08-20 | 11:43 | Button presence script update | `2cdf6fc` | Presence script hardened; scripts README and troubleshooting updated |
| 2026-08-20 | 11:22 | Initial debug script for button presence events | `a4262e3` | First `scripts/gateway/button-presence.js` — logs BLU button events |
| 2026-08-20 | 11:16 | Define device inventory and roles | `12e01fb` | `docs/01-devices.md` — every device given a clearly defined role |
| 2026-08-20 | 11:13 | Button-based presence detection | `fc98065` | ADR-0002: use the BLU button as the presence token |
| 2026-08-20 | 11:04 | Define task specification and project overview | `776dce0` | `docs/00-overview.md` — full task text and project scope |
| 2026-08-20 | 10:59 | Add project directory skeleton | `06b98ff` | Repository skeleton: `docs/`, `adr/`, `diagrams/`, `configs/`, `scripts/`, `logs/`, `images/`, `.gitignore`, `CHANGELOG.md` |
| 2026-08-19 | 22:00 | Initial commit | `b74e0ca` | Repository created — `README.md`, `.gitattributes` |

## Milestones

- **2026-08-19 22:00 — 2026-08-20 11:16** — Repository setup, task specification, device inventory and the first ADRs.
- **2026-08-20 11:22 — 12:24** — Presence detection on the gateway (BLU button) and the window state machine.
- **2026-08-20 13:13 — 15:25** — Climate: measurement, MQTT publishing, thermostat logic and automatic humidity control, consolidated into a single gateway script.
- **2026-08-20 15:54 — 16:51** — Desktop monitoring application: core, UI, live values, credentials moved to the environment.
- **2026-08-20 16:55 — 18:01** — Documentation restructure and diagrams.
