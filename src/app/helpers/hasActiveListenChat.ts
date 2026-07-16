import Chat from "@/src/models/chatModel";
import mongoose from "mongoose";

export default async function hasActiveListenChat(userId: string) {
  try {
    const objId = new mongoose.Types.ObjectId(userId);
    const activeChat = await Chat.findOne({
      participants: objId,
      isListenChat: true,
      isLocked: false,
      expiresAt: { $gt: new Date() },
    });
    return !!activeChat;
  } catch (error) {
    console.error("Error in hasActiveListenChat helper:", error);
    return false;
  }
}
