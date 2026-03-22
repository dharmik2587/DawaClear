# 🩺 DawaClear — AI Medical Clarity

> The AI that sits between a patient and confusion.

Upload any prescription, discharge summary, or lab report. DawaClear uses **Claude Vision** to read the actual document and generate a full health dashboard — diagnosis explained, medication timeline, side effects, family brief, and chemist sheet — in under 30 seconds.

---

## Features

- 📄 **Real document analysis** — Claude Vision reads handwritten and printed prescriptions
- ⏰ **Visual daily timeline** — Morning / Afternoon / Night with dose checkboxes
- 💊 **Chemist mode** — Exact dispense table to hand to a pharmacist
- ⚠️ **Color-coded side effects** — 🔴 Emergency / 🟡 Monitor / 🟢 Mild
- 💬 **Family brief** — One-sentence WhatsApp-ready summary
- 🔊 **"Sunao Mujhe"** — Read aloud in English, Hindi, or Gujarati
- 🧲 **Fridge magnet PDF** — Printable medicine schedule
- 🆘 **2AM Panic Mode** — Emergency info + call buttons

---

## Local Development

### Prerequisites
- Node.js 18+
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/dawaclear.git
cd dawaclear

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 4. Build the frontend
npm run build

# 5. Start the server
npm start
# → Open http://localhost:3001
```

### Development mode (hot reload)

```bash
npm run build          # build once first
# Then in two terminals:
npm run dev:frontend   # Vite dev server on :5173
npm run dev:backend    # Express proxy on :3001
```

Or run both together:
```bash
npm run dev
```

---

## Deploy to Render

See **DEPLOY.md** for the full step-by-step guide.

---

## Project Structure

```
dawaclear/
├── src/
│   ├── App.jsx        ← Full React app (UI + logic)
│   └── main.jsx       ← React entry point
├── index.html         ← Vite HTML template
├── vite.config.js     ← Vite config
├── server.js          ← Express server + API proxy
├── package.json
├── .env.example
└── .gitignore
```

---

## Tech Stack

- **Frontend**: React 18, Vite, inline CSS (no Tailwind needed)
- **Backend**: Express.js (Node 18)
- **AI**: Anthropic Claude Opus (vision + analysis)
- **Hosting**: Render (free tier works)

---

*Built for IAR Udaan 2026 Hackathon*
