"use client";

import { getUserProfile, logoutUser, updateUserProfile, updateReadyToListen } from "../../lib/api";
import { getUserVibe } from "../../lib/vibeApi";
import toast from "react-hot-toast";
import { useUserStore } from "@/src/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit, Camera, X, Check, Sparkles, Loader2 } from "lucide-react";

export default function Profile() {
    const router = useRouter();
    const { user: currentUser, clearUser } = useUserStore();

    const [profile, setProfile] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [userVibe, setUserVibe] = useState<any | null>(null);
    const [vibeLoading, setVibeLoading] = useState(false);
    const [vibeError, setVibeError] = useState("");

    // Edit states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedBio, setEditedBio] = useState("");
    const [editedName, setEditedName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // File states
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
    
    // Ready to listen states
    const [readyToListen, setReadyToListen] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [updatingReadyToListen, setUpdatingReadyToListen] = useState(false);

    // Check if viewing own profile
    //   const isOwnProfile = currentUser?._id === profile?.user?._id;
    const isOwnProfile = true;

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
                setEditedBio(data?.user?.bio || "");
                setEditedName(data?.user?.name || "");
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

        fetchVibe();
        return () => {
            ignore = true;
        };
    }, [profile?.user?._id]);


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
        input.accept = "image/*";
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
            if (profileImageFile) formData.append("profileImage", profileImageFile);
            if (bannerImageFile) formData.append("bannerImage", bannerImageFile);

            console.log("🧩 FormData before upload:");
            for (const [key, value] of formData.entries()) {
                console.log(key, value);
            }

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
        if (updatingReadyToListen) return; // Prevent multiple clicks
        
        if (!readyToListen) {
            // If turning on, show confirmation dialog
            setShowConfirmDialog(true);
        } else {
            // If turning off, update directly
            await handleUpdateReadyToListen(false);
        }
    };

    const handleConfirmReadyToListen = () => {
        setShowConfirmDialog(false);
        handleUpdateReadyToListen(true);
    };

    const handleUpdateReadyToListen = async (value: boolean) => {
        if (updatingReadyToListen) return; // Prevent duplicate calls
        
        setUpdatingReadyToListen(true);
        try {
            console.log("Updating readyToListen to:", value);
            const res = await updateReadyToListen(value);
            console.log("API response:", res);
            
            // Get the updated value from response
            const updatedValue = res?.user?.readyToListen ?? res?.readyToListen ?? value;
            
            // Update state immediately
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
            
            // Revert state on error
            setReadyToListen(!value);
            setProfile((prev: any) => ({
                ...prev,
                user: { ...prev.user, readyToListen: !value },
            }));
        } finally {
            setUpdatingReadyToListen(false);
        }
    };

    return (
        <div className="bg-linear-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] w-full min-h-screen">

            {loading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white/70 text-lg">Loading profile...</p>
                    </div>
                </div>
            ) : errorMsg ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                        <p className="text-red-400 text-lg">{errorMsg}</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Banner */}
                    <div className="relative w-full h-64 bg-linear-to-r from-purple-600 via-pink-500 to-purple-700 overflow-hidden group">
                        {profile?.user?.bannerImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.user.bannerImage}
                                alt="Banner"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-linear-to-r from-purple-600 via-pink-500 to-purple-700"></div>
                        )}
                        <div className="absolute inset-0 bg-black/20"></div>

                        {/* Buttons */}
                        <div className="absolute top-4 right-4 z-10 flex gap-3">
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-full transition-all duration-300 border border-white/20 font-medium shadow-lg hover:shadow-xl"
                            >
                                Logout
                            </button>
                        </div>

                        {isOwnProfile && (
                            <button
                                onClick={() => handleImageUpload("banner")}
                                className="absolute top-4 left-4 z-10 p-3 bg-black/40 backdrop-blur-md hover:bg-black/60 text-white rounded-full transition-all duration-300 border border-white/20 opacity-0 group-hover:opacity-100"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Profile Content */}
                    <div
                        className="mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10"
                        style={{ maxWidth: "90rem" }}
                    >
                        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar */}
                                <div className="relative shrink-0 group">
                                    <div className="w-40 h-40 rounded-3xl overflow-hidden bg-linear-to-br from-purple-500 via-pink-500 to-purple-700 flex items-center justify-center ring-4 ring-white/10 shadow-2xl">
                                        {profile?.user?.profileImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={profile.user.profileImage}
                                                alt={profile.user.name || "User"}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white text-4xl font-bold">
                                                {profile?.user?.name?.[0] || "U"}
                                            </span>
                                        )}
                                    </div>

                                    {isOwnProfile && (
                                        <button
                                            onClick={() => handleImageUpload("profile")}
                                            className="absolute bottom-2 right-2 p-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-all duration-300 shadow-lg opacity-0 group-hover:opacity-100"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 flex flex-col gap-3">
                                    {isEditMode ? (
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={editedName}
                                                onChange={(e) => setEditedName(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Your name"
                                            />
                                            <p className="text-purple-300 text-lg">
                                                @{profile?.user?.username}
                                            </p>
                                            <textarea
                                                value={editedBio}
                                                onChange={(e) => setEditedBio(e.target.value)}
                                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                placeholder="Tell us about yourself..."
                                                rows={3}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                                                    {profile?.user?.name}
                                                </h1>
                                                <p className="text-purple-300 text-lg">
                                                    @{profile?.user?.username}
                                                </p>
                                            </div>

                                            <p className="text-white/70 text-base leading-relaxed max-w-2xl">
                                                {profile?.user?.bio || "No bio yet."}
                                            </p>
                                        </>
                                    )}

                                    <div className="flex items-center gap-2 text-white/60 text-sm">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>
                                            Joined {formatDayAndDate(profile?.user?.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 shrink-0">
                                    {isOwnProfile ? (
                                        isEditMode ? (
                                            <>
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={isSaving}
                                                    className="px-6 py-2.5 rounded-full bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    {isSaving ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={handleEditToggle}
                                                    disabled={isSaving}
                                                    className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium transition-all duration-300 border border-white/20 flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" /> Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleEditToggle}
                                                className="px-6 py-2.5 rounded-full bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                                            >
                                                <Edit className="w-4 h-4" /> Edit Profile
                                            </button>
                                        )
                                    ) : (
                                        <>
                                            <button className="px-6 py-2.5 rounded-full bg-linear-to-r from-purple-500 to-pink-500 text-white">
                                                Follow
                                            </button>
                                            <button className="px-6 py-2.5 rounded-full bg-white/10 text-white border border-white/20">
                                                Unfollow
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Ready to Listen Toggle */}
                            {isOwnProfile && (
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleToggleReadyToListen();
                                                    }}
                                                    disabled={updatingReadyToListen}
                                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                        readyToListen
                                                            ? "bg-linear-to-r from-purple-500 to-pink-500"
                                                            : "bg-white/20"
                                                    } ${updatingReadyToListen ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                >
                                                    {updatingReadyToListen ? (
                                                        <span className="absolute inset-0 flex items-center justify-center">
                                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                                                readyToListen ? "translate-x-8" : "translate-x-1"
                                                            }`}
                                                        />
                                                    )}
                                                </button>
                                                <span className="text-white font-semibold text-lg">Ready to Listen</span>
                                            </div>
                                            <p className="text-white/60 text-sm ml-20">
                                                People who need calm company can be matched with you.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <VibeHighlight
                                loading={vibeLoading}
                                vibe={userVibe}
                                error={vibeError}
                                isOwnProfile={isOwnProfile}
                                username={profile?.user?.name || ""}
                                onUpdate={() => router.push("/vibe/create")}
                                onDiscover={() => router.push("/vibe/discover")}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full">
                        <h3 className="text-white font-bold text-xl mb-4">Now u r open to:</h3>
                        <ul className="space-y-3 mb-6">
                            <li className="text-white/90 flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                listening
                            </li>
                            <li className="text-white/90 flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                calming chats
                            </li>
                            <li className="text-white/90 flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                supporting someone
                            </li>
                            <li className="text-white/90 flex items-center gap-2">
                                <span className="text-purple-400">•</span>
                                being a gentle presence
                            </li>
                        </ul>
                        <div className="flex gap-3">
                            <button
                                onClick={handleConfirmReadyToListen}
                                className="flex-1 px-6 py-3 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => setShowConfirmDialog(false)}
                                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/20"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type VibeHighlightProps = {
    loading: boolean;
    vibe: any;
    error: string;
    isOwnProfile: boolean;
    username: string;
    onUpdate: () => void;
    onDiscover: () => void;
};

function VibeHighlight({ loading, vibe, error, isOwnProfile, username, onUpdate, onDiscover }: VibeHighlightProps) {
    return (
        <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <h3 className="text-lg font-semibold text-white">Current Vibe</h3>
            </div>

            {loading ? (
                <div className="flex items-center gap-3 text-white/70">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading vibe...</span>
                </div>
            ) : error ? (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {error}
                </div>
            ) : vibe ? (
                <ProfileVibeCard vibe={vibe} isOwnProfile={isOwnProfile} username={username} onUpdate={onUpdate} onDiscover={onDiscover} />
            ) : (
                <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl p-6 text-white/70">
                    <p>{isOwnProfile ? "You haven't created a vibe card yet." : `${username} hasn't shared a vibe yet.`}</p>
                    {isOwnProfile && (
                        <button
                            onClick={onUpdate}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Create Vibe Card
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

type ProfileVibeCardProps = {
    vibe: any;
    isOwnProfile: boolean;
    username: string;
    onUpdate: () => void;
    onDiscover: () => void;
};

function ProfileVibeCard({ vibe, isOwnProfile, username, onUpdate, onDiscover }: ProfileVibeCardProps) {
    const theme = vibe?.theme || {
        gradientFrom: "#2b1055",
        gradientTo: "#7597de",
        borderGlow: "#a855f7",
        accentColor: "#fcd34d",
    };

    return (
        <div
            className="rounded-3xl p-6 border-2 relative overflow-hidden text-white shadow-lg"
            style={{
                borderColor: theme.borderGlow,
                backgroundImage: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
                boxShadow: `0 0 50px ${theme.borderGlow}40`,
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="text-6xl">{vibe.emoji}</div>
                <div className="text-right text-xs uppercase tracking-[0.4em] text-white/70">
                    Mood
                    <div className="text-white font-bold text-sm tracking-normal mt-1">
                        {vibe.vibeScore?.mood || "unknown"}
                    </div>
                </div>
            </div>

            <p className="text-2xl font-extrabold leading-snug mb-4">{vibe.description}</p>

            <div className="space-y-3 bg-black/20 rounded-2xl p-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-white/15">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">Energy Level: {vibe.energyLevel || 5}/10</p>
                        <div className="w-full bg-white/10 rounded-full h-2 mt-1">
                            <div
                                className="h-2 rounded-full"
                                style={{
                                    width: `${((vibe.energyLevel || 5) / 10) * 100}%`,
                                    backgroundColor: theme.accentColor,
                                }}
                            />
                        </div>
                    </div>
                </div>
                {vibe.currentIntent && vibe.currentIntent.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {vibe.currentIntent.map((intent: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                {intent}
                            </span>
                        ))}
                    </div>
                )}
                {vibe.contextTag && (
                    <p className="text-sm text-white/80">#{vibe.contextTag}</p>
                )}
                <p className="text-xs text-white/60">{vibe.interactionBoundary || "Fast replies"}</p>
            </div>

            {/* What I'm Feeling Like Today */}
            {vibe.feelingOptions && vibe.feelingOptions.length > 0 && (
                <div className="mb-4 pt-3 border-t border-white/10">
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>✨</span>
                        What I'm Feeling Like Today
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {vibe.feelingOptions.map((feeling: string, idx: number) => (
                            <span 
                                key={idx} 
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white/90 border border-white/20"
                                style={{ boxShadow: `0 0 8px ${theme.accentColor}30` }}
                            >
                                {feeling}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Vibe Availability */}
            {vibe.vibeAvailability && (
                <div className="mb-4 pt-3 border-t border-white/10">
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>⚡</span>
                        Availability
                    </p>
                    <span 
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/15 text-white border border-white/20 inline-block"
                        style={{ boxShadow: `0 0 10px ${theme.accentColor}40` }}
                    >
                        {vibe.vibeAvailability}
                    </span>
                </div>
            )}

            {/* Mini Personality Prompt */}
            {vibe.personalityPrompt && (
                <div className="mb-4 pt-3 border-t border-white/10">
                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <span style={{ color: theme.accentColor }}>💭</span>
                        Today I feel like...
                    </p>
                    <span 
                        className="px-3 py-1.5 rounded-lg text-sm font-medium italic bg-white/15 text-white border border-white/20 inline-block"
                        style={{ boxShadow: `0 0 10px ${theme.accentColor}40` }}
                    >
                        {vibe.personalityPrompt}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-3 gap-3 text-xs text-white/80">
                <div className="bg-black/20 rounded-2xl px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Energy</p>
                    <p className="font-semibold">{Math.round(vibe.vibeScore?.energy ?? 0)}/100</p>
                </div>
                <div className="bg-black/20 rounded-2xl px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Positivity</p>
                    <p className="font-semibold">{Math.round(vibe.vibeScore?.positivity ?? 0)}/100</p>
                </div>
                <div className="bg-black/20 rounded-2xl px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Intent</p>
                    <p className="font-semibold capitalize">{vibe.vibeScore?.intent || "—"}</p>
                </div>
            </div>

            <div className="mt-5 flex gap-3 flex-wrap">
                <button
                    onClick={onDiscover}
                    className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-all"
                >
                    View Matches
                </button>
                {isOwnProfile && (
                    <button
                        onClick={onUpdate}
                        className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-white text-purple-700 font-semibold text-sm hover:bg-white/90 transition-all"
                    >
                        Update Vibe
                    </button>
                )}
            </div>
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

