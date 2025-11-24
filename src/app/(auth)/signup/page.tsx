'use client'

import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { signupUser } from "../../lib/api"
import z from "zod"
import { Loader2, User, Mail, Lock, Check, X, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react"

const signup = () => {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Derived, live password checks for UI feedback
  const hasUpper = /[A-Z]/.test(user.password)
  const hasLower = /[a-z]/.test(user.password)
  const hasNumber = /\d/.test(user.password)
  const hasSpecial = /[@$!%*?&]/.test(user.password)
  const hasLength = user.password.length >= 8
  const isPasswordValid = hasUpper && hasLower && hasNumber && hasSpecial && hasLength
  const passwordsMatch = user.password === user.confirmPassword && user.confirmPassword.length > 0

  // zod for checking schema
  const signupSchema = z.object({
    name: z.string().min(3, "Name too short"),
    username: z.string().min(3, "Username too short"),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // handling submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse(user);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        toast.error(issue.message);
      });
      return;
    }

    try {
      setLoading(true);
      const res = await toast.promise(
        signupUser(user), 
        {
          loading: "Creating your account...",
          success: "Account created! Check your email for verification code ✅",
          error: "Failed to register. Please try again ❌",
        }
      );

      if(res.verified){
        router.push(`/login`);
      }else{
        router.push(`/verifyemail?email=${encodeURIComponent(user.email)}`);
      }

    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Floating emojis
  const emojis = ["😌", "🤪", "😴", "🤯", "😎", "🤗", "😊", "🤔"];

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
            Join Vibess
          </h1>
          <p className="text-white/70 text-sm">
            Create your account and start matching with people who share your vibe
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  name="username"
                  value={user.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-white/50 mt-1">Must be at least 3 characters</p>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-white/50 mt-1">We'll send a verification code to this email</p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={user.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
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

              {/* Password Requirements */}
              {user.password !== '' && (
                <div className="mt-3 space-y-2 bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-xs font-medium text-white/70 mb-2">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { check: hasLength, text: 'At least 8 characters' },
                      { check: hasUpper, text: 'One uppercase letter' },
                      { check: hasLower, text: 'One lowercase letter' },
                      { check: hasNumber, text: 'One number' },
                      { check: hasSpecial, text: 'One special character', colSpan: true },
                    ].map((req, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-xs ${req.colSpan ? 'col-span-2' : ''}`}
                      >
                        {req.check ? (
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                        )}
                        <span className={req.check ? 'text-green-400' : 'text-white/50'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={user.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  className={`w-full pl-12 pr-12 py-3 bg-white/10 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                    user.confirmPassword
                      ? passwordsMatch
                        ? 'border-green-500/50 focus:ring-green-500'
                        : 'border-red-500/50 focus:ring-red-500'
                      : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {user.confirmPassword && (
                <div className="mt-2 flex items-center gap-2">
                  {passwordsMatch ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Terms and Privacy */}
          <p className="text-xs text-white/60 text-center mt-6">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Privacy Policy
            </Link>
            {" "}and{" "}
            <Link href="/cookies" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Cookies Policy
            </Link>
            .
          </p>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/70 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold hover:underline transition-colors">
                Sign In
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

export default signup
