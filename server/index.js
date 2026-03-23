import 'dotenv/config'
import mongoose from 'mongoose'
import express from 'express'
import cors from 'cors'
import { seedDefaults } from './db/database.js'
import rentalRouter    from './routes/rental.js'
import freightRouter   from './routes/freight.js'
import inventoryRouter from './routes/inventory.js'
import exportRouter    from './routes/export.js'

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/rentals',   rentalRouter)
app.use('/api/freight',   freightRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/export',    exportRouter)
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3000

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB 連線成功')
    await seedDefaults()
    app.listen(PORT, () => console.log(`伺服器啟動：http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('MongoDB 連線失敗：', err.message)
    process.exit(1)
  })
