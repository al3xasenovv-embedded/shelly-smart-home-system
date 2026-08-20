# Project Overview

## Task

Create a Shelly profile (or use an existing one) and build a smart home
automation system using the Shelly BLU ecosystem.

### Requirements

1. All provided devices must be added and configured in the Shelly profile.
2. Each device must be assigned a clearly defined role within the system.
3. A thermostat must be implemented using the built-in components and
   capabilities of the Shelly ecosystem.
4. A presence detection system must be implemented using the Bluetooth button.
5. The door/window sensor must be used optimally, achieving recognition
   and reporting of all three states of a single-leaf window
   (closed / tilted / open).
6. Part of the system's business logic must be implemented and stored on
   the hub. The Bluetooth button must be used for one of these tasks.
7. An automatic humidity control system must be implemented, using the
   capabilities of the hub, the Shelly Plug S, and the temperature/humidity
   sensor.
8. A GitHub repository must be created to store everything developed for
   these tasks — diagrams, schematics, source code, explanatory notes,
   documentation, descriptions, and other related materials.
9. Project progress must be documented through clear, logically separated
   steps in the version control system. Creating the repository and the
   initial project structure must be the first completed task, after which
   the repository must be submitted for review.
10. A small monitoring application must be developed to visualize data from
    all devices. The programming language and technology are free to choose.
    MQTT or HTTP may be used for device communication, also free to choose.

## Devices provided

- BLU Gateway Gen3
- BLU Door/Window ZB
- BLU Button Tough 1 ZB
- BLU H&T ZB
- Shelly Plug S Gen3

## Architecture decision (summary)

The hub (BLU Gateway Gen3) acts as the central brain: it receives BLE
events from the BLU sensors, runs the business logic via on-device scripts,
and publishes state to a local MQTT broker. The monitoring application is
a read-only consumer of this MQTT stream. See `adr/` for detailed
architectural decisions.