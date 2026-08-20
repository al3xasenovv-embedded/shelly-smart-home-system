# Automatic Humidity Control

## Approach

Hysteresis-based control of the Shelly Plug S Gen3, driven by humidity
readings from the BLU H&T ZB.

humidity >= 60% → turn plug on
humidity <= 55% → turn plug off
55% < humidity < 60% → keep current state (hysteresis deadband)


## Configuration: hard-coded on purpose

Every parameter above lives as a constant in the `CONFIG` block of
`scripts/gateway/climate-monitor.js`. Nothing here is editable from
the Shelly app, and changing a threshold means editing the script and
re-uploading it to the gateway.

This is deliberate, and it is the opposite of how the thermostat is
configured — see `adr/0008-two-configuration-approaches.md`. The short
version: these are protective limits rather than preferences. The
180-second guard exists to save a compressor and the 600-second
timeout exists to stop the system acting on stale readings; neither is
something a user should be able to set to zero from a phone.

Between them, the two subsystems demonstrate both configuration
techniques the Shelly ecosystem offers.

## Safety mechanisms

- **Anti-short-cycle protection**: minimum 180 seconds between
  switches, to protect the connected appliance's compressor.
- **Stale-data fail-safe**: if no humidity reading arrives for 600
  seconds while the plug is on, it is forced off — acting on outdated
  data is treated as unsafe rather than assumed safe.

## Implementation

Part of the combined `scripts/gateway/climate-monitor.js` script (see
`adr/0004-consolidate-climate-scripts.md` for why this isn't a
separate script). Controls the Shelly Plug S over local HTTP RPC
(`Switch.Set` / `Switch.GetStatus` on `192.168.100.35`), independent
of MQTT.

Published to MQTT topic `home/humidity-control` (retained):
`{"plug_on": true|false, "ts": <unix timestamp>}`

State is persisted via KVS (key `humidity_control_state`).

## Known gotcha

In-memory plug state can desync from the physical device after a
script restart (see `docs/09-troubleshooting.md`) — the script seeds
its state from the actual `Switch.GetStatus` on startup to avoid this.