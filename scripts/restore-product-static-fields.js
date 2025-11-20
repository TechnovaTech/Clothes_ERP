const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function restoreProductStaticFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Static product fields that should always be present
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
      
      // Remove any existing static fields to avoid duplicates
      const staticFieldNames = staticFields.map(f => f.name.toLowerCase());
      const dynamicFields = existingFields.filter(field => 
        !staticFieldNames.includes(field.name.toLowerCase())
      );
      
      // Combine static fields + dynamic fields
      const allFields = [...staticFields, ...dynamicFields];
      
      // Update the business type
      await businessTypesCollection.updateOne(
        { _id: businessType._id },
        { 
          $set: { 
            fields: allFields,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated business type: ${businessType.name}`);
      console.log(`Static fields: ${staticFields.map(f => f.name).join(', ')}`);
      console.log(`Dynamic fields: ${dynamicFields.map(f => f.name).join(', ') || 'None'}`);
      console.log('---');
    }
    
    console.log('Product static fields restored successfully!');
    
  } catch (error) {
    console.error('Error restoring product static fields:', error);
  } finally {
    await client.close();
  }
}

restoreProductStaticFields();