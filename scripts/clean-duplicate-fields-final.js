const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system';

async function cleanDuplicateFields() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const businessTypesCollection = db.collection('business_types');
    
    // Get all business types
    const businessTypes = await businessTypesCollection.find({}).toArray();
    
    for (const businessType of businessTypes) {
      if (businessType.fields && businessType.fields.length > 0) {
        // Remove duplicate fields based on name (case insensitive)
        const uniqueFields = [];
        const seenNames = new Set();
        
        for (const field of businessType.fields) {
          const normalizedName = field.name.toLowerCase().trim();
          if (!seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            uniqueFields.push(field);
          } else {
            console.log(`Removing duplicate field: ${field.name} from ${businessType.name}`);
          }
        }
        
        // Update the business type with unique fields
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
    }
    
    console.log('Cleanup completed!');
    
  } catch (error) {
    console.error('Error cleaning duplicate fields:', error);
  } finally {
    await client.close();
  }
}

cleanDuplicateFields();