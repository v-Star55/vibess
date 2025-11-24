'use client';
import Content from "../components/Content";
import { useEffect } from "react";
import { useUserStore } from "../../store/store";
import { getUser } from "../lib/api";
import RightSide from "../components/RightSide";
import JokeDisplay from "../components/JokeDisplay";
import FloatingEmojis from "../components/FloatingEmojis";

export default function AppHome() {
  const { user, setUser } = useUserStore();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUser();
      console.log("From intial", res);
      const apiUser = res?.data?.user;
      if (apiUser) {
        setUser({
          id: apiUser._id,
          name: apiUser.name,
          email: apiUser.email,
          username: apiUser.username,
          profileImage: apiUser.profileImage,
        });
      }
    }

    if (!user) fetchUser();
  }, [user, setUser])

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-y-auto h-full relative">
      {/* Center Feed */}
      <section className="flex-1 max-w-5xl mx-auto">
        <div className="space-y-6">
          {/* Joke Display with Floating Emojis */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <JokeDisplay />
            </div>
            <FloatingEmojis />
          </div>
          <Content />
        </div>
      </section>
      
      {/* Right Sidebar */}
      <aside className="w-80 shrink-0 hidden xl:block">
        <RightSide />
      </aside>
    </div>
  );
}

