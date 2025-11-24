'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/store";
import { getUser } from "./lib/api";
import LandingPage from "./landing/page";

export default function Home() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await getUser();
        const apiUser = res?.data?.user;
        if (apiUser) {
          setUser({
            id: apiUser._id,
            name: apiUser.name,
            email: apiUser.email,
            username: apiUser.username,
            profileImage: apiUser.profileImage,
          });
          // User is logged in, redirect to app home
          router.replace("/app-home");
          return;
        }
      } catch (error) {
        // Not logged in or error
      }
      // No user or error - show landing page
      setChecking(false);
    }

    // Only check if we don't have user in store
    if (!user) {
      checkAuth();
    } else {
      // User exists in store, redirect to app home
      router.replace("/app-home");
    }
  }, [user, setUser, router]);

  // Show loading state briefly, then landing page if not logged in
  if (checking && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show landing page if not logged in
  return <LandingPage />;
}
