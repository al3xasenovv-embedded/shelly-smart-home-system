"""Minimal live-updating window showing current state of all devices.
No history/graphs — just current values (see task requirement #10).
"""

import tkinter as tk


class MonitorWindow:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Shelly Smart Home Monitor")
        self.root.geometry("420x320")

        self.labels = {}
        self._build_row("presence", "Presence")
        self._build_row("window", "Window")
        self._build_row("temperature", "Temperature")
        self._build_row("humidity", "Humidity")
        self._build_row("plug", "Humidity Control (Plug)")
        self._build_row("thermostat", "Thermostat")

    def _build_row(self, key: str, title: str):
        frame = tk.Frame(self.root, pady=6, padx=10)
        frame.pack(fill="x")
        tk.Label(frame, text=title + ":", width=20, anchor="w",
                  font=("Segoe UI", 10, "bold")).pack(side="left")
        value_label = tk.Label(frame, text="—", anchor="w", font=("Segoe UI", 10))
        value_label.pack(side="left")
        self.labels[key] = value_label

    def update_presence(self, present: bool):
        self.labels["presence"].config(text="Home" if present else "Away")

    def update_window(self, state: str):
        self.labels["window"].config(text=state.capitalize())

    def update_climate(self, temperature, humidity):
        temp_text = f"{temperature:.1f} °C" if temperature is not None else "—"
        hum_text = f"{humidity:.0f} %" if humidity is not None else "—"
        self.labels["temperature"].config(text=temp_text)
        self.labels["humidity"].config(text=hum_text)

    def update_plug(self, plug_on: bool):
        self.labels["plug"].config(text="ON" if plug_on else "OFF")

    def update_thermostat(self, enabled: bool, setpoint: float, heating_demand: bool):
        mode = "Auto" if enabled else "Off"
        demand = "Heating" if heating_demand else "Idle"
        self.labels["thermostat"].config(text=f"{mode} · {setpoint}°C · {demand}")

    def run(self):
        self.root.mainloop()