# Looker Custom Table Visualization with CSS

This is a custom Looker visualization that provides a standard table view with an additional **Custom CSS** option, allowing for deep styling flexibility directly from the Looker Explore UI.

## Features
- **Standard Table Configuration**:
    - Show/Hide Row Numbers.
    - Standard Dimension/Measure columns.
- **Custom CSS**:
    - Inject raw CSS to style the table (e.g., specific branding, conditional formatting overrides, fonts).

## Installation

1. **Host the files**:
   Host the `looker_custom_table.js` and `manifest.json` files on a web server accessible by your Looker instance (e.g., GitHub Pages, S3, or a dedicated CDN).

2. **Add to Looker**:
   - Go to **Admin** > **Platform** > **Visualizations**.
   - Click **Add Visualization**.
   - **ID**: `custom_table`
   - **Label**: `Custom Table with CSS`
   - **Main**: `https://your-host/looker_custom_table.js` (URL to your hosted JS file)

## Usage

1. Open an Explore in Looker.
2. Select the **Custom Table with CSS** visualization.
3. Open the **Edit** menu (gear icon).
4. **Row Numbers**: Toggle on/off.
5. **Custom CSS**: Paste your CSS code.
   - Example:
     ```css
     table {
       font-family: 'Courier New';
     }
     th {
       background-color: #333;
       color: white;
     }
     tr:nth-child(even) {
       background-color: #f2f2f2;
     }
     ```

## Local Development
open `demo_harness.html` in your browser to test changes locally.
