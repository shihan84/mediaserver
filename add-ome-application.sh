#!/bin/bash
# Script to add a new OME application
# Usage: sudo ./add-ome-application.sh <app-name>

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: sudo $0 <application-name>"
    echo "Example: sudo $0 live"
    exit 1
fi

APP_NAME="$1"
ORIGIN_XML="/usr/share/ovenmediaengine/conf/Origin.xml"
BACKUP_FILE="${ORIGIN_XML}.backup.$(date +%Y%m%d_%H%M%S)"

echo "Adding OME application: $APP_NAME"

# Backup
echo "Creating backup..."
cp "$ORIGIN_XML" "$BACKUP_FILE"
echo "Backup created: $BACKUP_FILE"

# Check if application already exists
if grep -q "<Name>$APP_NAME</Name>" "$ORIGIN_XML"; then
    echo "Error: Application '$APP_NAME' already exists!"
    exit 1
fi

# Create temporary file with new application
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF
				<Application>
					<Name>$APP_NAME</Name>
					<Type>live</Type>
					<OutputProfiles>
						<Decodes>
							<ThreadCount>2</ThreadCount>
							<OnlyKeyframes>false</OnlyKeyframes>
						</Decodes>
						<HWAccels>
							<Decoder>
								<Enable>false</Enable>
							</Decoder>
							<Encoder>
								<Enable>false</Enable>
							</Encoder>
						</HWAccels>
						<OutputProfile>
							<Name>bypass_stream</Name>
							<OutputStreamName>\${OriginStreamName}</OutputStreamName>
							<Playlist>
								<Name>default</Name>
								<FileName>master</FileName>
								<Options>
									<WebRtcAutoAbr>true</WebRtcAutoAbr>
									<HLSChunklistPathDepth>0</HLSChunklistPathDepth>
									<EnableTsPackaging>true</EnableTsPackaging>
								</Options>
								<RenditionTemplate>
									<Name>\${Height}p</Name>
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
					<Providers>
						<OVT />
						<RTMP />
						<SRT />
					</Providers>
				</Application>
EOF

# Find the insertion point (after the last </Application> before </Applications>)
if ! grep -q "</Applications>" "$ORIGIN_XML"; then
    echo "Error: Could not find </Applications> tag in $ORIGIN_XML"
    rm "$TEMP_FILE"
    exit 1
fi

# Insert the new application before </Applications>
# Using Python for more reliable XML handling
python3 << PYTHON_SCRIPT
import sys
import re

with open("$ORIGIN_XML", "r") as f:
    content = f.read()

# Read the new application content
with open("$TEMP_FILE", "r") as f:
    new_app = f.read()

# Find the last </Application> before </Applications>
pattern = r'(</Application>\s*\n\t\t\t</Applications>)'
replacement = f'</Application>\n\t\t\t\t{new_app}\n\t\t\t</Applications>'

if not re.search(pattern, content):
    print("Error: Could not find insertion point")
    sys.exit(1)

new_content = re.sub(pattern, replacement, content)

# Write back
with open("$ORIGIN_XML", "w") as f:
    f.write(new_content)

print("Application added successfully")
PYTHON_SCRIPT

rm "$TEMP_FILE"

# Validate XML
echo "Validating XML..."
if command -v xmllint &> /dev/null; then
    if xmllint --noout "$ORIGIN_XML" 2>/dev/null; then
        echo "[OK] XML is valid"
    else
        echo "[ERROR] XML validation failed! Restoring backup..."
        cp "$BACKUP_FILE" "$ORIGIN_XML"
        exit 1
    fi
else
    echo "[WARN] xmllint not found, skipping validation"
fi

# Restart OME
echo "Restarting OvenMediaEngine..."
systemctl restart ovenmediaengine

sleep 2

# Check if OME started successfully
if systemctl is-active --quiet ovenmediaengine; then
    echo "[OK] OME restarted successfully"
    echo ""
    echo "Application '$APP_NAME' has been added!"
    echo "You can now use: rtmp://ome.imagetv.in:1935/$APP_NAME/{stream-key}"
else
    echo "[ERROR] OME failed to start! Restoring backup..."
    cp "$BACKUP_FILE" "$ORIGIN_XML"
    systemctl restart ovenmediaengine
    exit 1
fi

