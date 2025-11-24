'use client'
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { verifyOTP } from "../../lib/api";

export default function verifyEmail() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState('');

    const [cooldown, setCooldown] = useState(0);

    /// verify email

    const verifyMail = async (e: React.FormEvent) => {
        e.preventDefault();

        

        if (cooldown > 0) {
            toast.error(`Please wait ${cooldown}s before trying again`);
            return;
        }

        try {
            setCooldown(30);
            const timer = setInterval(() => {
                setCooldown((prev) => (prev <= 1 ? (clearInterval(timer), 0) : prev - 1));
            }, 1000);

            const res = await verifyOTP(email, otp);

            console.log("🔍 OTP Verification Response:", res);

            // ✅ Handle success and redirect
            if (res?.verified) {
                toast.success(res.message || "OTP verified successfully ✅");
                router.push("/login");
            } else {
                toast.error(res.message || "Invalid or expired OTP ❌");
            }

        } catch (err) {
            console.error("❌ Error during OTP verification:", err);
            toast.error("Something went wrong. Please try again later.");
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
            <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
                    Verify Your Email
                </h1>

                <p className="text-sm text-center text-gray-600 mb-6">
                    We’ve sent an OTP to{" "}
                    <span className="font-semibold text-gray-900">{email}</span>.
                    Please enter it below to verify your account.
                </p>

                <input
                    type="number"
                    name="otp"
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-transparent mb-4 text-gray-900 placeholder-gray-400"
                />

                <button
                    type="button"
                    onClick={verifyMail}
                    disabled={cooldown > 0}
                    className={`w-full px-4 py-2 font-semibold rounded-xl transition duration-200 ${cooldown > 0
                            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                            : "bg-black text-white hover:scale-105 hover:bg-gray-800"
                        }`}
                >
                    {cooldown > 0 ? `Wait ${cooldown}s` : "Verify OTP"}
                </button>
            </div>
        </div>

    );
}