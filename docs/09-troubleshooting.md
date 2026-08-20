# Troubleshooting

## Script does not survive gateway reboot

**Symptom:** after rebooting the gateway, button presses no longer
trigger MQTT messages, even though the script worked before the reboot.

**Cause:** starting a script via the "Start" button in the web UI does
not persist across reboots. The script's `enable` config flag must be
set to `true` explicitly.

**Fix:**

\`\`\`bash
curl -X POST -d '{"id":1,"method":"Script.SetConfig","params":{"id":1,"config":{"enable":true}}}' http://<gateway-ip>/rpc
\`\`\`

Verify with:

\`\`\`bash
curl -X POST -d '{"id":1,"method":"Script.GetConfig","params":{"id":1}}' http://<gateway-ip>/rpc
\`\`\`