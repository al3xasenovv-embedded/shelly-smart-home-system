# Network Setup

## Wi-Fi

All Wi-Fi connected devices (BLU Gateway Gen3, Shelly Plug S Gen3) join
the same 2.4GHz local network. Shelly devices do not support 5GHz.

## MQTT Broker

Local Mosquitto instance running on the development machine.

- Host: `192.168.100.5`
- Port: `1883`
- Authentication: username/password (not committed to this repository)
- TLS: disabled — see `adr/000X-no-tls-local-network.md`

Setup steps and issues encountered are documented in
`docs/09-troubleshooting.md` (notably: running as a Windows Service
failed due to `Program Files` write permissions; a startup `.bat`
script is used instead).

## Device IP addresses

| Device | IP | Notes |
|---|---|---|
| Development machine (MQTT broker) | 192.168.100.5 | |
| BLU Gateway Gen3 | 192.168.100.34 | |
| Shelly Plug S Gen3 | 192.168.100.35 | Connects directly via Wi-Fi, not through the gateway |

**Known limitation:** these are DHCP-assigned addresses, not static
reservations. A router restart could reassign them, which would break
the gateway's MQTT connection and the humidity-control script's HTTP
calls to the Plug S. See `docs/10-future-improvements.md`.

## Firewall

Inbound MQTT traffic (port 1883) must be allowed on the broker
machine:

\`\`\`powershell
New-NetFirewallRule -DisplayName "MQTT 1883" -Direction Inbound -Protocol TCP -LocalPort 1883 -Action Allow
\`\`\`

## Topology

See `diagrams/device-topology.mmd` for the full data flow diagram.