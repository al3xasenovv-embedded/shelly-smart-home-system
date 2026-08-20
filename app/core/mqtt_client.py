"""MQTT client wrapper: connects to the local broker, subscribes to
all relevant topics, and forwards decoded messages to a callback.
"""

import logging
from typing import Callable, Optional

import paho.mqtt.client as mqtt

from core.decoder import decode, ALL_TOPICS

logger = logging.getLogger(__name__)


class MqttClient:
    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: str,
        on_message: Callable[[str, object], None],
        on_connection_change: Optional[Callable[[bool], None]] = None,
    ):
        self._on_message_callback = on_message
        self._on_connection_change = on_connection_change
        self._client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self._client.username_pw_set(username, password)
        self._client.on_connect = self._handle_connect
        self._client.on_message = self._handle_message
        self._client.on_disconnect = self._handle_disconnect

        self._host = host
        self._port = port

    def connect(self):
        logger.info("Connecting to MQTT broker at %s:%s", self._host, self._port)
        self._client.connect(self._host, self._port, keepalive=60)

    def loop_forever(self):
        self._client.loop_forever()

    def _handle_connect(self, client, userdata, flags, reason_code, properties):
        if reason_code == 0:
            logger.info("Connected to broker.")
            for topic in ALL_TOPICS:
                client.subscribe(topic)
                logger.info("Subscribed to %s", topic)
            self._notify_connection(True)
        else:
            logger.error("Connection failed: %s", reason_code)
            self._notify_connection(False)

    def _handle_disconnect(self, client, userdata, flags, reason_code, properties):
        logger.warning("Disconnected from broker: %s", reason_code)
        self._notify_connection(False)

    def _notify_connection(self, connected: bool):
        if self._on_connection_change is None:
            return
        try:
            self._on_connection_change(connected)
        except Exception:
            logger.exception("Connection-state handler failed")

    def _handle_message(self, client, userdata, msg):
        # paho lets exceptions escape loop_forever(), which would kill the
        # network thread and silently freeze every further update. A single
        # malformed or changed payload must not cost us the whole stream.
        try:
            model = decode(msg.topic, msg.payload)
        except Exception:
            logger.exception("Failed to decode message on %s", msg.topic)
            return

        if model is None:
            logger.debug("Ignored message on %s (undecodable)", msg.topic)
            return

        try:
            self._on_message_callback(msg.topic, model)
        except Exception:
            logger.exception("Message handler failed for %s", msg.topic)