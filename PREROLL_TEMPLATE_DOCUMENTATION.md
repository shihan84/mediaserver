# SCTE-35 Preroll Template Documentation

## Overview

The SCTE-35 preroll template feature allows you to quickly create standardized preroll ad break markers that play before the main content starts.

## API Endpoint

### Create Preroll Template

**Endpoint:** `POST /api/scte35/templates/preroll`  
**Authentication:** Required (Operator or Admin)  
**Method:** POST

### Request Body

```json
{
  "name": "Standard Preroll 30s",
  "duration": 30,
  "programId": 1,
  "spliceId": 123456
}
```

### Parameters

- **name** (required): Name for the preroll marker template
- **duration** (optional, default: 30): Duration of the preroll ad break in seconds
- **programId** (optional, default: 1): Program ID for the SCTE-35 marker
- **spliceId** (optional): Splice ID for the SCTE-35 marker (auto-generated if not provided)

### Response

```json
{
  "message": "SCTE-35 preroll template created successfully",
  "marker": {
    "id": "uuid",
    "name": "Standard Preroll 30s",
    "type": "SPLICE_INSERT",
    "cueOut": true,
    "cueIn": false,
    "duration": 30,
    "outOfNetwork": true,
    "autoReturn": true,
    "breakDuration": 30,
    "availNum": 1,
    "availsExpected": 1,
    "metadata": {
      "template": "preroll",
      "description": "Preroll ad break template",
      "createdBy": "user-id",
      "createdAt": "2025-11-23T10:00:00.000Z"
    }
  },
  "template": {
    "type": "preroll",
    "description": "Preroll ad break that plays before main content",
    "duration": 30,
    "cueOut": true,
    "cueIn": false
  }
}
```

## Preroll Template Characteristics

The preroll template creates an SCTE-35 marker with the following characteristics:

- **Type:** `SPLICE_INSERT`
- **Cue Out:** `true` - Signals the start of the ad break
- **Cue In:** `false` - No cue in (preroll plays before content)
- **Out of Network:** `true` - Indicates content is out of network
- **Auto Return:** `true` - Automatically returns to main content
- **Duration:** Configurable (default 30 seconds)
- **Break Duration:** Matches the specified duration
- **Avail Number:** 1
- **Avails Expected:** 1

## Usage Examples

### Using cURL

```bash
# Create a 30-second preroll template
curl -X POST http://localhost:3001/api/scte35/templates/preroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Standard Preroll 30s",
    "duration": 30
  }'

# Create a 15-second preroll template with custom IDs
curl -X POST http://localhost:3001/api/scte35/templates/preroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Short Preroll 15s",
    "duration": 15,
    "programId": 100,
    "spliceId": 987654
  }'
```

### Using Frontend API

```typescript
import { scte35Api } from '../lib/api';

// Create preroll template
const createPreroll = async () => {
  try {
    const response = await scte35Api.createPrerollTemplate({
      name: 'Standard Preroll 30s',
      duration: 30
    });
    console.log('Preroll template created:', response.data);
  } catch (error) {
    console.error('Error creating preroll template:', error);
  }
};
```

### Using in Streams

Once created, the preroll marker can be inserted into a stream:

```bash
curl -X POST http://localhost:3001/api/streams/{channelId}/scte35 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "markerId": "preroll-marker-uuid"
  }'
```

## Use Cases

1. **Standard Preroll Ads:** Create consistent preroll ad breaks for all streams
2. **Custom Duration Prerolls:** Create prerolls of different lengths (15s, 30s, 60s)
3. **Program-Specific Prerolls:** Use different program IDs for different content types
4. **Automated Scheduling:** Use preroll templates in scheduled playout

## Best Practices

1. **Naming Convention:** Use descriptive names like "Preroll 30s Standard" or "Preroll 15s Short"
2. **Duration Standards:** Common durations are 15, 30, 45, and 60 seconds
3. **Program IDs:** Use consistent program IDs for similar content types
4. **Reusability:** Create templates once and reuse them across multiple streams

## Error Handling

### Duplicate Name Error

If a preroll marker with the same name already exists:

```json
{
  "error": "A preroll marker with this name already exists",
  "code": "DUPLICATE_ERROR",
  "status": 409
}
```

### Validation Error

If required fields are missing:

```json
{
  "error": "Validation error: Name is required for preroll template",
  "code": "VALIDATION_ERROR",
  "status": 400
}
```

## Integration with OvenMediaEngine

The preroll marker created by this template can be inserted into OME streams using the stream SCTE-35 insertion endpoint. The marker will trigger the preroll ad break before the main content plays.

## Notes

- Preroll templates are stored as regular SCTE-35 markers in the database
- The template metadata field identifies them as preroll templates
- Preroll markers use `cueOut: true` and `cueIn: false` to signal the start of an ad break
- The `autoReturn: true` setting ensures automatic return to main content after the break

