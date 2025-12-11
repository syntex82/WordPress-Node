# WordPress Node - Theme Shop Guide

## 🎨 How to Add Themes to the Theme Shop

The theme shop supports installing themes from GitHub repositories or local files. Here's how to add your own themes:

### Method 1: Add a GitHub Repository Theme

1. **Create a GitHub repository** for your theme
2. **Upload your theme files** to the repository with this structure:
   ```
   your-theme/
   ├── templates/
   │   ├── header.hbs
   │   ├── footer.hbs
   │   ├── home.hbs
   │   ├── single-post.hbs
   │   └── single-page.hbs
   ├── assets/
   │   ├── css/
   │   └── js/
   ├── theme.json
   └── README.md
   ```

3. **Edit the theme shop** file: `admin/src/components/ThemeShop.tsx`

4. **Add your theme** to the `SAMPLE_THEMES` array:
   ```typescript
   {
     id: 'my-awesome-theme',
     name: 'My Awesome Theme',
     author: 'Your Name',
     description: 'A beautiful theme for WordPress Node',
     thumbnail: 'https://images.unsplash.com/photo-xxx',
     downloadUrl: 'https://github.com/yourusername/your-theme/archive/refs/heads/main.zip',
     demoUrl: 'https://your-demo-site.com',
     rating: 5.0,
     downloads: 0,
     version: '1.0.0',
     price: 'Free',
   }
   ```

5. **Save the file** and the theme will appear in the shop!

### Method 2: Add a Local Theme

1. **Create your theme** in the `themes/` directory
2. **Add it to the theme shop** with `downloadUrl: 'LOCAL'`
3. Users can click "Scan Themes" to detect it

### Example: Modern Blog Theme

The **Modern Blog** theme is included as an example. It features:

- ✨ Beautiful, modern design
- 📱 Fully responsive layout
- 🎨 Clean typography
- ⚡ Smooth animations
- 🎯 SEO-friendly structure

**Location:** `themes/modern-blog/`

To activate it:
1. Go to Settings → Themes
2. Click "Scan Themes"
3. Click "Activate" on Modern Blog

### GitHub Download URL Format

For GitHub repositories, use this URL format:
```
https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.zip
```

Examples:
- `https://github.com/johndoe/my-theme/archive/refs/heads/main.zip`
- `https://github.com/janedoe/portfolio-theme/archive/refs/heads/master.zip`

### Theme Requirements

Every theme must have:

1. **theme.json** - Theme configuration
   ```json
   {
     "name": "Theme Name",
     "version": "1.0.0",
     "author": "Your Name",
     "description": "Theme description"
   }
   ```

2. **Required templates:**
   - `templates/home.hbs` - Homepage
   - `templates/single-post.hbs` - Blog post page
   - `templates/single-page.hbs` - Static page
   - `templates/header.hbs` - Header partial
   - `templates/footer.hbs` - Footer partial

3. **Optional:**
   - `assets/css/style.css` - Theme styles
   - `assets/js/main.js` - Theme JavaScript
   - `screenshot.png` - Theme thumbnail
   - `README.md` - Documentation

### Testing Your Theme

1. **Install** the theme via the shop or upload
2. **Activate** it in Settings → Themes
3. **View** your site to see the theme in action
4. **Test** on different devices and browsers

### Sharing Your Theme

To share your theme with others:

1. **Push to GitHub** - Make your repository public
2. **Add to the shop** - Edit ThemeShop.tsx with your GitHub URL
3. **Share the link** - Others can install with one click!

### Community Themes

Want to contribute a theme to the WordPress Node community?

1. Create an awesome theme
2. Push it to GitHub
3. Submit a pull request to add it to the default theme shop
4. Help others build beautiful sites!

## 🚀 Quick Start: Modern Blog Theme

The Modern Blog theme is ready to use right now:

1. Open admin panel: http://localhost:5174/admin/
2. Go to Settings → Themes
3. Click "Scan Themes"
4. Click "Activate" on Modern Blog
5. Visit your site to see it in action!

## 📝 Need Help?

- Check the theme requirements documentation in the admin panel
- Look at the Modern Blog theme as a reference
- Read the Handlebars documentation for template syntax
- Join the WordPress Node community for support

Happy theming! 🎨

