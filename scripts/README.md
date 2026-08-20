# Gateway Scripts

Scripts running directly on the BLU Gateway Gen3, implementing part of
the system's business logic locally on the hub (task requirement #6).

## button-presence.js

Listens for `single_push` events from the BLU Button
(component: `bthomedevice:200`) and toggles a persistent "home/away"
state, stored via KVS on the gateway. Publishes the state to MQTT
(`home/presence`, retained) on every toggle.

**Status:** working, tested across gateway reboots — state and script
auto-start both persist correctly.

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

Reads temperature, humidity, and battery level from the BLU H&T ZB
(components `bthomesensor:207`, `bthomesensor:206`, `bthomesensor:205`)
and publishes a combined reading to MQTT (`home/climate`, retained).

Seeds all three values from the sensor's current status on script
start, rather than waiting for the next change — a value that hasn't
changed since the last report (e.g. a steady temperature while
humidity fluctuates) would otherwise never trigger the status handler.

**Status:** working, tested — temperature, humidity, and battery all
populate correctly on script start and update live on sensor changes.