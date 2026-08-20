// Presence detection via BLU Button single press.
// Toggles a persistent "home / away" state, stored in KVS so it
// survives a gateway reboot, and publishes it to MQTT with retain=true
// so any new subscriber immediately knows the current state.
//
// Component id "bthomedevice:200" corresponds to the paired BLU Button
// (see docs/01-devices.md).
//
// On transition to "away", checks the current window state (written
// to KVS by window-state.js) and triggers an IFTTT webhook if the
// window is not closed, resulting in a push notification.
//
// IMPORTANT: this script must be configured with config.enable = true
// (Script.SetConfig) to auto-start after a gateway reboot — the "Start"
// button in the web UI alone only starts it for the current session.

let CONFIG = {
  buttonComponent: "bthomedevice:200",
  kvsKey: "presence_state",
  mqttTopic: "home/presence",
  presenceComponentId: 200, // boolean:200 — Home/Away
  notifyUrl: "YOUR_IFTTT_KEY_HERE"
};

function publishPresence(isHome) {
  let payload = JSON.stringify({
    present: isHome,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.mqttTopic, payload, 0, true);
  print("Presence published:", payload);

  Shelly.call("Boolean.Set", { id: CONFIG.presenceComponentId, value: isHome }, function (result, error_code, error_message) {
    if (error_code !== 0) {
      print("Boolean.Set failed:", error_message);
    }
  });
}

function checkWindowAndNotify() {
  Shelly.call("KVS.Get", { key: "window_state" }, function (result, error_code) {
    if (error_code === 0 && result && result.value !== "closed") {
      Shelly.call("HTTP.Request", {
        method: "POST",
        url: CONFIG.notifyUrl,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value1: result.value })
      }, function (res, err) {
        if (err !== 0) {
          print("IFTTT trigger failed, error:", err);
        } else {
          print("IFTTT triggered, window state:", result.value);
        }
      });
    } else {
      print("Window is closed, no notification needed.");
    }
  });
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

    if (newState === false) {
      checkWindowAndNotify();
    }
  });
}

Shelly.addEventHandler(function (e) {
  if (e.component === CONFIG.buttonComponent && e.info.event === "single_push") {
    togglePresence();
  }
});

print("Presence script ready.");