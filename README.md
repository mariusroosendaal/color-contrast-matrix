# Color Contrast Matrix

Generate WCAG contrast ratio matrices from your color variables.

## What it does

Creates a grid showing contrast ratios between background and text color combinations. Each cell displays the ratio and WCAG compliance level (AAA, AA, AA Large, or DNP).

## Usage

1. Run the plugin (requires color variables in your file)
2. Select which color groups to include as backgrounds
3. Optionally enable "Distinct rows and columns" to use different groups for text
4. Configure display options (which compliance levels to show)
5. Set a base color for alpha blending calculations
6. Click generate

## Display options

- **AAA** - Contrast ≥ 7:1
- **AA** - Contrast ≥ 4.5:1
- **AA Large** - Contrast ≥ 3:1 (for large text)
- **DNP** - Does not pass (< 3:1)
- **Show full name** - Display full variable paths

## Requirements

- Color variables organized with `/` separators (e.g., `brand/primary`, `neutral/gray-500`)

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```
