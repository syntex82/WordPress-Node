/**
 * Theme Requirements Component
 * Displays theme structure requirements and guidelines
 */

import { FiFolder, FiFile, FiCode, FiImage, FiCheckCircle } from 'react-icons/fi';

export default function ThemeRequirements() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <FiCheckCircle className="mr-2 text-blue-600" size={24} />
        Theme Requirements
      </h3>

      <div className="space-y-6">
        {/* Required Structure */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Required File Structure</h4>
          <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
            <div className="flex items-center mb-1">
              <FiFolder className="mr-2 text-yellow-600" />
              <span className="font-semibold">your-theme-name/</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center">
                <FiFile className="mr-2 text-blue-600" />
                <span className="font-semibold text-red-600">theme.json</span>
                <span className="ml-2 text-xs text-gray-500">(required)</span>
              </div>
              <div className="flex items-center">
                <FiImage className="mr-2 text-green-600" />
                <span>screenshot.png</span>
                <span className="ml-2 text-xs text-gray-500">(optional, 1200x900px recommended)</span>
              </div>
              <div className="flex items-center">
                <FiFolder className="mr-2 text-yellow-600" />
                <span className="font-semibold">templates/</span>
                <span className="ml-2 text-xs text-gray-500">(required)</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center">
                  <FiCode className="mr-2 text-purple-600" />
                  <span className="font-semibold text-red-600">home.hbs</span>
                  <span className="ml-2 text-xs text-gray-500">(required)</span>
                </div>
                <div className="flex items-center">
                  <FiCode className="mr-2 text-purple-600" />
                  <span className="font-semibold text-red-600">single-post.hbs</span>
                  <span className="ml-2 text-xs text-gray-500">(required)</span>
                </div>
                <div className="flex items-center">
                  <FiCode className="mr-2 text-purple-600" />
                  <span className="font-semibold text-red-600">single-page.hbs</span>
                  <span className="ml-2 text-xs text-gray-500">(required)</span>
                </div>
                <div className="flex items-center">
                  <FiCode className="mr-2 text-purple-600" />
                  <span>archive.hbs</span>
                  <span className="ml-2 text-xs text-gray-500">(optional)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* theme.json Format */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">theme.json Format</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
            <pre className="text-sm">{`{
  "name": "Your Theme Name",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Theme description",
  "thumbnail": "/themes/your-theme/screenshot.png",
  "templates": [
    "home",
    "single-post",
    "single-page",
    "archive"
  ],
  "supports": {
    "featuredImages": true,
    "customFields": true,
    "widgets": false
  }
}`}</pre>
          </div>
        </div>

        {/* Template Variables */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Available Template Variables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded p-3">
              <h5 className="font-medium text-sm mb-2">Site Variables</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">{'{{site.site_name}}'}</code></li>
                <li><code className="bg-gray-100 px-1 rounded">{'{{site.site_description}}'}</code></li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded p-3">
              <h5 className="font-medium text-sm mb-2">Post/Page Variables</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">{'{{post.title}}'}</code></li>
                <li><code className="bg-gray-100 px-1 rounded">{'{{post.content}}'}</code></li>
                <li><code className="bg-gray-100 px-1 rounded">{'{{post.author.name}}'}</code></li>
                <li><code className="bg-gray-100 px-1 rounded">{'{{post.featuredImage}}'}</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Packaging Instructions */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Packaging Your Theme</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Create a folder with your theme name (lowercase, no spaces, use hyphens)</li>
            <li>Add all required files: theme.json and templates folder</li>
            <li>Optionally add a screenshot.png (1200x900px recommended)</li>
            <li>Compress the theme folder into a ZIP file</li>
            <li>Upload the ZIP file using the "Upload Theme" button above</li>
          </ol>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            <li>Theme folder name must match the slug in theme.json</li>
            <li>All template files must use .hbs extension (Handlebars)</li>
            <li>Templates must be in the templates/ subdirectory</li>
            <li>Use {'{{{'} for raw HTML output in templates</li>
            <li>Cannot delete the currently active theme</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

