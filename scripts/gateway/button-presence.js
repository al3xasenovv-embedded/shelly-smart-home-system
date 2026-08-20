// Presence detection via BLU Button single press.
// Toggles a persistent "home / away" state, stored in KVS so it
// survives a gateway reboot, and publishes it to MQTT with retain=true
// so any new subscriber immediately knows the current state.
//
// Component id "bthomedevice:200" corresponds to the paired BLU Button
// (see docs/01-devices.md).
//
// IMPORTANT: this script must be configured with config.enable = true
// (Script.SetConfig) to auto-start after a gateway reboot — the "Start"
// button in the web UI alone only starts it for the current session.

let CONFIG = {
  buttonComponent: "bthomedevice:200",
  kvsKey: "presence_state",
  mqttTopic: "home/presence"
};

function publishPresence(isHome) {
  let payload = JSON.stringify({
    present: isHome,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.mqttTopic, payload, 0, true);
  print("Presence published:", payload);
}

function togglePresence() {
  Shelly.call("KVS.Get", { key: CONFIG.kvsKey }, function (result, error_code) {
    let isHome = false;
    if (error_code === 0 && result && result.value === "true") {
      isHome = true;
    }
    let newState = !isHome;
    Shelly.call("KVS.Set", {
      key: CONFIG.kvsKey,
      value: newState ? "true" : "false"
    });
    publishPresence(newState);
  });
}

Shelly.addEventHandler(function (e) {
  if (e.component === CONFIG.buttonComponent && e.info.event === "single_push") {
    togglePresence();
  }
});

print("Presence script ready.");