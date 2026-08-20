"""Data models for the smart home monitoring application.

Each dataclass mirrors the JSON payload published by the corresponding
gateway script (see scripts/gateway/) on its MQTT topic.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class PresenceState:
    present: bool
    ts: int


@dataclass
class WindowState:
    state: str  # "closed" | "open" | "tilted"
    ts: int


@dataclass
class ClimateReading:
    temperature: Optional[float]
    humidity: Optional[float]
    battery: Optional[float]
    ts: int


@dataclass
class HumidityControlState:
    plug_on: bool
    ts: int


@dataclass
class ThermostatState:
    mode: str  # "off" | "heating" | "cooling"
    setpoint: float
    heating_demand: bool
    current_temp: Optional[float]
    ts: int