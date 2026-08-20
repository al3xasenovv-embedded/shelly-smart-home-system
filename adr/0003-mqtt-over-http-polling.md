# ADR-0003: MQTT chosen over HTTP polling

## Status
Accepted

## Context
Task requirement #10 allows either MQTT or HTTP for device
communication. Both were available on the gateway and Plug S.

## Decision
MQTT was chosen as the sole communication mechanism between gateway
scripts, the Shelly Plug S, and the monitoring application.

## Rationale
- Event-driven: state changes (a button press, a window opening) are
  pushed immediately, rather than waiting for the next polling
  interval.
- `retain=true` messages give any new subscriber the current state
  immediately on connect, without an extra query.
- Lower network chatter than polling every device on a fixed interval.
- A local broker already had to be set up for the gateway's own RPC
  channel, so no additional infrastructure was needed.

## Consequences
- Requires running and maintaining a local MQTT broker (Mosquitto),
  see `docs/02-network-setup.md` and `docs/09-troubleshooting.md` for
  setup issues encountered.
- The monitoring app must handle a persistent connection and
  reconnect logic, rather than simple request/response calls.