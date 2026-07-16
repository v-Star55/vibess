import ListenProfile from "@/src/models/listenProfileModel";

export default async function getOrCreateListenProfile(userId: string) {
  try {
    let profile = await ListenProfile.findOne({ user: userId });
    if (!profile) {
      profile = new ListenProfile({ user: userId });
      await profile.save();
    }
    return profile;
  } catch (error) {
    console.error("Error in getOrCreateListenProfile helper:", error);
    throw error;
  }
}
