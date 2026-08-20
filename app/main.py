"""Minimal test entrypoint: connects to MQTT, prints decoded messages.
Storage and UI will be added in later steps.
"""

import logging

from core.mqtt_client import MqttClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

MQTT_HOST = "192.168.100.5"  # смени с реалния IP на брокера
MQTT_PORT = 1883
MQTT_USER = "shellyhub"
MQTT_PASSWORD = "1811"


def handle_message(topic: str, model: object):
    print(f"[{topic}] {model}")


def main():
    client = MqttClient(
        host=MQTT_HOST,
        port=MQTT_PORT,
        username=MQTT_USER,
        password=MQTT_PASSWORD,
        on_message=handle_message,
    )
    client.connect()
    client.loop_forever()


if __name__ == "__main__":
    main()