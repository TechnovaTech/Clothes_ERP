export const defaultBusinessTypes = [
  {
    name: "Fashion Retail Store",
    description: "Complete clothing and fashion retail business",
    fields: [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Min Stock", type: "number", required: true, enabled: true }
    ],
    customerFields: []
  },
  {
    name: "General Store",
    description: "General retail business",
    fields: [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Min Stock", type: "number", required: true, enabled: true }
    ],
    customerFields: []
  }
]