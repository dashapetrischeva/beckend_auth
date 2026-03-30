import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { readJSON } from '../utils/fileDb.js'

dotenv.config()

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const usersFile = path.join(__dirname, '../data/users.json')

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRES }
  )
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES }
  )
}

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const users = await readJSON(usersFile)

    const user = users.find((u) => u.email === email)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken
    })
  } catch (error) {
    console.error('LOGIN ERROR:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// REFRESH
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.refreshToken

    if (!token) return res.sendStatus(401)

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

    const users = await readJSON(usersFile)

    const user = users.find((u) => u.id === payload.id)

    if (!user) return res.sendStatus(401)

    const accessToken = generateAccessToken(user)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      accessToken
    })
  } catch (error) {
    console.error('REFRESH ERROR:', error)
    res.sendStatus(403)
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken')
  res.sendStatus(204)
})

export default router