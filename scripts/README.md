# Gateway Scripts

Scripts running directly on the BLU Gateway Gen3, implementing part of
the system's business logic locally on the hub (task requirement #6).

## button-presence.js

Listens for `single_push` events from the BLU Button
(component: `bthomedevice:200`, see `docs/01-devices.md`) and publishes
a message to MQTT on every press.

**Status:** initial debug version. Confirms that BLE events from the
button are correctly received by the gateway and can be forwarded to
MQTT. Does not yet implement persistent presence state — see
`docs/05-manual-presence-with-button.md` for the planned toggle logic
using the KVS component.