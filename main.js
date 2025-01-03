import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './Apps/Auth'
import { users } from './Apps/User'
import { houses } from './Apps/House'
import { Pay } from './Apps/Pay'

const app = new Hono()

app.use('*', logger()) // Add logger middleware
app.use('*', cors({
    origin: 'http://localhost:3000', // Allow requests from SvelteKit
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true, // If you need to include cookies
}))

app.route('/auth', auth)
app.route('/user', users)
app.route('/house', houses)
app.route('/pay', Pay)
app.get('/', (c) => c.json({ status: 'alive' }))

Bun.serve({
    hostname: 'localhost',
    port: 3001,
    fetch: app.fetch,
})