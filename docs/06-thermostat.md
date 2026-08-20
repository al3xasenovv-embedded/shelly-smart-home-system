# Thermostat

## Approach

Implemented as hysteresis-based heating-demand logic — a **logical
signal only**, since no physical heating actuator is available in
this deployment (the only controllable actuator, Shelly Plug S, is
already allocated to humidity control). See
`adr/0005-thermostat-as-logical-signal.md`.

temperature < setpoint - 0.5°C → heating demand ON
temperature > setpoint + 0.5°C → heating demand OFF
within deadband → keep current state (hysteresis)


## Virtual components

- `number:200` — Setpoint temperature, editable from the Shelly app
- `boolean:201` — Heating Demand, read-only indicator
- `boolean:202` — Thermostat Enabled (Off/Auto toggle)

When disabled (Off), heating demand is forced off regardless of
temperature; the setpoint value is preserved, not reset.

## Implementation

Part of the combined `scripts/gateway/climate-monitor.js` script (see
`adr/0004-consolidate-climate-scripts.md`).

Published to MQTT topic `home/thermostat` (retained):
`{"enabled": bool, "setpoint": number, "heating_demand": bool,
"current_temp": number, "ts": <unix timestamp>}`