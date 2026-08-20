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


## Script state desyncs from physical device after restart

**Symptom:** humidity control logic doesn't trigger, even though the
humidity clearly crosses the configured threshold.

**Cause:** the script tracked the plug's on/off state in an in-memory
variable (`plugIsOn`), initialized to `false` on every script restart.
If the plug was physically on (e.g. from a previous test) but the
script restarted, the variable no longer matched reality — both the
"turn on" and "turn off" conditions failed silently, since each checks
the in-memory flag before acting.

**Fix:** seed the in-memory state from the actual device status via
`Switch.GetStatus` on script start, not just from KVS or an assumed
default.