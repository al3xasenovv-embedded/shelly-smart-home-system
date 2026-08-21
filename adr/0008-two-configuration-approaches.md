# ADR-0008: Two configuration approaches, one per subsystem

## Status
Accepted.

## Context
Both closed-loop subsystems need parameters: the humidity control needs
its on/off thresholds and timing guards, the thermostat needs a target
temperature and a mode. The Shelly ecosystem offers two ways to supply
them, and they are genuinely different in character:

- **Constants in the script.** Simple, visible in one place, and
  changed by editing and re-uploading the script.
- **Virtual components.** `number:` and `boolean:` components created on
  the gateway, editable from the Shelly app at runtime, readable by the
  script through a status handler.

A single project could reasonably use either for everything.

## Decision
Use one approach for each subsystem, deliberately:

| Subsystem | Configuration | Where |
|---|---|---|
| Automatic humidity control | Hard-coded constants | `CONFIG` in `climate-monitor.js` |
| Thermostat | User input at runtime | `number:200`, `boolean:202`, `boolean:203` |

The humidity thresholds (60% / 55%), the anti-short-cycle interval
(180 s) and the stale-data timeout (600 s) are literals in the script.
The thermostat setpoint and mode are virtual components the user
changes from the Shelly app, with no script edit and no restart.

## Rationale
- The project is a demonstration, and the two techniques are both worth
  demonstrating. Using virtual components everywhere would leave the
  simpler approach unshown, and vice versa.
- The split is not arbitrary. The humidity parameters are protective:
  the anti-short-cycle interval exists to save a compressor and the
  stale-data timeout exists to avoid acting on old readings. Those are
  engineering limits, not preferences, and exposing them invites
  someone to set the cycle guard to zero.
- The thermostat setpoint is the opposite — a comfort preference that
  changes with the season, the time of day, and who is home. A value
  like that belongs in the app, not in a source file.
- Implementing the thermostat with virtual components also satisfies
  requirement #4 more directly, since it asks for a thermostat built
  from the ecosystem's own components.

## Consequences
- The asymmetry is intentional and must be documented, otherwise it
  reads as an inconsistency. It is stated in `docs/06-thermostat.md`,
  `docs/07-humidity-control.md` and the README.
- Changing a humidity threshold means editing `climate-monitor.js` and
  re-uploading it to the gateway. Acceptable for values that should
  rarely change; annoying if they turn out to need tuning.
- The thermostat carries the cost of its flexibility: four virtual
  components to create by hand in the web UI, startup seeding to read
  their current values, and status handlers to react to changes. The
  humidity control needs none of that.
- A product rather than a demonstration would likely expose the
  humidity thresholds too, while keeping the safety guards fixed —
  which is a third approach, and the one worth taking if this ever
  stops being a demonstration.
