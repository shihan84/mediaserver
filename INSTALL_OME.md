# OvenMediaEngine Installation Guide

## Current Status

OvenMediaEngine installation from source is a **long-running process** (30-60+ minutes) that compiles many libraries from source.

## Quick Installation Command

To install OvenMediaEngine with all dependencies, run:

```bash
cd /root/omd/OvenMediaEngine/misc
bash prerequisites.sh --all
```

This will:
1. Install all system dependencies
2. Build and install all required libraries (OpenSSL, FFmpeg, codecs, etc.)
3. Build and install OvenMediaEngine

## Installation in Background

To run installation in the background:

```bash
cd /root/omd/OvenMediaEngine/misc
nohup bash prerequisites.sh --all > /tmp/ome_install.log 2>&1 &
```

Monitor progress:
```bash
tail -f /tmp/ome_install.log
```

## Manual Step-by-Step Installation

If you prefer to install step by step:

### 1. Install Base Dependencies
```bash
apt-get install -y build-essential autoconf libtool zlib1g-dev tclsh cmake curl pkg-config bc uuid-dev git libgomp1
```

### 2. Run Prerequisites Script
```bash
cd /root/omd/OvenMediaEngine/misc
bash prerequisites.sh --all
```

The script will automatically:
- Detect your OS (Ubuntu/Debian)
- Install base packages
- Build and install all required libraries
- Build and install OvenMediaEngine

## Installation Location

- **Binary**: `/opt/ovenmediaengine/bin/OvenMediaEngine`
- **Libraries**: `/opt/ovenmediaengine/lib/`
- **Configuration**: `/opt/ovenmediaengine/bin/origin_conf/`

## After Installation

### 1. Configure OvenMediaEngine

```bash
# Copy example configurations
sudo cp /root/omd/OvenMediaEngine/misc/conf_examples/* /opt/ovenmediaengine/bin/origin_conf/

# Edit main configuration
sudo nano /opt/ovenmediaengine/bin/origin_conf/Server.xml
```

### 2. Set Up Systemd Service

```bash
# Copy service file
sudo cp /root/omd/OvenMediaEngine/misc/ovenmediaengine.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable ovenmediaengine
sudo systemctl start ovenmediaengine

# Check status
sudo systemctl status ovenmediaengine
```

### 3. Verify Installation

```bash
# Check if OME is running
ps aux | grep OvenMediaEngine

# Check ports
netstat -tlnp | grep -E "(8081|1935|9999|9000)"

# Test API
curl http://localhost:8081/v1/stats/current
```

### 4. Update Frontend Configuration

Edit `/root/omd/ome/backend/.env`:

```env
OME_API_URL=http://localhost:8081
OME_API_KEY=your-api-key-if-configured
```

## Troubleshooting

### Installation Takes Too Long
- This is normal - compiling FFmpeg and all codecs takes 30-60+ minutes
- Monitor CPU usage: `htop` or `top`
- Check disk space: `df -h` (need at least 10GB free)

### Build Errors
- Check log file for specific error
- Ensure all base dependencies are installed
- Try building individual components

### OME Won't Start
- Check configuration files for syntax errors
- Verify ports are available
- Check logs: `journalctl -u ovenmediaengine -n 50`

## Alternative: Use Pre-built Binary

If building from source is taking too long, you can:

1. Use Docker (but requirements say no Docker)
2. Download pre-built binaries if available
3. Use package manager if available for your OS

However, per requirements, we're doing direct system installation from source.

## Next Steps

1. Wait for installation to complete
2. Configure OME settings
3. Start OME service
4. Test OME API connectivity
5. Integrate with frontend

