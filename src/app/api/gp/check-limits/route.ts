import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group from "@/src/models/groupModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

// Check if user can create a GP (check all limits)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Check daily limit
    const todayCreations = currentUser.gpCreationHistory?.filter(
      (entry: any) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt >= todayStart && createdAt <= todayEnd;
      }
    ) || [];

    const canCreateToday = todayCreations.length < 2;
    const creationsRemaining = 2 - todayCreations.length;

    // Check cooldown
    const cooldownActive = currentUser.gpCooldownUntil && new Date(currentUser.gpCooldownUntil) > now;
    const cooldownMinutes = cooldownActive
      ? Math.ceil((new Date(currentUser.gpCooldownUntil).getTime() - now.getTime()) / (1000 * 60))
      : 0;

    // Check category limit (if category provided)
    let hasActiveGPInCategory = false;
    if (category) {
      const activeGPsInCategory = await Group.find({
        createdBy: user._id,
        category,
        status: "active",
        $or: [
          { expiresAt: { $gt: now } },
          { isPermanent: true },
          { isPermanentConversionEligible: true },
        ],
      });

      hasActiveGPInCategory = activeGPsInCategory.length > 0;
    }

    // Check system limits
    // If total users < 5, allow 3 GPs. Otherwise, MaxActiveGroups = U / 2.5
    const activeUsersCount = await User.countDocuments({
      lastLocationUpdate: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    });

    const maxActiveGroups = activeUsersCount < 5 ? 3 : Math.floor(activeUsersCount / 2.5);
    const currentActiveGroups = await Group.countDocuments({
      status: "active",
      expiresAt: { $gt: now },
    });

    const systemLimitReached = currentActiveGroups >= maxActiveGroups;

    // Overall can create
    const canCreate =
      canCreateToday &&
      !cooldownActive &&
      !hasActiveGPInCategory &&
      !systemLimitReached;

    return NextResponse.json({
      success: true,
      canCreate,
      limits: {
        daily: {
          canCreate: canCreateToday,
          creationsRemaining,
          todayCreations: todayCreations.length,
        },
        cooldown: {
          active: cooldownActive,
          minutesRemaining: cooldownMinutes,
        },
        category: {
          hasActive: hasActiveGPInCategory,
          category: category || null,
        },
        system: {
          limitReached: systemLimitReached,
          currentGroups: currentActiveGroups,
          maxGroups: maxActiveGroups,
          activeUsers: activeUsersCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Check GP Limits Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

