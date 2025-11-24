"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search, Hash } from "lucide-react";

/* ---------------- MOCK DATA (replace with real API calls) ---------------- */
async function mockFetchExplore({ page = 1, limit = 18 } = {}) {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 300));

  const posts = Array.from({ length: limit }).map((_, i) => {
    const id = `explore-${page}-${i}`;
    const isVideo = Math.random() > 0.85;

    return {
      _id: id,
      user: {
        _id: `user-${(page - 1) * limit + i + 1}`,
        username: `creator_${(page - 1) * limit + i + 1}`,
        profileImage: `https://i.pravatar.cc/100?img=${(page - 1) * limit + i + 10}`,
      },
      createdAt: new Date(
        Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7
      ).toISOString(),
      media: [
        {
          url: isVideo
            ? // Cloudinary demo video (ok to use)
              "https://res.cloudinary.com/demo/video/upload/w_800,h_900,c_fill,q_auto/sample.mp4"
            : // picsum images (external) — we'll render with <img>
              `https://picsum.photos/seed/${encodeURIComponent(id)}/800/900`,
          type: isVideo ? "video" : "image",
        },
      ],
      caption: ["Aesthetic", "Vibes", "City", "Neon", "Design"][
        Math.floor(Math.random() * 5)
      ] + " — explore post",
      likesCount: Math.floor(Math.random() * 3000),
      comments: Math.floor(Math.random() * 200),
    };
  });

  const creators = Array.from({ length: 8 }).map((_, i) => ({
    id: `creator-${i + 1}`,
    username: `creator${i + 1}`,
    avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
    bio: "Visual creator • vibes & edits",
    followers: Math.floor(Math.random() * 100000),
  }));

  const hashtags = [
    { tag: "aesthetic", count: 1240 },
    { tag: "neon", count: 980 },
    { tag: "design", count: 870 },
    { tag: "photography", count: 650 },
    { tag: "travel", count: 450 },
  ];

  return { posts, creators, hashtags, nextPage: page + 1 };
}

/* ---------------- small helpers ---------------- */
function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: Array<[number, string]> = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [secs, label] of intervals) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n}${label}`;
  }
  return `${seconds}s`;
}

/* ---------------- Light media renderer (no CldImage) ---------------- */
function MediaRenderer({ media }: { media: { url: string; type?: string }[] }) {
  const item = media?.[0];
  if (!item) {
    return (
      <div className="w-full aspect-square bg-white/5 flex items-center justify-center">
        <div className="text-white/40">No media</div>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <video
        src={item.url}
        className="w-full h-full object-cover"
        playsInline
        muted
        loop
        controls={false}
        autoPlay
      />
    );
  }

  // fallback to plain img for all external images
  return <img src={item.url} alt="" className="w-full h-full object-cover" />;
}

/* ---------------- Explore card (lightweight, no CldImage) ---------------- */
function ExploreCard({
  post,
  onClick,
}: {
  post: any;
  onClick?: (p: any) => void;
}) {
  return (
    <article
      className="rounded-2xl overflow-hidden bg-white/3 border border-white/8 hover:border-white/20 transition-shadow duration-200"
      onClick={() => onClick?.(post)}
    >
      <div className="relative aspect-square bg-black">
        <MediaRenderer media={post.media || []} />
        <div className="absolute left-3 top-3 bg-black/50 text-xs text-white px-2 py-1 rounded-full">
          {post.likesCount.toLocaleString()} ❤
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
            <img src={post.user?.profileImage} alt={post.user?.username} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{post.user?.username}</p>
            <p className="text-xs text-white/60 truncate">{post.caption}</p>
          </div>
          <div className="text-xs text-white/50 ml-2">{formatTimeAgo(post.createdAt)}</div>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Main Explore Page ---------------- */
export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "images" | "videos" | "creators" | "hashtags"
  >("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // initial load
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    mockFetchExplore({ page: 1, limit: 18 }).then((res) => {
      if (!mounted) return;
      setPosts(res.posts);
      setCreators(res.creators);
      setHashtags(res.hashtags);
      setPage(res.nextPage);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        if (ent.isIntersecting && !loading) {
          setLoading(true);
          mockFetchExplore({ page, limit: 12 }).then((res) => {
            setPosts((p) => [...p, ...res.posts]);
            setPage(res.nextPage);
            setLoading(false);
          });
        }
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [page, loading]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          (p.caption || "").toLowerCase().includes(q) ||
          (p.user?.username || "").toLowerCase().includes(q)
      );
    }
    if (activeFilter === "images")
      result = result.filter((p) => p.media?.[0]?.type === "image");
    if (activeFilter === "videos")
      result = result.filter((p) => p.media?.[0]?.type === "video");
    return result;
  }, [posts, query, activeFilter]);

  function openPostModal(_post: any) {
    // placeholder — implement post modal/route later
    // console.log("open", _post);
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 text-white">
          {/* search & filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-2">
              <Search className="w-5 h-5 text-white/60" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators, hashtags, or posts"
                className="flex-1 bg-transparent outline-none text-white placeholder-white/40 text-sm"
              />
              <div className="text-xs text-white/50 px-2">Press Enter to search</div>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {(["all", "images", "videos", "creators", "hashtags"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      activeFilter === f
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                )
              )}
            </div>
          </div>

          {/* featured banner */}
          <div className="rounded-2xl overflow-hidden relative bg-gradient-to-r from-purple-600 to-pink-500 p-1">
            <div className="bg-[#0b0226] p-6 rounded-xl backdrop-blur-md">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-full md:w-1/2 space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    Discover this week’s creative spotlight
                  </h2>
                  <p className="text-white/70">
                    Hand-picked posts and creators driven by engagement and craft.
                    Tap a post to explore the vibe.
                  </p>
                  <div className="flex gap-3 mt-3">
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
                      Explore Now
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10">
                      View Creators
                    </button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-3 w-full md:w-1/2">
                  {posts.slice(0, 4).map((p) => (
                    <div key={p._id} className="w-full aspect-square overflow-hidden rounded-lg">
                      {p.media?.[0]?.type === "video" ? (
                        <video
                          src={p.media[0].url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                        />
                      ) : (
                        <img src={p.media?.[0]?.url} alt={p.caption} className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* creators carousel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Creator Spotlight</h3>
              <button className="text-sm text-purple-300 hover:text-purple-200 flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 scrollbar-thin overflow-x-auto pb-2">
              {creators.map((c) => (
                <div key={c.id} className="min-w-[180px] bg-white/5 border border-white/10 rounded-2xl p-3 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <img src={c.avatar} alt={c.username} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{c.username}</p>
                        <p className="text-xs text-white/50">{Math.round(c.followers / 1000)}k</p>
                      </div>
                      <p className="text-xs text-white/60 truncate">{c.bio}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">Follow</button>
                    <button className="px-2 py-1 text-sm bg-white/5 rounded-lg">View</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* hashtags */}
          <div className="flex items-center gap-3 flex-wrap">
            {hashtags.map((h) => (
              <button key={h.tag} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full text-sm hover:bg-white/10">
                <Hash className="w-4 h-4 text-white/70" />
                <span className="font-medium">#{h.tag}</span>
                <span className="text-xs text-white/50 ml-2">{h.count}</span>
              </button>
            ))}
          </div>

          {/* masonry explore grid */}
          <section>
            <h3 className="text-xl font-semibold mb-4">Explore</h3>

            <div className="columns-1 md:columns-2 xl:columns-3 gap-4">
              {filteredPosts.map((post) => (
                <div key={post._id} className="break-inside-avoid mb-4">
                  <ExploreCard post={post} onClick={openPostModal} />
                </div>
              ))}
            </div>

            <div ref={loaderRef} className="h-16 flex items-center justify-center py-8">
              {loading ? <div className="text-white/60">Loading more...</div> : <div className="text-white/40">Scroll for more</div>}
            </div>
          </section>
    </div>
  );
}
