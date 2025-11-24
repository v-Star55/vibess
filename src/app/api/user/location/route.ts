import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/app/config/dbconfig";
import User from "@/src/models/userModel";
import getUserFromToken from "@/src/app/helpers/getUserFromToken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Update user location
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB uses [lng, lat]
        },
        locationPermissionGranted: true,
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      location: {
        latitude,
        longitude,
      },
    });
  } catch (error: any) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await getUserFromToken(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await User.findById(user._id).select("location locationPermissionGranted lastLocationUpdate");

    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      location: dbUser.location?.coordinates
        ? {
            latitude: dbUser.location.coordinates[1],
            longitude: dbUser.location.coordinates[0],
          }
        : null,
      locationPermissionGranted: dbUser.locationPermissionGranted || false,
      lastLocationUpdate: dbUser.lastLocationUpdate,
    });
  } catch (error: any) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch location" },
      { status: 500 }
    );
  }
}

