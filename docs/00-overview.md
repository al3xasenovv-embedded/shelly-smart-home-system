# Project Overview

## Task

Create a Shelly profile (or use an existing one) and build a smart home
automation system using the Shelly BLU ecosystem.

### Requirements

1. Create a Shelly profile, if one does not already exist. If a profile
   already exists, use it.
2. All provided devices must be added and configured in the Shelly profile.
3. Each device must be assigned a clearly defined role within the system.
4. A thermostat must be implemented using the ready-made components and
   capabilities of the Shelly ecosystem.
5. A presence detection system must be implemented using the Bluetooth button.
6. The capabilities of the door/window sensor must be used optimally,
   achieving recognition and reporting of all three states of a single-leaf
   window.
7. Part of the system's business logic must be implemented and stored on
   the hub. The Bluetooth button must be used for one of these tasks.
8. An automatic humidity control system must be implemented, using the
   capabilities of the hub, the Shelly Plug S, and the temperature/humidity
   sensor.
9. A GitHub repository must be created to store everything developed for
   these tasks — schematics, diagrams, source code, explanatory notes,
   documentation, descriptions, and other related materials.
10. Project progress must be documented through clear, logically separated
    steps in the version control system. Creating the repository and the
    initial project structure must be the first completed task, after which
    the repository must be submitted for review.
11. A small computer application for monitoring must be developed, to
    visualize the data from all devices. The programming language and
    technology are free to choose. MQTT or HTTP may be used for
    communication with the devices, also free to choose.

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