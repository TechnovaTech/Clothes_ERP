# Multi-Tenant Template Builder System

## Overview
Complete drag-and-drop template customization system for the ERP, allowing each tenant to design their own invoice, report, and certificate templates.

## Features Implemented

### 🎨 Canvas-Based Template Editor
- **Drag-and-drop interface** for adding and positioning elements
- **Visual element selection** with property panels
- **Real-time preview** of template changes
- **Element types**: Text, Image, Table, Divider, Spacer
- **Styling controls**: Font size, weight, alignment, colors
- **Position controls**: Drag elements anywhere on canvas

### 🏢 Multi-Tenant Architecture
- **Tenant isolation**: Each tenant has their own templates
- **Default templates**: Auto-created for new tenants
- **Template types**: Invoice, Report, Certificate, Email
- **Business type templates**: Different defaults for retail vs restaurant

### 🔧 Template Engine
- **Placeholder system**: `{{tenant.companyName}}`, `{{invoice.total}}`, etc.
- **Dynamic data replacement**: Real-time placeholder resolution
- **HTML rendering**: Convert templates to printable HTML
- **PDF generation**: Export templates as downloadable files

### 📊 Data Integration
- **Bill integration**: Custom templates used in bill generation
- **Settings integration**: Access via tenant settings page
- **Live preview**: Sample data for template testing

## File Structure

```
├── lib/
│   ├── template-engine.ts          # Core template processing
│   └── default-templates.ts        # Default template configurations
├── components/template-builder/
│   ├── canvas-editor.tsx           # Drag-and-drop editor
│   └── template-preview.tsx        # Live preview component
├── app/
│   ├── tenant/template-builder/    # Template builder page
│   └── api/
│       ├── templates/              # Template CRUD operations
│       ├── templates/render/       # Template rendering
│       └── bill-pdf-custom/        # Custom bill generation
```

## API Endpoints

### Template Management
- `GET /api/templates?type=invoice` - Load tenant template
- `POST /api/templates` - Save template
- `DELETE /api/templates/[type]` - Reset to default

### Template Rendering
- `POST /api/templates/render` - Render template with data
- `POST /api/bill-pdf-custom` - Generate custom bill

## Usage

### 1. Access Template Builder
Navigate to Settings → "Open Template Builder" button

### 2. Design Templates
- Select template type (Invoice, Report, Certificate)
- Drag elements from toolbar to canvas
- Customize properties in sidebar
- Use placeholders for dynamic content

### 3. Preview & Save
- Switch to "Live Preview" tab
- See template with sample data
- Save changes to apply to all future bills

### 4. Generate Custom Bills
Bills page now uses custom templates automatically

## Placeholder System

### Available Placeholders

#### Tenant Information
- `{{tenant.companyName}}` - Store name
- `{{tenant.address}}` - Store address
- `{{tenant.phone}}` - Phone number
- `{{tenant.email}}` - Email address
- `{{tenant.gst}}` - GST number
- `{{tenant.logo}}` - Logo image

#### Invoice Data
- `{{invoice.billNo}}` - Bill number
- `{{invoice.total}}` - Total amount
- `{{invoice.subtotal}}` - Subtotal
- `{{invoice.tax}}` - Tax amount
- `{{invoice.discount}}` - Discount amount
- `{{invoice.date}}` - Invoice date

#### Customer Information
- `{{customer.name}}` - Customer name
- `{{customer.phone}}` - Customer phone
- `{{customer.address}}` - Customer address
- `{{customer.email}}` - Customer email

#### User Information
- `{{user.name}}` - Cashier name
- `{{user.email}}` - User email
- `{{user.role}}` - User role

## Database Schema

### Templates Collection
```javascript
{
  _id: ObjectId,
  tenantId: String,
  templateType: String, // 'invoice', 'report', 'certificate', 'email'
  name: String,
  canvasJSON: {
    elements: [
      {
        id: String,
        type: String, // 'text', 'image', 'table', 'divider', 'spacer'
        content: String,
        placeholder: String,
        style: {
          fontSize: Number,
          fontWeight: String,
          textAlign: String,
          color: String,
          // ... other styles
        },
        position: { x: Number, y: Number },
        size: { width: Number, height: Number }
      }
    ],
    settings: {
      pageSize: String,
      orientation: String,
      margins: { top: Number, right: Number, bottom: Number, left: Number }
    }
  },
  isDefault: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Tenant isolation**: Templates are strictly isolated by tenantId
- **Authentication required**: All APIs require valid session
- **Input validation**: Template data is validated before saving
- **XSS protection**: HTML output is sanitized

## Customization Options

### Adding New Element Types
1. Update `TemplateElement` interface in `template-engine.ts`
2. Add rendering logic in `renderElement()` method
3. Add UI controls in `canvas-editor.tsx`

### Adding New Placeholder Categories
1. Extend `TemplateData` interface
2. Update placeholder documentation
3. Add sample data in preview component

### Creating Business-Specific Templates
1. Add templates to `default-templates.ts`
2. Update `getDefaultTemplate()` function
3. Add business type detection logic

## Performance Considerations

- Templates are cached after first load
- Canvas rendering is optimized for 60fps
- Large templates are paginated
- Image placeholders are lazy-loaded

## Future Enhancements

- **Advanced table support** with dynamic rows
- **Conditional elements** based on data
- **Template marketplace** for sharing designs
- **Version control** for template changes
- **Bulk template operations**
- **Template import/export**

## Troubleshooting

### Template Not Loading
- Check tenant authentication
- Verify template type parameter
- Check database connection

### Elements Not Positioning Correctly
- Ensure canvas dimensions are set
- Check element position values
- Verify CSS styling

### Placeholders Not Replacing
- Check placeholder syntax: `{{category.field}}`
- Verify data structure matches placeholders
- Check for typos in placeholder names

## Support

For issues or feature requests related to the template system, check:
1. Browser console for JavaScript errors
2. Network tab for API call failures
3. Database logs for data issues
4. Template validation errors in API responses