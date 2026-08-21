# Future Improvements

Ideas considered during development but intentionally out of scope
for v1, plus known limitations worth addressing in a future iteration.

## Passive BLE-based presence (considered, not implemented)

An alternative to the explicit button-press presence model: track the
BLU Button's BLE advertisement "last seen" timestamp, and infer
"away" after a timeout with no heartbeat.

Considered and rejected for v1 — see
`adr/0002-use-button-as-presence-token.md` for the full rationale
(false positives if the button is left at home, false negatives
during temporary BLE signal loss, and a passive signal doesn't
directly fulfill the task's explicit requirement to use the button).

Could be added later as a **secondary confirmation signal**, combined
with — not replacing — the explicit button press.

## Static IP addresses / DHCP reservations

Static addressing is the norm for devices that other devices talk to
by address, and any real installation would use it from the start.
This project is the exception: the gateway, the Plug S and the broker
machine all run on DHCP-assigned addresses, because the setup was
built and torn down repeatedly on a home network where fixing
addresses would have slowed the work down more than it helped.

The cost of that shortcut is real. A router restart can reassign any
of the three, which breaks the gateway's MQTT connection and the
humidity-control script's HTTP calls to the Plug S — both of which
address their targets by IP. Nothing in the system detects this; it
simply stops working.

For anything beyond a demonstration, reserve all three addresses in
the router before deploying.

## TLS for MQTT

The broker currently runs without TLS, acceptable for a local network
but not for any deployment with untrusted network segments. No ADR
records this decision — it was a default rather than a deliberate
choice, and deserves one if the system ever leaves the LAN.

## Physical heating and cooling actuators

The thermostat currently outputs a logical demand signal only, with no
physical actuator in either mode (see
`adr/0005-thermostat-as-logical-signal.md` and
`adr/0006-thermostat-cooling-mode.md`). Adding a relay or TRV for
heating, and a switchable outlet for a cooling appliance, would let the
existing decision logic drive real hardware without changes to the
hysteresis logic itself.

A cleaner demand field would come with that work: `heating_demand` is
a misnomer in cooling mode, kept only for compatibility. Driving two
separate actuators is the natural moment to split it into explicit
heating and cooling outputs.

## Mirror the window state to a virtual component

`window-state.js` publishes its three-state classification to MQTT and
KVS, but never mirrors it to a virtual component the way
`button-presence.js` mirrors presence to `boolean:200`. The state is
therefore invisible in the Shelly app, which shows only the raw contact
and rotation sensors.

An enum virtual component fits this directly — one component holding
`closed` / `tilted` / `open` — which is closer to the state machine than
a boolean per state would be.

## Move the IFTTT webhook key out of the script

The credential is currently kept out of the repository by committing a
placeholder in `CONFIG.notifyUrl`, with the real URL living only on the
gateway. That protects the secret but makes the committed script
undeployable: uploading it overwrites the working URL, and the
notification then fails silently until someone pastes it back in the
script editor.

Reading the URL from gateway KVS would give both properties at once —
no secret in the repository, and a file that can be uploaded as-is. The
script would assemble the URL at call time from a KVS key, and a
missing key would disable the notification with a log line instead of
sending a request to a placeholder address.

## Automated testing

All testing performed so far was manual and interactive (see
`docs/08-testing-plan.md`). A future iteration could add:
- Unit tests for the classification/hysteresis logic (extracted into
  testable pure functions where possible)
- Integration tests using a mock MQTT broker for the monitoring app's
  decoder layer

## Monitoring app enhancements

- Historical graphs (temperature/humidity over time) — deliberately
  out of scope for v1; the UI shows live values only. Adding them
  would require a persistence layer, which the app does not have.
- Manual controls from the app (e.g. override the humidity control
  plug, change thermostat mode) — the app is currently read-only by
  design (see `adr/0001-*`), but a controlled write path could be
  added without breaking that principle if scoped carefully.

## Cross-device rules

Each subsystem in this project currently observes its own sensor and
acts on its own. The one exception is the Away notification, which
combines presence with window state (`adr/0007-*`) — and it works
because the two scripts involved share the key-value store.

That mechanism is general. Several rules are one `KVS.Get` away from
being possible, and each is a rule that a commercial system would be
expected to have.

### The thermostat should defer to the window

Conditioning a room that is open to the outside is wasted work. While
`window_state` is anything other than `closed`, heating and cooling
demand should be held off, with mode and setpoint left untouched so
that closing the window resumes exactly what was configured.

Two properties matter for a correct implementation:

- **Fail open.** An unknown or unreadable `window_state` should be
  treated as closed. Refusing to heat because a KVS key is missing
  turns a small failure into a cold room.
- **Poll, do not only react.** Temperature reports are infrequent, so a
  version that re-checks the window only when a reading arrives would
  not notice an open window for minutes.

**This was attempted and reverted.** A version that cached the window
state and refreshed it from KVS — at startup, on each temperature
reading, and on the existing 60-second timer — broke other behaviour on
the gateway and was rolled back. The suspected cause is the platform
limit this project has already hit once: issuing several asynchronous
`Shelly.call` requests close together produces "Too many calls in
progress" (see `docs/09-troubleshooting.md` and `adr/0004-*`). The
refresh added a `KVS.Get` into handlers that were already issuing a
`KVS.Set`, and into a startup chain that was already five calls deep.

A working version would have to add no concurrent calls at all — for
example by folding the window read into the existing sequential seeding
chain and the 60-second timer only, never inside the temperature
handler, and accepting the resulting delay in reacting.

### The humidity control should defer to the window too

The same argument applies to the plug: dehumidifying against outside
air achieves nothing. The same `window_state` key is available, and the
constraint above applies equally.

### Presence should influence the climate

Presence is tracked, persisted and published, but nothing consumes it
except the notification. The standard rule — a setback temperature
while the house is empty, restored on return — needs no new hardware
and no new sensor, only the `presence_state` key that already exists.

### Making the reason visible

None of these rules are distinguishable in the MQTT payload. A consumer
sees `heating_demand: false` whether the room is warm enough or the
window is open. A `window_hold` (or more generally a `reason`) field in
`home/thermostat` would let the monitoring app show why the system is
idle, at the cost of a payload change and a matching update to the
app's decoder, models and UI.
