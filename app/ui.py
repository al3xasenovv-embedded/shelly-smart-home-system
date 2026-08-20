"""Live-updating window showing current state of all devices, styled
with CustomTkinter for a modern dark theme.
No history/graphs — just current values (see task requirement #10).
"""

import customtkinter as ctk

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

GOOD_COLOR = "#4caf50"
WARN_COLOR = "#f5a623"
IDLE_COLOR = "#8a8a99"
TEXT_COLOR = "#e8e8ec"


class MonitorWindow:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.title("Shelly Smart Home Monitor")
        self.root.geometry("440x520")

        header = ctk.CTkLabel(
            self.root, text="🏠  Smart Home Monitor",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        header.pack(pady=(24, 4))

        self.status_dot = ctk.CTkLabel(
            self.root, text="●  connecting…",
            font=ctk.CTkFont(size=12), text_color=WARN_COLOR
        )
        self.status_dot.pack(pady=(0, 16))

        self.labels = {}
        self._build_card("presence", "Presence")
        self._build_card("window", "Window")
        self._build_card("temperature", "Temperature")
        self._build_card("humidity", "Humidity")
        self._build_card("plug", "Humidity Control")
        self._build_card("thermostat", "Thermostat")

    def _build_card(self, key: str, title: str):
        card = ctk.CTkFrame(self.root, corner_radius=10)
        card.pack(fill="x", padx=20, pady=6)

        ctk.CTkLabel(
            card, text=title, font=ctk.CTkFont(size=12),
            text_color=IDLE_COLOR, anchor="w"
        ).pack(fill="x", padx=16, pady=(10, 0))

        value_label = ctk.CTkLabel(
            card, text="—", font=ctk.CTkFont(size=20, weight="bold"),
            text_color=TEXT_COLOR, anchor="w"
        )
        value_label.pack(fill="x", padx=16, pady=(0, 12))
        self.labels[key] = value_label

    def set_connected(self, connected: bool):
        if connected:
            self.status_dot.configure(text="●  live", text_color=GOOD_COLOR)
        else:
            self.status_dot.configure(text="●  disconnected", text_color=WARN_COLOR)

    def update_presence(self, present: bool):
        self.labels["presence"].configure(
            text="Home" if present else "Away",
            text_color=GOOD_COLOR if present else IDLE_COLOR,
        )

    def update_window(self, state: str):
        color = GOOD_COLOR if state == "closed" else WARN_COLOR
        self.labels["window"].configure(text=state.capitalize(), text_color=color)

    def update_climate(self, temperature, humidity):
        temp_text = f"{temperature:.1f} °C" if temperature is not None else "—"
        hum_text = f"{humidity:.0f} %" if humidity is not None else "—"
        self.labels["temperature"].configure(text=temp_text, text_color=TEXT_COLOR)
        self.labels["humidity"].configure(text=hum_text, text_color=TEXT_COLOR)

    def update_plug(self, plug_on: bool):
        self.labels["plug"].configure(
            text="ON" if plug_on else "OFF",
            text_color=WARN_COLOR if plug_on else IDLE_COLOR,
        )

    def update_thermostat(self, enabled: bool, setpoint: float, heating_demand: bool):
        mode = "Auto" if enabled else "Off"
        demand = "Heating" if heating_demand else "Idle"
        color = WARN_COLOR if heating_demand else IDLE_COLOR
        self.labels["thermostat"].configure(
            text=f"{mode} · {setpoint}°C · {demand}", text_color=color
        )

    def run(self):
        self.root.mainloop()