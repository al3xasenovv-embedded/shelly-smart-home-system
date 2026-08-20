# ADR-0001: Business logic runs on the gateway, not in the cloud or the app

## Status
Accepted

## Context
Shelly devices support multiple places where automation logic could
live: Shelly Cloud scenes, the monitoring application, or scripts
running directly on the BLU Gateway Gen3 itself. Task requirement #6
explicitly asks for logic to be "implemented and stored on the hub."

## Decision
All business logic (presence toggling, window state classification,
thermostat hysteresis, humidity control) runs as mJS scripts directly
on the BLU Gateway Gen3. The monitoring application is a read-only
MQTT consumer with no control logic of its own.

## Consequences
- The system keeps working (sensors, actuators, automation) even if
  the monitoring app or the local network's internet connection is
  down — only the local MQTT broker and gateway are required.
- Logic is constrained by the gateway's script limits (RAM, max 3
  concurrent scripts — see ADR-0004), which forced consolidation of
  several features into one script.
- Debugging happens via the gateway's script console and MQTT traffic,
  not via a familiar desktop debugger.