// Temperature & humidity monitoring via BLU H&T ZB
// bthomesensor:205 = battery (%)
// bthomesensor:206 = humidity (%)
// bthomesensor:207 = temperature (°C)
//
// Values are seeded from current device status on script start (not
// just on the next change), since a sensor value that hasn't changed
// since the last report will never trigger a status handler call —
// e.g. temperature can stay constant while humidity fluctuates.

let CONFIG = {
  temperatureComponent: "bthomesensor:207",
  humidityComponent: "bthomesensor:206",
  batteryComponent: "bthomesensor:205",
  kvsKey: "climate_reading",
  mqttTopic: "home/climate"
};

let lastTemperature = null;
let lastHumidity = null;
let lastBattery = null;

function publishReading() {
  let payload = JSON.stringify({
    temperature: lastTemperature,
    humidity: lastHumidity,
    battery: lastBattery,
    ts: Math.floor(Date.now() / 1000)
  });
  MQTT.publish(CONFIG.mqttTopic, payload, 0, true);
  Shelly.call("KVS.Set", { key: CONFIG.kvsKey, value: payload });
  print("Climate reading published:", payload);
}

function seedInitialValues() {
  Shelly.call("BTHomeSensor.GetStatus", { id: 207 }, function (result, error_code) {
    if (error_code === 0 && result) { lastTemperature = result.value; }
  });
  Shelly.call("BTHomeSensor.GetStatus", { id: 206 }, function (result, error_code) {
    if (error_code === 0 && result) { lastHumidity = result.value; }
  });
  Shelly.call("BTHomeSensor.GetStatus", { id: 205 }, function (result, error_code) {
    if (error_code === 0 && result) { lastBattery = result.value; }
    publishReading();
  });
}

Shelly.addStatusHandler(function (status) {
  let changed = false;
  if (status.component === CONFIG.temperatureComponent) {
    lastTemperature = status.delta.value; changed = true;
  } else if (status.component === CONFIG.humidityComponent) {
    lastHumidity = status.delta.value; changed = true;
  } else if (status.component === CONFIG.batteryComponent) {
    lastBattery = status.delta.value; changed = true;
  }
  if (changed) { publishReading(); }
});

seedInitialValues();
print("Climate monitoring script ready.");