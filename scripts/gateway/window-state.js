// Window 3-state detection: closed / open / tilted
// Combines two BTHome sensor components from the same physical
// BLU Door/Window ZB device (see docs/01-devices.md):
//   bthomesensor:202 = contact state (true = open, false = closed)
//   bthomesensor:203 = tilt angle in degrees (0 = not tilted)
//
// Contact and rotation status changes arrive asynchronously (rotation
// typically ~2s after contact, while the device's accelerometer
// settles — see manufacturer docs), so both last-known values are
// tracked and the state is re-evaluated on every status change from
// either sensor, rather than deciding on a single event alone.
//
// IMPORTANT: this script must be configured with config.enable = true
// (Script.SetConfig) to auto-start after a gateway reboot.

let CONFIG = {
  contactComponent: "bthomesensor:202",
  rotationComponent: "bthomesensor:203",
  kvsKey: "window_state",
  mqttTopic: "home/window"
};

let lastContact = null;
let lastRotation = 0;
let currentState = null;

function classify() {
  if (lastContact === false) {
    return "closed";
  }
  if (lastContact === true) {
    return (lastRotation !== 0) ? "tilted" : "open";
  }
  return "unknown";
}

function publishState(state) {
  let payload = JSON.stringify({
    state: state,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.mqttTopic, payload, 0, true);
  Shelly.call("KVS.Set", { key: CONFIG.kvsKey, value: state });
  print("Window state published:", payload);
}

function evaluate() {
  let newState = classify();
  if (newState !== currentState && newState !== "unknown") {
    currentState = newState;
    publishState(newState);
  }
}

Shelly.addStatusHandler(function (status) {
  if (status.component === CONFIG.contactComponent) {
    lastContact = status.delta.value;
    evaluate();
  } else if (status.component === CONFIG.rotationComponent) {
    lastRotation = status.delta.value;
    evaluate();
  }
});

print("Window state machine ready.");