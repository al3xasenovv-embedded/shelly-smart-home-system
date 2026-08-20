// Climate monitoring + automatic humidity control + thermostat
// (combined into a single script due to the gateway's 3-script limit,
// see docs/09-troubleshooting.md and adr/0004-*).

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
  controlMqttTopic: "home/humidity-control",

  setpointComponentId: 200,      // number:200 — Thermostat Setpoint
  heatingDemandComponentId: 201, // boolean:201 — Heating Demand
  enabledComponentId: 202,       // boolean:202 — Thermostat Enabled
  thermostatDeadband: 0.5,       // °C, hysteresis band
  thermostatMqttTopic: "home/thermostat"
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

// --- Humidity control ---

let plugIsOn = false;
let lastSwitchTs = 0;
let lastReadingTs = 0;

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

// --- Thermostat (logical signal, no physical actuator — see ADR-0005) ---

let currentSetpoint = 21;
let heatingDemand = false;
let thermostatEnabled = true;

function publishThermostat() {
  let payload = JSON.stringify({
    enabled: thermostatEnabled,
    setpoint: currentSetpoint,
    heating_demand: heatingDemand,
    current_temp: lastTemperature,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.thermostatMqttTopic, payload, 0, true);
  print("Thermostat published:", payload);
}

function setHeatingDemand(state) {
  if (state === heatingDemand) return;
  heatingDemand = state;
  Shelly.call("Boolean.Set", { id: CONFIG.heatingDemandComponentId, value: state });
  publishThermostat();
}

function evaluateThermostat() {
  if (!thermostatEnabled) {
    setHeatingDemand(false);
    return;
  }
  if (lastTemperature === null) return;
  let low = currentSetpoint - CONFIG.thermostatDeadband;
  let high = currentSetpoint + CONFIG.thermostatDeadband;
  if (lastTemperature < low) {
    setHeatingDemand(true);
  } else if (lastTemperature > high) {
    setHeatingDemand(false);
  }
  // temperature is within the deadband: keep the current state (hysteresis)
}

// Listen for setpoint and enabled/mode changes made from the app
Shelly.addStatusHandler(function (status) {
  if (status.component === "number:" + CONFIG.setpointComponentId) {
    currentSetpoint = status.delta.value;
    print("Setpoint changed to:", currentSetpoint);
    evaluateThermostat();
  } else if (status.component === "boolean:" + CONFIG.enabledComponentId) {
    thermostatEnabled = status.delta.value;
    print("Thermostat enabled changed to:", thermostatEnabled);
    evaluateThermostat();
  }
});

// --- Sensor status handler ---

Shelly.addStatusHandler(function (status) {
  if (status.component === CONFIG.temperatureComponent) {
    lastTemperature = status.delta.value;
    publishClimate();
    evaluateThermostat();
  } else if (status.component === CONFIG.humidityComponent) {
    lastHumidity = status.delta.value;
    publishClimate();
    evaluateHumidity(lastHumidity);
  } else if (status.component === CONFIG.batteryComponent) {
    lastBattery = status.delta.value;
    publishClimate();
  }
});

// --- Startup: seed all initial state sequentially (chained), to avoid
// "Too many calls in progress" errors from firing several async
// Shelly.call requests in parallel on startup. ---

function seedClimateValues() {
  Shelly.call("BTHomeSensor.GetStatus", { id: 207 }, function (result, error_code) {
    if (error_code === 0 && result) {
      lastTemperature = result.value;
      evaluateThermostat();
    }
    Shelly.call("BTHomeSensor.GetStatus", { id: 206 }, function (result, error_code) {
      if (error_code === 0 && result) {
        lastHumidity = result.value;
        evaluateHumidity(lastHumidity);
      }
      Shelly.call("BTHomeSensor.GetStatus", { id: 205 }, function (result, error_code) {
        if (error_code === 0 && result) { lastBattery = result.value; }
        publishClimate();
        print("Climate + humidity control + thermostat script ready.");
      });
    });
  });
}

function seedAll() {
  Shelly.call("HTTP.GET", {
    url: "http://" + CONFIG.plugIp + "/rpc/Switch.GetStatus?id=0"
  }, function (res, error_code) {
    if (error_code === 0 && res && res.body) {
      let data = JSON.parse(res.body);
      plugIsOn = data.output;
      print("Seeded plug state:", plugIsOn);
    } else {
      print("Failed to seed plug state, error:", error_code);
    }

    Shelly.call("Number.GetStatus", { id: CONFIG.setpointComponentId }, function (result, error_code) {
      if (error_code === 0 && result) {
        currentSetpoint = result.value;
        print("Seeded setpoint:", currentSetpoint);
      }

      Shelly.call("Boolean.GetStatus", { id: CONFIG.heatingDemandComponentId }, function (result, error_code) {
        if (error_code === 0 && result) {
          heatingDemand = result.value;
          print("Seeded heating demand:", heatingDemand);
        }

        Shelly.call("Boolean.GetStatus", { id: CONFIG.enabledComponentId }, function (result, error_code) {
          if (error_code === 0 && result) {
            thermostatEnabled = result.value;
            print("Seeded thermostat enabled:", thermostatEnabled);
          }
          seedClimateValues();
        });
      });
    });
  });
}

seedAll();