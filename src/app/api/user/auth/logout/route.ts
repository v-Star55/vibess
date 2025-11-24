import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const response = NextResponse.json({ message: "Logout successful" });

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0), // Expire immediately
      path: "/", // Make sure it clears across entire app
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0), // Expire immediately
      path: "/", // Make sure it clears across entire app
    });


    return response;

    
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}