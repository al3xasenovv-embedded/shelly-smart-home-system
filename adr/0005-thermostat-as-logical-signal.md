# ADR-0005: Thermostat implemented as logical heating-demand signal

## Status
Accepted. Extended by ADR-0006, which adds a cooling mode on top
of the same logical-signal approach.

## Context
Task requirement #3 asks for a thermostat using built-in Shelly
components. The provided hardware set does not include a physical
heating relay or TRV — the only controllable actuator (Shelly Plug S)
is already allocated to the humidity control system
(see ADR-0004: consolidate-climate-scripts, and docs/01-devices.md).

## Decision
The thermostat is implemented as hysteresis-based logic that computes
a "heating demand" boolean, exposed via:
- a virtual boolean component on the gateway (visible in the Shelly
  app, alongside Home/Away)
- an MQTT topic (home/thermostat)

No physical actuator is switched. The signal represents what a real
heating relay would do, and is ready to drive one if hardware is added.

Since ADR-0006 the same signal also represents cooling demand when the
thermostat is in cooling mode.

## Consequences
- Fully testable and demonstrable logic without additional hardware.
- Does not physically control temperature in this deployment.
- If a heating relay/TRV becomes available, only the actuator call
  needs to be added — the decision logic is already complete.