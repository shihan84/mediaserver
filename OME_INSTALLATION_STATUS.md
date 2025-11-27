# OvenMediaEngine Installation Status

## Installation Process

OvenMediaEngine is being installed from source according to the provided instructions. This is a comprehensive build process that includes:

1. **System Dependencies** - Base build tools and libraries
2. **Third-party Libraries** - OpenSSL, SRTP, SRT, Opus, x264, VPX, FDK-AAC, etc.
3. **FFmpeg** - Custom build with OME patches
4. **OvenMediaEngine** - Main application build

## Installation Location

- **Installation Prefix**: `/opt/ovenmediaengine`
- **Source Code**: `/root/omd/OvenMediaEngine`
- **Build Directory**: `/root/omd/OvenMediaEngine/build`
- **Log File**: `/tmp/ome_full_install.log`

## Installation Time

This installation can take **30-60 minutes** or more depending on your system, as it compiles many libraries from source including:
- OpenSSL 3.0.7
- FFmpeg 5.1.4 (with custom patches)
- Various codec libraries
- OvenMediaEngine itself

## Monitor Installation Progress

```bash
# View installation log
tail -f /tmp/ome_full_install.log

# Check if installation is still running
ps aux | grep prerequisites

# Check installed components
ls -la /opt/ovenmediaengine/
```

## Installation Steps

The prerequisites script installs in this order:

1. **Base System Packages** (Ubuntu/Debian)
2. **NASM** - Assembler
3. **OpenSSL** - Cryptography library
4. **libSRTP** - Secure RTP library
5. **libSRT** - Secure Reliable Transport
6. **libOpus** - Audio codec
7. **OpenH264** - H.264 codec
8. **x264** - H.264 encoder
9. **libVPX** - VP8/VP9 codec
10. **libWebP** - Image codec
11. **FDK-AAC** - Audio codec
12. **FFmpeg** - Media framework (with OME patches)
13. **jemalloc** - Memory allocator
14. **PCRE2** - Regular expressions
15. **hiredis** - Redis client
16. **spdlog** - Logging library
17. **whisper** - Speech recognition
18. **OvenMediaEngine** - Main application

## After Installation

Once installation completes:

1. **Configuration Files**: Located in `/opt/ovenmediaengine/bin/origin_conf/`
2. **Binary**: `/opt/ovenmediaengine/bin/OvenMediaEngine`
3. **Service**: Can be set up using `misc/ovenmediaengine.service`

## Configure OvenMediaEngine

```bash
# Copy configuration files
sudo mkdir -p /etc/ovenmediaengine
sudo cp /root/omd/OvenMediaEngine/misc/conf_examples/* /etc/ovenmediaengine/

# Edit configuration
sudo nano /etc/ovenmediaengine/Server.xml
sudo nano /etc/ovenmediaengine/Origin.xml
```

## Start OvenMediaEngine

```bash
# Using systemd service
sudo cp /root/omd/OvenMediaEngine/misc/ovenmediaengine.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ovenmediaengine
sudo systemctl start ovenmediaengine

# Or manually
/opt/ovenmediaengine/bin/OvenMediaEngine
```

## Integration with Frontend

Update the backend `.env` file:

```env
OME_API_URL=http://localhost:8081
OME_API_KEY=your-ome-api-key
```

The OME REST API is typically available on port 8081.

## Troubleshooting

### Installation Fails
- Check the log: `cat /tmp/ome_full_install.log`
- Ensure all base dependencies are installed
- Check disk space: `df -h`
- Check available memory: `free -h`

### OME Won't Start
- Check configuration files for errors
- Verify ports are not in use: `netstat -tlnp | grep -E "(8081|1935|9999)"`
- Check logs: `journalctl -u ovenmediaengine -f`

### Build Errors
- Ensure you have sufficient disk space (at least 10GB free)
- Ensure you have sufficient RAM (at least 4GB recommended)
- Some packages may need to be built sequentially

## Next Steps

1. Wait for installation to complete
2. Configure OvenMediaEngine
3. Start OvenMediaEngine service
4. Update frontend backend `.env` with OME API details
5. Test integration between frontend and OME

