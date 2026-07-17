"use client";

import { getUserProfile, logoutUser, updateUserProfile, updateReadyToListen, getMyGPs, updateUserProfileDetails } from "../../lib/api";
import { getUserVibe, getVibeMatches } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Edit, Camera, X, Check, Sparkles, Loader2,
  MapPin, Calendar, HeartHandshake, Star,
  Clock, ShieldCheck, Heart, Info, Award, Cake,
  Lock, Flame, LogOut, ChevronRight, Eye, EyeOff,
  MoreVertical
} from "lucide-react";
import ConversationStartersSidebar from "../../components/ConversationStartersSidebar";
import ConversationStartersModal from "../../components/ConversationStartersModal";

export default function Profile() {
    const router = useRouter();
    const { user: currentUser, clearUser } = useUserStore();

    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [userVibe, setUserVibe] = useState<any | null>(null);
    const [vibeLoading, setVibeLoading] = useState(false);
    const [vibeError, setVibeError] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    // Profile Details (Icebreaker Questions)
    const [profileDetails, setProfileDetails] = useState<any>({});
    const [showStartersModal, setShowStartersModal] = useState(false);
    const [draftDetails, setDraftDetails] = useState<any>({});
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    // Stats
    const [vibesMatchedCount, setVibesMatchedCount] = useState(0);
    const [groupsJoinedCount, setGroupsJoinedCount] = useState(0);

    // Geolocation address resolution
    const [locationName, setLocationName] = useState("Bhiwadi, Rajasthan");
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Privacy states
    const [showExactDistance, setShowExactDistance] = useState(true);
    const [appearInHeatmap, setAppearInHeatmap] = useState(true);

    // Edit states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedBio, setEditedBio] = useState("");
    const [editedName, setEditedName] = useState("");
    const [editedBirthday, setEditedBirthday] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // File states
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
    
    // Ready to listen states
    const [readyToListen, setReadyToListen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [updatingReadyToListen, setUpdatingReadyToListen] = useState(false);

    const isOwnProfile = true;

    // Hobbies options
    const HOBBIES_LIST = [
      "Photography", "Gym", "Reading", "Coding", "Cricket", "Football", 
      "Chess", "Anime", "Movies", "Music", "Dancing", "Cooking", 
      "Travelling", "Startups", "AI", "Gaming", "Content Creation"
    ];

    // Icebreaker mapping details (labels and emojis)
    const STARTERS_MAPPING: Record<string, { label: string; icon: string }> = {
      favoriteMovie: { label: "Favorite Movie", icon: "🎬" },
      favoriteSeries: { label: "Favorite Series", icon: "📺" },
      lastMovieWatched: { label: "Last Movie Watched", icon: "🍿" },
      favoriteAnime: { label: "Favorite Anime", icon: "🍥" },
      favoriteSuperhero: { label: "Favorite Superhero", icon: "🦸‍♂️" },
      favoriteGame: { label: "Favorite Game", icon: "🎮" },
      songOnRepeat: { label: "Song on Repeat", icon: "🎧" },
      favoriteArtistBand: { label: "Favorite Artist/Band", icon: "🎸" },
      favoriteBook: { label: "Favorite Book", icon: "📚" },
      favoritePodcast: { label: "Favorite Podcast", icon: "🎙" },

      threeWordsDescribeMe: { label: "Three words that describe me", icon: "😄" },
      nightOwlEarlyBird: { label: "Night Owl or Early Bird?", icon: "🌙" },
      coffeeOrTea: { label: "Coffee or Tea?", icon: "☕" },
      mountainsOrBeach: { label: "Mountains or Beach?", icon: "🏖" },
      catOrDog: { label: "Cat or Dog?", icon: "🐶" },
      sweetOrSpicy: { label: "Sweet or Spicy?", icon: "🍕" },
      introvertExtrovertAmbivert: { label: "Introvert / Extrovert / Ambivert", icon: "🎨" },
      biggestGreenFlag: { label: "Biggest Green Flag", icon: "🟩" },
      biggestRedFlag: { label: "Biggest Red Flag", icon: "🚩" },
      myToxicTrait: { label: "My toxic trait is...", icon: "😂" },

      favoriteCuisine: { label: "Favorite Cuisine", icon: "🍜" },
      goToMidnightSnack: { label: "Go-to Midnight Snack", icon: "🍪" },
      favoriteFastFood: { label: "Favorite Fast Food", icon: "🍔" },

      dreamDestination: { label: "Dream Destination", icon: "✈" },
      mostBeautifulPlaceBeen: { label: "Most Beautiful Place I've Been", icon: "🏞" },
      nextTrip: { label: "Next Trip", icon: "🎒" },
      windowOrAisle: { label: "Window or Aisle seat?", icon: "💺" },

      ifOneCroreToday: { label: "If you had ₹1 Crore today...", icon: "💰" },
      zombieApocalypseRole: { label: "Zombie apocalypse role?", icon: "🧟‍♂️" },
      fictionalCharacter: { label: "Which fictional character are you?", icon: "🦸‍♀️" },
      neverGetTiredOf: { label: "One thing you'll never get tired of?", icon: "✨" },
      lifeTitle: { label: "If your life had a title?", icon: "📖" },
      mostEmbarrassingMoment: { label: "Most embarrassing moment?", icon: "😳" },
      lastThingLaugh: { label: "Last thing that made you laugh?", icon: "😆" },
      conspiracyTheoryBelieve: { label: "One conspiracy theory you kinda believe", icon: "👽" },
      dinnerWithAnyone: { label: "If you could have dinner with anyone?", icon: "🍽" },

      favoriteLanguage: { label: "Favorite Programming Language", icon: "💻" },
      dreamCompany: { label: "Dream Company", icon: "🏢" },
      currentSideProject: { label: "Current Side Project", icon: "🚀" },
      vsCodeTheme: { label: "VS Code Theme", icon: "🎨" },
      tabsVsSpaces: { label: "Tabs vs Spaces 😈", icon: "😈" },
      coffeeWhileCoding: { label: "Coffee while coding?", icon: "☕" }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getUserProfile();
                if (!res) {
                    setErrorMsg("Not authenticated");
                    router.push("/login");
                    return;
                }
                const data = res.data?.profile;
                setProfile(data || {});
                setProfileDetails(data?.profileDetails || {});
                setEditedBio(data?.user?.bio || "");
                setEditedName(data?.user?.name || "");
                setEditedBirthday(data?.user?.birthday ? new Date(data.user.birthday).toISOString().split('T')[0] : "");
                setReadyToListen(data?.user?.readyToListen || false);
            } catch (e: any) {
                setErrorMsg(e?.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    useEffect(() => {
        const targetUserId = profile?.user?._id;
        if (!targetUserId) return;
        let ignore = false;

        const fetchVibe = async () => {
            setVibeLoading(true);
            setVibeError("");
            try {
                const res = await getUserVibe(targetUserId);
                if (!ignore) setUserVibe(res?.vibeCard || null);
            } catch (error: any) {
                if (!ignore) {
                    if (error?.response?.status === 404) {
                        setUserVibe(null);
                        setVibeError("");
                    } else {
                        setVibeError(error?.response?.data?.message || "Failed to load vibe");
                    }
                }
            } finally {
                if (!ignore) setVibeLoading(false);
            }
        };

        const fetchAdditionalStats = async () => {
            try {
                const matchesRes = await getVibeMatches();
                if (matchesRes && matchesRes.matches) {
                    setVibesMatchedCount(matchesRes.matches.length);
                }
            } catch (error) {
                console.error("Error fetching matches count:", error);
            }

            try {
                const gpRes = await getMyGPs();
                if (gpRes && gpRes.gps) {
                    setGroupsJoinedCount(gpRes.gps.length);
                }
            } catch (error) {
                console.error("Error fetching groups count:", error);
            }
        };

        fetchVibe();
        fetchAdditionalStats();

        return () => {
            ignore = true;
        };
    }, [profile?.user?._id]);

    // Geolocation Resolution
    useEffect(() => {
        const coordinates = profile?.user?.location?.coordinates;
        const hasCoordinates = coordinates && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0);

        if (hasCoordinates) {
            setLoadingLocation(true);
            const lon = coordinates[0];
            const lat = coordinates[1];
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
                .then(res => res.json())
                .then(data => {
                    const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.suburb;
                    const state = data?.address?.state;
                    if (city && state) {
                        setLocationName(`${city}, ${state}`);
                    } else if (city) {
                        setLocationName(city);
                    } else if (data?.address?.country) {
                        setLocationName(data?.address?.country);
                    } else {
                        setLocationName("Bhiwadi, Rajasthan");
                    }
                })
                .catch(() => {
                    setLocationName("Bhiwadi, Rajasthan");
                })
                .finally(() => {
                    setLoadingLocation(false);
                });
        } else {
            setLocationName("Bhiwadi, Rajasthan");
        }
    }, [profile?.user?.location?.coordinates]);

    useEffect(() => {
        if (!showDropdown) return;
        const handleOutsideClick = () => setShowDropdown(false);
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [showDropdown]);

    const handleLogout = async () => {
        try {
            const res = await logoutUser();
            toast.success(res?.data?.message || "Logout successful");
            clearUser();
            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("Logout failed. Please try again.");
        }
    };

    const handleEditToggle = () => {
        if (isEditMode) {
            setEditedBio(profile?.user?.bio || "");
            setEditedName(profile?.user?.name || "");
        }
        setIsEditMode(!isEditMode);
    };

    const handleImageUpload = (type: "profile" | "banner") => {
        const input = document.createElement("input");
        input.type = "file";
        input.onchange = async (e: any) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                if (type === "profile") {
                    setProfile((prev: any) => ({
                        ...prev,
                        user: { ...prev.user, profileImage: reader.result as string },
                    }));
                    setProfileImageFile(file);
                } else {
                    setProfile((prev: any) => ({
                        ...prev,
                        user: { ...prev.user, bannerImage: reader.result as string },
                    }));
                    setBannerImageFile(file);
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleSaveProfile = async () => {
        if (!profile?.user?._id) return;
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("bio", editedBio);
            formData.append("name", editedName);
            formData.append("birthday", editedBirthday);
            if (profileImageFile) formData.append("profileImage", profileImageFile);
            if (bannerImageFile) formData.append("bannerImage", bannerImageFile);

            const res = await updateUserProfile(formData);
            setProfile((prev: any) => ({ ...prev, user: res.user }));

            toast.success("Profile updated successfully!");
            setIsEditMode(false);
            setProfileImageFile(null);
            setBannerImageFile(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleReadyToListen = async () => {
        if (updatingReadyToListen) return;
        
        if (!readyToListen) {
            setShowConfirmDialog(true);
        } else {
            await handleUpdateReadyToListen(false);
        }
    };

    const handleConfirmReadyToListen = () => {
        setShowConfirmDialog(false);
        handleUpdateReadyToListen(true);
    };

    const handleUpdateReadyToListen = async (value: boolean) => {
        if (updatingReadyToListen) return;
        
        setUpdatingReadyToListen(true);
        try {
            const res = await updateReadyToListen(value);
            const updatedValue = res?.user?.readyToListen ?? res?.readyToListen ?? value;
            
            setReadyToListen(updatedValue);
            setProfile((prev: any) => ({
                ...prev,
                user: { ...prev.user, readyToListen: updatedValue },
            }));
            
            toast.success(updatedValue ? "You're now open to supporting others!" : "Ready to listen status turned off");
        } catch (error: any) {
            console.error("Error updating ready to listen:", error);
            const errorMessage = error?.response?.data?.error || error?.message || "Failed to update status";
            toast.error(errorMessage);
            
            setReadyToListen(!value);
            setProfile((prev: any) => ({
                ...prev,
                user: { ...prev.user, readyToListen: !value },
            }));
        } finally {
            setUpdatingReadyToListen(false);
        }
    };

    // Save Icebreaker Starters
    const handleSaveStarters = async () => {
        setIsSavingDetails(true);
        try {
            const res = await updateUserProfileDetails(draftDetails);
            if (res.success) {
                setProfileDetails(res.profileDetails);
                toast.success("Conversation starters saved successfully!");
                setShowStartersModal(false);
            } else {
                toast.error(res.error || "Failed to save details");
            }
        } catch (error) {
            console.error("Failed to save profile details:", error);
            toast.error("Failed to update conversation starters");
        } finally {
            setIsSavingDetails(false);
        }
    };

    // Check if any details are populated
    const hasAnyDetails = profileDetails && Object.keys(profileDetails).some(key => {
        if (key === "_id" || key === "user" || key === "createdAt" || key === "updatedAt" || key === "__v") return false;
        if (key === "hobbies" || key === "personalities") return Array.isArray(profileDetails[key]) && profileDetails[key].length > 0;
        return typeof profileDetails[key] === "string" && profileDetails[key].trim() !== "";
    });

    // Helper for rendering rating stars
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Star key={i} className="w-3.5 h-3.5 text-[#FFB25E] fill-[#FFB25E]" />);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(
                    <div key={i} className="relative w-3.5 h-3.5 text-[#FFB25E]">
                        <Star className="absolute top-0 left-0 w-3.5 h-3.5 text-[#FFB25E]" />
                        <div className="absolute top-0 left-0 w-1.5 h-3.5 overflow-hidden">
                            <Star className="w-3.5 h-3.5 text-[#FFB25E] fill-[#FFB25E]" />
                        </div>
                    </div>
                );
            } else {
                stars.push(<Star key={i} className="w-3.5 h-3.5 text-[#7C7196]" />);
            }
        }
        return stars;
    };

    return (
        <div className="bg-[#100C1C] text-[#F3EFFF] min-h-screen w-full overflow-y-auto font-sans pb-16">
            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    --ink: #100C1C;
                    --ink-2: #150F26;
                    --surface: #1C1732;
                    --surface-2: #251F42;
                    --line: rgba(243,239,255,0.09);
                    --text: #F3EFFF;
                    --text-dim: #B3A7CE;
                    --text-faint: #7C7196;
                    --fun: #FF5D73;
                    --chaos: #C65CFF;
                    --calm: #33D6C0;
                    --chill: #FFB25E;
                    --over: #8F84AE;
                    --radius-s: 10px;
                    --radius-m: 16px;
                    --radius-l: 24px;
                    --glass: rgba(255,255,255,0.045);
                    --glass-strong: rgba(255,255,255,0.09);
                    --glass-border: rgba(255,255,255,0.13);
                    --shadow-deep: 0 30px 70px -26px rgba(0,0,0,0.6);
                }

                .glass-card {
                    background: linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
                    backdrop-filter: blur(20px) saturate(150%);
                    -webkit-backdrop-filter: blur(20px) saturate(150%);
                    border: 1px solid rgba(255,255,255,0.08);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 40px -15px rgba(0,0,0,0.5);
                }
                
                .glass-card-strong {
                    background: linear-gradient(165deg, rgba(255,255,255,0.09), rgba(255,255,255,0.045));
                    backdrop-filter: blur(20px) saturate(150%);
                    -webkit-backdrop-filter: blur(20px) saturate(150%);
                    border: 1px solid rgba(255,255,255,0.12);
                    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px -26px rgba(0,0,0,0.6);
                }

                .eyebrow-text {
                    font-family: var(--font-space-mono), 'Space Mono', monospace;
                    font-size: 11px;
                    letter-spacing: 0.13em;
                    text-transform: uppercase;
                    color: #7C7196;
                }

                .conic-avatar-border {
                    background: conic-gradient(from 90deg, #FF5D73, #C65CFF, #33D6C0, #FFB25E, #FF5D73);
                    animation: spinConic 8s linear infinite;
                }
                
                @keyframes spinConic {
                    to { transform: rotate(360deg); }
                }

                .pulse-glow {
                    animation: pulseGlow 1.8s infinite;
                }

                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 0 0 rgba(51, 214, 192, 0.5); }
                    70% { box-shadow: 0 0 0 8px rgba(51, 214, 192, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(51, 214, 192, 0); }
                }
            `}} />

            {loading ? (
                <div className="flex items-center justify-center min-h-[70vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-[#C65CFF] animate-spin" />
                        <p className="text-[#B3A7CE] text-lg font-medium">Loading profile...</p>
                    </div>
                </div>
            ) : errorMsg ? (
                <div className="flex items-center justify-center min-h-[70vh] p-4">
                    <div className="bg-[#FF5D73]/10 border border-[#FF5D73]/30 rounded-2xl p-8 text-center max-w-md w-full glass-card">
                        <p className="text-[#FF5D73] text-lg font-medium">{errorMsg}</p>
                        <button 
                            onClick={() => router.push("/login")}
                            className="mt-6 px-6 py-2.5 bg-[#C65CFF] text-[#100C1C] rounded-full font-bold hover:bg-[#C65CFF]/90 transition"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header Banner */}
                    <div className="relative w-full h-[180px] overflow-hidden group bg-[#1C1732] border-b border-[#f3efff]/10">
                        {profile?.user?.bannerImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.user.bannerImage}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-[#FF5D73]/20 via-[#C65CFF]/20 to-[#33D6C0]/20"></div>
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>

                        {/* Top Action Row with 3 Dots Dropdown */}
                        <div className="absolute top-4 right-4 z-20 flex gap-3">
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDropdown(!showDropdown);
                                    }}
                                    className="p-2.5 glass-btn bg-white/5 text-[#F3EFFF] rounded-full hover:bg-white/10 transition-all flex items-center justify-center border border-white/10"
                                    aria-label="More options"
                                >
                                    <MoreVertical className="w-5 h-5 text-[#F3EFFF]" />
                                </button>
                                
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-[#150F26]/95 border border-white/10 p-1.5 shadow-2xl z-30 animate-in fade-in slide-in-from-top-1 duration-100 backdrop-blur-md">
                                        <button
                                            onClick={() => {
                                                setShowDropdown(false);
                                                handleLogout();
                                            }}
                                            className="w-full px-4 py-2.5 rounded-xl text-left text-sm text-[#FF5D73] hover:bg-white/5 transition flex items-center gap-2 font-medium"
                                        >
                                            <LogOut className="w-4 h-4 text-[#FF5D73]" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isOwnProfile && (
                            <button
                                onClick={() => handleImageUpload("banner")}
                                className="absolute top-4 left-4 z-10 p-3 bg-[#100C1C]/40 backdrop-blur-md hover:bg-[#100C1C]/60 text-[#F3EFFF] rounded-full transition-all border border-white/10 opacity-0 group-hover:opacity-100"
                                title="Change Banner Image"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Main Container */}
                    <div className="mx-auto px-4 md:px-8 max-w-[1400px] w-full -mt-[58px] relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                            
                            {/* Middle Column (Main Content) */}
                            <div className="flex flex-col gap-8 min-w-0">
                                
                                {/* Profile Header Card */}
                                <div className="glass-card-strong rounded-3xl p-6 md:p-8">
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                                        
                                        {/* Left: Avatar & Identity Details */}
                                        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                                            {/* Avatar Ring */}
                                            <div className="relative shrink-0 group">
                                                <div className="w-[104px] h-[104px] rounded-full p-[3px] conic-avatar-border shadow-lg">
                                                    <div className="w-full h-full rounded-full overflow-hidden bg-[#150F26] flex items-center justify-center ring-4 ring-[#100C1C]">
                                                        {profile?.user?.profileImage ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={profile.user.profileImage}
                                                                alt={profile.user.name || "User"}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-[#F3EFFF] text-4xl font-extrabold font-bricolage">
                                                                {profile?.user?.name?.[0] || "U"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {isOwnProfile && (
                                                    <button
                                                        onClick={() => handleImageUpload("profile")}
                                                        className="absolute bottom-1 right-1 p-2 bg-[#C65CFF] text-[#100C1C] rounded-full transition-all shadow-lg hover:scale-105"
                                                        title="Change Profile Image"
                                                    >
                                                        <Camera className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Identity Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                                                    {isEditMode ? (
                                                        <input
                                                            type="text"
                                                            value={editedName}
                                                            onChange={(e) => setEditedName(e.target.value)}
                                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[#F3EFFF] text-2xl font-extrabold focus:outline-none focus:ring-1 focus:ring-[#C65CFF] font-bricolage w-full max-w-[280px]"
                                                            placeholder="Your name"
                                                        />
                                                    ) : (
                                                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#F3EFFF] font-bricolage tracking-tight truncate max-w-[320px]">
                                                            {profile?.user?.name}
                                                        </h1>
                                                    )}

                                                    {profile?.user?.isVerified && (
                                                        <span className="text-[#33D6C0] shrink-0" title="Verified Presence">
                                                            <ShieldCheck className="w-5 h-5 fill-[#33D6C0]/10" />
                                                        </span>
                                                    )}
                                                </div>

                                                {isEditMode && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] text-[#B3A7CE] font-bold uppercase tracking-wider">Birthday:</span>
                                                        <input
                                                            type="date"
                                                            value={editedBirthday}
                                                            onChange={(e) => setEditedBirthday(e.target.value)}
                                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-[#F3EFFF] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#C65CFF] cursor-pointer"
                                                        />
                                                    </div>
                                                )}

                                                <p className="text-[#7C7196] font-medium text-sm mb-3">
                                                    @{profile?.user?.username}
                                                </p>

                                                {/* Meta Row */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#B3A7CE] text-xs font-medium">
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-[#7C7196]" />
                                                        {loadingLocation ? (
                                                            <span className="text-white/40">Resolving...</span>
                                                        ) : (
                                                            locationName
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-[#7C7196]" />
                                                        Member since {formatDayAndDate(profile?.user?.createdAt)}
                                                    </span>
                                                    {profile?.user?.birthday && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Cake className="w-3.5 h-3.5 text-[#7C7196]" />
                                                            Born {new Date(profile.user.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex gap-2.5 w-full sm:w-auto shrink-0 md:mb-1">
                                            {isEditMode ? (
                                                <>
                                                    <button
                                                        onClick={handleSaveProfile}
                                                        disabled={isSaving}
                                                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-gradient-to-r from-[#33D6C0] to-[#C65CFF] hover:opacity-90 text-[#100C1C] font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg"
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="w-4 h-4 animate-spin text-[#100C1C]" />
                                                        ) : (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={handleEditToggle}
                                                        disabled={isSaving}
                                                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full bg-[#150F26] text-[#F3EFFF] font-bold text-sm border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-1.5"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={handleEditToggle}
                                                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/5 text-[#F3EFFF] border border-white/10 hover:bg-white/10 font-bold text-sm transition flex items-center justify-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4 text-[#C65CFF]" />
                                                    Edit Profile
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Editable Bio Line */}
                                    <div className="mt-6 pt-5 border-t border-[#f3efff]/10">
                                        {isEditMode ? (
                                            <textarea
                                                value={editedBio}
                                                onChange={(e) => setEditedBio(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[#F3EFFF] text-sm focus:outline-none focus:ring-1 focus:ring-[#C65CFF] resize-none"
                                                placeholder="Write something cool about yourself..."
                                                rows={3}
                                                maxLength={160}
                                            />
                                        ) : (
                                            <p className="text-[#B3A7CE] text-sm md:text-base leading-relaxed max-w-[680px]">
                                                {profile?.user?.bio || "Full-stack dev by day, overthinker by 2am. Down for chai debates, movie GPs, and pretending I understand cricket strategy."}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Stats Strip */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#f3efff]/10 border border-[#f3efff]/10 rounded-2xl md:rounded-3xl overflow-hidden glass-card">
                                    <div className="bg-[#1C1732]/30 p-5 flex flex-col justify-center">
                                        <div className="text-xl md:text-2xl font-extrabold font-bricolage text-[#F3EFFF]">
                                            {vibesMatchedCount}
                                        </div>
                                        <div className="eyebrow-text mt-1">Vibes Matched</div>
                                    </div>
                                    <div className="bg-[#1C1732]/30 p-5 flex flex-col justify-center border-l md:border-l border-[#f3efff]/10">
                                        <div className="text-xl md:text-2xl font-extrabold font-bricolage text-[#F3EFFF]">
                                            {groupsJoinedCount}
                                        </div>
                                        <div className="eyebrow-text mt-1">Groups Joined</div>
                                    </div>
                                    <div className="bg-[#1C1732]/30 p-5 flex flex-col justify-center border-t md:border-t-0 md:border-l border-[#f3efff]/10">
                                        <div className="text-xl md:text-2xl font-extrabold font-bricolage text-[#F3EFFF]">
                                            {profile?.listenProfile?.ratingCount || 0}
                                        </div>
                                        <div className="eyebrow-text mt-1">Sessions</div>
                                    </div>
                                    <div className="bg-[#1C1732]/30 p-5 flex flex-col justify-center border-t border-l border-[#f3efff]/10">
                                        <div className="text-xl md:text-2xl font-extrabold font-bricolage text-[#FFB25E]">
                                            96%
                                        </div>
                                        <div className="eyebrow-text mt-1">Response Rate</div>
                                    </div>
                                </div>

                                {/* Current Vibe Section */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-5 h-5 text-[#C65CFF]" />
                                        <h2 className="text-lg md:text-xl font-extrabold font-bricolage text-[#F3EFFF]">Current Vibe</h2>
                                    </div>

                                    {vibeLoading ? (
                                        <div className="glass-card rounded-3xl p-8 flex items-center justify-center text-[#B3A7CE]">
                                            <Loader2 className="w-6 h-6 animate-spin text-[#C65CFF] mr-2" />
                                            <span>Retrieving active vibe card...</span>
                                        </div>
                                    ) : vibeError ? (
                                        <div className="glass-card rounded-3xl p-6 text-sm text-[#FF5D73] border border-[#FF5D73]/20">
                                            {vibeError}
                                        </div>
                                    ) : userVibe ? (
                                        <div
                                            className="rounded-3xl p-6 md:p-8 border relative overflow-hidden text-white shadow-2xl transition duration-300 hover:scale-[1.01]"
                                            style={{
                                                borderColor: userVibe.theme?.borderGlow || "#C65CFF",
                                                backgroundImage: `linear-gradient(135deg, ${userVibe.theme?.gradientFrom || "#1C1732"}, ${userVibe.theme?.gradientTo || "#251F42"})`,
                                                boxShadow: `0 0 40px ${(userVibe.theme?.borderGlow || "#C65CFF")}25`,
                                            }}
                                        >
                                            {/* Gradient Accent Overlay */}
                                            <div className="absolute -top-[30%] -right-[15%] w-80 h-80 bg-radial from-[#FFB25E]/10 to-transparent pointer-events-none" />

                                            {/* Vibe Header */}
                                            <div className="flex items-center justify-between gap-4 mb-6 relative z-10 flex-wrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-[52px] h-[52px] rounded-full p-0.5 conic-avatar-border flex items-center justify-center">
                                                        <div className="w-full h-full rounded-full bg-[#150F26] flex items-center justify-center text-2xl">
                                                            {userVibe.emoji}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg md:text-xl font-extrabold font-bricolage text-white leading-tight">
                                                            feeling {userVibe.vibeScore?.mood || "good"}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#33D6C0] font-mono tracking-wider font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#33D6C0] pulse-glow" />
                                                            Active Vibe
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Energy Track Slider */}
                                                <div className="min-w-[170px] w-full sm:w-auto mt-2 sm:mt-0">
                                                    <div className="flex justify-between text-[11px] font-medium text-[#B3A7CE] mb-1">
                                                        <span>Energy Level</span>
                                                        <span>{userVibe.energyLevel || 5}/10</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-[#FFB25E] to-[#FF5D73]" 
                                                            style={{ width: `${(userVibe.energyLevel || 5) * 10}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bio Segment */}
                                            <div className="mb-5 relative z-10">
                                                <span className="eyebrow-text text-white/50 block mb-2">Vibe Description</span>
                                                <p className="text-white/90 text-sm leading-relaxed max-w-[620px]">
                                                    {userVibe.description}
                                                </p>
                                            </div>

                                            {/* Feeling Tags */}
                                            {userVibe.feelingOptions && userVibe.feelingOptions.length > 0 && (
                                                <div className="mb-5 pt-4 border-t border-white/10 relative z-10">
                                                    <span className="eyebrow-text text-white/50 block mb-2.5">Today I feel like</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userVibe.feelingOptions.map((feeling: string, idx: number) => (
                                                            <span 
                                                                key={idx} 
                                                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
                                                            >
                                                                {feeling}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Current Intents */}
                                            {userVibe.currentIntent && userVibe.currentIntent.length > 0 && (
                                                <div className="mb-5 pt-4 border-t border-white/10 relative z-10">
                                                    <span className="eyebrow-text text-white/50 block mb-2.5">Interests / Intents</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userVibe.currentIntent.map((intent: string, idx: number) => (
                                                            <span 
                                                                key={idx} 
                                                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#C65CFF]/10 text-[#C65CFF] border border-[#C65CFF]/20 hover:bg-[#C65CFF]/20 transition"
                                                            >
                                                                {intent}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ask me about... */}
                                            {userVibe.askMeAbout && userVibe.askMeAbout.length > 0 && (
                                                <div className="mb-5 pt-4 border-t border-white/10 relative z-10">
                                                    <span className="eyebrow-text text-white/50 block mb-2.5">Ask me about...</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {userVibe.askMeAbout.map((item: string, idx: number) => (
                                                            <span 
                                                                key={idx} 
                                                                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#33D6C0]/10 text-[#33D6C0] border border-[#33D6C0]/20 hover:bg-[#33D6C0]/20 transition"
                                                            >
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Context Tag / Prompt & Boundary Details */}
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs text-white/80 relative z-10">
                                                <div>
                                                    <span className="eyebrow-text text-white/50 block mb-1">Context Tag</span>
                                                    <span className="font-semibold text-white">#{userVibe.contextTag || "dailyvibe"}</span>
                                                </div>
                                                <div>
                                                    <span className="eyebrow-text text-white/50 block mb-1">Conversational Preferences</span>
                                                    <span className="font-semibold text-white truncate block">{userVibe.conversationalPreferences || userVibe.interactionBoundary || "Calm replies"}</span>
                                                </div>
                                            </div>

                                            {/* Dynamic Vibe Scores */}
                                            <div className="grid grid-cols-3 gap-3 text-xs text-white/90 mt-5 pt-4 border-t border-white/10 relative z-10">
                                                <div className="bg-black/25 rounded-xl px-3 py-2 border border-white/5">
                                                    <p className="eyebrow-text text-[9px] text-white/40">Energy</p>
                                                    <p className="font-bold mt-0.5">{Math.round(userVibe.vibeScore?.energy ?? 0)}/100</p>
                                                </div>
                                                <div className="bg-black/25 rounded-xl px-3 py-2 border border-white/5">
                                                    <p className="eyebrow-text text-[9px] text-white/40">Positivity</p>
                                                    <p className="font-bold mt-0.5">{Math.round(userVibe.vibeScore?.positivity ?? 0)}/100</p>
                                                </div>
                                                <div className="bg-black/25 rounded-xl px-3 py-2 border border-white/5">
                                                    <p className="eyebrow-text text-[9px] text-white/40">Intent Alignment</p>
                                                    <p className="font-bold mt-0.5 capitalize truncate">{userVibe.vibeScore?.intent || "General"}</p>
                                                </div>
                                            </div>

                                            {/* Matches Action Buttons */}
                                            <div className="mt-6 flex gap-3 flex-wrap relative z-10">
                                                <button
                                                    onClick={() => router.push("/vibe/discover")}
                                                    className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-sm transition shadow-lg text-center"
                                                >
                                                    View Matches
                                                </button>
                                                <button
                                                    onClick={() => router.push("/vibe/create")}
                                                    className="flex-1 min-w-[130px] py-2.5 rounded-xl bg-[#F3EFFF] text-[#100C1C] hover:bg-[#F3EFFF]/90 font-bold text-sm transition shadow-lg text-center"
                                                >
                                                    Update Vibe
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#1C1732]/30 border border-dashed border-white/10 rounded-3xl p-8 text-center glass-card">
                                            <p className="text-[#B3A7CE] text-sm">You haven't shared a Vibe Card today.</p>
                                            <button
                                                onClick={() => router.push("/vibe/create")}
                                                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF5D73] to-[#C65CFF] text-[#100C1C] font-bold hover:scale-[1.02] transition shadow-lg"
                                            >
                                                <Sparkles className="w-4 h-4 text-[#100C1C]" />
                                                Create Vibe Card
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Listening Profile Section */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <HeartHandshake className="w-5 h-5 text-[#33D6C0]" />
                                        <h2 className="text-lg md:text-xl font-extrabold font-bricolage text-[#F3EFFF]">Listening Profile</h2>
                                    </div>

                                    <div className="glass-card rounded-3xl p-6 md:p-8 border border-[#33D6C0]/15 relative overflow-hidden">
                                        {/* Background glow accent */}
                                        <div className="absolute -top-[25%] -left-[10%] w-72 h-72 bg-radial from-[#33D6C0]/5 to-transparent pointer-events-none" />

                                        {/* Title & Sync Toggle */}
                                        <div className="flex items-center justify-between gap-4 flex-wrap mb-6 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#33D6C0] to-[#C65CFF] flex items-center justify-center">
                                                    <HeartHandshake className="w-5 h-5 text-[#100C1C]" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base md:text-lg font-bold text-white leading-tight">
                                                        {profile?.listenProfile?.ratingCount || 0} people felt heard
                                                    </h3>
                                                    <p className="text-xs text-[#7C7196] mt-0.5 font-medium">
                                                        You support when someone just needs a calm companion.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Open to listen Toggle */}
                                            {isOwnProfile && (
                                                <div className="flex items-center gap-3 px-4 py-2 glass-btn bg-white/5 border border-white/10 rounded-full transition-all">
                                                    <span className="text-xs font-bold text-[#B3A7CE]">Open to listen</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleToggleReadyToListen();
                                                        }}
                                                        disabled={updatingReadyToListen}
                                                        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                                                            readyToListen
                                                                ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]"
                                                                : "bg-white/15"
                                                        } ${updatingReadyToListen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                    >
                                                        {updatingReadyToListen ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute left-[14px]" />
                                                        ) : (
                                                            <span
                                                                className={`block w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                                                                    readyToListen ? "translate-x-5" : "translate-x-0"
                                                                }`}
                                                            />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-6 relative z-10">
                                            <div className="bg-[#150F26]/60 p-4 rounded-2xl border border-white/5 text-center">
                                                <div className="text-lg md:text-xl font-extrabold font-bricolage text-[#F3EFFF] flex items-center justify-center gap-1">
                                                    <Star className="w-4 h-4 text-[#FFB25E] fill-[#FFB25E]" />
                                                    {profile?.listenProfile?.ratingCount > 0 ? Number(profile.listenProfile.rating).toFixed(1) : "—"}
                                                </div>
                                                <div className="eyebrow-text text-[9px] mt-1">Avg Rating</div>
                                            </div>
                                            <div className="bg-[#150F26]/60 p-4 rounded-2xl border border-white/5 text-center">
                                                <div className="text-lg md:text-xl font-extrabold font-bricolage text-[#F3EFFF]">
                                                    {profile?.listenProfile?.ratingCount || 0}
                                                </div>
                                                <div className="eyebrow-text text-[9px] mt-1">Sessions</div>
                                            </div>
                                            <div className="bg-[#150F26]/60 p-4 rounded-2xl border border-white/5 text-center">
                                                <div className="text-lg md:text-xl font-extrabold font-bricolage text-[#33D6C0]">
                                                    {profile?.listenProfile?.totalListenHours !== undefined ? `${profile.listenProfile.totalListenHours}h` : "0h"}
                                                </div>
                                                <div className="eyebrow-text text-[9px] mt-1">Hrs Spent</div>
                                            </div>
                                        </div>

                                        {/* Listen Badges */}
                                        <div className="flex gap-2 flex-wrap mb-6 relative z-10">
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#33D6C0]/5 text-[#33D6C0] border border-[#33D6C0]/15 flex items-center gap-1">
                                                <Heart className="w-3.5 h-3.5 fill-[#33D6C0]/10" />
                                                Judgment-Free Zone
                                            </span>
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#33D6C0]/5 text-[#33D6C0] border border-[#33D6C0]/15 flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Fast Responder
                                            </span>
                                            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#33D6C0]/5 text-[#33D6C0] border border-[#33D6C0]/15 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Patient Presence
                                            </span>
                                        </div>

                                        {/* Recent Feedback Reviews */}
                                        <div className="pt-5 border-t border-white/10 relative z-10">
                                            <span className="eyebrow-text text-white/50 block mb-4">Recent Feedback</span>
                                            
                                            {profile?.listenProfile?.reviews && profile.listenProfile.reviews.length > 0 ? (
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                                                    {profile.listenProfile.reviews.map((rev: any) => {
                                                        const reviewerName = rev.reviewer?.name || "Anonymous Speaker";
                                                        const dateStr = new Date(rev.createdAt).toLocaleDateString([], { month: "short", day: "numeric" });
                                                        
                                                        const borderColors: Record<string, string> = {
                                                          Light: "border-[#33D6C0]",
                                                          Moderate: "border-[#FFB25E]",
                                                          Heavy: "border-[#FF5D73]",
                                                        };
                                                        const borderColor = borderColors[rev.heaviness] || "border-[#C65CFF]";

                                                        return (
                                                            <div key={rev._id} className={`p-4 rounded-xl bg-white/[0.03] border-l-[3px] ${borderColor} glass-card`}>
                                                                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                                                    <div className="flex gap-0.5">
                                                                        {renderStars(rev.rating)}
                                                                    </div>
                                                                    <span className="text-[#7C7196] text-[10px] font-mono uppercase tracking-wider">
                                                                        {rev.topic} · {dateStr}
                                                                    </span>
                                                                </div>
                                                                {rev.comment ? (
                                                                    <p className="text-[#B3A7CE] text-xs leading-relaxed">
                                                                        "{rev.comment}"
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[#7C7196] text-xs italic leading-relaxed">
                                                                        No written comment provided. Left a {rev.rating}-star rating.
                                                                    </p>
                                                                )}
                                                                <span className="text-[9px] text-[#7C7196] block mt-1.5 text-right font-mono">
                                                                    — by {reviewerName}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-[#7C7196] text-xs">
                                                    No ratings feedback collected yet. Turn on listening mode to receive stars.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Achievements */}
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-5 h-5 text-[#FFB25E]" />
                                        <h2 className="text-lg md:text-xl font-extrabold font-bricolage text-[#F3EFFF]">Achievements</h2>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {/* Early Adopter */}
                                        <div className="glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition duration-300">
                                            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#FF5D73] to-[#C65CFF] flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <Flame className="w-5 h-5 text-[#100C1C]" />
                                            </div>
                                            <h4 className="text-xs md:text-sm font-bold text-white mb-0.5">Early Adopter</h4>
                                            <p className="text-[10px] text-[#7C7196] leading-tight font-medium">Joined in the first month</p>
                                        </div>

                                        {/* Night Owl */}
                                        <div className="glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition duration-300">
                                            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#C65CFF] to-[#33D6C0] flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <Sparkles className="w-5 h-5 text-[#100C1C]" />
                                            </div>
                                            <h4 className="text-xs md:text-sm font-bold text-white mb-0.5">Night Owl</h4>
                                            <p className="text-[10px] text-[#7C7196] leading-tight font-medium">50+ chats after midnight</p>
                                        </div>

                                        {/* The Whisperer */}
                                        <div className={`glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition duration-300 ${(profile?.listenProfile?.ratingCount || 0) < 25 ? 'opacity-50' : ''}`}>
                                            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#33D6C0] to-[#FFB25E] flex items-center justify-center mx-auto mb-3 shadow-lg relative">
                                                <HeartHandshake className="w-5 h-5 text-[#100C1C]" />
                                                {(profile?.listenProfile?.ratingCount || 0) < 25 && (
                                                    <div className="absolute -bottom-1.5 -right-1.5 p-1 bg-[#100C1C] rounded-full border border-white/10">
                                                        <Lock className="w-2.5 h-2.5 text-[#7C7196]" />
                                                    </div>
                                                )}
                                            </div>
                                            <h4 className="text-xs md:text-sm font-bold text-white mb-0.5">The Whisperer</h4>
                                            <p className="text-[10px] text-[#7C7196] leading-tight font-medium">
                                                25+ listening sessions
                                                <span className="block mt-1 font-mono text-[9px] text-[#33D6C0]">
                                                    {profile?.listenProfile?.ratingCount || 0}/25
                                                </span>
                                            </p>
                                        </div>

                                        {/* Streak Keeper */}
                                        <div className="glass-card rounded-2xl p-4 text-center hover:-translate-y-1 transition duration-300">
                                            <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#FFB25E] to-[#FF5D73] flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                <Flame className="w-5 h-5 text-[#100C1C]" />
                                            </div>
                                            <h4 className="text-xs md:text-sm font-bold text-white mb-0.5">Streak Keeper</h4>
                                            <p className="text-[10px] text-[#7C7196] leading-tight font-medium">7-day feeling streak</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (Sidebar Settings) */}
                            <aside className="hidden lg:flex flex-col gap-6 w-[320px] shrink-0 self-start">
                                
                                {/* Quick Privacy Switches */}
                                <div>
                                    <span className="eyebrow-text mb-3 block">Quick Privacy</span>
                                    <div className="glass-card rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                                        
                                        {/* Switch 1: Distance */}
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-[#B3A7CE] block truncate">Show exact distance</span>
                                                <span className="text-[9px] text-[#7C7196] mt-0.5 block truncate">Allows others to see city</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowExactDistance(!showExactDistance)}
                                                className={`w-10 h-[22px] rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                                                    showExactDistance ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]" : "bg-white/10"
                                                }`}
                                            >
                                                <span
                                                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                                                        showExactDistance ? "translate-x-[18px]" : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Switch 2: Heatmap */}
                                        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-[#f3efff]/5">
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-[#B3A7CE] block truncate">Appear in Heatmap</span>
                                                <span className="text-[9px] text-[#7C7196] mt-0.5 block truncate">Incognito status overlay</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAppearInHeatmap(!appearInHeatmap)}
                                                className={`w-10 h-[22px] rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                                                    appearInHeatmap ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]" : "bg-white/10"
                                                }`}
                                            >
                                                <span
                                                    className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                                                        appearInHeatmap ? "translate-x-[18px]" : "translate-x-0"
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Switch 3: Ready to Listen Status (Synced with Middle Panel) */}
                                        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-[#f3efff]/5">
                                            <div className="min-w-0">
                                                <span className="text-xs font-bold text-[#B3A7CE] block truncate">Listening mode visible</span>
                                                <span className="text-[9px] text-[#7C7196] mt-0.5 block truncate">Show availability marker</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleToggleReadyToListen();
                                                }}
                                                disabled={updatingReadyToListen}
                                                className={`w-10 h-[22px] rounded-full p-0.5 transition-colors duration-200 border border-white/10 shrink-0 relative flex items-center ${
                                                    readyToListen
                                                        ? "bg-gradient-to-r from-[#33D6C0] to-[#C65CFF]"
                                                        : "bg-white/10"
                                                } ${updatingReadyToListen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                {updatingReadyToListen ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white absolute left-[13px]" />
                                                ) : (
                                                    <span
                                                        className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${
                                                            readyToListen ? "translate-x-[18px]" : "translate-x-0"
                                                        }`}
                                                    />
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* Conversation Starters List */}
                                <ConversationStartersSidebar
                                    profileDetails={profileDetails}
                                    isOwnProfile={isOwnProfile}
                                    onEditClick={() => {
                                        setDraftDetails({ ...profileDetails });
                                        setShowStartersModal(true);
                                    }}
                                    startersMapping={STARTERS_MAPPING}
                                    hasAnyDetails={hasAnyDetails}
                                />
                            </aside>

                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1C1732] rounded-2xl border border-white/15 p-6 max-w-md w-full shadow-2xl glass-card-strong">
                        <h3 className="text-white font-extrabold text-xl mb-4 font-bricolage">Now you're open to:</h3>
                        <ul className="space-y-3 mb-6 text-sm font-semibold">
                            <li className="text-[#B3A7CE] flex items-center gap-2">
                                <span className="text-[#C65CFF] text-lg leading-none">•</span>
                                Active supportive listening
                            </li>
                            <li className="text-[#B3A7CE] flex items-center gap-2">
                                <span className="text-[#C65CFF] text-lg leading-none">•</span>
                                Calming, non-judgmental chats
                            </li>
                            <li className="text-[#B3A7CE] flex items-center gap-2">
                                <span className="text-[#C65CFF] text-lg leading-none">•</span>
                                Helping someone talk it out
                            </li>
                            <li className="text-[#B3A7CE] flex items-center gap-2">
                                <span className="text-[#C65CFF] text-lg leading-none">•</span>
                                Being a gentle, grounding presence
                            </li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmReadyToListen}
                                className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#33D6C0] to-[#C65CFF] hover:opacity-90 text-[#100C1C] font-bold transition-all shadow-lg"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Conversation Starters Interactive Modal */}
            <ConversationStartersModal
                isOpen={showStartersModal}
                onClose={() => setShowStartersModal(false)}
                draftDetails={draftDetails}
                setDraftDetails={setDraftDetails}
                onSave={handleSaveStarters}
                isSaving={isSavingDetails}
                hobbiesList={HOBBIES_LIST}
            />
        </div>
    );
}

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
        const count = Math.floor(seconds / secs);
        if (count >= 1) return `${count}${label}`;
    }
    return `${seconds}s`;
}

function formatDayAndDate(dateString?: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleDateString(undefined, { month: "short" });
    const year = date.getFullYear();
    return `${day}, ${dayNum} ${month} ${year}`;
}
