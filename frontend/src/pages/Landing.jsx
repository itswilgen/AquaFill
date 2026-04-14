import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../hooks/useWindowSize';

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

function Animate({ children, delay = 0, direction = 'up' }) {
  const [ref, inView] = useInView();
  const transforms = {
    up:    'translateY(32px)',
    left:  'translateX(-32px)',
    right: 'translateX(32px)',
    scale: 'scale(0.92)',
  };
  return (
    <div ref={ref} style={{
      opacity:   inView ? 1 : 0,
      transform: inView ? 'none' : transforms[direction],
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

export default function Landing() {
  const { isMobile, isTablet } = useWindowSize();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [activeLink, setActiveLink] = useState('home');
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = ['home', 'features', 'pricing', 'how', 'contact'];
    const onScroll = () => {
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveLink(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  }

  const sectionPad = isMobile ? '48px 20px' : isTablet ? '64px 32px' : '80px 60px';

  return (
    <div style={s.page}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .nav-link-item:hover  { color: #0ea5e9 !important; }
        .btn-ghost-hover:hover { background: #e0f2fe !important; }
        .btn-solid-hover:hover { background: #0284c7 !important; transform: translateY(-1px); }
        .hero-cta:hover  { background: #0284c7 !important; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(14,165,233,0.35) !important; }
        .hero-sec:hover  { background: #e0f2fe !important; transform: translateY(-1px); }
        .feat-card:hover { transform: translateY(-4px); border-color: #bae6fd !important; }
        .price-card:hover { transform: translateY(-6px); }
        .price-btn:hover  { opacity: 0.9; transform: translateY(-1px); }
        .step-card:hover .step-num { transform: scale(1.1); }
        .footer-link:hover { color: #e2e8f0 !important; }
        * { transition-property: color, background-color, border-color, transform, opacity, box-shadow; transition-duration: 0.2s; transition-timing-function: ease; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        ...s.nav,
        padding: isMobile ? '14px 20px' : isTablet ? '14px 32px' : '14px 60px',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
      }}>
        <div style={s.logo}>Aqua<span style={{ color: '#0369a1' }}>Fill</span></div>

        {!isMobile && (
          <div style={s.navLinks}>
            {[['home','Home'],['features','Features'],['pricing','Pricing'],['how','How it works'],['contact','Contact']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{
                ...s.navLink,
                color: activeLink === id ? '#0ea5e9' : '#64748b',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeLink === id ? '2px solid #0ea5e9' : '2px solid transparent',
              }} className="nav-link-item">
                {label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isMobile && (
            <>
              <button style={s.btnGhost} className="btn-ghost-hover" onClick={() => navigate('/login')}>Login</button>
              <button style={s.btnSolid} className="btn-solid-hover" onClick={() => navigate('/signup')}>Get started</button>
            </>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 4 }}>
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 57, left: 0, right: 0, zIndex: 99,
          background: '#fff', borderBottom: '1px solid #f1f5f9',
          padding: '8px 20px 16px',
          animation: 'fadeDown 0.2s ease',
        }}>
          {[['home','Home'],['features','Features'],['pricing','Pricing'],['how','How it works'],['contact','Contact']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '13px 0', fontSize: 15, color: '#374151',
              background: 'none', border: 'none',
              borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
              fontWeight: 500,
            }}>
              {label}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={{ ...s.btnGhost, flex: 1 }} onClick={() => navigate('/login')}>Login</button>
            <button style={{ ...s.btnSolid, flex: 1 }} onClick={() => navigate('/signup')}>Get started</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <section id="home" style={{
        ...s.hero,
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        padding: isMobile ? '48px 20px 40px' : isTablet ? '60px 32px' : '80px 60px',
        minHeight: isMobile ? 'auto' : '90vh',
        gap: isMobile ? 32 : isTablet ? 40 : 60,
      }}>
        <div>
          <Animate direction="up" delay={0}>
            <div style={s.badge}>
              <div style={{ ...s.badgeDot, animation: 'pulse 1.5s ease infinite' }} />
              Now serving Tanjay City
            </div>
          </Animate>

          <Animate direction="up" delay={100}>
            <h1 style={{
              ...s.heroTitle,
              fontSize: isMobile ? 36 : isTablet ? 44 : 52,
            }}>
              Fresh Water,<br />
              <span style={{
                color: '#0ea5e9',
                background: 'linear-gradient(90deg, #0ea5e9, #0369a1, #0ea5e9)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}>Delivered</span><br />
              To Your Door.
            </h1>
          </Animate>

          <Animate direction="up" delay={200}>
            <p style={{
              ...s.heroDesc,
              fontSize: isMobile ? 14 : 15,
              maxWidth: isMobile ? '100%' : 440,
            }}>
              Order purified water anytime. We deliver fast, fresh, and affordable
              water straight to your home or office in Tanjay City.
            </p>
          </Animate>

          <Animate direction="up" delay={300}>
            <div style={{
              display: 'flex', gap: 10, marginBottom: 12,
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              <button style={{
                ...s.heroCta,
                width: isMobile ? '100%' : 'auto',
              }} className="hero-cta" onClick={() => navigate('/signup')}>
                Start ordering today
              </button>
              <button style={{
                ...s.heroSec,
                width: isMobile ? '100%' : 'auto',
              }} className="hero-sec" onClick={() => scrollTo('pricing')}>
                View pricing
              </button>
            </div>
            <p style={s.heroNote}>Free to sign up. No credit card required.</p>
          </Animate>

          <Animate direction="up" delay={400}>
            <div style={{
              ...s.heroStats,
              gap: isMobile ? 24 : 36,
              justifyContent: isMobile ? 'space-around' : 'flex-start',
              marginTop: 16,
            }}>
              <StatCounter target={500} suffix="+" label="Happy customers" />
              <StatCounter target={24}  suffix="hr"  label="Delivery time" />
              <StatCounter target={100} suffix="%"   label="Purified water" />
            </div>
          </Animate>
        </div>

        {/* Hero image — hidden on mobile */}
        {!isMobile && (
          <div style={{ animation: 'float 4s ease-in-out infinite' }}>
            <Animate direction="right" delay={200}>
              <div style={{
                ...s.heroImg,
                height: isTablet ? 360 : 480,
              }}>
                <img
                  src="/images/Img_3.webp"
                  alt="Water delivery"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </Animate>
          </div>
        )}
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ ...s.section, padding: sectionPad }}>
        <Animate direction="up">
          <SectionHeader
            label="Why choose us"
            title="Everything you need, nothing you don't"
            sub="Simple, reliable water delivery built for busy households and offices."
            isMobile={isMobile}
          />
        </Animate>
        <div style={{
          ...s.grid3,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 14 : 24,
        }}>
          {[
            { title: 'Same-day delivery',   desc: 'Order before 2PM and get your water delivered the same day, right to your doorstep.', icon: '⚡' },
            { title: '100% purified water', desc: 'Our water goes through a rigorous 7-stage purification process. Safe for the whole family.', icon: '🛡️' },
            { title: 'Affordable pricing',  desc: 'Starting at just ₱15 per bottle. No hidden fees, no subscriptions required.', icon: '💰' },
          ].map((f, i) => (
            <Animate key={i} direction="up" delay={i * 100}>
              <div style={{ ...s.featCard, padding: isMobile ? 20 : 28 }} className="feat-card">
                <div style={s.featIconWrap}>
                  <span style={{ fontSize: 20 }}>{f.icon}</span>
                </div>
                <div style={s.featTitle}>{f.title}</div>
                <div style={s.featDesc}>{f.desc}</div>
              </div>
            </Animate>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ ...s.section, padding: sectionPad, background: '#f0f9ff' }}>
        <Animate direction="up">
          <SectionHeader
            label="Pricing"
            title="Simple, transparent pricing"
            sub="No subscriptions. Pay only for what you order."
            isMobile={isMobile}
          />
        </Animate>
        <div style={{
          ...s.grid3,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 14 : 24,
        }}>
          {[
            { name: 'Small bottle',     price: '₱15', desc: '500ml purified water',  features: ['Purified water','Single use bottle','Available daily'],            featured: false },
            { name: '5-gallon bottle',  price: '₱50', desc: 'Refilled gallon jug',   features: ['Mineral water','Reusable gallon jug','Free delivery 3+ gals'],    featured: true  },
            { name: 'Mineral water 1L', price: '₱25', desc: '1 liter mineral water', features: ['Premium mineral water','Sealed bottle','Perfect for office use'],  featured: false },
          ].map((p, i) => (
            <Animate key={i} direction="up" delay={i * 120}>
              <PriceCard {...p} onClick={() => navigate('/signup')} isMobile={isMobile} />
            </Animate>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ ...s.section, padding: sectionPad }}>
        <Animate direction="up">
          <SectionHeader
            label="How it works"
            title="Order water in 3 easy steps"
            sub="Simple process, fast delivery."
            isMobile={isMobile}
          />
        </Animate>
        <div style={{
          ...s.grid3,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 14 : 24,
        }}>
          {[
            { step: '1', title: 'Create your account', desc: 'Sign up with email or Google in under a minute. No credit card required.' },
            { step: '2', title: 'Place your order',    desc: 'Choose your water type, quantity, and set your preferred delivery date and address.' },
            { step: '3', title: 'Get it delivered',    desc: 'We deliver fresh purified water straight to your door. Pay online or on delivery.' },
          ].map((step, i) => (
            <Animate key={i} direction="up" delay={i * 120}>
              <div style={{ ...s.stepCard, padding: isMobile ? 24 : 32 }} className="step-card">
                <div style={s.stepNum} className="step-num">{step.step}</div>
                <div style={s.stepTitle}>{step.title}</div>
                <div style={s.stepDesc}>{step.desc}</div>
              </div>
            </Animate>
          ))}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ ...s.section, padding: sectionPad, background: '#f8fafc' }}>
        <Animate direction="up">
          <SectionHeader
            label="Contact us"
            title="We're here to help"
            sub="Reach out anytime during business hours."
            isMobile={isMobile}
          />
        </Animate>
        <div style={{
          ...s.grid4,
          gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? 10 : 16,
        }}>
          {[
            { label: 'Address',        value: 'Barangay Tugas, Tanjay City' },
            { label: 'Phone',          value: '09171234567' },
            { label: 'Business hours', value: 'Mon–Sat, 7AM–6PM' },
            { label: 'Email',          value: 'aquafill@email.com' },
          ].map((c, i) => (
            <Animate key={i} direction="up" delay={i * 80}>
              <div style={{ ...s.contactCard, padding: isMobile ? 16 : 24 }}>
                <div style={s.contactLabel}>{c.label}</div>
                <div style={{ ...s.contactVal, fontSize: isMobile ? 13 : 14 }}>{c.value}</div>
              </div>
            </Animate>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <Animate direction="up">
        <section style={{
          ...s.ctaBanner,
          padding: isMobile ? '48px 20px' : '64px 60px',
        }}>
          <h2 style={{
            ...s.ctaTitle,
            fontSize: isMobile ? 24 : 32,
          }}>
            Ready to order fresh water?
          </h2>
          <p style={s.ctaSub}>Join 500+ happy customers in Tanjay City today.</p>
          <button style={s.ctaBtn} className="hero-cta" onClick={() => navigate('/signup')}>
            Get started for free
          </button>
        </section>
      </Animate>

      {/* ── Footer ── */}
      <footer style={{
        ...s.footer,
        padding: isMobile ? '32px 20px' : '48px 60px',
      }}>
        <div style={{
          ...s.footerTop,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 24 : 0,
          marginBottom: isMobile ? 24 : 32,
        }}>
          <div>
            <div style={s.footerLogo}>AquaFill</div>
            <div style={s.footerTagline}>Pure water, delivered fresh.</div>
          </div>
          <div style={{
            display: 'flex',
            gap: isMobile ? 12 : 24,
            flexWrap: 'wrap',
          }}>
            {['Home','Features','Pricing','How it works','Contact'].map(l => (
              <a key={l} href="#" style={s.footerLink} className="footer-link">{l}</a>
            ))}
          </div>
        </div>
        <div style={{
          ...s.footerBottom,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 6 : 0,
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <span style={s.footerCopy}>© 2026 AquaFill Water Refilling Station. All rights reserved.</span>
          <span style={s.footerCopy}>Tanjay City Negros Oriental, Philippines</span>
        </div>
      </footer>
    </div>
  );
}

// ── Animated counter ──────────────────────────────────────────
function StatCounter({ target, suffix, label }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0c1a2e' }}>{count}{suffix}</div>
      <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────
function SectionHeader({ label, title, sub, isMobile }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 40 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0c1a2e', letterSpacing: '-0.5px', marginBottom: 8 }}>{title}</h2>
      <p style={{ fontSize: isMobile ? 13 : 14, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>{sub}</p>
    </div>
  );
}

function PriceCard({ name, price, desc, features, featured, onClick, isMobile }) {
  return (
    <div style={{
      ...s.priceCard,
      ...(featured ? s.priceCardFeatured : {}),
      padding: isMobile ? 24 : 32,
    }} className="price-card">
      {featured && <div style={s.popularBadge}>Most popular</div>}
      <div style={{ fontSize: 16, fontWeight: 700, color: featured ? '#fff' : '#0c1a2e', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: isMobile ? 32 : 38, fontWeight: 900, color: featured ? '#fff' : '#0ea5e9', letterSpacing: '-1px' }}>{price}</div>
      <div style={{ fontSize: 12, color: featured ? '#bae6fd' : '#94a3b8', margin: '4px 0 16px' }}>{desc}</div>
      <div style={{ marginBottom: 20 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: featured ? '#e0f2fe' : '#64748b', marginBottom: 8 }}>
            <div style={{ width: 16, height: 16, background: featured ? '#fff' : '#0ea5e9', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 6, height: 6, background: featured ? '#0ea5e9' : '#fff', borderRadius: '50%' }} />
            </div>
            {f}
          </div>
        ))}
      </div>
      <button onClick={onClick} style={{ ...s.priceBtn, background: featured ? '#fff' : '#f0f9ff' }} className="price-btn">
        Order now
      </button>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = {
  page:             { background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', minHeight: '100vh' },
  nav:              { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #f1f5f9' },
  logo:             { fontSize: 22, fontWeight: 800, color: '#0ea5e9', letterSpacing: '-0.5px' },
  navLinks:         { display: 'flex', gap: 4 },
  navLink:          { fontSize: 13, color: '#64748b', fontWeight: 500, padding: '6px 12px', borderRadius: 6 },
  btnGhost:         { padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#0ea5e9', border: '1.5px solid #bae6fd', borderRadius: 8, background: 'none', cursor: 'pointer' },
  btnSolid:         { padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#fff', background: '#0ea5e9', border: 'none', borderRadius: 8, cursor: 'pointer' },
  hero:             { background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', display: 'grid', alignItems: 'center' },
  badge:            { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#0369a1', fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, marginBottom: 20, border: '1px solid #bae6fd' },
  badgeDot:         { width: 7, height: 7, background: '#0ea5e9', borderRadius: '50%' },
  heroTitle:        { fontWeight: 800, color: '#0c1a2e', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 20 },
  heroDesc:         { color: '#64748b', lineHeight: 1.8, marginBottom: 28 },
  heroCta:          { padding: '13px 28px', fontSize: 14, fontWeight: 600, color: '#fff', background: '#0ea5e9', border: 'none', borderRadius: 12, cursor: 'pointer' },
  heroSec:          { padding: '13px 28px', fontSize: 14, fontWeight: 500, color: '#0369a1', background: 'none', border: '1.5px solid #bae6fd', borderRadius: 12, cursor: 'pointer' },
  heroNote:         { fontSize: 12, color: '#94a3b8', marginTop: 10, marginBottom: 28 },
  heroStats:        { display: 'flex' },
  heroImg:          { borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(14,165,233,0.2)' },
  section:          { background: '#fff' },
  grid3:            { display: 'grid' },
  grid4:            { display: 'grid' },
  featCard:         { background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9', cursor: 'default' },
  featIconWrap:     { width: 48, height: 48, background: '#e0f2fe', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  featTitle:        { fontSize: 15, fontWeight: 700, color: '#0c1a2e', marginBottom: 8 },
  featDesc:         { fontSize: 13, color: '#64748b', lineHeight: 1.7 },
  priceCard:        { background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', cursor: 'default' },
  priceCardFeatured:{ background: '#0ea5e9', borderColor: '#0ea5e9', boxShadow: '0 16px 40px rgba(14,165,233,0.3)' },
  popularBadge:     { fontSize: 11, fontWeight: 700, background: '#fff', color: '#0ea5e9', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: 14 },
  priceBtn:         { width: '100%', padding: 12, fontSize: 13, fontWeight: 600, borderRadius: 12, border: 'none', cursor: 'pointer', color: '#0ea5e9' },
  stepCard:         { textAlign: 'center', background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9' },
  stepNum:          { width: 56, height: 56, background: '#0ea5e9', color: '#fff', borderRadius: '50%', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(14,165,233,0.3)' },
  stepTitle:        { fontSize: 15, fontWeight: 700, color: '#0c1a2e', marginBottom: 8 },
  stepDesc:         { fontSize: 13, color: '#64748b', lineHeight: 1.7 },
  contactCard:      { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' },
  contactLabel:     { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 },
  contactVal:       { fontWeight: 600, color: '#0c1a2e' },
  ctaBanner:        { background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', textAlign: 'center' },
  ctaTitle:         { fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.5px' },
  ctaSub:           { fontSize: 15, color: '#bae6fd', marginBottom: 28 },
  ctaBtn:           { padding: '14px 32px', fontSize: 14, fontWeight: 600, color: '#0ea5e9', background: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer' },
  footer:           { background: '#0c1a2e' },
  footerTop:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerLogo:       { fontSize: 22, fontWeight: 800, color: '#0ea5e9', marginBottom: 8 },
  footerTagline:    { fontSize: 13, color: '#475569' },
  footerLink:       { fontSize: 13, color: '#64748b', textDecoration: 'none' },
  footerBottom:     { borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between' },
  footerCopy:       { fontSize: 12, color: '#475569' },
};