# Automatic Humidity Control

## Approach

Hysteresis-based control of the Shelly Plug S Gen3, driven by humidity
readings from the BLU H&T ZB.

humidity >= 60% → turn plug on
humidity <= 55% → turn plug off
55% < humidity < 60% → keep current state (hysteresis deadband)


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