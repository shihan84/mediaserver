# Application Name Fix - FOUND THE ISSUE!

## Problem Discovered

We were editing the **WRONG configuration file**!

- **What we edited**: `/usr/share/ovenmediaengine/conf/Origin.xml`
- **What OME actually uses**: `/usr/share/ovenmediaengine/conf/Server.xml`

## Solution

### The Fix

OME loads applications from `Server.xml`, not `Origin.xml`. 

After changing the application name in `Server.xml` from `app` to `live`, OME successfully loaded:
```
RTMPProvider has created [#default#live] application
```

## Current Configuration

Both applications are now configured:
- **"app"** - For backward compatibility with existing channels
- **"live"** - Your new application name

## How to Change Application Name

1. Edit `/usr/share/ovenmediaengine/conf/Server.xml` (NOT Origin.xml!)
2. Find `<Applications>` section
3. Change `<Name>app</Name>` to your desired name
4. Restart OME: `sudo systemctl restart ovenmediaengine`

## Important Notes

- OME uses `Server.xml` as the main configuration
- `Origin.xml` appears to be a template or example file
- Always edit `Server.xml` for application configuration changes

## Verification

After changing to "live" in Server.xml, logs show:
```
RTMPProvider has created [#default#live] application ✅
```

This confirms OME CAN use any application name - we just needed to edit the correct file!

