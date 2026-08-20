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
but not for any deployment with untrusted network segments. See
`adr/0003-*` (or wherever the TLS decision is recorded) for the
current rationale.

## Physical heating actuator

The thermostat currently outputs a logical "heating demand" signal
only, with no physical actuator (see
`adr/0005-thermostat-as-logical-signal.md`). Adding a relay or TRV
would let the existing decision logic directly drive real hardware
without changes to the hysteresis logic itself.

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
- Real MQTT connection-state tracking in the UI, replacing the current
  fixed-delay `after(800, ...)` approximation.
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