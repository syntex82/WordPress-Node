# Certificate Template API Documentation

## Overview
This document describes the API endpoints for managing certificate templates in the LMS system.

## Base URL
All endpoints are prefixed with: `/api/lms/admin/certificate-templates`

## Authentication
All endpoints require:
- JWT authentication
- Admin or Instructor role

## Endpoints

### 1. List All Templates

**GET** `/api/lms/admin/certificate-templates`

Returns all certificate templates.

**Response:**
```json
[
  {
    "id": "clx123abc",
    "name": "Professional Blue",
    "isDefault": true,
    "logoUrl": "/uploads/logo.png",
    "primaryColor": "#6366f1",
    "secondaryColor": "#a5b4fc",
    "backgroundColor": "#f8fafc",
    "textColor": "#1e293b",
    "accentColor": "#6366f1",
    "titleFont": "Helvetica-Bold",
    "bodyFont": "Helvetica",
    "titleFontSize": 42,
    "nameFontSize": 36,
    "courseFontSize": 28,
    "bodyFontSize": 14,
    "titleText": "Certificate of Completion",
    "subtitleText": "This is to certify that",
    "completionText": "has successfully completed the course",
    "brandingText": "NodePress LMS",
    "showBorder": true,
    "showLogo": false,
    "showBranding": true,
    "borderWidth": 3,
    "borderStyle": "double",
    "createdAt": "2024-01-04T12:00:00Z",
    "updatedAt": "2024-01-04T12:00:00Z"
  }
]
```

---

### 2. Get Single Template

**GET** `/api/lms/admin/certificate-templates/:id`

Returns a specific template by ID.

**Parameters:**
- `id` (path): Template ID

**Response:**
```json
{
  "id": "clx123abc",
  "name": "Professional Blue",
  "isDefault": true,
  // ... all template fields
}
```

**Error Responses:**
- `404 Not Found`: Template not found

---

### 3. Get Default Template

**GET** `/api/lms/admin/certificate-templates/default`

Returns the current default template.

**Response:**
```json
{
  "id": "clx123abc",
  "name": "Professional Blue",
  "isDefault": true,
  // ... all template fields
}
```

**Note:** If no default template exists, one will be created automatically.

---

### 4. Create Template

**POST** `/api/lms/admin/certificate-templates`

Creates a new certificate template.

**Request Body:**
```json
{
  "name": "Modern Gold",
  "isDefault": false,
  "logoUrl": "/uploads/logo.png",
  "primaryColor": "#fbbf24",
  "secondaryColor": "#fef3c7",
  "backgroundColor": "#ffffff",
  "textColor": "#1e293b",
  "accentColor": "#fbbf24",
  "titleFont": "Times-Bold",
  "bodyFont": "Times-Roman",
  "titleFontSize": 48,
  "nameFontSize": 40,
  "courseFontSize": 32,
  "bodyFontSize": 14,
  "titleText": "Certificate of Excellence",
  "subtitleText": "Awarded to",
  "completionText": "for outstanding achievement in",
  "brandingText": "Acme University",
  "showBorder": true,
  "showLogo": true,
  "showBranding": true,
  "borderWidth": 2,
  "borderStyle": "single"
}
```

**Response:**
```json
{
  "id": "clx456def",
  "name": "Modern Gold",
  // ... all template fields
}
```

**Validation:**
- `name` is required
- Color fields must be valid hex colors
- Font sizes must be positive numbers
- Border width must be between 1-10

---

### 5. Update Template

**PUT** `/api/lms/admin/certificate-templates/:id`

Updates an existing template.

**Parameters:**
- `id` (path): Template ID

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "primaryColor": "#3b82f6",
  "titleFontSize": 44
  // ... any fields to update
}
```

**Response:**
```json
{
  "id": "clx456def",
  "name": "Updated Template Name",
  // ... all template fields
}
```

**Error Responses:**
- `404 Not Found`: Template not found

---

### 6. Delete Template

**DELETE** `/api/lms/admin/certificate-templates/:id`

Deletes a template.

**Parameters:**
- `id` (path): Template ID

**Response:**
```json
{
  "message": "Template deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Cannot delete default template
- `404 Not Found`: Template not found

---

### 7. Set Default Template

**PATCH** `/api/lms/admin/certificate-templates/:id/set-default`

Sets a template as the default.

**Parameters:**
- `id` (path): Template ID

**Response:**
```json
{
  "id": "clx456def",
  "name": "Modern Gold",
  "isDefault": true,
  // ... all template fields
}
```

**Note:** This automatically unsets the previous default template.

**Error Responses:**
- `404 Not Found`: Template not found

---

## Data Types

### CertificateTemplate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | - | Auto-generated UUID |
| name | string | Yes | Template name |
| isDefault | boolean | No | Whether this is the default template |
| logoUrl | string | No | URL to logo image |
| primaryColor | string | Yes | Primary color (hex) |
| secondaryColor | string | Yes | Secondary color (hex) |
| backgroundColor | string | Yes | Background color (hex) |
| textColor | string | Yes | Text color (hex) |
| accentColor | string | Yes | Accent color (hex) |
| titleFont | string | Yes | Font for title |
| bodyFont | string | Yes | Font for body text |
| titleFontSize | number | Yes | Title font size (20-72) |
| nameFontSize | number | Yes | Name font size (16-60) |
| courseFontSize | number | Yes | Course font size (14-48) |
| bodyFontSize | number | Yes | Body font size (10-24) |
| titleText | string | Yes | Main title text |
| subtitleText | string | Yes | Subtitle text |
| completionText | string | Yes | Completion text |
| brandingText | string | Yes | Branding text |
| showBorder | boolean | Yes | Show border |
| showLogo | boolean | Yes | Show logo |
| showBranding | boolean | Yes | Show branding |
| borderWidth | number | Yes | Border width (1-10) |
| borderStyle | string | Yes | Border style (single/double) |
| createdAt | datetime | - | Creation timestamp |
| updatedAt | datetime | - | Last update timestamp |

### Available Fonts
- `Helvetica`
- `Helvetica-Bold`
- `Times-Roman`
- `Times-Bold`
- `Courier`
- `Courier-Bold`

### Border Styles
- `single`: Single line border
- `double`: Double line border

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get all templates
const templates = await fetch('/api/lms/admin/certificate-templates', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => r.json());

// Create template
const newTemplate = await fetch('/api/lms/admin/certificate-templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Template',
    primaryColor: '#6366f1',
    // ... other fields
  })
}).then(r => r.json());

// Set as default
await fetch(`/api/lms/admin/certificate-templates/${templateId}/set-default`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Notes

- Templates are applied when certificates are generated
- Existing certificates are not affected by template changes
- At least one template must exist (default is created automatically)
- Default template cannot be deleted
- Logo URLs should point to accessible image files
- Colors must be valid hex codes (e.g., #6366f1)

