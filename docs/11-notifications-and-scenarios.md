# Notifications and Scenarios

Scenarios combine state from more than one device into something the
system does for the user. Unlike the control logic elsewhere in
`scripts/gateway/`, the output is not a device state — it is a message
to a person.

## Scenario: leaving home with a window open

**Trigger:** presence transitions to Away.
**Condition:** the window is not closed.
**Action:** a push notification on the phone.

The point is the transition, not the state. A window standing open
while somebody is home is normal and must stay silent; the same window
open as the last person leaves is worth a notification, because nobody
is left to notice it.

## How it works

The decision is made on the gateway. IFTTT only delivers the message.

```
BLU Button ──BLE──> button-presence.js
                          │
                          │  toggled to Away?
                          │
                          ├── no ──> nothing further
                          │
                          └── yes ──> read window_state from KVS
                                            │
                                    ┌───────┴────────┐
                                 closed          open / tilted
                                    │                │
                                 silent      POST to IFTTT Webhooks
                                                     │
                                            IFTTT applet fires
                                                     │
                                            push notification
```

`window-state.js` persists its three-state classification under the
KVS key `window_state`. `button-presence.js` reads that key at the
moment of the Away transition, in `checkWindowAndNotify()`. KVS is the
channel between them: gateway scripts run isolated from each other and
cannot share variables, but they can share the key-value store.

The IFTTT applet is the simplest possible one — *if a webhook request
is received, send a notification*. It holds no logic and knows nothing
about windows or presence.

### The request

```
POST https://maker.ifttt.com/trigger/Left_home/with/key/<webhooks key>
Content-Type: application/json

{"value1": "open"}
```

`value1` carries the current window state, so the notification text can
say whether the window was fully open or only tilted.

### Why the condition lives on the hub

Putting the AND on the gateway keeps this consistent with
`adr/0001-hub-centric-business-logic.md`, and avoids three problems
that the cloud-side alternative has:

- An IFTTT applet has exactly one trigger, so expressing "Away **and**
  window open" there would need filter code — a paid IFTTT feature.
- Shelly Cloud would have to be enabled and the devices exposed to it.
  The webhook needs only outbound HTTPS from the gateway.
- Cloud would only ever see the raw contact sensor. The hub has the
  derived three-state classification, so it can tell tilted from open.

### A tilted window counts as open

The script notifies whenever `window_state` is anything other than
`closed`. Leaving the house with a window in ventilation position is
the same problem as leaving it wide open, so the distinction is not
worth acting on — but the state is passed along in `value1`, so the
notification can still say which it was.

## Configuration

The IFTTT event name is `Left_home`. The applet must be listening for
that exact name.

### The webhook URL is not in this repository

The Webhooks URL contains the account's Webhooks key, which is a
credential. The version committed here carries a placeholder instead:

```js
notifyUrl: "YOUR_IFTTT_KEY_HERE"
```

The real value exists only on the gateway. Despite the placeholder's
name, the field holds the **entire URL**, not just the key — the script
passes it straight to `HTTP.Request` as `url`. Replace it with:

```
https://maker.ifttt.com/trigger/Left_home/with/key/<your webhooks key>
```

Your key is under **Webhooks → Documentation** in IFTTT.

> **Re-uploading this script to the gateway overwrites the working
> URL with the placeholder**, and the notification then fails silently
> on every Away transition — the script log shows the failed request,
> nothing else does. Paste the URL back in the gateway's script editor
> after any upload. Keeping the value in KVS instead would remove this
> footgun; see `docs/10-future-improvements.md`.

### The IFTTT applet

Record the applet here so the scenario stays reproducible — the
configuration lives in an IFTTT account and cannot be recovered from
this repository:

```
Applet name:
Trigger:       Webhooks — "Receive a web request", event Left_home
Action:        Notifications — send a notification from the IFTTT app
Message:
```

## Limitations

**Delivery depends on the internet.** The gateway's control logic keeps
working during an outage; the notification does not. The webhook is
fire-and-forget — a failed request is logged in the script console on
the gateway and nothing else happens.

**No delivery confirmation.** A successful response means IFTTT
accepted the request, not that a notification reached the phone.

**The window state can be unknown.** `window_state` only exists in KVS
once `window-state.js` has classified the window at least once. On a
gateway that has never seen a window event, the KVS read fails and the
Away transition stays silent rather than guessing.

**One window.** The scenario is written for the single Door/Window
sensor in this deployment. More sensors would need a different KVS
layout and a rule for what "a window is open" means across several.

**No notification on the way in.** Only the transition to Away fires
the webhook. Arriving home to an open window is not reported, by
design — somebody is there to see it.
