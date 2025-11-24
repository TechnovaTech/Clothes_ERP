# Template Builder & Invoice System Documentation

## 📋 Overview

The Template Builder and Invoice System is a comprehensive solution for creating, customizing, and rendering dynamic invoice templates in the Fashion Store ERP. It provides a visual drag-and-drop interface for designing templates and a powerful rendering engine that merges template designs with actual business data.

## 🚀 Quick Start

- Open the builder at `http://localhost:3000/tenant/template-builder`.
- Or navigate to `Tenant → Settings → Bill Template Settings` and click `Open Template Builder`.
- Start with the default template, customize elements, preview with sample data, then save.

## 🎯 Key Features

- **Visual Template Designer** - Drag-and-drop interface for building custom templates
- **Dynamic Data Binding** - Placeholder system for automatic data injection
- **Multiple Template Types** - Support for invoices, reports, certificates, and emails
- **Business-Specific Templates** - Pre-built templates for retail and restaurant businesses
- **Real-time Preview** - Live preview of template with sample data
- **Element Management** - Add, edit, delete, and duplicate template elements
- **Responsive Design** - Templates work on desktop and mobile devices
- **Multi-Tenant Support** - Each store has isolated templates
- **PDF Generation** - Convert templates to printable HTML/PDF format

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Template Builder UI                       │
│  (app/tenant/template-builder/page.tsx)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐    ┌────────▼──────────┐
│  Template Engine │    │  Default Templates│
│  (lib/template-  │    │  (lib/default-    │
│   engine.ts)     │    │   templates.ts)   │
└────────┬─────────┘    └───────────────────┘
         │
    ┌────▼─────────────────────────────────┐
    │      API Routes                      │
    ├──────────────────────────────────────┤
    │ • /api/templates (CRUD)              │
    │ • /api/templates/render (Render)     │
    │ • /api/bill-pdf-custom (Generate)    │
    │ • /api/bill-pdf (Legacy)             │
    └────────┬──────────────────────────────┘
             │
    ┌────────▼──────────────────┐
    │   MongoDB Database        │
    │   (templates collection)  │
    └───────────────────────────┘
```

---

## 📊 Data Models

### Template Structure

```typescript
interface Template {
  id: string                          // Unique template ID
  tenantId: string                    // Store/Tenant identifier
  templateType: 'invoice' | 'report' | 'certificate' | 'email' | 'layout'
  name: string                        // Template name
  canvasJSON: {
    elements: TemplateElement[]       // Array of template elements
    settings: {
      pageSize: 'A4' | 'A5' | 'Letter'
      orientation: 'portrait' | 'landscape'
      margins: {
        top: number
        right: number
        bottom: number
        left: number
      }
    }
  }
  isDefault: boolean                  // Is this the default template?
  createdAt: Date
  updatedAt: Date
}
```

### Template Element Structure

```typescript
interface TemplateElement {
  id: string                          // Unique element ID
  type: 'text' | 'image' | 'table' | 'placeholder' | 'divider' | 'spacer'
  content?: string                    // Static content
  placeholder?: string                // Dynamic placeholder (e.g., {{tenant.companyName}})
  style?: {
    fontSize?: number
    fontWeight?: 'normal' | 'bold'
    textAlign?: 'left' | 'center' | 'right'
    color?: string
    backgroundColor?: string
    borderColor?: string
    padding?: number
    margin?: number
    width?: string
    height?: string
  }
  position?: {
    x: number                         // X coordinate in pixels
    y: number                         // Y coordinate in pixels
  }
  size?: {
    width: number                     // Width in pixels
    height: number                    // Height in pixels
  }
  tableConfig?: {
    rows: number
    columns: number
    headers: string[]
    headerBg: string
    headerColor: string
    borderWidth: number
  }
  dividerType?: 'horizontal' | 'vertical'
}
```

### Template Data Structure

```typescript
interface TemplateData {
  tenant?: {
    companyName?: string
    address?: string
    phone?: string
    email?: string
    gst?: string
    logo?: string
  }
  user?: {
    name?: string
    email?: string
    role?: string
  }
  invoice?: {
    billNo?: string
    total?: number
    subtotal?: number
    tax?: number
    discount?: number
    date?: string
    items?: any[]
  }
  customer?: {
    name?: string
    phone?: string
    address?: string
    email?: string
  }
  [key: string]: any                  // Additional custom data
}
```

---

## 🔄 Workflow

### 1. Template Creation Workflow

```
User Opens Template Builder
        ↓
Load Existing Template or Create Default
        ↓
Display Canvas with Elements
        ↓
User Adds/Edits Elements
        ↓
Real-time Preview Updates
        ↓
User Saves Template
        ↓
Template Stored in MongoDB
        ↓
Success Notification
```

### 2. Invoice Generation Workflow

```
User Creates/Completes Sale
        ↓
Click "Generate Bill" or "Print"
        ↓
Fetch Bill Data from Database
        ↓
Load Tenant's Invoice Template
        ↓
Merge Template with Bill Data
        ↓
Render HTML Output
        ↓
Display/Print/Download PDF
```

### 3. Data Binding Workflow

```
Template Contains Placeholder: {{tenant.companyName}}
        ↓
Template Engine Detects Placeholder
        ↓
Extract Path: "tenant.companyName"
        ↓
Retrieve Value from TemplateData Object
        ↓
Replace Placeholder with Actual Value
        ↓
Render Final HTML
```

---

## 🛠️ Core Components

### 1. Template Engine (`lib/template-engine.ts`)

**Purpose**: Core engine for template rendering and data binding

**Key Methods**:

#### `replacePlaceholders(template: string, data: TemplateData): string`
- Replaces all `{{path.to.value}}` placeholders with actual data
- Uses regex pattern: `/\{\{([^}]+)\}\}/g`
- Supports nested object paths (e.g., `tenant.companyName`)

```typescript
// Example
const template = "Store: {{tenant.companyName}}, Phone: {{tenant.phone}}"
const data = {
  tenant: {
    companyName: "Fashion Hub",
    phone: "+91 9876543210"
  }
}
const result = TemplateEngine.replacePlaceholders(template, data)
// Result: "Store: Fashion Hub, Phone: +91 9876543210"
```

#### `renderToHTML(template: Template, data: TemplateData): string`
- Converts template structure to HTML
- Processes all elements and applies styling
- Handles dynamic data binding

#### `renderElement(element: TemplateElement, data: TemplateData): string`
- Renders individual element based on type
- Supports: text, image, table, divider, spacer
- Applies element-specific styling

#### `buildElementStyle(element: TemplateElement): string`
- Converts element style object to CSS string
- Handles positioning, sizing, and styling properties

#### `renderTable(element: TemplateElement, data: TemplateData, baseStyle: string): string`
- Special handler for table elements
- Supports dynamic item rendering from invoice data
- Customizable headers and styling

### 2. Default Templates (`lib/default-templates.ts`)

**Purpose**: Pre-built template configurations for different business types

**Available Templates**:

#### Invoice Templates
- **Retail**: Standard invoice for clothing/retail stores
- **Restaurant**: Order receipt format for restaurants

#### Report Templates
- **Default**: Basic business report layout

**Template Structure**:
```typescript
DEFAULT_TEMPLATES = {
  invoice: {
    retail: { elements: [...] },
    restaurant: { elements: [...] }
  },
  report: {
    default: { elements: [...] }
  }
}
```

**Function**: `getDefaultTemplate(templateType: string, businessType?: string): TemplateElement[]`
- Returns appropriate template elements based on type and business
- Falls back to retail invoice if not found

### 3. Template Builder UI (`app/tenant/template-builder/page.tsx`)

**Purpose**: Visual interface for creating and editing templates

**Key Features**:

#### Editor Tab
- **Element Toolbar**: Add text, image, table, dividers
- **Canvas Area**: Visual representation of template (A4 size)
- **Properties Panel**: Edit selected element properties
- **Elements List**: Overview of all template elements

#### Preview Tab
- Real-time preview with sample data
- Shows how template will look with actual data
- Responsive scaling

**Element Operations**:
- **Add**: Insert new elements to template
- **Edit**: Modify element properties (position, size, style, content)
- **Delete**: Remove elements from template
- **Duplicate**: Clone existing elements
- **Drag**: Move elements on canvas

**Supported Element Types**:

1. **Text Element**
   - Static content or dynamic placeholders
   - Customizable font size, weight, alignment, color
   - Position and size control

2. **Image Element**
   - Upload custom images
   - Use dynamic placeholders (e.g., {{tenant.logo}})
   - Adjustable dimensions

3. **Table Element**
   - Configurable rows and columns
   - Custom headers
   - Header styling (background, text color)
   - Border customization
   - Dynamic item rendering from invoice data

4. **Divider Element**
   - Horizontal or vertical
   - Customizable color and thickness
   - Spacing control

5. **Spacer Element**
   - Empty space for layout
   - Adjustable dimensions

---

## 📡 API Endpoints

### 1. GET `/api/templates?type=invoice`

**Purpose**: Load template for editing

**Query Parameters**:
- `type` (string): Template type (invoice, report, certificate, email)

**Response**:
```json
{
  "_id": "template_id",
  "tenantId": "tenant_id",
  "templateType": "invoice",
  "name": "Default Invoice Template",
  "canvasJSON": {
    "elements": [...],
    "settings": {...}
  },
  "isDefault": true,
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Behavior**:
- If template exists, returns it
- If not, creates and returns default template
- Tenant-specific (uses session.user.tenantId)

### 2. POST `/api/templates`

**Purpose**: Save/update template

**Request Body**:
```json
{
  "templateType": "invoice",
  "name": "Custom Invoice Template",
  "canvasJSON": {
    "elements": [...],
    "settings": {...}
  }
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "acknowledged": true,
    "modifiedCount": 1
  }
}
```

**Behavior**:
- Creates new template if doesn't exist (upsert)
- Updates existing template
- Sets updatedAt timestamp
- Tenant-specific

### 3. DELETE `/api/templates?type=invoice`

**Purpose**: Reset template to default

**Query Parameters**:
- `type` (string): Template type to reset

**Response**:
```json
{
  "success": true
}
```

**Behavior**:
- Deletes custom template
- Next load will create default template
- Tenant-specific

### 4. POST `/api/templates/render`

**Purpose**: Render template with data to HTML

**Request Body**:
```json
{
  "templateType": "invoice",
  "data": {
    "tenant": {...},
    "invoice": {...},
    "customer": {...}
  }
}
```

**Response**:
```json
{
  "html": "<div class='template-container'>...</div>"
}
```

**Behavior**:
- Loads tenant's template
- Merges with provided data
- Returns rendered HTML
- Used for preview and PDF generation

### 5. POST `/api/bill-pdf-custom`

**Purpose**: Generate custom bill PDF using template

**Request Body**:
```json
{
  "billId": "bill_id",
  "billData": {
    "billNo": "INV-001",
    "total": 1250,
    "subtotal": 1100,
    "tax": 150,
    "discountAmount": 0,
    "items": [...],
    "customerName": "John Doe",
    "customerPhone": "+91 9876543210",
    "storeName": "Fashion Hub",
    "address": "123 Main Street",
    "phone": "+91 9876543210",
    "email": "store@fashion.com",
    "gst": "24AYZPV0035B1ZD",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Response**:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invoice INV-001</title>
    <style>...</style>
  </head>
  <body>
    <!-- Rendered template HTML -->
  </body>
</html>
```

**Behavior**:
- Loads tenant's invoice template
- Creates default if not exists
- Merges bill data with template
- Returns complete HTML document
- Can be printed or converted to PDF

### 6. GET `/api/bill-pdf/[id]`

**Purpose**: Generate legacy-style printable receipt (static HTML)

This system exposes two routes:

- GET `/api/receipt/[id]` – Authenticated tenant receipt
- GET `/api/public-receipt/[id]` – Public receipt (shareable link)

**Parameters**:
- `id` (string): Bill ID

**Response**: Complete HTML document with bill details, optimized for printing

**Behavior**:
- Fetches bill and tenant settings from the database
- Generates static HTML invoice layout
- Includes auto-print script and print styles
- Intended for quick print flows or sharing receipts

Note: The template builder-based route is `/api/bill-pdf-custom` for fully customized invoices.

---

## 🖨️ Printing & PDF

- The custom route `POST /api/bill-pdf-custom` returns full HTML; open in a new window and use the browser print dialog for PDF export.
- For server-side PDF generation, integrate a renderer like `puppeteer` to convert the returned HTML to PDF.
- Ensure page size in template settings matches desired print size (e.g., A4) and verify margins.

Example:

```typescript
const res = await fetch('/api/bill-pdf-custom', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ billData })
})
const html = await res.text()
const w = window.open()
w!.document.write(html)
w!.document.close()
w!.print()
```

---

## 🔌 Integration Points

### 1. POS System Integration

**Location**: `app/tenant/pos/`

**Usage**:
```typescript
// When user clicks "Print Bill"
const response = await fetch('/api/bill-pdf-custom', {
  method: 'POST',
  body: JSON.stringify({
    billData: {
      billNo: sale.billNo,
      total: sale.total,
      items: sale.items,
      // ... other bill data
    }
  })
})

const html = await response.text()
// Open in new window for printing
window.open('data:text/html,' + encodeURIComponent(html))
```

### 2. WhatsApp Integration

**Location**: `app/api/whatsapp/`

**Usage**:
```typescript
// Generate bill HTML
const billHtml = await fetch('/api/bill-pdf-custom', {
  method: 'POST',
  body: JSON.stringify({ billData })
})

// Convert to PDF and send via WhatsApp
// (Requires additional PDF library like puppeteer)
```

### 3. Email Integration

**Location**: `app/api/send-bill/`

**Usage**:
```typescript
// Generate bill using email template
const emailHtml = await fetch('/api/templates/render', {
  method: 'POST',
  body: JSON.stringify({
    templateType: 'email',
    data: billData
  })
})

// Send email with rendered HTML
```

---

## 🎨 Placeholder Reference

### Tenant Placeholders
```
{{tenant.companyName}}      - Store/Company name
{{tenant.address}}          - Store address
{{tenant.phone}}            - Store phone number
{{tenant.email}}            - Store email
{{tenant.gst}}              - GST number
{{tenant.logo}}             - Store logo URL
```

### Invoice Placeholders
```
{{invoice.billNo}}          - Bill/Invoice number
{{invoice.total}}           - Total amount
{{invoice.subtotal}}        - Subtotal (before tax/discount)
{{invoice.tax}}             - Tax amount
{{invoice.discount}}        - Discount amount
{{invoice.date}}            - Invoice date
{{invoice.items}}           - Array of items (for tables)
```

### Customer Placeholders
```
{{customer.name}}           - Customer name
{{customer.phone}}          - Customer phone
{{customer.address}}        - Customer address
{{customer.email}}          - Customer email
```

### User Placeholders
```
{{user.name}}               - Current user name
{{user.email}}              - Current user email
{{user.role}}               - User role
```

### Special Placeholders
```
{{items.table}}             - Renders items as table
```

---

## 📝 Usage Examples

### Example 1: Creating a Custom Invoice Template

```typescript
// 1. User opens template builder
// 2. Adds elements:

const elements = [
  {
    id: 'header',
    type: 'text',
    placeholder: '{{tenant.companyName}}',
    style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    position: { x: 200, y: 30 }
  },
  {
    id: 'bill-no',
    type: 'text',
    placeholder: 'Bill No: {{invoice.billNo}}',
    style: { fontSize: 14 },
    position: { x: 20, y: 180 }
  },
  {
    id: 'items-table',
    type: 'table',
    placeholder: '{{items.table}}',
    position: { x: 20, y: 270 },
    tableConfig: {
      rows: 5,
      columns: 4,
      headers: ['Item', 'Qty', 'Rate', 'Amount'],
      headerBg: '#f3f4f6',
      headerColor: '#000000',
      borderWidth: 1
    }
  },
  {
    id: 'total',
    type: 'text',
    placeholder: 'TOTAL: ₹{{invoice.total}}',
    style: { fontSize: 18, fontWeight: 'bold', textAlign: 'right' },
    position: { x: 350, y: 530 }
  }
]

// 3. Save template
await fetch('/api/templates', {
  method: 'POST',
  body: JSON.stringify({
    templateType: 'invoice',
    name: 'Custom Invoice',
    canvasJSON: { elements, settings: {...} }
  })
})
```

### Example 2: Rendering Invoice with Template

```typescript
// 1. Get bill data
const billData = {
  billNo: 'INV-001',
  total: 1250,
  subtotal: 1100,
  tax: 150,
  items: [
    { name: 'T-Shirt', quantity: 2, price: 250, total: 500 },
    { name: 'Jeans', quantity: 1, price: 500, total: 500 }
  ],
  customerName: 'John Doe',
  storeName: 'Fashion Hub',
  address: '123 Main Street',
  phone: '+91 9876543210',
  email: 'store@fashion.com',
  gst: '24AYZPV0035B1ZD'
}

// 2. Generate bill HTML
const response = await fetch('/api/bill-pdf-custom', {
  method: 'POST',
  body: JSON.stringify({ billData })
})

const html = await response.text()

// 3. Display/Print
const printWindow = window.open()
printWindow.document.write(html)
printWindow.document.close()
printWindow.print()
```

### Example 3: Dynamic Placeholder Replacement

```typescript
// Template contains: "Store: {{tenant.companyName}}, Phone: {{tenant.phone}}"

const data = {
  tenant: {
    companyName: 'Fashion Hub',
    phone: '+91 9876543210'
  }
}

const result = TemplateEngine.replacePlaceholders(template, data)
// Result: "Store: Fashion Hub, Phone: +91 9876543210"
```

---

## 🔒 Security Considerations

### 1. Authentication & Authorization
- All endpoints require valid NextAuth session
- Tenant isolation via `session.user.tenantId`
- Users can only access their own templates

### 2. Data Validation
- Template structure validated before saving
- Element types restricted to predefined list
- Placeholder format validated

### 3. XSS Prevention
- HTML content properly escaped
- User input sanitized
- No eval() or dynamic code execution

### 4. Database Security
- MongoDB connection secured
- Tenant data isolated
- Indexes on tenantId for performance

---

## 🚀 Performance Optimization

### 1. Template Caching
- Templates cached in browser localStorage
- Reduces API calls during editing
- Invalidated on save

### 2. Lazy Loading
- Elements rendered only when visible
- Canvas scaled for performance
- Preview uses sample data (not full dataset)

### 3. Database Optimization
- Indexes on `tenantId` and `templateType`
- Upsert operations for efficiency
- Minimal data transfer

### 4. Rendering Optimization
- HTML generation optimized
- CSS minimized
- No unnecessary DOM operations

---

## 🐛 Troubleshooting

### Issue: Template not loading
**Solution**:
1. Check browser console for errors
2. Verify session is valid
3. Check MongoDB connection
4. Ensure tenantId is set in session

### Issue: Placeholders not replacing
**Solution**:
1. Verify placeholder format: `{{path.to.value}}`
2. Check data object has correct structure
3. Ensure nested paths exist in data
4. Check for typos in placeholder names

### Issue: Elements not displaying on canvas
**Solution**:
1. Verify element position is within canvas bounds
2. Check element size is not zero
3. Ensure element type is valid
4. Check z-index if elements overlap

### Issue: Table not rendering items
**Solution**:
1. Verify placeholder is `{{items.table}}`
2. Check invoice.items array exists in data
3. Ensure items have required properties (name, quantity, price, total)
4. Check table configuration is valid

### Issue: PDF not printing correctly
**Solution**:
1. Check page size matches template settings
2. Verify margins are set correctly
3. Test in different browsers
4. Check for CSS print media queries

---

## 📚 File Structure

```
Clothes_ERP/
├── lib/
│   ├── template-engine.ts           # Core template rendering engine
│   └── default-templates.ts         # Pre-built template configurations
├── components/
│   └── template-builder/
│       ├── canvas-editor.tsx        # Canvas editing component
│       ├── template-preview.tsx     # Preview component
│       ├── simple-canvas-editor.tsx # Simplified editor
│       ├── simple-preview.tsx       # Simplified preview
│       └── quick-guide.tsx          # User guide
├── app/
│   ├── api/
│   │   ├── templates/
│   │   │   ├── route.ts             # Template CRUD endpoints
│   │   │   └── render/
│   │   │       └── route.ts         # Template rendering endpoint
│   │   ├── bill-pdf/
│   │   │   └── [id]/
│   │   │       └── route.ts         # Legacy bill PDF generation
│   │   └── bill-pdf-custom/
│   │       └── route.ts             # Custom template bill generation
│   └── tenant/
│       └── template-builder/
│           └── page.tsx             # Template builder UI
└── prisma/
    └── schema.prisma                # Database schema
```

---

## 🔄 Future Enhancements

1. **Template Versioning**: Track template changes over time
2. **Template Sharing**: Share templates between stores
3. **Advanced Styling**: CSS editor for custom styles
4. **Conditional Elements**: Show/hide elements based on data
5. **Batch Operations**: Generate multiple bills with template
6. **Template Analytics**: Track template usage and performance
7. **Mobile Template Builder**: Responsive template editor
8. **Template Marketplace**: Pre-built templates from community
9. **PDF Export**: Direct PDF generation without printing
10. **Multi-language Support**: Templates in multiple languages

---

## 📞 Support & Maintenance

### Common Tasks

**Adding a new placeholder**:
1. Define in TemplateData interface
2. Update placeholder reference documentation
3. Add to template builder dropdown
4. Test with sample data

**Creating a new template type**:
1. Add to DEFAULT_TEMPLATES
2. Create UI for template type selection
3. Add API endpoint support
4. Update documentation

**Customizing default templates**:
1. Edit `lib/default-templates.ts`
2. Modify element positions and styling
3. Update placeholder references
4. Test with template builder

---

## 📖 Related Documentation

- [README.md](./README.md) - Project overview
- [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - Database schema
- [README_TEMPLATE_SYSTEM.md](./README_TEMPLATE_SYSTEM.md) - Template system overview

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained By**: Fashion ERP Team
