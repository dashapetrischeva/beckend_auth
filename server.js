import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { delay } from './middleware/delay.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import commentRoutes from './routes/comments.js'

dotenv.config()

const app = express()

// app.use(cors({ origin: 'http://localhost:5173/', credentials: true }))
app.use(cors({
  origin: 'https://react-17-oyz3.onrender.com',
  credentials: true
}));

app.use(express.json())
app.use(cookieParser())
app.use(delay)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)

const PORT = process.env.PORT || 4000

app.listen(PORT, () => console.log(`API running on port ${PORT}`))

