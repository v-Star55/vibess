# Vibess 🌟

A modern social networking platform that helps you connect with people who match your vibe. Share your mood, discover like-minded individuals, join temporary groups, and build meaningful connections through mood-based matching.

## ✨ Features

### 🎭 Vibe Card System
- **Create Your Vibe**: Express your current mood with emojis, a 6-7 word description, and your favorite song
- **Smart Matching**: AI-powered algorithm matches you with users based on:
  - Mood compatibility (25%)
  - Energy levels (20%)
  - Positivity (20%)
  - Music genre affinity (15%)
  - Intent from description (20%)
- **Dynamic Theming**: Auto-generated themes based on your music genre, BPM, and emoji
- **Vibe Heatmap**: See trending moods and emojis in your area or globally
- **Auto Refresh**: Get reminders to update your vibe every 12 hours

### 💬 Chat System
- **24-Hour Chat Windows**: When you match with someone, unlock a private chat for 24 hours
- **Permanent Unlock**: Chat stays open permanently if both users follow each other
- **AI Icebreakers**: Get personalized conversation starters powered by Google Gemini AI
- **Real-time Messaging**: Connect and chat with your matches
- **Safety Features**: Report and block users for a safe experience

### 👥 Group Posts (GP) System
- **Temporary Groups**: Create location-based groups that last 3 hours
- **Categories**: 
  - Vibe GP (Fun, Chill, Overthinker, Chaos, etc.)
  - Movie GP (by movie name or genre)
  - Anime GP (by anime name or genre)
  - Other GP (Standup, Travel, Tech Talk, Music, Sports)
- **Location-Based Discovery**: Find groups near you with progressive radius expansion
- **Permanent Conversion**: Active groups can convert to permanent chat groups through voting
- **Smart Limits**: 
  - Max 2 GPs per day per user
  - 1 hour cooldown after creation
  - 1 active GP per category
  - System-level limits to maintain quality

### 🤫 Whisper Space
- **Anonymous Confessions**: Share your thoughts anonymously
- **Community Wall**: View and interact with anonymous posts
- **Safe Space**: Express yourself without revealing your identity

### 🎮 Games & Entertainment
- **Overthink Game**: Challenge yourself with thought-provoking games
- **Daily Advice**: Get motivational advice every day
- **Jokes**: Lighten your mood with curated jokes

### 📱 Social Features
- **Posts & Feed**: Create posts, like, comment, and react
- **Trending Content**: Discover what's popular in your community
- **Bookmarks**: Save your favorite posts
- **User Profiles**: Customize your profile and follow others
- **Stories**: Share moments that disappear after 24 hours

### 🤖 AI Integration
- **Google Gemini AI**: 
  - Personalized icebreaker generation
  - Vibe description enhancement suggestions
  - Content moderation
  - Matching insights

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access & Refresh Tokens), NextAuth
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **AI**: Google Gemini AI
- **File Upload**: Cloudinary
- **Email**: Nodemailer with AWS SES
- **Icons**: Lucide React, Tabler Icons
- **Animations**: Framer Motion
- **Validation**: Zod

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or cloud like MongoDB Atlas)
- Cloudinary account (for image uploads)
- Google Gemini API key (optional, for AI features)
- AWS SES credentials (optional, for email)
- RapidAPI key (optional, for jokes API)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/vibess.git
cd vibess
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI (optional)
GEMINI_API_KEY=your_gemini_api_key

# AWS SES (optional, for email)
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Internal API Key (for background jobs)
INTERNAL_API_KEY=your_internal_api_key

# RapidAPI (optional, for jokes)
RAPIDAPI_KEY=your_rapidapi_key
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
vibess/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── verifyemail/
│   │   ├── api/             # API routes
│   │   │   ├── advice/      # Daily advice
│   │   │   ├── ai/          # AI endpoints
│   │   │   ├── auth/        # Authentication
│   │   │   ├── chat/        # Chat system
│   │   │   ├── chat-room/   # Chat rooms
│   │   │   ├── games/       # Games
│   │   │   ├── gp/          # Group Posts
│   │   │   ├── jokes/       # Jokes
│   │   │   ├── post/        # Posts & interactions
│   │   │   ├── user/        # User management
│   │   │   ├── vibe/        # Vibe cards
│   │   │   └── whisper-space/ # Anonymous confessions
│   │   ├── components/      # React components
│   │   ├── config/          # Configuration files
│   │   ├── helpers/         # Helper functions
│   │   ├── lib/             # Utility libraries
│   │   └── models/          # Database models
│   ├── components/          # Shared components
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
├── lib/                     # Shared utilities
└── README.md
```

## 🔑 Key Features Explained

### Vibe Matching Algorithm

The matching system uses a weighted similarity calculation:
- **Mood** (25%): Extracted from emoji emotional categories
- **Energy** (20%): Calculated from BPM + emoji adjustments
- **Positivity** (20%): Analyzes description words + emoji sentiment
- **Genre** (15%): Music genre compatibility
- **Intent** (20%): Extracted from description keywords

Only matches with ≥70% similarity are shown.

### Group Post (GP) System

GPs are temporary location-based groups:
- **Duration**: 3 hours
- **Max Members**: 5 per group
- **Discovery**: Location-based with progressive radius (10km → 25km → 50km → 100km → 500km)
- **Priority Scoring**: Based on members needed, time remaining, distance, and activity
- **Permanent Conversion**: Groups can become permanent through voting (70% approval required)

### Chat Windows

- **24-Hour Window**: Opens when users match via vibe cards
- **Auto-Lock**: Closes after 24 hours if users don't follow each other
- **Permanent Unlock**: Stays open if both users follow each other
- **Safety**: Built-in reporting and blocking features

## 📚 Documentation

- [Vibe Card System](./VIBE_CARD_SYSTEM.md) - Complete guide to vibe cards
- [GP System](./GP_SYSTEM.md) - Group Posts implementation details
- [Gemini AI Setup](./GEMINI_SETUP.md) - AI integration guide
- [How to Use Gemini](./HOW_TO_USE_GEMINI.md) - Quick reference for AI features


## 🧪 Development

### Running Linter

```bash
npm run lint
```

### Environment Setup

Make sure all required environment variables are set in `.env.local`. Refer to the environment variables section above.

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

Make sure to set all environment variables in your deployment platform.



Made with ❤️ by Vaibhav
