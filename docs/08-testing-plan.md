# Testing

This document records the testing performed for each feature,
including edge cases discovered and verified during development.

## Presence detection

| Test | Result |
|---|---|
| Single press toggles state | ✅ Verified via `mosquitto_sub` on `home/presence` |
| State persists across gateway reboot (KVS) | ✅ Verified: pressed once, rebooted gateway, pressed again — resumed from correct prior state |
| Script auto-starts after reboot | ✅ Verified `config.enable = true` is required (see `docs/09-troubleshooting.md`) |
| Virtual component (`boolean:200`) reflects state in the app | ✅ Verified visually in Shelly Smart Control |

## Window state detection

| Test | Result |
|---|---|
| Closed → Open transition | ✅ |
| Open → Closed transition | ✅ |
| Closed → Tilted transition | ✅ Verified rotation arrives ~2s after contact; state correctly resolves to "tilted" once rotation is non-zero |
| Tilted → Closed transition | ✅ |
| Rapid open/close does not produce spurious intermediate states | ✅ Contact always takes priority in classification (`contact=false` → `closed` regardless of stale rotation value) |
| State persists across gateway reboot (KVS) | ✅ |

## Thermostat

| Test | Result |
|---|---|
| Heating mode: temperature below setpoint - deadband → demand ON | ✅ Verified via console injection (`evaluateThermostat()`) and via real sensor readings |
| Heating mode: temperature above setpoint + deadband → demand OFF | ✅ |
| Temperature within deadband → state unchanged (hysteresis) | ✅ Verified no toggling when injecting a mid-range value |
| Setpoint change from the app updates behavior live | ✅ Verified via direct RPC (`Number.Set`) — app UI itself shows a "Failed to apply setting" error, but the underlying value and script behavior are correct (see `docs/09-troubleshooting.md`) |
| Off mode (both toggles off) forces demand off | ✅ Verified before the cooling change, when Off was a single `Thermostat Enabled` toggle |
| Setpoint is preserved (not reset) when leaving Off | ✅ By design, not implemented as an automatic reset |
| Cooling mode: temperature above setpoint + deadband → demand ON | ⬜ Not yet tested |
| Cooling mode: temperature below setpoint - deadband → demand OFF | ⬜ Not yet tested |
| HEATING and COOLING toggles are mutually exclusive in the app | ⬜ Not yet tested |
| `boolean:203` exists and is seeded correctly on script start | ⬜ Not yet tested |
| Mode survives a gateway reboot (seeded from component status) | ⬜ Not yet tested |

## Automatic humidity control

| Test | Result |
|---|---|
| Humidity ≥ 60% turns plug on | ✅ Verified via console injection (`evaluateHumidity(70)`) and confirmed physically (relay click) |
| Humidity ≤ 55% turns plug off | ✅ Verified via console injection (`evaluateHumidity(20)`) |
| Humidity between thresholds keeps current state | ✅ |
| Anti-short-cycle protection blocks rapid re-switching | ✅ Verified: immediate re-trigger after a switch correctly logged "Skipping switch, too soon since last change." |
| Script state resyncs with physical plug state after restart | ✅ Bug found and fixed — see `docs/09-troubleshooting.md` ("Script state desyncs from physical device after restart") |
| Real-world end-to-end: pressed H&T button to force a real reading, plug switched automatically without manual injection | ✅ |

## Gateway script limits

| Test | Result |
|---|---|
| 4th concurrent script fails to start | ✅ Confirmed RPC error `-108` ("Reached the maximum 3 of running scripts") — led to consolidating climate/humidity/thermostat logic into one script (`adr/0004-*`) |

## Monitoring application

| Test | Result |
|---|---|
| All 5 MQTT topics decode correctly on connect (retained messages) | ✅ |
| UI reflects live state (presence, window, climate, humidity control, thermostat) | ✅ |
| App correctly displays retained state even if started after the gateway | ✅ |
| A changed payload shape does not kill the MQTT loop | ✅ Bug found and fixed — the `mode` field broke `decode()` and the unguarded exception killed the network thread, freezing every update (see `docs/09-troubleshooting.md`) |
| Malformed / non-JSON payloads are dropped without stopping the stream | ✅ Verified by injecting a truncated payload and non-JSON bytes |
| Legacy `enabled` payload still decodes (stale retained message) | ✅ Decoded as heating/off by `_thermostat_mode()` |
| Connection indicator reflects real broker state | ✅ Driven by the paho connect/disconnect callbacks, no longer a fixed timer |
| Thermostat card labels cooling demand as cooling, not heating | ✅ Verified for all three modes |
| Live end-to-end run against the gateway after the cooling change | ⬜ Not yet tested |

## IFTTT notification scenario

| Test | Result |
|---|---|
| Away transition with a window open sends the notification | ⬜ Not yet recorded |
| Away transition with all windows closed sends nothing | ⬜ Not yet recorded |
| Home transition never notifies, regardless of window state | ⬜ Not yet recorded |
| Tilted window also notifies, and arrives as `value1: "tilted"` | ⬜ Not yet recorded |
| Away transition with `window_state` never set skips silently | ⬜ Not yet recorded |
| Behaviour when the gateway has no internet access | ⬜ Not yet recorded — the request is expected to fail and be logged, with no retry |

See `docs/11-notifications-and-scenarios.md`. The condition is testable
on the gateway (the script console prints which branch was taken), but
delivery ends in an IFTTT account, so the results above have to be
recorded by hand.

## Known gaps / not tested

- No automated test suite (unit tests) — all testing was manual,
  performed interactively during development via the gateway's script
  console and `mosquitto_sub`/`mosquitto_pub`.
- No load/stress testing (e.g. rapid MQTT message bursts).
- No test of full system behavior after a router restart / device IP
  change (see `docs/10-future-improvements.md`).