const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function checkCurrentFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get business types
    const businessTypes = await db.collection('business_types').find({}).toArray();
    
    console.log('Current Business Types:');
    businessTypes.forEach(bt => {
      console.log(`\nBusiness Type: ${bt.name}`);
      console.log(`Fields (${bt.fields?.length || 0}):`);
      if (bt.fields) {
        bt.fields.forEach((field, index) => {
          console.log(`  ${index + 1}. ${field.name} (${field.type}) ${field.required ? '- Required' : ''} ${field.enabled ? '- Enabled' : '- Disabled'}`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkCurrentFields();