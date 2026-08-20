"""Entrypoint: connects to MQTT, decodes messages, and displays live
current values in a simple Tkinter window.
"""

import logging
import sys
import threading

import config
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

    try:
        config.validate()
    except config.ConfigError as exc:
        print(f"Configuration error: {exc}", file=sys.stderr)
        return 1

    # The window must exist before the MQTT thread starts, otherwise the
    # first (retained) messages arrive while `window` is still None and
    # get silently dropped.
    window = MonitorWindow()

    client = MqttClient(
        host=config.MQTT_HOST,
        port=config.MQTT_PORT,
        username=config.MQTT_USER,
        password=config.MQTT_PASSWORD,
        on_message=handle_message,
    )
    client.connect()

    mqtt_thread = threading.Thread(target=client.loop_forever, daemon=True)
    mqtt_thread.start()
    window.root.after(800, lambda: window.set_connected(True))

    window.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
