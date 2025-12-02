# ERP UI Design System

## Color Scheme

- Base palette: Indigo, Blue, Teal, Slate neutrals
- Semantic roles
  - Primary: brand actions, highlights
  - Secondary: secondary actions, tags
  - Tertiary: success/positive indicators
  - Error: failures, destructive actions
  - Surface: backgrounds, cards
  - On-*: text colors that contrast with their surfaces
- Accessibility
  - Maintain 4.5:1 contrast for body text on surfaces
  - Maintain 3:1 for large text (≥18pt) and icons
  - Use `onSurfaceVariant` for secondary text to ensure legibility

## Spacing and Layout

- Spacing scale: 4, 8, 12, 16, 24
- Page padding: 12 horizontal, 8 vertical
- Card padding: 12 internal
- Grid responsiveness
  - ≤600px: 1 column
  - 601–900px: 2 columns
  - ≥901px: 3 columns

## Components

- Metric Card
  - Icon block: 36px square, 8px radius, tinted with role color
  - Title: 12pt, regular, `onSurface`
  - Value: 18pt, bold
  - Subtitle: 11pt, `onSurfaceVariant`
- Section Header
  - 16pt, semibold, `onSurface`
  - 12px spacing above/below
- Status Indicators
  - Positive: `tertiary`
  - Negative: `error`
  - Neutral: `secondary`

## ERP Patterns

- Dense but scannable grids
  - Compact metric cards with clear hierarchy
- Data entry workflows
  - Left-to-right flow: inputs → validation → actions
- Process states
  - Pending, In Progress, Completed, Failed
  - Use clear color semantics and concise labels

## Analytics Page Mockup (Updated)

- Header row
  - Title left, period dropdown right
- Metrics grid (responsive 1/2/3 columns)
  - Today’s Sales, Profit, Orders, Total Revenue, Total Profit, Expenses, Profit Margin
- Monthly Net Profit section
  - List of two latest months with revenue/expenses bar and net profit value
- Recent Days section
  - List of last 7 days with left color bar and trend icon

## Implementation Plan

1. Analytics screen
   - Replace hard-coded colors with `colorScheme` roles
   - Standardize spacing and responsive grid
   - Use `withValues(alpha: …)` for overlays
2. Navigation and menu
   - Apply consistent active/hover states and spacing
3. Forms and controls
   - Standardize input padding, label sizes, validation hints
4. Dashboards
   - Convert summary tiles to Metric Cards across pages
5. Accessibility
   - Audit contrast and increase text size where needed
6. Iteration
   - Review with stakeholders, tune palette and spacing

