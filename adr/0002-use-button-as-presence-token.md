# ADR-0002: Use BLU Button as an explicit presence token

## Status
Accepted

## Context
Task requirement #4 asks for a presence detection system using the
Bluetooth button. A passive alternative was considered: tracking BLE
advertisement "last seen" timestamps from the button and inferring
absence after a timeout of missed heartbeats.

## Decision
Presence is tracked exclusively through explicit button presses.
A single press toggles the system's "home / away" state. No passive
proximity/timeout-based inference is implemented in v1.

## Rationale
- The task explicitly requires the button to be used for presence
  detection — an explicit press is a direct, unambiguous fulfillment
  of that requirement.
- Deterministic behavior: the system's state always reflects a
  conscious user action, not an inferred approximation.
- Passive proximity tracking only reflects the button's location, not
  the person's — it produces false positives if the button is left at
  home, and false negatives during temporary BLE signal loss.

## Consequences
- The user must remember to press the button when leaving/arriving.
- If the button's battery dies or it goes out of range while pressed
  in a stale state, the system will not self-correct until the next
  press.
- A passive "last seen" fallback remains a documented possible
  improvement (see docs/10-future-improvements.md) but is out of scope
  for v1.