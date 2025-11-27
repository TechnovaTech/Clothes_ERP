import { MongoClient, Db, Collection, ObjectId } from 'mongodb'

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017'
const dbName = 'erp_system'

let client: MongoClient | null = null
let db: Db | null = null
const tenantDbs: Record<string, Db> = {}

export async function connectDB(): Promise<Db> {
  try {
    if (db && client) {
      return db
    }
    
    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)
    console.log('MongoDB connected successfully to:', dbName)
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    console.error('Connection URI:', uri.replace(/\/\/.*@/, '//<credentials>@'))
    throw error
  }
}

export async function connectTenantDB(tenantId: string, tenantName?: string): Promise<Db> {
  try {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }
    
    if (!client) {
      client = new MongoClient(uri)
      await client.connect()
    }
    
    if (tenantDbs[tenantId]) {
      return tenantDbs[tenantId]
    }
    
    let name = tenantName
    if (!name) {
      const mainDb = await connectDB()
      let query: any
      try {
        query = { _id: new ObjectId(tenantId) }
      } catch {
        query = { _id: tenantId }
      }
      const tenantDoc = await mainDb.collection('tenants').findOne(query)
      if (!tenantDoc) {
        throw new Error(`Tenant not found: ${tenantId}`)
      }
      name = (tenantDoc as any)?.name || tenantId
    }
    
    let safe = String(name).toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (!safe) {
      safe = 'tenant'
    }
    
    const tenantDbName = `${dbName}_tenant_${safe}_${tenantId}`
    const tenantDb = client.db(tenantDbName)
    tenantDbs[tenantId] = tenantDb
    console.log('Connected to tenant DB:', tenantDbName)
    return tenantDb
  } catch (error) {
    console.error('Tenant DB connection error:', error)
    throw error
  }
}

export async function getTenantsCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('tenants')
}

export async function getUsersCollection(): Promise<Collection> {
  const database = await connectDB()
  return database.collection('users')
}