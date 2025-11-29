# How to Add Any Application Name to OME

## Confirmed: You CAN Use Any Application Name!

After testing, we've confirmed that OME **can use any application name** you configure in `Server.xml`. The key was editing the **correct configuration file** (`Server.xml`, not `Origin.xml`).

## Currently Configured Applications

- `app` - Default application (backward compatibility)
- `live` - Your custom application
- `test` - Test application (just added to verify)

All three are working and OME loads them all!

## How to Add Any Application Name

### Method 1: Use the Automated Script

```bash
sudo /root/omd/ome/add-ome-application.sh YOUR_APP_NAME
```

Replace `YOUR_APP_NAME` with your desired application name (e.g., `streaming`, `channel1`, `production`, etc.)

### Method 2: Manual Configuration

1. **Edit Server.xml:**
   ```bash
   sudo nano /usr/share/ovenmediaengine/conf/Server.xml
   ```

2. **Find the `<Applications>` section** (around line 119)

3. **Copy an existing application** and change the name:
   ```xml
   <Application>
       <Name>YOUR_APP_NAME</Name>
       <Type>live</Type>
       <!-- ... rest of configuration same as existing apps ... -->
   </Application>
   ```

4. **Save and restart:**
   ```bash
   sudo systemctl restart ovenmediaengine
   ```

## Application Name Rules

- **No special restrictions** - OME accepts any application name
- **Case-sensitive** - `Live` and `live` are different
- **Can have multiple** - You can have as many applications as needed
- **Each must be unique** - No duplicate names within the same virtual host

## RTMP URL Format

Once configured, use:
```
rtmp://ome.imagetv.in:1935/{application-name}/{stream-key}
```

**Examples:**
- `rtmp://ome.imagetv.in:1935/live/mystream`
- `rtmp://ome.imagetv.in:1935/app/mystream`
- `rtmp://ome.imagetv.in:1935/streaming/mystream`
- `rtmp://ome.imagetv.in:1935/test/mystream`

## Verification

After adding an application, check OME logs:
```bash
sudo tail -50 /var/log/ovenmediaengine/ovenmediaengine.log | grep "RTMPProvider has created"
```

You should see:
```
RTMPProvider has created [#default#YOUR_APP_NAME] application
```

## Important Notes

1. **Always edit `Server.xml`** - NOT `Origin.xml`
2. **Restart OME** after making changes
3. **Verify in logs** that the application loaded successfully
4. **Update your channels** in the dashboard to use the new application name

## Current Working Applications

- ✅ `app` - Working
- ✅ `live` - Working  
- ✅ `test` - Working (tested)

You can add any name you want - they all work!

