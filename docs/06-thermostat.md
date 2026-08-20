# Thermostat

## Approach

Implemented as hysteresis-based demand logic with three modes —
**Off / Heating / Cooling** — producing a **logical signal only**,
since no physical heating or cooling actuator is available in this
deployment (the only controllable actuator, Shelly Plug S, is already
allocated to humidity control). See
`adr/0005-thermostat-as-logical-signal.md` and
`adr/0006-thermostat-cooling-mode.md`.

Heating mode — demand rises when the room is too cold:

```
temperature < setpoint - 0.5°C → demand ON
temperature > setpoint + 0.5°C → demand OFF
within deadband                → keep current state (hysteresis)
```

Cooling mode — the same comparison inverted:

```
temperature > setpoint + 0.5°C → demand ON
temperature < setpoint - 0.5°C → demand OFF
within deadband                → keep current state (hysteresis)
```

Off mode — demand is forced off regardless of temperature. The
setpoint value is preserved, not reset, so switching back into Heating
or Cooling resumes with the same target.

## Configuration: user input at runtime

Unlike the humidity control, whose thresholds are constants in the
script, the thermostat is configured by the user while it runs. The
setpoint and the mode are virtual components on the gateway, editable
from the Shelly app — no script edit, no re-upload, no restart.

The two subsystems were built this way on purpose, so the project
shows both configuration techniques the ecosystem offers. The reasoning
for which subsystem got which is in
`adr/0008-two-configuration-approaches.md`.

The flexibility is not free: it costs four virtual components created
by hand, startup seeding to read their current values, and status
handlers to react when they change. The humidity control needs none of
that.

## Virtual components

- `number:200` — Setpoint temperature, editable from the Shelly app
- `boolean:201` — Heating Demand, read-only indicator
- `boolean:202` — Thermostat HEATING, mode toggle
- `boolean:203` — Thermostat COOLING, mode toggle

`boolean:202` and `boolean:203` are **mutually exclusive**: switching
one on switches the other off, both in the script's state and on the
gateway component itself, so the Shelly app always shows the true
mode. Both off means the thermostat is Off.

All four components must be created through the gateway's **web UI**
(Components → Create new) — the `Boolean.Create` and `Number.Create`
RPC methods return 404 on this firmware. If `boolean:203` is missing,
the script's startup seeding logs an error and cooling silently
defaults to off.

## Implementation

Part of the combined `scripts/gateway/climate-monitor.js` script (see
`adr/0004-consolidate-climate-scripts.md`).

Published to MQTT topic `home/thermostat` (retained):

```json
{"mode": "off" | "heating" | "cooling", "setpoint": number,
 "heating_demand": bool, "current_temp": number, "ts": 1755700000}
```

### Note on the `heating_demand` field name

The demand flag keeps the name `heating_demand` in both cooling and
heating mode. In cooling mode a `true` value means *cooling* demand,
not heating. The name was kept deliberately so that the existing
`boolean:201` component, the MQTT payload, and any existing subscriber
stay compatible — see `adr/0006-thermostat-cooling-mode.md` for the
rationale.

Consumers must therefore read `mode` together with `heating_demand` to
know what an active demand actually means. The monitoring app does
exactly this in `app/ui.py`.
