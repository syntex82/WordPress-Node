# Theme Customizer - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the Advanced Theme Customizer feature, including export/import, presets, and live preview functionality.

## Prerequisites
- Application running locally or deployed
- Admin or Editor user account
- Access to the admin panel

## Test Cases

### 1. Page Customization
**Steps:**
1. Navigate to Admin Panel → Pages
2. Click the "Customize" button on any page
3. Verify the PageCustomizationPanel opens
4. Test the following:
   - [ ] Layout selector changes layout
   - [ ] Color pickers update colors
   - [ ] Visibility toggles work (header, footer, sidebar)
   - [ ] Custom CSS editor accepts input
   - [ ] Save button persists changes
   - [ ] Cancel button closes without saving

**Expected Result:** All customizations are saved and applied to the page

### 2. Post Customization
**Steps:**
1. Navigate to Admin Panel → Posts
2. Click the "Customize" button on any post
3. Verify the PostCustomizationPanel opens
4. Test the following:
   - [ ] Layout selector works
   - [ ] Display options toggle (author, date, category, tags, related posts)
   - [ ] Related posts count input works
   - [ ] Color pickers update colors
   - [ ] Custom CSS editor accepts input
   - [ ] Save button persists changes

**Expected Result:** All post customizations are saved and applied

### 3. Export Functionality
**Steps:**
1. Navigate to Admin Panel → Pages or Posts
2. Click the "Export/Import" button (if available in toolbar)
3. In the ExportImportPanel:
   - [ ] Click "Export Pages" and verify JSON file downloads
   - [ ] Click "Export Posts" and verify JSON file downloads
   - [ ] Click "Export All" and verify JSON file downloads
4. Verify exported JSON contains:
   - [ ] Correct structure with version and exportedAt
   - [ ] All customization data (layout, colors, CSS, etc.)
   - [ ] Page/post metadata

**Expected Result:** JSON files download successfully with correct data

### 4. Import Functionality
**Steps:**
1. In the ExportImportPanel:
   - [ ] Select a previously exported JSON file
   - [ ] Click "Import" button
   - [ ] Verify success message appears
   - [ ] Verify customizations are imported
2. Test with invalid file:
   - [ ] Try importing a non-JSON file
   - [ ] Verify error message appears

**Expected Result:** Valid imports succeed, invalid imports show errors

### 5. Customization Presets
**Steps:**
1. Navigate to Admin Panel → Pages or Posts
2. Click the "Presets" button (if available)
3. In the PresetsPanel:
   - [ ] Verify all 8 presets load
   - [ ] Click "Apply Preset" on each preset
   - [ ] Verify settings update in customization panel
4. Test preset categories:
   - [ ] "Minimal" preset removes sidebar
   - [ ] "Sidebar Right" preset shows sidebar on right
   - [ ] "Dark Mode" preset changes colors
   - [ ] "Blog Focused" preset shows author/date/tags
   - [ ] "Landing Page" preset hides header/footer
   - [ ] "Product Showcase" preset optimizes for products
   - [ ] "Course Page" preset optimizes for courses

**Expected Result:** All presets apply correctly and update customization settings

### 6. Live Preview
**Steps:**
1. In the customization panel:
   - [ ] Look for "Preview" button or icon
   - [ ] Click to open LivePreviewPanel
2. Verify preview shows:
   - [ ] Current layout
   - [ ] Current colors
   - [ ] Header/footer/sidebar visibility
   - [ ] Custom CSS applied
3. Test fullscreen mode:
   - [ ] Click fullscreen icon
   - [ ] Verify preview expands to fullscreen
   - [ ] Click minimize to return to normal view
4. Test real-time updates:
   - [ ] Change a color in customization panel
   - [ ] Verify preview updates immediately
   - [ ] Change layout
   - [ ] Verify preview updates immediately

**Expected Result:** Preview displays correctly and updates in real-time

### 7. API Endpoints
**Steps:**
1. Test export endpoints:
   - [ ] GET /api/customizations/export/pages
   - [ ] GET /api/customizations/export/posts
   - [ ] GET /api/customizations/export/all
2. Test import endpoint:
   - [ ] POST /api/customizations/import with valid data
   - [ ] POST /api/customizations/import with invalid data
3. Test preset endpoints:
   - [ ] GET /api/customizations/presets
   - [ ] GET /api/customizations/presets/category/page
   - [ ] GET /api/customizations/presets/category/post
   - [ ] GET /api/customizations/presets/:id
   - [ ] GET /api/customizations/presets/:id/settings
   - [ ] POST /api/customizations/presets (create custom preset)
   - [ ] DELETE /api/customizations/presets/:id (delete custom preset)

**Expected Result:** All endpoints return correct data and status codes

### 8. Security & Permissions
**Steps:**
1. Test with different user roles:
   - [ ] ADMIN can access all customization features
   - [ ] EDITOR can access customization features
   - [ ] AUTHOR cannot access customization features
   - [ ] SUBSCRIBER cannot access customization features
2. Test JWT authentication:
   - [ ] Requests without token are rejected
   - [ ] Requests with invalid token are rejected
   - [ ] Requests with valid token are accepted

**Expected Result:** Only authorized users can access features

### 9. Error Handling
**Steps:**
1. Test error scenarios:
   - [ ] Import non-existent file
   - [ ] Import corrupted JSON
   - [ ] Apply preset to non-existent page
   - [ ] Delete non-existent customization
   - [ ] Network errors are handled gracefully
2. Verify error messages:
   - [ ] Error messages are clear and helpful
   - [ ] Toast notifications appear for errors
   - [ ] No console errors or warnings

**Expected Result:** All errors are handled gracefully with helpful messages

### 10. Performance
**Steps:**
1. Test with large datasets:
   - [ ] Export 100+ pages/posts
   - [ ] Import large JSON file
   - [ ] Load presets with many customizations
2. Verify performance:
   - [ ] Export completes in < 5 seconds
   - [ ] Import completes in < 10 seconds
   - [ ] Presets load in < 2 seconds
   - [ ] Live preview updates in < 500ms

**Expected Result:** All operations complete within acceptable timeframes

## Test Results Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Page Customization | [ ] | |
| Post Customization | [ ] | |
| Export Functionality | [ ] | |
| Import Functionality | [ ] | |
| Customization Presets | [ ] | |
| Live Preview | [ ] | |
| API Endpoints | [ ] | |
| Security & Permissions | [ ] | |
| Error Handling | [ ] | |
| Performance | [ ] | |

## Known Issues
(To be filled during testing)

## Recommendations
(To be filled during testing)

