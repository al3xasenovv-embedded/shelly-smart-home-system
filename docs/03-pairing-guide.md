# Pairing Guide

Steps for pairing each BLU device with the BLU Gateway Gen3, plus
official reference documentation per device.

## Prerequisites

- BLU Gateway Gen3 powered on and already connected to Wi-Fi and MQTT
  (see `docs/02-network-setup.md`).
- Shelly Smart Control app installed, logged into the project's
  Shelly profile.

## General procedure

1. Open the Gateway's page in the Shelly app.
2. Tap **Add Bluetooth device**.
3. Put the target device into BLE pairing mode (method differs per
   device, see below).
4. Confirm pairing in the app, assign a recognizable name.
5. Verify the device appears in **Components** with a
   `bthomedevice:X` identifier.

## BLU Button Tough 1 ZB

- Model: SBBT-102C
- References:
  [Technical Documentation](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU_ZB/button1_ZB) ·
  [Knowledge Base](https://kb.shelly.cloud/knowledge-base/shelly-blu-button-tough-1-zb)

## BLU Door/Window ZB

- Model: SBDW-103C
- Reference:
  [Technical Documentation](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU_ZB/dw_ZB)

## BLU H&T ZB

- Model: SBHT-203C
- References:
  [Technical Documentation](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU_ZB/ht_ZB) ·
  [Knowledge Base](https://kb.shelly.cloud/knowledge-base/shelly-blu-h-t-zb)

## Shelly Plug S Gen3

Not paired via the gateway — connects directly to Wi-Fi.

- Model: S3PL-00112EU
- Reference:
  [Knowledge Base](https://kb.shelly.cloud/knowledge-base/shelly-plug-s-mtr-gen3)

## BLU Gateway Gen3

- Model: S3GW-1DBT001
- Reference:
  [Technical Documentation](https://shelly-api-docs.shelly.cloud/gen2/Devices/Gen2/ShellyBluGw)

## Notes

- All three BLU sensors are "ZB" (dual Bluetooth + Zigbee) models.
  Ensure they are paired in **Bluetooth** mode, not Zigbee — pairing
  via a Zigbee coordinator first can prevent BLE pairing with the
  gateway. See `docs/09-troubleshooting.md`.
- After a firmware update performed via a third-party tool, BLE
  bonding can break, causing a "no gateway" error on the device. Fix:
  remove the device from the gateway, power-cycle it, and re-pair.
  See `docs/09-troubleshooting.md`.