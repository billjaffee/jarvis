# JARVIS Personal Dashboard

An Iron Man–style personal command center built with React + Vite, deployable on Netlify.

---

## Phase 1 Features

- 🔐 Netlify Identity login (email/password, just you)
- 📅 Calendar panel (mock → Google Calendar in Phase 2)
- 📧 Gmail panel (mock → live Gmail in Phase 2)
- ✅ Native task list (persisted in localStorage)
- 🌤️ Live weather for Colorado Springs (Open-Meteo API, no key needed)
- 📰 News headlines (AP News via RSS)
- 📝 Quick notes (persisted in localStorage)
- 🎙️ Jarvis voice — speaks and listens via Web Speech API

---

## Deployment Guide

### Step 1: Create a GitHub repo

Push this entire project to a new GitHub repository.

### Step 2: Deploy to Netlify

1. Log into [netlify.com](https://netlify.com)
2. Click **Add new site → Import an existing project**
3. Connect your GitHub repo
4. Build settings are auto-detected from `netlify.toml`
5. Click **Deploy**

### Step 3: Enable Netlify Identity

1. In your Netlify dashboard, go to **Identity**
2. Click **Enable Identity**
3. Under **Registration**, set to **Invite only**
4. Go to **Identity → Users → Invite users** and invite your email
5. Check your email and set your password

### Step 4: Set your subdomain (optional)

1. In Netlify: **Domain settings → Add a domain**
2. Add something like `jarvis.billjaffee.com` and follow DNS instructions

### Step 5: Use it

- Navigate to your Netlify URL
- Log in with your Netlify Identity credentials
- Jarvis will greet you by name
- Click the **🎙️ mic button** in the Jarvis bar and speak a command

---

## Voice Commands (Phase 1)

| Say this | Jarvis does this |
|---|---|
| "What's the weather?" | Reads current Colorado Springs conditions |
| "What's on my calendar?" | Lists today's events |
| "Check my email" / "inbox" | Reports unread count |
| "Add task [name]" | Adds to your task list |
| "Read my notes" | Reads your notes aloud |
| "What time is it?" | States the current time |
| "System status" | Reports Phase 1 status |
| "Hello" / "Good morning" | Jarvis greets you |

---

## Phase 2 (Coming Next)

- Live Gmail integration via Netlify Functions + Google OAuth
- Live Google Calendar integration
- Supabase for persistent task/notes storage
- Continuous wake-word listening ("Hey Jarvis")
- ElevenLabs voice option

---

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`

Note: Netlify Identity won't work in local dev without the Netlify CLI:
```bash
npm install -g netlify-cli
netlify dev
```
