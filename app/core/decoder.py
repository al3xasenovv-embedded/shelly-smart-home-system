"""Decodes raw MQTT JSON payloads into typed model instances."""

import json
from typing import Optional

from core.models import (
    PresenceState,
    WindowState,
    ClimateReading,
    HumidityControlState,
    ThermostatState,
)

TOPIC_PRESENCE = "home/presence"
TOPIC_WINDOW = "home/window"
TOPIC_CLIMATE = "home/climate"
TOPIC_HUMIDITY_CONTROL = "home/humidity-control"
TOPIC_THERMOSTAT = "home/thermostat"

ALL_TOPICS = [
    TOPIC_PRESENCE,
    TOPIC_WINDOW,
    TOPIC_CLIMATE,
    TOPIC_HUMIDITY_CONTROL,
    TOPIC_THERMOSTAT,
]


def _thermostat_mode(data: dict) -> str:
    """Read the thermostat mode, tolerating the pre-cooling payload.

    The gateway used to publish `enabled: bool` (Off/Auto, heating
    only); it now publishes `mode: "off" | "heating" | "cooling"`.
    A retained message from before that change can still be sitting
    on the broker, so both shapes are accepted.
    """
    mode = data.get("mode")
    if mode is not None:
        return mode
    return "heating" if data.get("enabled") else "off"


def decode(topic: str, payload: bytes) -> Optional[object]:
    """Decode a raw MQTT message into the matching model, or None if
    the topic is unrecognized or the payload is malformed."""
    try:
        data = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None

    if topic == TOPIC_PRESENCE:
        return PresenceState(present=data["present"], ts=data["ts"])
    if topic == TOPIC_WINDOW:
        return WindowState(state=data["state"], ts=data["ts"])
    if topic == TOPIC_CLIMATE:
        return ClimateReading(
            temperature=data.get("temperature"),
            humidity=data.get("humidity"),
            battery=data.get("battery"),
            ts=data["ts"],
        )
    if topic == TOPIC_HUMIDITY_CONTROL:
        return HumidityControlState(plug_on=data["plug_on"], ts=data["ts"])
    if topic == TOPIC_THERMOSTAT:
        return ThermostatState(
            mode=_thermostat_mode(data),
            setpoint=data["setpoint"],
            heating_demand=data["heating_demand"],
            current_temp=data.get("current_temp"),
            ts=data["ts"],
        )
    return None