"""Application configuration.

Values are read from environment variables, optionally seeded from a
local .env file next to this module (see .env.example). Credentials
are never committed to the repository.
"""

import os
from pathlib import Path

_ENV_FILE = Path(__file__).resolve().parent / ".env"


class ConfigError(RuntimeError):
    """Raised when a required setting is missing."""


def _load_env_file(path: Path) -> None:
    """Seed os.environ from a simple KEY=VALUE file, if one exists.

    Variables already present in the environment win, so the shell can
    always override the file. Kept dependency-free on purpose — the app
    only needs paho-mqtt to run.
    """
    if not path.is_file():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_env_file(_ENV_FILE)

# Broker address and user are not secrets — defaults match the
# deployment documented in docs/02-network-setup.md.
MQTT_HOST = os.getenv("MQTT_HOST", "192.168.100.5")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "shellyhub")

# The password has no default on purpose.
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "")


def validate() -> None:
    """Fail early with an actionable message if the password is missing."""
    if not MQTT_PASSWORD:
        raise ConfigError(
            "MQTT_PASSWORD is not set.\n"
            "Copy app/.env.example to app/.env and fill in the broker "
            "password, or export MQTT_PASSWORD in your shell."
        )
