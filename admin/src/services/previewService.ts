/**
 * Preview Service
 * Generates HTML preview for customizations
 */

export interface PreviewSettings {
  layout?: string;
  backgroundColor?: string;
  textColor?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  customCSS?: string;
  [key: string]: any;
}

export const generatePreview = (settings: PreviewSettings, title: string = 'Preview'): string => {
  const {
    layout = 'default',
    backgroundColor = '#ffffff',
    textColor = '#000000',
    showHeader = true,
    showFooter = true,
    showSidebar = true,
    customCSS = '',
  } = settings;

  const sidebarClass = layout === 'sidebar-left' ? 'flex-row' : 'flex-row-reverse';
  const sidebarDisplay = showSidebar ? 'block' : 'none';
  const headerDisplay = showHeader ? 'block' : 'none';
  const footerDisplay = showFooter ? 'block' : 'none';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background-color: ${backgroundColor};
          color: ${textColor};
          line-height: 1.6;
        }

        header {
          display: ${headerDisplay};
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }

        header p {
          font-size: 14px;
          opacity: 0.9;
        }

        .container {
          display: flex;
          ${sidebarClass};
          min-height: calc(100vh - 120px);
        }

        main {
          flex: 1;
          padding: 30px;
          background-color: ${backgroundColor};
        }

        .content-block {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid #667eea;
        }

        .content-block h2 {
          color: #667eea;
          margin-bottom: 10px;
          font-size: 20px;
        }

        .content-block p {
          color: #666;
          margin-bottom: 10px;
        }

        aside {
          display: ${sidebarDisplay};
          width: 250px;
          background: #f8f9fa;
          padding: 20px;
          border-left: 1px solid #e0e0e0;
        }

        aside h3 {
          color: #667eea;
          margin-bottom: 15px;
          font-size: 16px;
        }

        aside ul {
          list-style: none;
        }

        aside li {
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        aside a {
          color: #667eea;
          text-decoration: none;
          font-size: 14px;
        }

        aside a:hover {
          text-decoration: underline;
        }

        footer {
          display: ${footerDisplay};
          background: #333;
          color: white;
          text-align: center;
          padding: 20px;
          margin-top: 30px;
        }

        footer p {
          font-size: 14px;
        }

        ${customCSS}
      </style>
    </head>
    <body>
      ${showHeader ? `
        <header>
          <h1>NodePress CMS</h1>
          <p>Live Preview of Your Customizations</p>
        </header>
      ` : ''}

      <div class="container">
        <main>
          <div class="content-block">
            <h2>Welcome to Your Site</h2>
            <p>This is a live preview of how your customizations will look on your pages and posts.</p>
            <p>The layout, colors, and styling you've configured are displayed here in real-time.</p>
          </div>

          <div class="content-block">
            <h2>Customization Features</h2>
            <p>✓ Layout: ${layout}</p>
            <p>✓ Background Color: ${backgroundColor}</p>
            <p>✓ Text Color: ${textColor}</p>
            <p>✓ Header: ${showHeader ? 'Visible' : 'Hidden'}</p>
            <p>✓ Footer: ${showFooter ? 'Visible' : 'Hidden'}</p>
            <p>✓ Sidebar: ${showSidebar ? 'Visible' : 'Hidden'}</p>
          </div>

          <div class="content-block">
            <h2>Ready to Deploy</h2>
            <p>Once you're satisfied with your customizations, save them and they'll be applied to your live site.</p>
          </div>
        </main>

        ${showSidebar ? `
          <aside>
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">Home</a></li>
              <li><a href="#">About</a></li>
              <li><a href="#">Services</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </aside>
        ` : ''}
      </div>

      ${showFooter ? `
        <footer>
          <p>&copy; 2024 NodePress CMS. All rights reserved.</p>
        </footer>
      ` : ''}
    </body>
    </html>
  `;
};

