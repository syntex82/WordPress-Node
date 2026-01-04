# Certificate Customization Guide

## Overview
The certificate customization system allows you to create and manage multiple certificate templates with full control over design, colors, fonts, and branding.

## Accessing Certificate Templates

1. **Navigate to LMS Section**
   - Log in to the admin panel
   - Click on "LMS" in the main navigation

2. **Access Certificate Templates**
   - In the LMS section, look for "Certificate Templates" in the navigation
   - Or navigate directly to: `/lms/certificate-templates`

## Creating a New Template

### Step 1: Create Template
1. Click the "New Template" button
2. Enter a template name (e.g., "Professional Blue", "Modern Gold")

### Step 2: Configure Basic Settings
- **Template Name**: Give your template a descriptive name
- **Set as Default**: Check this to make it the default template for all new certificates
- **Logo URL**: Upload a logo to the Media Library and paste the URL here

### Step 3: Customize Colors
Configure the following colors using the color pickers:

- **Primary Color**: Main accent color (used for titles and borders)
- **Secondary Color**: Supporting color (used for decorative elements)
- **Background Color**: Certificate background (usually white or light color)
- **Text Color**: Main text color (usually dark for readability)
- **Accent Color**: Additional accent color for highlights

**Color Tips:**
- Use high contrast between background and text colors
- Keep it professional - avoid too many bright colors
- Test print preview to ensure colors look good on paper

### Step 4: Typography Settings
Customize fonts and sizes:

**Font Families:**
- **Title Font**: Font for the main "Certificate of Completion" heading
- **Body Font**: Font for all other text

**Available Fonts:**
- Helvetica (clean, modern)
- Helvetica-Bold (bold version)
- Times-Roman (classic, formal)
- Times-Bold (bold classic)
- Courier (typewriter style)
- Courier-Bold (bold typewriter)

**Font Sizes:**
- **Title Size**: Main heading (20-72pt, default: 42pt)
- **Name Size**: Student name (16-60pt, default: 36pt)
- **Course Size**: Course title (14-48pt, default: 28pt)
- **Body Size**: Other text (10-24pt, default: 14pt)

### Step 5: Text Content
Customize the text that appears on certificates:

- **Title Text**: Main heading (default: "Certificate of Completion")
- **Subtitle Text**: Text before student name (default: "This is to certify that")
- **Completion Text**: Text after student name (default: "has successfully completed the course")
- **Branding Text**: Your organization name (default: "NodePress LMS")

**Examples:**
```
Title: "Certificate of Achievement"
Subtitle: "Awarded to"
Completion: "for outstanding performance in"
Branding: "Acme University"
```

### Step 6: Display Options
Toggle visual elements:

- **Show Border**: Display decorative border around certificate
  - **Border Width**: Thickness (1-10pt)
  - **Border Style**: Single or Double line
- **Show Logo**: Display uploaded logo
- **Show Branding**: Display branding text at bottom

### Step 7: Save Template
Click "Save Template" to create your custom template

## Managing Templates

### Viewing Templates
- All templates are displayed in a grid view
- Each card shows:
  - Template name
  - Default indicator (if applicable)
  - Color preview
  - Action buttons

### Editing Templates
1. Click the "Edit" button on any template card
2. Make your changes
3. Click "Save Template"

### Setting Default Template
1. Click the star icon on any template
2. This template will be used for all new certificates
3. Only one template can be default at a time

### Deleting Templates
1. Click the trash icon on any template
2. Confirm deletion
3. **Note**: You cannot delete the default template

## Using Templates

### Automatic Application
- When a student completes a course, the certificate is automatically generated using the default template
- No additional configuration needed

### Testing Your Template
1. Enroll in a test course
2. Complete all lessons and quizzes
3. View your certificate
4. Verify the design matches your template

## Best Practices

### Design Tips
1. **Keep it Professional**
   - Use classic fonts for formal certificates
   - Stick to 2-3 colors maximum
   - Ensure good contrast for readability

2. **Logo Guidelines**
   - Use high-resolution images (300 DPI minimum)
   - PNG format with transparent background works best
   - Recommended size: 200x200 pixels or larger

3. **Color Schemes**
   - **Professional**: Navy blue (#1e3a8a) + Gold (#fbbf24)
   - **Modern**: Indigo (#6366f1) + Light gray (#f1f5f9)
   - **Classic**: Black (#000000) + White (#ffffff)
   - **Academic**: Burgundy (#991b1b) + Cream (#fef3c7)

4. **Typography**
   - Use Helvetica or Times for professional look
   - Keep title size large (40-48pt)
   - Ensure body text is readable (12-14pt minimum)

### Testing Checklist
- [ ] Colors have good contrast
- [ ] Text is readable at all sizes
- [ ] Logo displays correctly (if used)
- [ ] Border looks good (if enabled)
- [ ] All text content is spelled correctly
- [ ] Certificate prints well (test print)
- [ ] Design looks professional

## Troubleshooting

### Logo Not Showing
- Verify the logo URL is correct
- Ensure "Show Logo" is enabled
- Check that the image file is accessible
- Try uploading to Media Library first

### Colors Look Different in PDF
- PDF colors may appear slightly different than on screen
- Test print to verify final appearance
- Adjust colors if needed

### Text Overlapping
- Reduce font sizes if text overlaps
- Adjust spacing by changing font sizes
- Keep text content concise

### Template Not Applying
- Verify the template is set as default
- Check that the certificate was generated after template creation
- Old certificates use the template from when they were created

## Advanced Customization

### Multiple Templates
Create different templates for:
- Different course types (technical, business, creative)
- Different achievement levels (completion, excellence, mastery)
- Different organizations or departments
- Seasonal or special event certificates

### Template Naming Convention
Use descriptive names:
- "Professional Blue - Standard"
- "Gold Excellence - Advanced"
- "Modern Minimal - Beginner"
- "Corporate Red - Executive"

## Support

If you encounter any issues:
1. Check this guide for solutions
2. Verify all settings are correct
3. Test with a simple template first
4. Contact support with template details and screenshots

---

**Note**: Changes to templates only affect new certificates. Existing certificates retain their original design.

