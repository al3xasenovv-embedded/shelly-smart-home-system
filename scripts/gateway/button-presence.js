// Initial debug script.
// Confirms that single_push events from the BLU Button are received by
// the gateway's event handler and can be forwarded to MQTT.
//
// Component id "bthomedevice:200" corresponds to the paired BLU Button
// (see docs/01-devices.md). This id was discovered by first logging
// the raw event payload for all BLE events on the gateway.
//
// Next step: replace the raw publish below with persistent home/away
// state tracking using the KVS component (see docs/05-*).

Shelly.addEventHandler(function (e) {
  if (e.component === "bthomedevice:200") {
    if (e.info.event === "single_push") {
      print("Button was pushed");
      MQTT.publish("hello/world", JSON.stringify("hello world!"), 0, false);
    }
  }
});