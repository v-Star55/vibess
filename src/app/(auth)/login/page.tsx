'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../../lib/api";
import { useUserStore } from "@/src/store/store";
import toast from "react-hot-toast";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { handleGoogleSignIn } from "../../actions/authActions";

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useUserStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      toast.success("Welcome back! Taking you to your vibes… ✅");
      router.push('/app-home');
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.status === 403) {
        toast.error("Please verify your email first.");
        const targetEmail = error?.email || (identifier.includes("@") ? identifier : "");
        if (targetEmail) router.push(`/verifyemail?email=${encodeURIComponent(targetEmail)}`);
      } else {
        toast.error(error?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#100C1C', color: '#F3EFFF', fontFamily: 'var(--font-inter), Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Grain background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          radial-gradient(circle at 12% 10%, rgba(198,92,255,0.18), transparent 42%),
          radial-gradient(circle at 90% 15%, rgba(51,214,192,0.12), transparent 40%),
          radial-gradient(circle at 75% 85%, rgba(255,93,115,0.12), transparent 45%),
          radial-gradient(circle at 10% 90%, rgba(255,178,94,0.08), transparent 40%)`
      }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-shell">
        {/* ── Brand panel ── */}
        <div className="auth-brand-panel" style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '44px 52px', borderRight: '1px solid rgba(243,239,255,0.10)',
          overflow: 'hidden', background: 'rgba(16,12,28,0.6)',
        }}>
          {/* Top nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 900, fontSize: 21, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
              <span className="logo-dot" />
              vibess
            </div>
            <Link href="/landing" style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12.5, color: '#7C7196', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F3EFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7C7196')}>
              ← back to home
            </Link>
          </div>

          {/* Orb + headline */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24 }}>
            <div className="orb-stage-sm">
              <div className="orb-ring-sm" />
              <div className="orb-sm" />
              <div className="mood-chip-sm m1">chill</div>
              <div className="mood-chip-sm m2">fun</div>
              <div className="mood-chip-sm m3">calm</div>
              <div className="mood-chip-sm m4">chaos</div>
            </div>
            <h1 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 800, fontSize: 'clamp(28px,3vw,40px)', lineHeight: 1.08, maxWidth: 420, margin: 0, letterSpacing: '-0.02em', color: '#F3EFFF' }}>
              Your city has a{' '}
              <span style={{ background: 'linear-gradient(100deg,#FF5D73,#C65CFF 55%,#33D6C0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>vibe</span>
              {' '}right now.
            </h1>
            <p style={{ color: '#B3A7CE', maxWidth: 360, fontSize: 15, margin: 0, lineHeight: 1.6 }}>
              Sign in to pick up your matches and chats, or create a vibe card to start discovering people near you.
            </p>
          </div>

          {/* Stats + quote */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['50k+', 'vibes matched'], ['12', 'cities live'], ['4.8★', 'average rating']].map(([num, label]) => (
                <div key={label} style={{ padding: '9px 16px', borderRadius: 100, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <b style={{ fontFamily: 'var(--font-space-mono), monospace', color: '#F3EFFF' }}>{num}</b>
                  <span style={{ color: '#7C7196' }}>{label}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '18px 20px', borderRadius: 18, display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#33D6C0,#C65CFF)' }} />
              <div>
                <p style={{ margin: 0, fontSize: 13.5, color: '#B3A7CE', lineHeight: 1.5 }}>
                  "Matched with my closest friend group through a Movie GP about all things Miyazaki. Didn't expect that from a group chat."
                </p>
                <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: '#7C7196', marginTop: 8, display: 'block' }}>— Ananya, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '44px 40px', background: 'rgba(16,12,28,0.3)' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))', backdropFilter: 'blur(22px) saturate(150%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 28, padding: '36px 34px 30px', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)' }}>
            {/* Heading */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 800, fontSize: 26, margin: 0, color: '#F3EFFF', letterSpacing: '-0.02em' }}>Welcome back</h2>
              <p style={{ marginTop: 8, color: '#B3A7CE', fontSize: 14, margin: '8px 0 0' }}>Log in to keep the conversation going.</p>
            </div>

            {/* Tab switcher */}
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 100, padding: 4, marginBottom: 26 }}>
              <div style={{ position: 'absolute', top: 4, left: 4, width: 'calc(50% - 4px)', height: 'calc(100% - 8px)', borderRadius: 100, background: 'linear-gradient(120deg,#FF5D73,#C65CFF)', zIndex: 0, transition: 'transform 0.35s cubic-bezier(0.2,0.8,0.2,1)' }} />
              <Link href="/login" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13.5, fontWeight: 700, color: '#160E22', textDecoration: 'none', borderRadius: 100 }}>Log in</Link>
              <Link href="/signup" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13.5, fontWeight: 600, color: '#B3A7CE', textDecoration: 'none', borderRadius: 100 }}>Sign up</Link>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C7196' }}>Email or Username</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="you@email.com"
                    required
                    style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#F3EFFF', fontSize: 14.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C7196' }}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ width: '100%', paddingLeft: 42, paddingRight: 64, paddingTop: 12, paddingBottom: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#F3EFFF', fontSize: 14.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10.5, color: '#7C7196', padding: '6px 10px', borderRadius: 100 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Remember me + forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B3A7CE', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" style={{ display: 'none' }} />
                  <span style={{ width: 17, height: 17, borderRadius: 5, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                  Remember me
                </label>
                <Link href="/forgot-password" style={{ color: '#7C7196', textDecoration: 'none', fontSize: 13 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F3EFFF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#7C7196')}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit button */}
              <button type="submit" disabled={loading}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', borderRadius: 100, fontWeight: 700, fontSize: 14.5, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(120deg,#FF5D73,#C65CFF 55%,#33D6C0)', color: '#160E22', boxShadow: '0 10px 30px -10px rgba(198,92,255,0.55)', opacity: loading ? 0.6 : 1, transition: 'transform 0.2s ease, box-shadow 0.2s ease', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 40px -12px rgba(198,92,255,0.65)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px -10px rgba(198,92,255,0.55)'; }}>
                {loading ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Logging in...</> : <>Log in <ArrowRight style={{ width: 17, height: 17 }} /></>}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: '#7C7196', fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, padding: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
                or continue with
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.10)' }} />
              </div>

              {/* Google */}
              <button type="button" onClick={async () => { await handleGoogleSignIn(); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '11px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#F3EFFF', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}>
                <FcGoogle style={{ fontSize: 20 }} />
                Continue with Google
              </button>

              <div style={{ textAlign: 'center', paddingTop: 12, fontSize: 13.5, color: '#7C7196' }}>
                New to Vibess?{' '}
                <Link href="/signup" style={{ color: '#F3EFFF', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Create an account</Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .auth-shell { grid-template-columns: 1fr !important; }
          .auth-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
