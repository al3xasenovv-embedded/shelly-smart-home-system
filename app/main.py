"""Entrypoint: connects to MQTT, decodes messages, and displays live
current values in a simple Tkinter window.
"""

import logging
import threading

from core.mqtt_client import MqttClient
from core.models import (
    PresenceState,
    WindowState,
    ClimateReading,
    HumidityControlState,
    ThermostatState,
)
from ui import MonitorWindow

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

MQTT_HOST = "192.168.100.5"
MQTT_PORT = 1883
MQTT_USER = "shellyhub"
MQTT_PASSWORD = "1811"

window: MonitorWindow = None


def handle_message(topic: str, model: object):
    print(f"[{topic}] {model}")
    if window is None:
        return
    if isinstance(model, PresenceState):
        window.root.after(0, window.update_presence, model.present)
    elif isinstance(model, WindowState):
        window.root.after(0, window.update_window, model.state)
    elif isinstance(model, ClimateReading):
        window.root.after(0, window.update_climate, model.temperature, model.humidity)
    elif isinstance(model, HumidityControlState):
        window.root.after(0, window.update_plug, model.plug_on)
    elif isinstance(model, ThermostatState):
        window.root.after(
            0, window.update_thermostat, model.enabled, model.setpoint, model.heating_demand
        )


def main():
    global window

    window = MonitorWindow()  # първо прозорецът

    client = MqttClient(
        host=MQTT_HOST,
        port=MQTT_PORT,
        username=MQTT_USER,
        password=MQTT_PASSWORD,
        on_message=handle_message,
    )
    client.connect()

    mqtt_thread = threading.Thread(target=client.loop_forever, daemon=True)
    mqtt_thread.start()  # чак сега пускаме MQTT-то

    window.run()


if __name__ == "__main__":
    main()