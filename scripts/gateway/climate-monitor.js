// Climate monitoring + automatic humidity control (combined).
//
// Reads temperature, humidity, battery from BLU H&T ZB and publishes
// to home/climate. Also runs hysteresis-based humidity control,
// switching the Shelly Plug S on/off via HTTP RPC.
//
// Combined into a single script due to the gateway's limit of 3
// concurrently running scripts (see docs/09-troubleshooting.md).

let CONFIG = {
  temperatureComponent: "bthomesensor:207",
  humidityComponent: "bthomesensor:206",
  batteryComponent: "bthomesensor:205",
  climateKvsKey: "climate_reading",
  climateMqttTopic: "home/climate",

  plugIp: "192.168.100.35",
  humidityOnThreshold: 60,
  humidityOffThreshold: 55,
  minSwitchIntervalSec: 180,
  staleDataTimeoutSec: 600,
  controlKvsKey: "humidity_control_state",
  controlMqttTopic: "home/humidity-control"
};

// --- Climate monitoring ---

let lastTemperature = null;
let lastHumidity = null;
let lastBattery = null;

function publishClimate() {
  let payload = JSON.stringify({
    temperature: lastTemperature,
    humidity: lastHumidity,
    battery: lastBattery,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.climateMqttTopic, payload, 0, true);
  Shelly.call("KVS.Set", { key: CONFIG.climateKvsKey, value: payload });
  print("Climate reading published:", payload);
}

function seedInitialValues() {
  Shelly.call("BTHomeSensor.GetStatus", { id: 207 }, function (result, error_code) {
    if (error_code === 0 && result) { lastTemperature = result.value; }
  });
  Shelly.call("BTHomeSensor.GetStatus", { id: 206 }, function (result, error_code) {
    if (error_code === 0 && result) {
      lastHumidity = result.value;
      evaluateHumidity(lastHumidity);
    }
  });
  Shelly.call("BTHomeSensor.GetStatus", { id: 205 }, function (result, error_code) {
    if (error_code === 0 && result) { lastBattery = result.value; }
    publishClimate();
  });
}

// --- Humidity control ---

let plugIsOn = false;
let lastSwitchTs = 0;
let lastReadingTs = 0;

function seedPlugState() {
  Shelly.call("HTTP.GET", {
    url: "http://" + CONFIG.plugIp + "/rpc/Switch.GetStatus?id=0"
  }, function (res, error_code) {
    if (error_code === 0 && res && res.body) {
      let data = JSON.parse(res.body);
      plugIsOn = data.output;
      print("Seeded plug state from device:", plugIsOn);
    } else {
      print("Failed to seed plug state, error:", error_code);
    }
  });
}

function setPlug(on) {
  let now = Math.floor(Date.now() / 1000);
  if (now - lastSwitchTs < CONFIG.minSwitchIntervalSec) {
    print("Skipping switch, too soon since last change.");
    return;
  }
  Shelly.call("HTTP.GET", {
    url: "http://" + CONFIG.plugIp + "/rpc/Switch.Set?id=0&on=" + (on ? "true" : "false")
  }, function (res, error_code) {
    if (error_code === 0) {
      plugIsOn = on;
      lastSwitchTs = now;
      Shelly.call("KVS.Set", { key: CONFIG.controlKvsKey, value: on ? "on" : "off" });
      publishControlStatus();
      print("Plug switched:", on);
    } else {
      print("Failed to switch plug, error:", error_code);
    }
  });
}

function publishControlStatus() {
  let payload = JSON.stringify({ plug_on: plugIsOn, ts: Math.floor(Date.now() / 1000) });
  MQTT.publish(CONFIG.controlMqttTopic, payload, 0, true);
}

function evaluateHumidity(humidity) {
  lastReadingTs = Math.floor(Date.now() / 1000);
  if (!plugIsOn && humidity >= CONFIG.humidityOnThreshold) {
    setPlug(true);
  } else if (plugIsOn && humidity <= CONFIG.humidityOffThreshold) {
    setPlug(false);
  }
}

Timer.set(60000, true, function () {
  let now = Math.floor(Date.now() / 1000);
  if (plugIsOn && (now - lastReadingTs > CONFIG.staleDataTimeoutSec)) {
    print("Climate data stale, forcing plug off (fail-safe).");
    setPlug(false);
  }
});

// --- Единен status handler за всичко ---

Shelly.addStatusHandler(function (status) {
  if (status.component === CONFIG.temperatureComponent) {
    lastTemperature = status.delta.value;
    publishClimate();
  } else if (status.component === CONFIG.humidityComponent) {
    lastHumidity = status.delta.value;
    publishClimate();
    evaluateHumidity(lastHumidity);
  } else if (status.component === CONFIG.batteryComponent) {
    lastBattery = status.delta.value;
    publishClimate();
  }
});

seedPlugState();
seedInitialValues();
print("Climate + humidity control script ready.");