import express from 'express'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' })) // prescriptions can have large base64 images

// ── Serve built frontend ───────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'dist')))

// ── Anthropic API proxy ────────────────────────────────────────────────────
app.post('/api/analyse', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server.' })
  }

  try {
    const { system, messages } = req.body

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2500,
        system,
        messages,
      }),
    })

    const data = await anthropicRes.json()

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data?.error?.message || 'Anthropic API error' })
    }

    res.json(data)
  } catch (err) {
    console.error('Proxy error:', err)
    res.status(500).json({ error: err.message })
  }
})

// ── SPA fallback — serve index.html for all other routes ──────────────────
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
createServer(app).listen(PORT, () => {
  console.log(`DawaClear running on http://localhost:${PORT}`)
})
