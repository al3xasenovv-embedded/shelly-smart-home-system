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
| Setpoint change from the app updates behavior live | ✅ |
| Off mode (both toggles off) forces demand off | ✅ Verified before the cooling change, when Off was a single `Thermostat Enabled` toggle |
| Setpoint is preserved (not reset) when leaving Off | ✅ By design, not implemented as an automatic reset |
| Cooling mode: temperature above setpoint + deadband → demand ON | ✅ |
| Cooling mode: temperature below setpoint - deadband → demand OFF | ✅ |
| HEATING and COOLING toggles are mutually exclusive in the app | ✅ Verified in the Shelly app — switching one on visibly switches the other off |
| `boolean:203` exists and is seeded correctly on script start | ✅ |
| Mode survives a gateway reboot (seeded from component status) | ✅ |

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
| Live end-to-end run against the gateway after the cooling change | ✅ |

## IFTTT notification scenario

| Test | Result |
|---|---|
| Away transition with a window open sends the notification | ✅ Notification received on the phone |
| Away transition with all windows closed sends nothing | ✅ |
| Home transition never notifies, regardless of window state | ✅ |

See `docs/11-notifications-and-scenarios.md`. A tilted window is
treated the same as a fully open one, so leaving with the window in
ventilation position notifies as well.

## Known gaps / not tested

- No automated test suite (unit tests) — all testing was manual,
  performed interactively during development via the gateway's script
  console and `mosquitto_sub`/`mosquitto_pub`.
- No load/stress testing (e.g. rapid MQTT message bursts).
- No test of full system behavior after a router restart / device IP
  change (see `docs/10-future-improvements.md`).