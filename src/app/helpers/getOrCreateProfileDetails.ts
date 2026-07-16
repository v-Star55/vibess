import UserProfileDetail from "@/src/models/userProfileDetailModel";

export default async function getOrCreateProfileDetails(userId: string) {
  try {
    let details = await UserProfileDetail.findOne({ user: userId });
    if (!details) {
      details = new UserProfileDetail({ user: userId });
      await details.save();
    }
    return details;
  } catch (error) {
    console.error("Error in getOrCreateProfileDetails helper:", error);
    throw error;
  }
}
