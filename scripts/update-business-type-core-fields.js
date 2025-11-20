const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function updateBusinessTypeCoreFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Core fields only
    const coreFields = [
      { name: "Name", type: "text", required: true, enabled: true },
      { name: "Price", type: "number", required: true, enabled: true },
      { name: "Cost Price", type: "number", required: true, enabled: true },
      { name: "Stock", type: "number", required: true, enabled: true },
      { name: "Min Stock", type: "number", required: true, enabled: true }
    ];
    
    // Update all business types to have only core fields
    const result = await businessTypesCollection.updateMany(
      {},
      { 
        $set: { 
          fields: coreFields,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Updated ${result.modifiedCount} business types with core fields only`);
    console.log('Core fields:', coreFields.map(f => f.name).join(', '));
    
  } catch (error) {
    console.error('Error updating business types:', error);
  } finally {
    await client.close();
  }
}

updateBusinessTypeCoreFields();