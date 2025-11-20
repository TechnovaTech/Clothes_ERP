const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function cleanFieldVariations() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Static fields that should always be present
    const staticFields = [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Min Stock", type: "number", required: true, enabled: true }
    ];
    
    // Get all business types
    const businessTypes = await businessTypesCollection.find({}).toArray();
    
    for (const businessType of businessTypes) {
      let existingFields = businessType.fields || [];
      
      // Create normalized names for static fields (remove spaces, lowercase)
      const staticFieldNormalized = staticFields.map(f => ({
        ...f,
        normalized: f.name.toLowerCase().replace(/\s+/g, '')
      }));
      
      // Filter out duplicates based on normalized names
      const uniqueFields = [];
      const seenNormalized = new Set();
      
      // Add static fields first
      staticFields.forEach(field => {
        const normalized = field.name.toLowerCase().replace(/\s+/g, '');
        uniqueFields.push(field);
        seenNormalized.add(normalized);
      });
      
      // Add dynamic fields that don't conflict with static fields
      existingFields.forEach(field => {
        const normalized = field.name.toLowerCase().replace(/\s+/g, '');
        if (!seenNormalized.has(normalized)) {
          uniqueFields.push(field);
          seenNormalized.add(normalized);
        } else {
          console.log(`Removing duplicate field: ${field.name} (conflicts with static field)`);
        }
      });
      
      // Update the business type
      await businessTypesCollection.updateOne(
        { _id: businessType._id },
        { 
          $set: { 
            fields: uniqueFields,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated business type: ${businessType.name}`);
      console.log(`Final fields: ${uniqueFields.map(f => f.name).join(', ')}`);
      console.log('---');
    }
    
    console.log('Field variations cleaned successfully!');
    
  } catch (error) {
    console.error('Error cleaning field variations:', error);
  } finally {
    await client.close();
  }
}

cleanFieldVariations();