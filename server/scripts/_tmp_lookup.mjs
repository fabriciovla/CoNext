import 'dotenv/config'
import { one, closePool } from '../src/db/index.js'
const a = await one('SELECT id, email FROM auth.users WHERE lower(email) = $1', ['varelafabricio6@gmail.com'])
console.log('auth.users:', JSON.stringify(a))
const u = await one('SELECT id, email, display_name FROM users WHERE lower(email) = $1', ['varelafabricio6@gmail.com'])
console.log('public.users:', JSON.stringify(u))
await closePool()
