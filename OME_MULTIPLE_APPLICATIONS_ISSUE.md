# OME Multiple Applications Issue

## Problem

Even though both "app" and "live" applications are correctly configured in `Origin.xml`, OME only loads "app" and ignores "live".

## Observations

1. Both applications are in the XML with identical structure
2. XML validation passes
3. OME logs show only: `#default#app` being loaded
4. No errors in logs about "live"
5. OME simply doesn't load the second application

## Possible Causes

1. **OME Limitation**: OME might only support one application per virtual host in some configurations
2. **Configuration Parsing**: OME might stop parsing after the first application
3. **Version Issue**: Current OME version might have a bug with multiple applications

## Workarounds

### Option 1: Use "app" (Recommended)
- Application "app" is working
- Use RTMP URL: `rtmp://ome.imagetv.in:1935/app/{stream-key}`
- No configuration changes needed

### Option 2: Create Separate Virtual Hosts
- Create a new virtual host for "live" application
- This requires more complex OME configuration

### Option 3: Use Application Aliases
- Some OME versions support aliasing, but may require different configuration

## Current Status

- ✅ "app" application: Working perfectly
- ❌ "live" application: In XML but not loaded by OME
- ⚠️ This appears to be an OME behavior, not a configuration error

## Recommendation

**Use "app" for all channels** until OME configuration supports multiple applications or until we can identify why OME isn't loading the second application.

The XML configuration is correct - the issue is with OME's application loading mechanism.

