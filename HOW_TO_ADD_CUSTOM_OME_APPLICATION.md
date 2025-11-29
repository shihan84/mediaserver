# How to Add a Custom Application Name to OME

If you want to use a different application name instead of "app" (e.g., "live", "streaming", "channel1"), you need to add it to OME's configuration.

## Step-by-Step Guide

### Step 1: Backup the Configuration

```bash
sudo cp /usr/share/ovenmediaengine/conf/Origin.xml /usr/share/ovenmediaengine/conf/Origin.xml.backup
```

### Step 2: Edit Origin.xml

```bash
sudo nano /usr/share/ovenmediaengine/conf/Origin.xml
```

Or use your preferred editor:
```bash
sudo vi /usr/share/ovenmediaengine/conf/Origin.xml
```

### Step 3: Add Your New Application

Find the `<Applications>` section (around line 310). It should look like:

```xml
<Applications>
    <Application>
        <Name>app</Name>
        <!-- ... existing configuration ... -->
    </Application>
</Applications>
```

**Add your new application** right after the `</Application>` tag (before `</Applications>`):

```xml
<Applications>
    <Application>
        <Name>app</Name>
        <!-- ... existing configuration ... -->
    </Application>
    
    <!-- Add your new application here -->
    <Application>
        <Name>live</Name>  <!-- Change this to your desired name -->
        <Type>live</Type>
        <OutputProfiles>
            <!-- Common setting for decoders -->
            <Decodes>
                <ThreadCount>2</ThreadCount>
                <OnlyKeyframes>false</OnlyKeyframes>
            </Decodes>

            <!-- Hardware acceleration (optional, same as app) -->
            <HWAccels>
                <Decoder>
                    <Enable>false</Enable>
                </Decoder>
                <Encoder>
                    <Enable>false</Enable>
                </Encoder>
            </HWAccels>

            <!-- Output profile for streaming -->
            <OutputProfile>
                <Name>bypass_stream</Name>
                <OutputStreamName>${OriginStreamName}</OutputStreamName>

                <Playlist>
                    <Name>default</Name>
                    <FileName>master</FileName>
                    <Options>
                        <WebRtcAutoAbr>true</WebRtcAutoAbr>
                        <HLSChunklistPathDepth>0</HLSChunklistPathDepth>
                        <EnableTsPackaging>true</EnableTsPackaging>
                    </Options>
                    <RenditionTemplate>
                        <Name>${Height}p</Name>
                        <VideoTemplate>
                            <EncodingType>all</EncodingType>
                        </VideoTemplate>
                        <AudioTemplate>
                            <EncodingType>all</EncodingType>
                        </AudioTemplate>
                    </RenditionTemplate>
                </Playlist>

                <Encodes>
                    <Video>
                        <Name>bypass_video</Name>
                        <Bypass>true</Bypass>
                    </Video>
                    <Audio>
                        <Name>aac_audio</Name>
                        <Codec>aac</Codec>
                        <Bitrate>128000</Bitrate>
                        <Samplerate>48000</Samplerate>
                        <Channel>2</Channel>
                        <BypassIfMatch>
                            <Codec>eq</Codec>
                        </BypassIfMatch>
                    </Audio>
                    <Audio>
                        <Name>opus_audio</Name>
                        <Codec>opus</Codec>
                        <Bitrate>128000</Bitrate>
                        <Samplerate>48000</Samplerate>
                        <Channel>2</Channel>
                        <BypassIfMatch>
                            <Codec>eq</Codec>
                        </BypassIfMatch>
                    </Audio>
                </Encodes>
            </OutputProfile>
        </OutputProfiles>
        
        <!-- Enable input providers -->
        <Providers>
            <OVT />
            <RTMP />
            <SRT />
        </Providers>
    </Application>
</Applications>
```

### Step 4: Verify XML Syntax

```bash
sudo xmllint --noout /usr/share/ovenmediaengine/conf/Origin.xml
```

If there are no errors, it will return nothing. If there are errors, fix them before proceeding.

### Step 5: Restart OME

```bash
sudo systemctl restart ovenmediaengine
```

### Step 6: Verify the Application Exists

Check OME logs to confirm:
```bash
sudo tail -f /var/log/ovenmediaengine/ovenmediaengine.log
```

Or test via API (if authentication is configured):
```bash
curl -u "ome-api-token-2024:" http://127.0.0.1:8081/v1/vhosts/default/apps
```

### Step 7: Use Your New Application

Now you can use your new application name when creating channels:

1. **In the Dashboard:**
   - Create a new channel
   - Set **Application Name** to your new name (e.g., "live")
   - Set **Stream Key** (e.g., "stream1")

2. **RTMP URL Format:**
   ```
   rtmp://ome.imagetv.in:1935/{your-app-name}/{stream-key}
   ```
   
   **Example:**
   - Application Name: `live`
   - Stream Key: `stream1`
   - RTMP URL: `rtmp://ome.imagetv.in:1935/live/stream1`

## Quick Reference Template

If you want to create a minimal application quickly, use this simplified template:

```xml
<Application>
    <Name>YOUR_APP_NAME</Name>
    <Type>live</Type>
    <OutputProfiles>
        <OutputProfile>
            <Name>bypass_stream</Name>
            <OutputStreamName>${OriginStreamName}</OutputStreamName>
            <Playlist>
                <Name>default</Name>
                <FileName>master</FileName>
            </Playlist>
            <Encodes>
                <Video>
                    <Name>bypass_video</Name>
                    <Bypass>true</Bypass>
                </Video>
                <Audio>
                    <Name>aac_audio</Name>
                    <Codec>aac</Codec>
                    <Bitrate>128000</Bitrate>
                    <Samplerate>48000</Samplerate>
                    <Channel>2</Channel>
                </Audio>
            </Encodes>
        </OutputProfile>
    </OutputProfiles>
    <Providers>
        <RTMP />
        <SRT />
    </Providers>
</Application>
```

## Common Application Names

Here are some common application names you might want to use:

- `live` - For live streaming
- `streaming` - General purpose streaming
- `channel1`, `channel2`, etc. - Multiple channels
- `production` - Production streams
- `test` - Testing streams

## Troubleshooting

### Application Not Found After Adding

1. **Check XML syntax:**
   ```bash
   sudo xmllint --noout /usr/share/ovenmediaengine/conf/Origin.xml
   ```

2. **Check OME logs:**
   ```bash
   sudo tail -50 /var/log/ovenmediaengine/ovenmediaengine.log | grep -i error
   ```

3. **Verify OME restarted:**
   ```bash
   sudo systemctl status ovenmediaengine
   ```

### OME Won't Start After Changes

1. **Restore backup:**
   ```bash
   sudo cp /usr/share/ovenmediaengine/conf/Origin.xml.backup /usr/share/ovenmediaengine/conf/Origin.xml
   sudo systemctl restart ovenmediaengine
   ```

2. **Check for XML errors:**
   ```bash
   sudo xmllint --noout /usr/share/ovenmediaengine/conf/Origin.xml
   ```

## Notes

- Application names are case-sensitive
- Each application can have different output profiles and settings
- You can have multiple applications for different use cases
- All applications share the same RTMP port (1935) but use different paths

