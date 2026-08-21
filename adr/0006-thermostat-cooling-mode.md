# ADR-0006: Cooling mode via two mutually-exclusive mode toggles

## Status
Accepted. Extends ADR-0005 (thermostat as a logical signal).

## Context
The thermostat originally had two states, driven by a single
`Thermostat Enabled` boolean: Off, and Auto (heating only). Adding
cooling means the thermostat now has three mutually-exclusive modes —
Off, Heating, Cooling — and a single boolean can no longer express
them.

Two things had to be decided: how the mode is represented on the
gateway and in the MQTT payload, and what happens to the existing
`heating_demand` flag once demand can also mean cooling.

## Decision

**Mode representation.** Two virtual booleans on the gateway,
`boolean:202` (HEATING) and `boolean:203` (COOLING), kept mutually
exclusive by the script: switching one on switches the other off, both
in memory and on the component itself. Both off means Off. The MQTT
payload replaces `enabled: bool` with `mode: "off" | "heating" |
"cooling"`.

**Demand flag.** The payload field and the virtual component keep the
name `heating_demand` / "Heating Demand". In cooling mode, `true`
means cooling demand. Consumers read `mode` and `heating_demand`
together to interpret it.

## Rationale
- Two toggles map directly onto the two things being switched, and both
  are visible at a glance in the Shelly app without opening a selector.
- Enforcing exclusivity in the script rather than trusting the user
  keeps the state machine total — there is no "both on" state to
  define behavior for.
- Renaming `heating_demand` to something neutral would have been
  cleaner in isolation, but it would rename the `boolean:201`
  component that already exists on the gateway, break any retained
  MQTT message, and break every existing subscriber at once. The
  rename buys clarity in one field name and costs compatibility
  everywhere.

## Consequences
- Three modes are controllable directly from the Shelly app.
- `heating_demand` is a misnomer in cooling mode. This is documented
  in `docs/06-thermostat.md` and handled explicitly in the monitoring
  app, which labels an active demand according to the current mode.
- Consumers that read `heating_demand` without reading `mode` will
  mislabel cooling as heating. There are no such consumers in this
  repository.
- Adding a third mode (e.g. "auto changeover") would need a third
  toggle and would make the mutual-exclusion logic noticeably worse.
  At that point a single component holding the mode as one value would
  be the better representation.
