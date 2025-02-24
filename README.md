# Ping Trace API

**Ping Trace API** is a REST API written in JavaScript that validates input and returns the output of the `ping` or `mtr` command. It accepts a public IPv4/IPv6 address or a hostname (that resolves to one) via a required query parameter.

## API Usage

### Endpoints

- `/ping`
- `/traceroute`

---

### Request Format

Every request must include the `target` query parameter. For example:

```
GET http://127.0.0.1:1234/ping?target=1.1.1.1
```

### Example Response (JSON)

```jsonc
{
  "status": "success", // "success" or "fail"
  "cached": true, // true if the result is from cache (cache is only 5s to prevent spam)
  "query": "1.1.1.1", // the original target query
  "endpoint": "ping", // requested endpoint
  "address": "1.1.1.1", // resolved IP address
  "output": "PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data." // trimmed raw command output
}
```

## Running the API

You can run the API in one of two ways:

- [**Precompiled Binary (Recommended)**](#running-from-precompiled-binary)
- [**Directly from Source**](#running-directly-from-source)

---

### Running from Precompiled Binary

> **Note:** Although you can simply download and run the binary, following this guide enhances deployment security.

**Assumptions:**

- Installation path: `/opt/ping-trace-api` (adjust as needed)
- All commands run as root
- `ping` and `mtr` are available in your `$PATH`

#### Steps

1. **Set Up Directories, User, and Permissions**

   Create the data directory (used for logs and command arguments), add a dedicated user, and adjust permissions:

   ```bash
   mkdir -p /opt/ping-trace-api/data
   useradd -s /usr/sbin/nologin -d /opt/ping-trace-api ping-trace-api
   chown ping-trace-api: /opt/ping-trace-api/data
   ```

2. **Download the Binary**

   Go to the [latest release page](https://github.com/Rmlyy/ping-trace-api/releases/latest) and copy the URL for the binary that matches your hardware.

   > **Note:** For `x86_64` systems, choose the `modern` binary if your CPU was launched in 2013 or later; otherwise, use the `baseline` binary.

   Then, download and make it executable:

   ```bash
   wget -O /opt/ping-trace-api/ping-trace-api <URL>
   chmod +x /opt/ping-trace-api/ping-trace-api
   ```

3. **Download the `cmdArgs.json` File**

   This file contains the configuration options for the commands:

   ```bash
   wget -O /opt/ping-trace-api/data/cmdArgs.json https://raw.githubusercontent.com/Rmlyy/ping-trace-api/refs/heads/main/cmdArgs.json
   ```

4. **Create a systemd Service**

   Create `/etc/systemd/system/ping-trace-api.service` with the following content:

   ```ini
   [Unit]
   Description=Ping and Traceroute API
   After=network-online.target
   Wants=network-online.target

   [Service]
   User=ping-trace-api
   Group=ping-trace-api
   WorkingDirectory=/opt/ping-trace-api/data
   ExecStart=/opt/ping-trace-api/ping-trace-api
   Environment=SERVER_ADDR=0.0.0.0
   Environment=SERVER_PORT=1234
   Environment=LOGS_ENABLED=true
   Restart=on-failure
   RestartSec=5s

   ReadOnlyPaths=/
   ReadWritePaths=/opt/ping-trace-api/data
   PrivateTmp=true
   ProtectHome=true
   ProtectControlGroups=true
   RemoveIPC=yes

   [Install]
   WantedBy=multi-user.target
   ```

   Reload systemd, then enable and start the service:

   ```bash
   systemctl daemon-reload
   systemctl enable --now ping-trace-api
   systemctl status ping-trace-api
   # Or view logs:
   journalctl -xeu ping-trace-api
   ```

The API should now be up and running. Enjoy!

---

### Running Directly from Source

**Assumptions:**

- `ping` and `mtr` are available in your `$PATH`
- A JavaScript runtime (Bun or Node.js) is installed
- `git` is installed

#### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Rmlyy/ping-trace-api.git
   cd ping-trace-api
   ```

2. **Configure Environment Variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. **Install Dependencies and Run**

   Using Bun for simplicity:

   ```bash
   bun install
   bun src/server.js
   ```

The API should now be up and running. Enjoy!

---
