const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function removeStaticCustomerFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Get all business types
    const businessTypes = await businessTypesCollection.find({}).toArray();
    
    for (const businessType of businessTypes) {
      let customerFields = businessType.customerFields || [];
      
      // Remove static fields (name, phone, email, address)
      const staticFieldNames = ['name', 'phone', 'email', 'address'];
      const filteredFields = customerFields.filter(field => 
        !staticFieldNames.includes(field.name.toLowerCase())
      );
      
      // Update the business type
      await businessTypesCollection.updateOne(
        { _id: businessType._id },
        { 
          $set: { 
            customerFields: filteredFields,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated business type: ${businessType.name}`);
      console.log(`Removed ${customerFields.length - filteredFields.length} static customer fields`);
      console.log(`Remaining customer fields: ${filteredFields.map(f => f.name).join(', ') || 'None'}`);
      console.log('---');
    }
    
    console.log('Static customer fields removed successfully!');
    
  } catch (error) {
    console.error('Error removing static customer fields:', error);
  } finally {
    await client.close();
  }
}

removeStaticCustomerFields();