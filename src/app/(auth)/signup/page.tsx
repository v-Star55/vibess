'use client'

import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { signupUser } from "../../lib/api"
import z from "zod"
import { Loader2, User, Mail, Lock, Check, X, ArrowRight } from "lucide-react"

const SignupPage = () => {
  const router = useRouter();
  const [user, setUser] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasUpper = /[A-Z]/.test(user.password);
  const hasLower = /[a-z]/.test(user.password);
  const hasNumber = /\d/.test(user.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(user.password);
  const hasLength = user.password.length >= 8;
  const isPasswordValid = hasUpper && hasLower && hasNumber && hasSpecial && hasLength;
  const passwordsMatch = user.password === user.confirmPassword && user.confirmPassword.length > 0;

  let score = 0;
  if (hasLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  const strengthColors = ['#FF5D73', '#FFB25E', '#33D6C0', '#C65CFF'];
  const strengthWords = ['Weak', 'Okay', 'Good', 'Strong'];

  const signupSchema = z.object({
    name: z.string().min(3, "Name too short"),
    username: z.string().min(3, "Username too short"),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = signupSchema.safeParse(user);
    if (!result.success) { result.error.issues.forEach(issue => toast.error(issue.message)); return; }
    try {
      setLoading(true);
      const res = await toast.promise(signupUser(user), {
        loading: "Creating your account...",
        success: "Account created! Check your email for verification code ✅",
        error: "Failed to register. Please try again ❌",
      });
      if (res.verified) router.push('/login');
      else router.push(`/verifyemail?email=${encodeURIComponent(user.email)}`);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.data?.message) toast.error(err.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#F3EFFF', fontSize: 14.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const labelStyle: React.CSSProperties = { fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C7196' };

  return (
    <div style={{ minHeight: '100vh', background: '#100C1C', color: '#F3EFFF', fontFamily: 'var(--font-inter), Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: `radial-gradient(circle at 12% 10%, rgba(198,92,255,0.18), transparent 42%), radial-gradient(circle at 90% 15%, rgba(51,214,192,0.12), transparent 40%), radial-gradient(circle at 75% 85%, rgba(255,93,115,0.12), transparent 45%), radial-gradient(circle at 10% 90%, rgba(255,178,94,0.08), transparent 40%)` }} />

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="auth-shell">
        {/* Brand panel */}
        <div className="auth-brand-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '44px 52px', borderRight: '1px solid rgba(243,239,255,0.10)', overflow: 'hidden', background: 'rgba(16,12,28,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 900, fontSize: 21, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
              <span className="logo-dot" />vibess
            </div>
            <Link href="/landing" style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 12.5, color: '#7C7196', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F3EFFF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#7C7196')}>
              ← back to home
            </Link>
          </div>

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
              Takes about a minute to set up. Your first match could be tonight.
            </p>
          </div>

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
                <p style={{ margin: 0, fontSize: 13.5, color: '#B3A7CE', lineHeight: 1.5 }}>"Matched with my closest friend group through a Movie GP about all things Miyazaki. Didn't expect that from a group chat."</p>
                <span style={{ fontFamily: 'var(--font-space-mono), monospace', fontSize: 11, color: '#7C7196', marginTop: 8, display: 'block' }}>— Ananya, Bengaluru</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '44px 40px', background: 'rgba(16,12,28,0.3)', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))', backdropFilter: 'blur(22px) saturate(150%)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 28, padding: '36px 34px 30px', boxShadow: '0 40px 90px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.10)' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-bricolage), sans-serif', fontWeight: 800, fontSize: 26, margin: 0, color: '#F3EFFF', letterSpacing: '-0.02em' }}>Create your vibe card</h2>
              <p style={{ marginTop: 8, color: '#B3A7CE', fontSize: 14, margin: '8px 0 0' }}>Takes about a minute. Your first match could be tonight.</p>
            </div>

            {/* Tab switcher — Sign up active */}
            <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 100, padding: 4, marginBottom: 26 }}>
              <div style={{ position: 'absolute', top: 4, left: 4, width: 'calc(50% - 4px)', height: 'calc(100% - 8px)', borderRadius: 100, background: 'linear-gradient(120deg,#FF5D73,#C65CFF)', zIndex: 0, transform: 'translateX(100%)' }} />
              <Link href="/login" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13.5, fontWeight: 600, color: '#B3A7CE', textDecoration: 'none', borderRadius: 100 }}>Log in</Link>
              <Link href="/signup" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '9px 0', fontSize: 13.5, fontWeight: 700, color: '#160E22', textDecoration: 'none', borderRadius: 100 }}>Sign up</Link>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input type="text" name="name" value={user.name} onChange={handleChange} placeholder="What should we call you?" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
                </div>
              </div>

              {/* Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Username</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input type="text" name="username" value={user.username} onChange={handleChange} placeholder="Choose a username" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <p style={{ fontSize: 10.5, color: '#7C7196', margin: 0, paddingLeft: 4 }}>Must be at least 3 characters</p>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Email</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input type="email" name="email" value={user.email} onChange={handleChange} placeholder="you@email.com" required style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
                </div>
                <p style={{ fontSize: 10.5, color: '#7C7196', margin: 0, paddingLeft: 4 }}>We'll send a verification code to this email</p>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input type={showPassword ? 'text' : 'password'} name="password" value={user.password} onChange={handleChange} placeholder="Create a password" required
                    style={{ ...inputStyle, paddingRight: 64 }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(198,92,255,0.55)'; e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10.5, color: '#7C7196', padding: '6px 10px', borderRadius: 100 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>

                {/* Strength bars */}
                {user.password !== '' && (
                  <div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                      {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? strengthColors[Math.max(0, score - 1)] : 'rgba(255,255,255,0.12)', transition: 'background 0.3s ease' }} />
                      ))}
                    </div>
                    <div style={{ marginTop: 6, fontFamily: 'var(--font-space-mono), monospace', fontSize: 10.5, color: '#7C7196', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
                      <span>Password strength:</span>
                      <span style={{ color: strengthColors[Math.max(0, score - 1)], fontWeight: 700 }}>{score === 0 ? 'Too short' : strengthWords[Math.max(0, score - 1)]}</span>
                    </div>
                    <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p style={{ margin: '0 0 8px', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10.5, color: '#B3A7CE' }}>Requirements:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                        {[
                          { check: hasLength, text: '8+ characters' },
                          { check: hasUpper, text: 'Uppercase letter' },
                          { check: hasLower, text: 'Lowercase letter' },
                          { check: hasNumber, text: 'One number' },
                          { check: hasSpecial, text: 'Special character', full: true },
                        ].map((req, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, gridColumn: req.full ? '1 / -1' : undefined }}>
                            {req.check ? <Check style={{ width: 13, height: 13, color: '#33D6C0', flexShrink: 0 }} /> : <X style={{ width: 13, height: 13, color: '#FF5D73', flexShrink: 0 }} />}
                            <span style={{ color: req.check ? '#33D6C0' : '#7C7196' }}>{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock style={{ position: 'absolute', left: 14, width: 17, height: 17, color: '#7C7196', pointerEvents: 'none' }} />
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={user.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required
                    style={{ ...inputStyle, paddingRight: 64, borderColor: user.confirmPassword ? (passwordsMatch ? 'rgba(51,214,192,0.5)' : 'rgba(255,93,115,0.5)') : 'rgba(255,255,255,0.12)' }}
                    onFocus={e => { e.target.style.boxShadow = '0 0 0 4px rgba(198,92,255,0.14)'; }}
                    onBlur={e => { e.target.style.boxShadow = 'none'; }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-space-mono), monospace', fontSize: 10.5, color: '#7C7196', padding: '6px 10px', borderRadius: 100 }}>
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {user.confirmPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4, fontSize: 11 }}>
                    {passwordsMatch
                      ? <><Check style={{ width: 13, height: 13, color: '#33D6C0' }} /><span style={{ color: '#33D6C0' }}>Passwords match</span></>
                      : <><X style={{ width: 13, height: 13, color: '#FF5D73' }} /><span style={{ color: '#FF5D73' }}>Passwords do not match</span></>}
                  </div>
                )}
              </div>

              {/* Terms */}
              <div style={{ fontSize: 12.5, color: '#7C7196', lineHeight: 1.5 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" required style={{ display: 'none' }} />
                  <span style={{ width: 17, height: 17, borderRadius: 5, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }} />
                  <span>
                    I agree to Vibess's{' '}
                    <Link href="/terms" style={{ color: '#B3A7CE', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</Link>
                    {' '}and{' '}
                    <Link href="/privacy" style={{ color: '#B3A7CE', textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</Link>
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading || !isPasswordValid || !passwordsMatch}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 22px', borderRadius: 100, fontWeight: 700, fontSize: 14.5, border: 'none', cursor: (loading || !isPasswordValid || !passwordsMatch) ? 'not-allowed' : 'pointer', background: 'linear-gradient(120deg,#FF5D73,#C65CFF 55%,#33D6C0)', color: '#160E22', boxShadow: '0 10px 30px -10px rgba(198,92,255,0.55)', opacity: (loading || !isPasswordValid || !passwordsMatch) ? 0.5 : 1, transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!loading && isPasswordValid && passwordsMatch) { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 40px -12px rgba(198,92,255,0.65)'; } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 30px -10px rgba(198,92,255,0.55)'; }}>
                {loading ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />Creating Account...</> : <>Create your vibe card <ArrowRight style={{ width: 17, height: 17 }} /></>}
              </button>

              {/* Location note */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11.5, color: '#7C7196', lineHeight: 1.5 }}>
                <span style={{ color: '#33D6C0', flexShrink: 0, fontWeight: 700, marginTop: 1 }}>◎</span>
                <span>Vibess uses your location, with permission, to show relevant vibes, groups and matches nearby. You can change this anytime in settings.</span>
              </div>

              <div style={{ textAlign: 'center', paddingTop: 8, fontSize: 13.5, color: '#7C7196' }}>
                Already vibing with us?{' '}
                <Link href="/login" style={{ color: '#F3EFFF', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>Log in</Link>
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

export default SignupPage
