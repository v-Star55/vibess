import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import Group, { GP_CATEGORIES } from "@/src/models/groupModel";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      category,
      subType,
      specificName,
      genre,
      talkTopics,
      description,
      creationReason,
      reasonNote,
      location,
    } = body;

    // Validation
    if (!category || !subType || !talkTopics || !creationReason || !location) {
      return NextResponse.json(
        { message: "Category, subType, talkTopics, creationReason, and location are required" },
        { status: 400 }
      );
    }

    if (!GP_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { message: "Invalid category" },
        { status: 400 }
      );
    }

    if (!Array.isArray(talkTopics) || talkTopics.length === 0 || talkTopics.length > 3) {
      return NextResponse.json(
        { message: "Must select 1-3 talk topics" },
        { status: 400 }
      );
    }

    if (description && description.length > 200) {
      return NextResponse.json(
        { message: "Description must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (reasonNote && reasonNote.length > 100) {
      return NextResponse.json(
        { message: "Reason note must be 100 characters or less" },
        { status: 400 }
      );
    }

    // Get user with GP creation history
    const currentUser = await User.findById(user._id);
    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Check daily limit (max 2 GPs per day)
    const todayCreations = currentUser.gpCreationHistory?.filter(
      (entry: any) => {
        const createdAt = new Date(entry.createdAt);
        return createdAt >= todayStart && createdAt <= todayEnd;
      }
    ) || [];

    if (todayCreations.length >= 2) {
      return NextResponse.json(
        { message: "You can create maximum 2 GPs per day" },
        { status: 403 }
      );
    }

    // Check cooldown (1 hour after creating a group)
    if (currentUser.gpCooldownUntil && new Date(currentUser.gpCooldownUntil) > now) {
      const cooldownMinutes = Math.ceil(
        (new Date(currentUser.gpCooldownUntil).getTime() - now.getTime()) / (1000 * 60)
      );
      return NextResponse.json(
        { message: `Please wait ${cooldownMinutes} minutes before creating another GP` },
        { status: 403 }
      );
    }

    // Check category limit (1 active GP per category)
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

    if (activeGPsInCategory.length > 0) {
      return NextResponse.json(
        { message: `You already have an active ${category}. Please wait for it to end or fail before creating another.` },
        { status: 403 }
      );
    }

    // Check system-level limits
    // If total users < 5, allow 3 GPs. Otherwise, MaxActiveGroups = U / 2.5
    const activeUsersCount = await User.countDocuments({
      lastLocationUpdate: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Active in last 30 mins
    });

    const maxActiveGroups = activeUsersCount < 5 ? 3 : Math.floor(activeUsersCount / 2.5);
    const currentActiveGroups = await Group.countDocuments({
      status: "active",
      expiresAt: { $gt: now },
    });

    if (currentActiveGroups >= maxActiveGroups) {
      return NextResponse.json(
        { message: "Too many groups active right now. Try joining one instead." },
        { status: 403 }
      );
    }

    // Prepare location data
    const locationData = {
      type: "Point" as const,
      coordinates: [location.longitude || 0, location.latitude || 0],
    };

    // Calculate expiration (default 3 hours, can be adjusted)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);

    // Create GP
    const gp = new Group({
      category,
      subType,
      specificName: specificName || "",
      genre: genre || "",
      talkTopics,
      description: description || "",
      creationReason,
      reasonNote: reasonNote || "",
      location: locationData,
      city: location.city || "",
      zone: location.zone || "",
      members: [user._id],
      maxMembers: 5,
      createdBy: user._id,
      status: "active",
      expiresAt,
      startedAt: now,
    });

    await gp.save();

    // Update user's GP creation history and cooldown
    const cooldownUntil = new Date();
    cooldownUntil.setHours(cooldownUntil.getHours() + 1);

    await User.findByIdAndUpdate(user._id, {
      $push: {
        gpCreationHistory: {
          gpId: gp._id,
          createdAt: now,
        },
      },
      $set: {
        lastGPCreationAt: now,
        gpCooldownUntil: cooldownUntil,
      },
    });

    return NextResponse.json({
      success: true,
      message: "GP created successfully",
      gp,
    });
  } catch (error: any) {
    console.error("GP Creation Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

