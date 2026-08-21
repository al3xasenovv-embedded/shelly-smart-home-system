# Gateway Scripts

Scripts running directly on the BLU Gateway Gen3, implementing part of
the system's business logic locally on the hub (task requirement #7).

## button-presence.js

Listens for `single_push` events from the BLU Button
(component: `bthomedevice:200`) and toggles a persistent "home/away"
state, stored via KVS on the gateway. Publishes the state to MQTT
(`home/presence`, retained) on every toggle.

On the transition to Away it also reads `window_state` from KVS (written
by `window-state.js`) and POSTs to an IFTTT Webhooks endpoint if the
window is not closed, which produces a push notification. The condition
is evaluated here, on the hub — the IFTTT applet only delivers the
message. See `docs/11-notifications-and-scenarios.md` and `adr/0007-*`.

**Status:** working, tested across gateway reboots — state and script
auto-start both persist correctly. The notification path is verified
for its three main cases; three edge cases remain open (see
`docs/08-testing-plan.md`).

**Gotcha:** `CONFIG.notifyUrl` is a placeholder in this repository
(`YOUR_IFTTT_KEY_HERE`) because the real Webhooks URL is a credential.
Despite the name, the field holds the **full URL**, not just the key.
Uploading this file to the gateway overwrites the working value and
silently disables the notification until it is pasted back — see
`docs/11-notifications-and-scenarios.md`.

**Gotcha:** the script must have `config.enable = true`
(`Script.SetConfig`) to auto-start after a reboot. This is not the same
as pressing "Start" in the web UI, which only affects the current
session.

## window-state.js

Detects the three states of a single-leaf window (closed / open / tilted)
by combining two BTHome sensor components from the BLU Door/Window ZB:
contact state (`bthomesensor:202`) and tilt angle (`bthomesensor:203`).

Publishes to MQTT (`home/window`, retained) and persists the last known
state via KVS. Uses `Shelly.addStatusHandler` (not `addEventHandler`) —
these are BTHome sensor status changes, not discrete events.

**Status:** working, tested for all three states, including the
tilted state which requires waiting for the asynchronous rotation
report after the initial contact change.

## climate-monitor.js

Combined script (single script due to the gateway's 3-script limit,
see docs/09-troubleshooting.md and adr/0004-*) handling:

1. **Climate monitoring** — reads temperature, humidity, battery from
   BLU H&T ZB (components `bthomesensor:207`, `bthomesensor:206`,
   `bthomesensor:205`), publishes to `home/climate` (retained). Seeds
   all three values from the sensor's current status on script start,
   rather than waiting for the next change — a value that hasn't
   changed since the last report (e.g. a steady temperature while
   humidity fluctuates) would otherwise never trigger the status
   handler.

The two control loops inside this script are configured differently on
purpose: the humidity thresholds are constants in `CONFIG`, while the
thermostat reads its setpoint and mode from virtual components the user
edits in the Shelly app. See `adr/0008-two-configuration-approaches.md`.

2. **Automatic humidity control** — hysteresis-based control of the
   Shelly Plug S based on humidity readings, with anti-short-cycle
   protection and a stale-data fail-safe. Publishes to
   `home/humidity-control` (retained).

3. **Thermostat** — hysteresis-based demand logic with three modes,
   Off / Heating / Cooling (logical signal only, no physical actuator —
   see `adr/0005-*` and `adr/0006-*`). Cooling inverts the heating
   comparison. Setpoint and mode are controlled via virtual components
   (`number:200`, plus the mutually-exclusive `boolean:202` HEATING and
   `boolean:203` COOLING), editable from the Shelly app. Publishes to
   `home/thermostat` (retained), carrying `mode` and `heating_demand`.

**Status:** all three functions working and tested, including
persistence across gateway reboots (KVS + device status seeding on
startup to avoid state desync).