import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

// Single shared connection — reused across requests in the same process
const sql = postgres(connectionString, { ssl: 'require', max: 10 })

export default sql
