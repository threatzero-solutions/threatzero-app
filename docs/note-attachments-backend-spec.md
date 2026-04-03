# Note Attachments — Backend Spec

## Overview

Allow file attachments on notes. The frontend already uploads files via the existing presigned URL flow and sends S3 keys when creating a note. The backend needs to accept those keys, persist them, and return attachment metadata on read.

## Model change

Add an `attachments` field to notes. Each attachment:

```
{
  "key": "string",       // S3 object key (from presigned upload)
  "url": "string",       // presigned GET URL, backend-populated on read
  "filename": "string"   // original filename (from presigned upload record)
}
```

`attachments` defaults to `[]`. Existing notes without attachments should continue to serialize normally — the frontend treats the field as optional.

## Endpoint changes

### `POST /{resource}/submissions/{id}/notes`

Applies to all three resource types: `tips`, `assessments`, `violent-incident-reports`.

**New request body:**

```json
{
  "value": "optional note text",
  "attachments": [
    { "key": "user-uploads/abc123.mp4", "filename": "surveillance.mp4" }
  ]
}
```

- `value` — optional, string. Note text.
- `attachments` — optional, array of `{ key: string, filename: string }`. The frontend sends both the S3 key and the original filename.
- **Validation**: at least one of `value` (non-empty) or `attachments` (non-empty array) must be present. Reject with 400 if both are absent/empty.

**Response**: same `Note` shape as before, now including `attachments`.

### `GET /{resource}/submissions/{id}/notes/`

No signature changes. Each note in the response should include an `attachments` array with presigned GET URLs. Example:

```json
{
  "id": "...",
  "value": "Here's the footage",
  "user": { ... },
  "createdOn": "...",
  "updatedOn": "...",
  "attachments": [
    {
      "key": "uploads/abc123.pdf",
      "url": "https://s3.../uploads/abc123.pdf?X-Amz-...",
      "filename": "incident-report.pdf"
    }
  ]
}
```

Notes with no attachments should return `attachments: []` (or omit the field — frontend handles both).

### Presigned upload endpoints

No changes. The frontend reuses the existing endpoints:

```
POST /tips/submissions/presigned-upload-urls
POST /assessments/submissions/presigned-upload-urls
POST /violent-incident-reports/submissions/presigned-upload-urls
```

## What the frontend sends (exact shapes)

**File upload request** (existing, unchanged):

```json
POST /tips/submissions/presigned-upload-urls
{
  "files": [
    { "filename": "photo.jpg", "fileId": "photo.jpg_204800", "mimeType": "image/jpeg" }
  ]
}
```

**Note creation** (updated):

```json
POST /tips/submissions/{tipId}/notes
{
  "value": "See attached surveillance footage",
  "attachments": [
    { "key": "user-uploads/abc123.mp4", "filename": "surveillance.mp4" }
  ]
}
```

Either field may be absent. A files-only note sends no `value`. A text-only note sends no `attachments`. The backend must handle both cases.

## Not in scope

- Deleting individual attachments from saved notes
- Editing attachments after creation
- Querying notes by attachment metadata
