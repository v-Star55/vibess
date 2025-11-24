# GP (Group) System Implementation

## Overview
Complete implementation of the GP (Group) creation and management system with location-based discovery, creation limits, permanent conversion, and priority-based display.

## Models

### Group Model (`src/models/groupModel.ts`)
Comprehensive GP schema with:
- **Category**: Vibe GP, Movie GP, Anime GP, Other GP
- **Sub-types**: Category-specific options (Fun, Chill, Movie Name, Genre, etc.)
- **Talk Topics**: 1-3 selected topics from predefined list
- **Description**: Optional 150-200 character description
- **Creation Reason**: Selectable reason + optional note (max 100 chars)
- **Location**: Geospatial coordinates with city/zone
- **Members**: Max 5 members per GP
- **Status**: active, expired, converted, failed
- **Permanent Conversion**: Voting system with 70% approval threshold
- **Engagement Tracking**: Message count, last activity, toxicity flags

### User Model Updates (`src/models/userModel.ts`)
Added GP creation tracking:
- `gpCreationHistory`: Array of created GPs with timestamps
- `lastGPCreationAt`: Last creation timestamp
- `gpCooldownUntil`: Cooldown expiration time

## API Routes

### 1. Create GP (`POST /api/gp/create`)
Creates a new GP with comprehensive validation:

**Validation Checks:**
- ✅ Daily limit: Max 2 GPs per day
- ✅ Cooldown: 1 hour after creation
- ✅ Category limit: 1 active GP per category
- ✅ System limit: MaxActiveGroups = ActiveUsers / 2.5

**Request Body:**
```json
{
  "category": "Vibe GP",
  "subType": "Chill",
  "specificName": "", // For Movie/Anime GPs
  "genre": "", // For genre-based GPs
  "talkTopics": ["Life stuff", "Overthinking & mental vibe"],
  "description": "Chill late-night talk about overthinking and life.",
  "creationReason": "Feeling lonely today",
  "reasonNote": "Want to just talk",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "city": "New Delhi",
    "zone": "Central"
  }
}
```

### 2. List GPs (`GET /api/gp/list`)
Location-based discovery with priority scoring:

**Features:**
- Starts with 10km radius, expands to 25km → 50km → 100km → 500km if needed
- Priority scoring based on:
  1. Members needed (1-2 members = highest priority)
  2. Time remaining (>1.5 hours = higher priority)
  3. Distance (nearer = higher priority)
  4. Recent activity
  5. Message count (engagement)
- Returns top 7 GPs

**Response:**
```json
{
  "success": true,
  "gps": [
    {
      "_id": "...",
      "category": "Vibe GP",
      "subType": "Chill",
      "talkTopics": ["Life stuff"],
      "members": [...],
      "memberCount": 3,
      "maxMembers": 5,
      "distance": 3.4,
      "timeLeft": 120, // minutes
      ...
    }
  ]
}
```

### 3. Join GP (`POST /api/gp/join`)
Join an active GP.

**Request Body:**
```json
{
  "gpId": "gp_id_here"
}
```

**Validation:**
- GP must be active
- GP must not be full
- User must not already be a member

### 4. Explore Mode (`GET /api/gp/explore`)
Advanced search and filtering for GPs.

**Query Parameters:**
- `category`: Filter by category
- `subType`: Filter by sub-type
- `vibeType`: Filter by vibe type
- `topic`: Filter by talk topic
- `minTimeRemaining`: Minimum hours remaining
- `maxDistance`: Maximum distance in km
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Priority Order:**
1. GPs needing 1-2 members
2. Time remaining (more = better)
3. Distance (nearer = better)
4. Recent activity

### 5. Permanent Conversion (`POST /api/gp/permanent-convert`)
Convert temporary GP to permanent chat group.

**Eligibility Criteria:**
- At least 3+ active members
- Active for 2.5+ hours
- No toxicity flags
- Good engagement

**Actions:**
- `action: "check"`: Check eligibility and request conversion
- `action: "vote"`: Vote on conversion (requires `vote: "yes" | "no"`)

**Voting:**
- Requires 70% YES votes to approve
- On approval: GP converted to permanent chat, creator becomes Admin, first member becomes Moderator

**Request Body (vote):**
```json
{
  "gpId": "gp_id_here",
  "action": "vote",
  "vote": "yes"
}
```

### 6. Check Limits (`GET /api/gp/check-limits`)
Check if user can create a GP.

**Query Parameters:**
- `category`: Optional category to check

**Response:**
```json
{
  "success": true,
  "canCreate": true,
  "limits": {
    "daily": {
      "canCreate": true,
      "creationsRemaining": 1,
      "todayCreations": 1
    },
    "cooldown": {
      "active": false,
      "minutesRemaining": 0
    },
    "category": {
      "hasActive": false,
      "category": "Vibe GP"
    },
    "system": {
      "limitReached": false,
      "currentGroups": 15,
      "maxGroups": 20,
      "activeUsers": 50
    }
  }
}
```

### 7. My GPs (`GET /api/gp/my-gps`)
Get all GPs where user is a member.

### 8. Leave GP (`POST /api/gp/leave`)
Leave a GP.

**Request Body:**
```json
{
  "gpId": "gp_id_here"
}
```

### 9. Update Activity (`POST /api/gp/update-activity`)
Update GP activity (message count, last activity).

**Request Body:**
```json
{
  "gpId": "gp_id_here",
  "messageCount": 25
}
```

**Note:** Automatically checks and marks GP as eligible for permanent conversion if conditions are met.

### 10. Get GP Details (`GET /api/gp/[gpId]`)
Get detailed information about a specific GP.

### 11. Expire GPs (`POST /api/gp/expire`)
Background job to expire old GPs. Should be called periodically (cron job).

**Authentication:** Requires `INTERNAL_API_KEY` in Authorization header.

## Constants & Enums

### Categories
- Vibe GP
- Movie GP
- Anime GP
- Other GP

### Sub-types

**Vibe GP:**
- Fun, Chill, Overthinker, Chaos, Calm, Random Talk

**Movie GP:**
- Movie Name, Genre (Horror, Action, Sci-Fi, Comedy, Drama, Romance, Thriller, Fantasy)

**Anime GP:**
- Anime Name, Genre (Shounen, Romance, Isekai, Slice of Life, Action, Comedy, Drama, Fantasy)

**Other GP:**
- Standup, Travel, Trip, Tech Talk, Music, Sports

### Talk Topics
- Life stuff
- Overthinking & mental vibe
- Random fun & nonsense
- Movie / Anime discussion
- Fan theories
- Day experiences
- Trip planning
- Roast sessions
- Meme talk
- Relationship stuff
- Career / ambitions

### Creation Reasons
- Feeling bored
- Feeling lonely today
- Want to meet new people
- Need people with same movie/anime interest
- Want people with same vibe
- Just for fun
- Planning something
- Want deep discussions
- Want a safe chill space

## Key Features

### 1. Creation Limits
- ✅ Max 2 GPs per day per user
- ✅ 1 hour cooldown after creation
- ✅ 1 active GP per category
- ✅ System-level limits (U / 2.5)

### 2. Location-Based Discovery
- ✅ Geospatial queries using MongoDB 2dsphere index
- ✅ Progressive radius expansion (10km → 25km → 50km → 100km → 500km)
- ✅ Distance calculation (Haversine formula)
- ✅ Privacy: Only approximate distance shown, not exact coordinates

### 3. Priority Display
- ✅ Top 7 GPs shown on main screen
- ✅ Priority scoring algorithm
- ✅ Factors: members needed, time remaining, distance, activity, engagement

### 4. Permanent Conversion
- ✅ Automatic eligibility checking
- ✅ Voting system (70% approval required)
- ✅ Conversion to permanent chat
- ✅ Admin/Moderator assignment

### 5. Explore Mode
- ✅ Advanced filtering
- ✅ Search by category, sub-type, topic, time, distance
- ✅ Pagination support

## Database Indexes

### Group Model
- `location.coordinates`: 2dsphere index for geospatial queries
- `status, expiresAt`: Compound index for active GP queries
- `createdBy, category, status`: Compound index for user's active GPs
- `category, subType, status`: Compound index for category filtering

### User Model
- `location.coordinates`: 2dsphere index (already exists)
- `email, username`: Compound index (already exists)

## Usage Examples

### Creating a GP
```typescript
const response = await fetch('/api/gp/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'Vibe GP',
    subType: 'Chill',
    talkTopics: ['Life stuff', 'Overthinking & mental vibe'],
    description: 'Chill late-night talk',
    creationReason: 'Feeling lonely today',
    reasonNote: 'Want to just talk',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
      city: 'New Delhi',
      zone: 'Central'
    }
  })
});
```

### Listing Nearby GPs
```typescript
const response = await fetch('/api/gp/list');
const { gps } = await response.json();
```

### Joining a GP
```typescript
const response = await fetch('/api/gp/join', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ gpId: 'gp_id_here' })
});
```

### Checking Creation Limits
```typescript
const response = await fetch('/api/gp/check-limits?category=Vibe GP');
const { canCreate, limits } = await response.json();
```

## Background Jobs

### Expire Old GPs
Set up a cron job to call `/api/gp/expire` periodically (e.g., every hour):

```bash
# Example cron job (runs every hour)
0 * * * * curl -X POST https://your-domain.com/api/gp/expire \
  -H "Authorization: Bearer YOUR_INTERNAL_API_KEY"
```

## Notes

1. **Location Privacy**: Exact coordinates are never exposed. Only approximate distance is shown to users.

2. **Active GP Definition**: A GP is considered active if:
   - Status is "active"
   - Not expired yet
   - Under permanent voting stage

3. **System Limits**: The formula `MaxActiveGroups = ActiveUsers / 2.5` ensures a healthy balance between creators and joiners.

4. **Permanent Conversion**: When a GP is converted to permanent:
   - It moves to the Chat section
   - Creator becomes Admin
   - First active member becomes Moderator
   - GP status changes to "converted"

5. **Message Activity**: Call `/api/gp/update-activity` whenever a message is sent in a GP to track engagement and check for permanent conversion eligibility.


