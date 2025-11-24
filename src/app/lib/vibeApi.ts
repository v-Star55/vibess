import api from "./api";

////////////////   VIBE CARD API

export async function createVibeCard(vibeData: {
  emoji: string;
  description: string;
  energyLevel: number;
  currentIntent: string[];
  contextTag?: string;
  interactionBoundary: string;
  feelingOptions?: string[];
  vibeAvailability?: string;
  personalityPrompt?: string;
  location?: { latitude: number; longitude: number };
}) {
  try {
    const res = await api.post("/vibe/create", vibeData);
    return res.data;
  } catch (error: any) {
    console.error("Error creating vibe card:", error);
    throw error;
  }
}

export async function getMyVibeCard() {
  try {
    const res = await api.get("/vibe/my-vibe");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching vibe card:", error);
    throw error;
  }
}

export async function getUserVibe(userId: string) {
  try {
    const res = await api.get(`/vibe/user/${userId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching user vibe:", error);
    throw error;
  }
}

export async function getVibeMatches() {
  try {
    const res = await api.get("/vibe/matches");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching vibe matches:", error);
    throw error;
  }
}

export async function getVibeHeatmap(lat?: number, lng?: number, radius?: number) {
  try {
    const params = new URLSearchParams();
    if (lat !== undefined) params.append("lat", lat.toString());
    if (lng !== undefined) params.append("lng", lng.toString());
    if (radius !== undefined) params.append("radius", radius.toString());
    
    const res = await api.get(`/vibe/heatmap?${params.toString()}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching vibe heatmap:", error);
    throw error;
  }
}


////////////////   CHAT API

export async function createChat(otherUserId: string) {
  try {
    const res = await api.post("/chat/create", { otherUserId });
    return res.data;
  } catch (error: any) {
    console.error("Error creating chat:", error);
    throw error;
  }
}

export async function getChat(chatId: string) {
  try {
    const res = await api.get(`/chat/${chatId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chat:", error);
    throw error;
  }
}

export async function sendMessage(chatId: string, text: string) {
  try {
    const res = await api.patch(`/chat/${chatId}`, {
      action: "sendMessage",
      text,
    });
    return res.data;
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function reportChat(chatId: string, reason: string) {
  try {
    const res = await api.patch(`/chat/${chatId}`, {
      action: "report",
      reason,
    });
    return res.data;
  } catch (error: any) {
    console.error("Error reporting chat:", error);
    throw error;
  }
}

export async function blockUser(chatId: string) {
  try {
    const res = await api.patch(`/chat/${chatId}`, {
      action: "block",
    });
    return res.data;
  } catch (error: any) {
    console.error("Error blocking user:", error);
    throw error;
  }
}

export async function followUser(userId: string) {
  try {
    const res = await api.post("/user/follow", {
      userId,
      action: "follow",
    });
    return res.data;
  } catch (error: any) {
    console.error("Error following user:", error);
    throw error;
  }
}

export async function unfollowUser(userId: string) {
  try {
    const res = await api.post("/user/follow", {
      userId,
      action: "unfollow",
    });
    return res.data;
  } catch (error: any) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
}

export async function followUserInChat(chatId: string) {
  try {
    const res = await api.patch(`/chat/${chatId}`, {
      action: "follow",
    });
    return res.data;
  } catch (error: any) {
    console.error("Error following user in chat:", error);
    throw error;
  }
}

export async function getMyChats() {
  try {
    const res = await api.get("/chat/my-chats");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function getUnreadChatCount() {
  try {
    const res = await api.get("/chat/unread");
    return res.data;
  } catch (error: any) {
    // Re-throw the error so the caller can handle it
    // Don't log 401 errors as they're expected when not authenticated
    if (error?.response?.status !== 401) {
      console.error("Error fetching unread chats:", error);
    }
    throw error;
  }
}

////////////////   CHAT ROOM API

export async function generateChatRoom() {
  try {
    const res = await api.post("/chat-room/generate");
    return res.data;
  } catch (error: any) {
    console.error("Error generating chat room:", error);
    throw error;
  }
}

export async function getChatRooms() {
  try {
    const res = await api.get("/chat-room/list");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chat rooms:", error);
    throw error;
  }
}

export async function getChatRoom(roomId: string) {
  try {
    const res = await api.get(`/chat-room/${roomId}`);
    return res.data;
  } catch (error: any) {
    console.error("Error fetching chat room:", error);
    throw error;
  }
}

export async function sendChatRoomMessage(roomId: string, text: string) {
  try {
    const res = await api.post(`/chat-room/${roomId}`, { text });
    return res.data;
  } catch (error: any) {
    console.error("Error sending chat room message:", error);
    throw error;
  }
}

export async function expireAndRegenerateChatRooms() {
  try {
    const res = await api.post("/chat-room/expire");
    return res.data;
  } catch (error: any) {
    console.error("Error expiring and regenerating chat rooms:", error);
    throw error;
  }
}

////////////////   AI API (Gemini)

export async function generateAIIcebreakers(otherUserId: string) {
  try {
    const res = await api.post("/ai/icebreakers", { otherUserId });
    return res.data;
  } catch (error: any) {
    console.error("Error generating AI icebreakers:", error);
    throw error;
  }
}

export async function enhanceVibeDescriptionAI(vibeData: {
  emoji: string;
  description: string;
  energyLevel: number;
  currentIntent: string[];
}) {
  try {
    const res = await api.post("/ai/enhance-description", vibeData);
    return res.data;
  } catch (error: any) {
    console.error("Error enhancing description:", error);
    throw error;
  }
}

