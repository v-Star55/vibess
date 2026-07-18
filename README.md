# Vibess 🌟

A modern social networking platform that helps you connect with people who match your vibe. Share your mood, discover like-minded individuals, join temporary groups, play interactive mini-games inside chat rooms, and build meaningful connections through mood-based matching and supportive spaces.

## ✨ Features

### 🎭 Vibe Card System & Heatmap
- **Create Your Vibe**: Express your current mood with emojis, a 6-7 word description, and your favorite song.
- **Smart Matching**: AI-powered matching algorithm (powered by Google Gemini) matches you with users based on:
  - Mood compatibility (25%)
  - Energy levels (20%)
  - Positivity (20%)
  - Music genre affinity (15%)
  - Intent from description (20%)
- **Vibe Heatmap & Radar**: A real-time radar scanning view of surrounding vibe cards.
  - **Fuzzy Privacy Controls**: Opt to "appear in heatmap" or not. Toggle "exact distance" or use a randomized coordinate decoy signal to protect your precise location.
  - **Radar Filters**: Custom radius scanning (up to 500km), minimum vibe energy thresholds, and intent filters.
- **Auto-Refresh**: Get reminders to update your vibe every 12 hours.

### 💬 Chat System & Sparks Mini-Games
- **24-Hour Chat Windows**: Matched users unlock a private chat window active for 24 hours.
- **Permanent Unlock**: Chat stays open permanently if both users follow each other.
- **AI Icebreakers**: Personalized conversation starters powered by Google Gemini AI.
- **Real-Time Messages**: Instant messaging with live typing indicators.
- **Sparks Panel (In-Chat Mini-Games)**: Interactive games playable directly within the chat screen, synced in real-time via WebSockets:
  - **Tic-Tac-Toe**: Classic turn-based grid battle.
  - **Connect Four**: Drop tokens to match four in a row.
  - **Truth or Dare**: Prompts for breaking the ice.
  - **Quick Draw**: A collaborative drawing board with real-time canvas updates and word-guessing.
  - **Coin Flip**: Fast decision maker directly in the chat panel.

### 👥 Group Posts (GP) & Chat Groups
- **Temporary Groups (GPs)**: Create location-based groups lasting 3 hours with a maximum of 5 members.
- **GP Categories**: Vibe GP (Fun, Chill, Chaos, etc.), Movie GP, Anime GP, and Other GP (Standup, Travel, Tech Talk, Music, Sports).
- **Location-Based Discovery**: Find groups near you using a progressive location radius (10km → 500km).
- **Permanent Conversion**: Active groups can convert to a permanent group chat room if members vote (70% approval required).
- **Group Chat Area & Interactive Features**: Dedicated chat interface for group participants featuring:
  - **Dynamic Theming**: Customized gradients, background glows, and bubble styling corresponding to the active GP category (Vibe GP, Movie GP, Anime GP, Other GP).
  - **Real-Time Polls & Challenges**: Interactive daily challenges and user-created polls synced live via WebSockets.
  - **Anonymous Messages**: Toggle to send messages anonymously (limited to 3 anonymous messages per user per day in the group chat).
  - **Chat Layout**: Live messaging feed, member drawer sidebar, and permanent conversion voting controls.
- **Smart Limits**: 
  - Max 2 GPs per day per user (1-hour cooldown after creation).
  - Max 1 active GP per category per user.

### 🤫 Whisper Space
- **Anonymous Confessions**: Share your thoughts anonymously.
- **Community Wall**: View, browse, and interact with anonymous posts.
- **Safe Space**: Express yourself without revealing your identity.

### 🎧 Listening Space (Support Network)
- **Open to Listen Toggle**: Users can toggle their profile status to signal they are open to listen to others who need emotional support.
- **Listen Cards & Requests**: Users can post a card detailing a topic, reason, and heaviness (Light, Moderate, Heavy) to find a supportive companion.
- **Real-Time Duration Caching**: Computes and caches the total hours a user has spent listening incrementally upon session expiration or lock, maintaining high profile load performance (O(1) lookups).
- **Empathy Ratings & Reviews**: Showcase listener reviews, empathy ratings, and custom topic tags on user profiles.

### 🎮 Games & Entertainment (Solo)
- **The Overthink Button**: Challenging thoughts and ridiculous counter-strategies generated on-the-fly using Google Gemini AI.
- **Make Your Decision**: Solo coin flipper to help make choices with a randomized heads/tails suspense spinner.
- **Daily Advice & Jokes**: Get motivational advice and lighthearted jokes to brighten your day.

### 🤖 AI Integration (Google Gemini)
- **AI Icebreakers**: Contextual conversation starters for matched users.
- **Vibe Enhancer**: Suggestions to refine and improve your vibe description card.
- **Overthink Generator**: Dynamically generates thoughts and rationales.
- **Content Moderation & Insights**: Behind-the-scenes checks on descriptions for user safety.

---

## 🛠️ Tech Stack

### Frontend & Core App
- **Framework**: Next.js 16 (App Router) & React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4 with custom CSS variables
- **Animations**: Framer Motion
- **Icons**: Lucide React & Tabler Icons

### Database & Backend Services
- **Database**: MongoDB with Mongoose (with Prisma schemas for potential extension)
- **Authentication**: JWT (Access & Refresh Tokens) & NextAuth
- **Media Storage**: Cloudinary (for profile images and graphics)
- **Mail Service**: Nodemailer with AWS SES
- **Validation**: Zod

### WebSocket Server (Real-Time Service)
- **Runtime**: Node.js & Express
- **Library**: Socket.io
- **Features**: Chat rooms, direct user notification channel, typing status, live Sparks panel sync, listening cards status broadcast.

---

## 📁 Project Structure

```
vibess/
├── socket-server/           # Standalone WebSocket Server
│   ├── server.js            # Express & Socket.io server logic
│   ├── package.json         # Server dependencies & nodemon config
│   └── .env                 # Server env variables (CLIENT_URL, PORT)
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication (login, signup, verifyemail)
│   │   ├── app-home/        # Main landing dashboard after login
│   │   ├── api/             # Next.js API Routes (advice, ai, auth, chat, games, gp, jokes, listen, user, vibe, whisper-space)
│   │   ├── chat/            # Chat room screens with SparksPanel integration
│   │   │   └── [chatId]/
│   │   ├── chat-room/       # Matched chat window listings
│   │   ├── components/      # Key components (AppLayout, SparksPanel, VibeCard, TrendCard, RightSide, JokeDisplay)
│   │   │   ├── sparks/      # Sparks mini-games: TicTacToe, ConnectFour, TruthOrDare, QuickDraw, CoinFlip
│   │   │   └── ui/          # Shareable UI components (e.g. Loader, select dropdowns)
│   │   ├── explore/         # Global vibe card discovery
│   │   ├── games/           # Solo games hub (Overthinker and Make Decision)
│   │   ├── gp/              # Group Posts creation flow
│   │   ├── groups/          # Active / Permanent group chats (sidebar, chat area)
│   │   ├── listen/          # Listening space board & request list
│   │   ├── profile/         # Profile details and stats for users
│   │   │   └── [userId]/
│   │   ├── whisper-space/   # Anonymous confession wall
│   │   ├── globals.css      # Core global stylesheet
│   │   ├── layout.tsx       # Root layout configuration
│   │   └── page.tsx         # Gateway entry route (handles redirection)
│   ├── hooks/               # Custom hooks (e.g., useSocket)
│   ├── lib/                 # Core API request utilities
│   └── store/               # Zustand state stores (user, chat notification stores)
├── public/                  # Public assets & icons
├── README.md                # System Overview
└── package.json             # Main app dependencies
```

---

## 📋 Environment Setup

### 1. App Environment Variables (`.env.local`)
Create a `.env.local` file in the root folder of the `vibess` project:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# API & Server URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# AWS SES (for email support)
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Internal API Key (for background sync jobs)
INTERNAL_API_KEY=your_internal_api_key

# RapidAPI (for daily jokes)
RAPIDAPI_KEY=your_rapidapi_key
```

### 2. Socket Server Environment Variables (`socket-server/.env`)
Create a `.env` file in the `socket-server` directory:

```env
PORT=3001
CLIENT_URL=http://localhost:3000
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vibess.git
cd vibess
```

### 2. Install Dependencies
Install packages for both the Next.js app and the WebSocket server:
```bash
# Install main application packages
npm install

# Install socket server packages
cd socket-server
npm install
cd ..
```

### 3. Run in Development Mode
You need to run both the Next.js frontend app and the socket server:

**Terminal 1 (Next.js Application):**
```bash
npm run dev
```

**Terminal 2 (Socket Server):**
```bash
cd socket-server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access Vibess.

### 4. Build for Production
```bash
# Build next app
npm run build
npm start

# Run socket server in production
cd socket-server
npm start
```

---
Made with ❤️ by Vaibhav
