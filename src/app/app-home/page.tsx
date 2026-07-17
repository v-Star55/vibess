'use client';
import Content from "../components/Content";
import { useEffect, useState } from "react";
import { useUserStore } from "../../store/store";
import { useChatNotificationStore } from "@/src/store/chatStore";
import { getUser, getUserLocation } from "../lib/api";
import RightSide from "../components/RightSide";
import JokeDisplay from "../components/JokeDisplay";
import FloatingEmojis from "../components/FloatingEmojis";
import { MapPin } from "lucide-react";

export default function AppHome() {
  const { user, setUser } = useUserStore();
  const { unreadCount } = useChatNotificationStore();
  const [greet, setGreet] = useState("Good evening");
  const [dateStr, setDateStr] = useState("");
  const [locationName, setLocationName] = useState("Bhiwadi");

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
  }, [user, setUser]);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const greetText = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    setGreet(greetText);
    setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }));
  }, []);

  useEffect(() => {
    const fetchLoc = async () => {
      try {
        const res = await getUserLocation();
        if (res?.success && res?.location) {
          const lat = res.location.latitude;
          const lon = res.location.longitude;
          if (lat && lon) {
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
              .then(r => r.json())
              .then(data => {
                const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.suburb;
                if (city) {
                  setLocationName(city);
                }
              })
              .catch(() => {});
          }
        }
      } catch (e) {}
    };
    fetchLoc();
  }, []);

  return (
    <div className="flex-1 flex main-feed min-h-0 h-full relative font-sans text-[#f3efff]">
      {/* Center Feed */}
      <section className="flex-1 overflow-y-auto p-9 md:p-[36px_34px_60px]">
        <div className="max-w-5xl mx-auto space-y-7">
          {/* Greeting Header */}
          <div className="greet-row flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1>{greet}, {user?.name || "Vaibhav"} 👋</h1>
              <div className="date">{dateStr}</div>
            </div>
            <div className="greet-chips">
              <span className="greet-chip glass font-semibold">
                <MapPin className="pin w-[14px] h-[14px] shrink-0" />
                {locationName} · Nearby
              </span>
              {unreadCount > 0 && (
                <span className="greet-chip glass unread font-semibold">
                  <span className="pip"></span>
                  {unreadCount} unread chats
                </span>
              )}
            </div>
          </div>

          {/* Tip Card (Joke Display with Floating Emojis) */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex-1">
              <JokeDisplay />
            </div>
            <div className="shrink-0 flex items-center justify-center">
              <FloatingEmojis />
            </div>
          </div>

          {/* Feed Content */}
          <Content />
        </div>
      </section>

      {/* Right Sidebar */}
      <aside className="w-84 shrink-0 hidden xl:block border-l border-[#f3efff]/10 bg-[#150F26]/30 overflow-y-auto h-full p-[36px_24px_40px]">
        <RightSide />
      </aside>
    </div>
  );
}

