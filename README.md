# Color Contrast Matrix

Generate WCAG contrast ratio matrices from your color variables.

## What it does

Creates a grid showing contrast ratios between background and text color combinations. Each cell displays the ratio and WCAG compliance level (AAA, AA, AA Large, or DNP).

## Features

- **Variable mode support** - Select light/dark mode when collections have multiple modes
- **Settings persistence** - Display preferences and base color save automatically
- **WCAG compliance levels** - AAA, AA, AA Large, and DNP indicators
- **Flexible grid options** - Same colors for both axes or distinct rows/columns

## Usage

1. Run the plugin (requires color variables in your file)
2. If your collections have multiple modes (e.g., light/dark), select which mode to use
3. Select which color groups to include as backgrounds
4. Optionally enable "Distinct rows and columns" to use different groups for text colors
5. Click "Generate matrix"

### Settings

Click the gear icon to configure:

- **Display options** - Which compliance levels to show (AAA, AA, AA Large, DNP)
- **Show full name** - Display full variable paths instead of shortened names
- **Base color** - Background color for alpha blending calculations (default: #FFFFFF)

Settings persist automatically across sessions.

## WCAG Compliance Levels

- **AAA** - Contrast ≥ 7:1
- **AA** - Contrast ≥ 4.5:1
- **AA Large** - Contrast ≥ 3:1 (for large text)
- **DNP** - Does not pass (< 3:1)

## Requirements

- Color variables organized with `/` separators (e.g., `brand/primary`, `neutral/gray-500`)

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```
