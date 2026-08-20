# ADR-0004: Consolidate climate, humidity control, and thermostat logic into one script

## Status
Accepted

## Context
The BLU Gateway Gen3 enforces a hard limit of 3 concurrently running
scripts (confirmed via RPC error `-108`: "Reached the maximum 3 of
running scripts"). Two script slots were already occupied by presence
detection (`button-presence.js`) and window state detection
(`window-state.js`), leaving only one slot for climate monitoring,
automatic humidity control, and the thermostat — three features that
would otherwise be natural candidates for separate scripts.

## Decision
Climate monitoring, automatic humidity control, and thermostat logic
are implemented together in a single script,
`scripts/gateway/climate-monitor.js`, rather than as three independent
scripts.

## Consequences
- All three features share sensor state (e.g. temperature) directly
  as in-memory variables, avoiding redundant reads.
- The script is larger and less modular than three separate files
  would be, but each concern is still clearly separated into its own
  section and functions within the file.
- Any future feature requiring gateway-side logic will need to either
  extend this script further or replace one of the three existing
  scripts, since no script slots remain.
- Startup sequencing required care: multiple parallel `Shelly.call`
  requests on script start triggered a "Too many calls in progress"
  error, resolved by chaining the seed calls sequentially (see
  `docs/09-troubleshooting.md`).