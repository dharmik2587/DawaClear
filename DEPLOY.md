# Deploying DawaClear to Render

Full step-by-step guide — from downloaded zip to live URL.

---

## Step 1 — Push to GitHub

### 1a. Create a GitHub repositorys

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `dawaclear`
3. Set to **Public** (required for Render free tier)
4. **Do NOT** initialise with README (you already have one)
5. Click **Create repository**

### 1b. Push your code

Open a terminal in your `dawaclear` folder and run:

```bash
git init
git add .
git commit -m "Initial commit — DawaClear"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dawaclear.git
git push -u origin main
```

> Replace `YOUR_USERNAME` with your actual GitHub username.

---

## Step 2 — Deploy on Render

### 2a. Create a Render account

Go to [render.com](https://render.com) and sign up (free). Connect your GitHub account when prompted.

### 2b. Create a new Web Service

1. Click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. Select your `dawaclear` repository
4. Click **Connect**

### 2c. Configure the service

Fill in these exact settings:

| Setting | Value |
|---|---|
| **Name** | `dawaclear` (or anything you like) |
| **Region** | Singapore (closest to India) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2d. Add your Anthropic API key

**This is the most important step.**

1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"**
3. Set:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: `sk-ant-your-actual-key-here`
4. Click **Save**

> Get your key from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

### 2e. Deploy

Click **"Create Web Service"**.

Render will:
1. Clone your repo
2. Run `npm install && npm run build` (builds the React frontend)
3. Run `npm start` (starts the Express server)
4. Give you a live URL like `https://dawaclear.onrender.com`

**First deploy takes ~3–5 minutes.**

---

## Step 3 — Test your deployment

1. Open your Render URL
2. Click **"👁 Load Demo"** — should work immediately
3. Upload a prescription image → should analyse and show dashboard

---

## Troubleshooting

**"Application failed to respond"**
- Check Render logs (Dashboard → your service → Logs tab)
- Make sure `ANTHROPIC_API_KEY` is set correctly
- Make sure Build Command ran `npm run build` (dist folder must exist)

**"API 401" error**
- Your Anthropic API key is wrong or missing
- Go to Render → Environment → check the key value

**"API 413" error (payload too large)**
- The uploaded image is too large — use a photo under 5MB
- Or compress the image before uploading

**Site is slow on first load (free tier)**
- Render free tier spins down after 15 mins of inactivity
- First request after sleep takes ~30 seconds to wake up
- Upgrade to Starter ($7/mo) to avoid this

---

## Updating the app

After making changes locally:

```bash
git add .
git commit -m "Update: describe what you changed"
git push
```

Render auto-deploys on every push to `main`. New version live in ~2 minutes.

---

## Custom domain (optional)

1. Render Dashboard → your service → **Settings** → **Custom Domains**
2. Add your domain (e.g. `dawaclear.in`)
3. Add the CNAME record to your DNS provider
4. Render handles HTTPS automatically

---

*DawaClear · IAR Udaan 2026*
