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