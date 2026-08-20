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

All device IPs (gateway, Plug S, broker machine) are currently
DHCP-assigned, not reserved. A router restart could reassign them,
breaking the gateway's MQTT connection and the humidity-control
script's HTTP calls to the Plug S. Should be addressed via DHCP
reservations in the router before any long-term deployment.

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

Mirroring it would need either a boolean per state or a `number:`
component holding an encoded state, since the gateway has no enum-style
virtual component.

## Move the IFTTT webhook key out of the script

`button-presence.js` carries the IFTTT Webhooks key inline in the
request URL. It is a credential and belongs outside the repository, the
same way the MQTT password was moved into `app/.env`.

Storing it in gateway KVS and reading it once at script startup would
fix this without changing any behaviour: the URL is assembled at call
time, and a missing key simply disables the notification instead of
breaking the script. The key should be regenerated in IFTTT if it has
ever been pushed to a remote.

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

## Additional gateway script capacity

The gateway's hard limit of 3 concurrently running scripts
(`adr/0004-*`) required consolidating climate monitoring, humidity
control, and thermostat logic into a single script. If a future
gateway firmware or hardware revision raises this limit, the logic
could be split back into more focused, independently deployable
scripts.