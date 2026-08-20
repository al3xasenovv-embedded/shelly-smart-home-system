# ADR-0007: Notification delivery via IFTTT webhook, decision on the hub

## Status
Accepted.

## Context
The "leaving home with a window open" scenario needs to reach a phone
that is, by definition, no longer on the local network. ADR-0001 keeps
the system's business logic on the gateway, but no amount of local
logic can deliver a push notification — that requires a service
outside the LAN.

The scenario also spans two devices: the presence state owned by
`button-presence.js`, and the window classification owned by
`window-state.js`. Gateway scripts run isolated and cannot share
variables.

Three implementations were possible:

1. Shelly Cloud exposes the devices to IFTTT; an IFTTT applet triggers
   on the Away transition and filter code checks the window.
2. The gateway evaluates the condition and calls an IFTTT webhook;
   the applet only sends the notification.
3. A self-hosted push bridge on the LAN.

## Decision
Option 2. On the Away transition, `button-presence.js` reads the
window classification from KVS and issues an HTTP POST to the IFTTT
Webhooks endpoint (event `Left_home`) only when the window is not
closed. The current window state travels in the request body as
`value1`. The IFTTT applet contains no logic: it receives the webhook
and sends a notification.

The two scripts communicate through KVS. `window-state.js` already
persists its classification under `window_state`; `button-presence.js`
reads that key at the moment of the transition.

## Rationale
- The decision stays where every other decision in this system is
  made. Only delivery is outsourced, which is the one part that
  genuinely cannot be local.
- The hub holds the derived three-state window classification. A
  cloud-side filter would only ever see the raw contact sensor and
  could not distinguish tilted from open.
- IFTTT filter code, needed to express the AND condition in option 1,
  is a paid feature.
- Option 1 requires Shelly Cloud enabled and the devices exposed to
  it. The webhook needs only outbound HTTPS.
- Option 3 was rejected as disproportionate: running and maintaining a
  push service to save one outbound HTTPS call is not a good trade at
  this scale.

## Consequences
- The notification depends on internet access and on IFTTT. All local
  control logic keeps working when either is down; the notification is
  simply lost, and the failure is only visible in the gateway's script
  log.
- The webhook is fire-and-forget. A successful response means IFTTT
  accepted the request, not that the phone received anything.
- The IFTTT Webhooks URL contains a credential, so the committed script
  carries a placeholder and the real URL exists only on the gateway.
  The consequence is that the file in this repository is not
  deployable as-is: uploading it overwrites the working URL and
  silently disables the notification until the value is pasted back.
  Reading the URL from gateway KVS would keep the secret out of the
  repository *and* keep the file deployable — see
  `docs/10-future-improvements.md`.
- The applet itself is not under version control. The repository can
  describe it but cannot reproduce it.
- KVS becomes a load-bearing interface between two scripts, not just a
  persistence mechanism. Renaming the `window_state` key would now
  silently break the notification rather than just losing state across
  a reboot.
- If more scenarios of this kind appear, each one adds another outbound
  call and another applet. At that point a single notification-dispatch
  script, or a local push bridge, becomes worth reconsidering.
