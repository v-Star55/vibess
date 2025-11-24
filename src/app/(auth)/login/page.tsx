'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../../lib/api";
import { useUserStore } from "@/src/store/store";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { handleGoogleSignIn } from "../../actions/authActions";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useUserStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Floating emojis for background
  const emojis = ["😌", "🤪", "😴", "🤯", "😎", "🤗", "😊", "🤔"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error("Please enter your email/username and password");
      return;
    }

    try {
      setLoading(true);
      const res = await loginUser({ identifier, password });

      const userData = res?.user;
      if (userData) {
        setUser({
          id: userData._id,
          name: userData.name,
          email: userData.email,
          username: userData.username,
          profileImage: userData.profileImage,
        });
      }

      toast.success("Login successful ✅");
      router.push('/app-home');

    } catch (error: any) {
      console.error("Login error:", error);

      // Handle special cases like unverified email
      if (error?.status === 403) {
        toast.error("Please verify your email first.");
        const targetEmail = error?.email || (identifier.includes("@") ? identifier : "");
        if (targetEmail) {
          router.push(`/verifyemail?email=${encodeURIComponent(targetEmail)}`);
        }
      } else {
        toast.error(error?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1d0033] via-[#2a0a4a] to-[#1d0033] text-white relative overflow-hidden flex items-center justify-center p-4">
      {/* Floating Emojis Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {emojis.map((emoji, idx) => (
          <div
            key={idx}
            className="absolute text-4xl opacity-10 animate-float"
            style={{
              left: `${(idx * 12) % 100}%`,
              top: `${(idx * 15) % 100}%`,
              animationDelay: `${idx * 0.5}s`,
              animationDuration: `${3 + (idx % 3)}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-white/70 text-sm">
            Sign in to continue your vibe journey
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or username"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white/80">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <hr className="flex-1 border-white/10" />
            <span className="text-white/40 text-sm font-medium">or</span>
            <hr className="flex-1 border-white/10" />
          </div>

          {/* Google Sign-In */}
          <form
            action={async () => {
              await handleGoogleSignIn();
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all flex items-center justify-center gap-3"
            >
              <FcGoogle className="text-xl" />
              Sign in with Google
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm">
              Don't have an account?{" "}
              <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="mt-6 text-center">
          <Link
            href="/landing"
            className="text-white/60 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
