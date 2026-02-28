'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Brain,
  Shield,
  TrendingUp,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  Menu,
  X,
  Check,
  Lock,
  Home,
  Zap,
  BarChart3,
  FileText,
  DollarSign,
  Star,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Product', target: 'product' },
    { label: 'How it Works', target: 'how-it-works' },
    { label: 'Mission', target: 'mission' },
    { label: 'FAQ', target: 'faq' },
  ]

  return (
    <header
      role="banner"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        {/* Wordmark */}
        <a href="/" className="flex items-center gap-2 group" aria-label="Home Haven home">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <Home size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-[15px]">
            Home Haven
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(({ label, target }) => (
            <button
              key={target}
              onClick={() => scrollTo(target)}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => scrollTo('mission')}
            className="text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-4 py-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Our Mission
          </button>
          <a
            href="/app"
            className="text-sm font-medium text-white bg-blue-600 rounded-lg px-4 py-2 hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
          >
            Get Started
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map(({ label, target }) => (
                <button
                  key={target}
                  onClick={() => { scrollTo(target); setMobileOpen(false) }}
                  className="text-sm text-slate-700 font-medium text-left py-1.5 hover:text-blue-600 transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-100 mt-1">
                <button
                  onClick={() => { scrollTo('mission'); setMobileOpen(false) }}
                  className="text-sm font-medium text-center text-slate-700 border border-slate-200 rounded-xl px-4 py-2.5 hover:bg-slate-50"
                >
                  Our Mission
                </button>
                <a
                  href="/app"
                  className="text-sm font-medium text-center text-white bg-blue-600 rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// ─── Hero Mock Cards ──────────────────────────────────────────────────────────

function TrueCostCard() {
  const items = [
    { label: 'Principal & Interest', amount: '$2,150', pct: 66 },
    { label: 'Property Tax', amount: '$458', pct: 14 },
    { label: 'HOA', amount: '$250', pct: 8 },
    { label: 'Homeowners Insurance', amount: '$175', pct: 5 },
    { label: 'Maint. Reserve', amount: '$214', pct: 7 },
  ]
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 p-5 w-[300px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          True Monthly Cost
        </span>
        <BarChart3 size={13} className="text-blue-400" />
      </div>
      <div className="mb-0.5">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">$3,247</span>
        <span className="text-sm text-slate-400 ml-1">/mo</span>
      </div>
      <p className="text-[11px] text-slate-400 mb-4">$650k home · 20% down · 7.25% rate</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-medium text-slate-700">{item.amount}</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
        <AlertTriangle size={11} className="text-amber-500 shrink-0 mt-0.5" />
        <span className="text-[11px] text-amber-700 leading-relaxed">
          Listed payment: $2,400 — underestimating by <strong>$847/mo</strong>
        </span>
      </div>
    </div>
  )
}

function ReadinessCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 p-5 w-[248px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Readiness Score
        </span>
        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Strong
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-4xl font-bold text-slate-900">78</span>
        <span className="text-slate-400 text-sm mb-1">/ 100</span>
      </div>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i < 8 ? 'bg-emerald-400' : 'bg-slate-100'}`}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-400 mb-3">Strong buyer · 2 items to review</p>
      <div className="space-y-1.5">
        {['Optimize credit utilization', 'Build 2-month reserve'].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-blue-200 flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
            <span className="text-[11px] text-slate-600">{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WireCheckCard() {
  const checks = [
    { label: 'Title Company', value: 'Capital Title LLC' },
    { label: 'Escrow Officer', value: 'S. Johnson' },
    { label: 'Wire Amount', value: '$88,450' },
    { label: 'Closing Date', value: 'Mar 15' },
  ]
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30 p-4 w-[228px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Wire Verification
        </span>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
          <Check size={9} strokeWidth={3} />
          PASS
        </div>
      </div>
      <div className="space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">{c.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-slate-700">{c.value}</span>
              <Check size={10} className="text-emerald-500" strokeWidth={2.5} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center gap-1.5">
        <Shield size={10} className="text-blue-400" />
        <span className="text-[10px] text-slate-400">Verified against closing docs</span>
      </div>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-white"
      aria-label="Hero"
    >
      {/* Gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white to-slate-50/80 pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Ambient blobs */}
      <div className="absolute -top-80 -right-80 w-[700px] h-[700px] bg-blue-100 rounded-full opacity-25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-80 -left-80 w-[600px] h-[600px] bg-slate-100 rounded-full opacity-40 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-28 pb-20 lg:pb-32 grid lg:grid-cols-2 gap-14 items-center w-full">
        {/* Left: Text */}
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-6">
              <Zap size={11} />
              Consumer protection · AI-powered
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl lg:text-[3.4rem] font-bold text-slate-900 tracking-tight leading-[1.08] mb-6 text-balance"
          >
            Your AI financial safety copilot for{' '}
            <span className="text-blue-600">homebuying.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg"
          >
            Know the true cost, choose safer loans, and protect your closing from wire
            fraud—before you sign.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 items-center">
            <a
              href="/app"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-blue-600 rounded-xl px-6 py-3.5 hover:bg-blue-700 transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
              <ArrowRight size={16} />
            </a>
            <button
              onClick={() => scrollTo('mission')}
              className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-700 border border-slate-200 rounded-xl px-6 py-3.5 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              Our Mission
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-3 text-sm text-slate-400">
            Takes ~2 minutes · No credit pull · Free
          </motion.p>
        </motion.div>

        {/* Right: Mock Dashboard */}
        <div className="relative hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-[420px] h-[520px]">
            {/* Back: Readiness (rotated left) */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-16 -left-4 rotate-[-5deg] origin-bottom-right"
            >
              <ReadinessCard />
            </motion.div>

            {/* Back: Wire check (rotated right) */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-4 right-0 rotate-[4deg] origin-bottom-left"
            >
              <WireCheckCard />
            </motion.div>

            {/* Front: True Cost (centered) */}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-8 left-10"
            >
              <TrueCostCard />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Trust Strip ──────────────────────────────────────────────────────────────

function TrustStrip() {
  const badges = [
    { icon: Lock, label: 'Privacy-first' },
    { icon: FileText, label: 'Plain-English' },
    { icon: Shield, label: 'Secure by design' },
    { icon: Star, label: 'Consumer-first' },
    { icon: Zap, label: 'No credit pull' },
  ]

  return (
    <section aria-label="Trust indicators" className="py-12 border-y border-slate-100 bg-slate-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Built for buyers. Not banks.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {badges.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-700 shadow-sm cursor-default"
              >
                <Icon size={13} className="text-blue-500" />
                {label}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Product Pillars ──────────────────────────────────────────────────────────

type PillarColor = 'blue' | 'emerald' | 'violet'

const pillarColors: Record<PillarColor, { icon: string; bg: string; border: string; check: string }> = {
  blue: { icon: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', check: 'text-blue-500' },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', check: 'text-emerald-500' },
  violet: { icon: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', check: 'text-violet-500' },
}

const pillars: {
  icon: React.ComponentType<{ size: number; className: string }>
  title: string
  desc: string
  bullets: string[]
  color: PillarColor
}[] = [
  {
    icon: Brain,
    title: 'Financial Intelligence Engine',
    desc: 'See the number that actually matters—what you\'ll pay every month, including taxes, HOA, insurance, and maintenance.',
    bullets: [
      'True monthly cost breakdown in plain English',
      'Loan comparison & amortization scenarios',
      'Closing cost estimates before you\'re surprised',
    ],
    color: 'blue',
  },
  {
    icon: TrendingUp,
    title: 'Readiness & Risk Advisor',
    desc: 'Know exactly where you stand before you start shopping. Get a personalized action plan to close the gaps.',
    bullets: [
      'Readiness score based on your real numbers',
      'Step-by-step path to improve your position',
      'Realistic timeline and milestone tracker',
    ],
    color: 'emerald',
  },
  {
    icon: Shield,
    title: 'Closing Protection AI',
    desc: 'Wire fraud costs buyers millions each year. We verify every closing detail before you wire a single dollar.',
    bullets: [
      'Cross-check wire instructions against your docs',
      'Detect inconsistencies in escrow information',
      'Alert you before sending irreversible funds',
    ],
    color: 'violet',
  },
]

// React import for JSX types
import React from 'react'

function ProductPillars() {
  return (
    <section id="product" className="py-28 bg-white" aria-labelledby="product-heading">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            Product
          </span>
          <h2
            id="product-heading"
            className="text-4xl font-bold text-slate-900 tracking-tight mb-4"
          >
            Three tools. One clear picture.
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Home Haven combines financial modeling, buyer coaching, and fraud prevention—so
            you're protected at every stage of the process.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => {
            const colors = pillarColors[pillar.color]
            const Icon = pillar.icon
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-white border border-slate-200 rounded-2xl p-7 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/80 transition-all cursor-default"
              >
                <div
                  className={`inline-flex p-2.5 rounded-xl ${colors.bg} border ${colors.border} mb-5`}
                >
                  <Icon size={20} className={colors.icon} />
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2 leading-snug">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">{pillar.desc}</p>
                <ul className="space-y-2.5 mb-6" aria-label={`${pillar.title} features`}>
                  {pillar.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5">
                      <Check
                        size={13}
                        className={`${colors.check} mt-0.5 shrink-0`}
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-slate-600 leading-snug">{b}</span>
                    </li>
                  ))}
                </ul>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.icon} group-hover:gap-2 transition-all`}
                >
                  Learn more <ArrowRight size={11} />
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Add your basics',
      desc: 'Share your income, savings, and homebuying goals. No credit check—just enough to build your real picture.',
      detail: '~2 minutes',
      icon: FileText,
    },
    {
      number: '02',
      title: 'See true costs & your plan',
      desc: 'Get a plain-English breakdown of what you\'ll actually pay each month, your readiness score, and a step-by-step action plan.',
      detail: 'Instant results',
      icon: BarChart3,
    },
    {
      number: '03',
      title: 'Verify before you sign',
      desc: 'Before transferring any funds, upload your closing disclosure and wire instructions. We check every line.',
      detail: 'Before closing day',
      icon: Shield,
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-28 bg-slate-50"
      aria-labelledby="how-it-works-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            How it Works
          </span>
          <h2
            id="how-it-works-heading"
            className="text-4xl font-bold text-slate-900 tracking-tight mb-4"
          >
            Simple. Straightforward.
          </h2>
          <p className="text-lg text-slate-500">
            No confusing dashboards. No financial jargon. Just clarity at every step.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-[26px] left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-blue-600 mb-6 shadow-lg shadow-blue-200">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
                  Step {step.number}
                </span>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-3">{step.desc}</p>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  {step.detail}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Mission Section ──────────────────────────────────────────────────────────

function MissionSection() {
  return (
    <section id="mission" className="py-28 bg-white" aria-labelledby="mission-heading">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            Our Mission
          </span>
          <h2
            id="mission-heading"
            className="text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-6"
          >
            Real estate is complex.
            <br />
            <span className="text-blue-600">Your decisions shouldn't be.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-lg text-slate-500 leading-relaxed mb-12 max-w-2xl mx-auto"
        >
          Most first-time buyers make irreversible financial decisions without fully
          understanding the costs, risks, or alternatives. We built Home Haven to change
          that—clear information, plain language, and real protection when it matters most.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-2xl mx-auto"
        >
          <div className="relative p-7 lg:p-9 bg-slate-900 rounded-2xl text-left overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-start gap-5">
              <div className="mt-0.5 p-2.5 bg-white/10 rounded-xl shrink-0 backdrop-blur-sm">
                <Shield size={20} className="text-blue-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3 leading-snug">
                  "Institutions protect themselves. We protect the buyer."
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Banks optimize for loan volume. Agents optimize for closing deals. Home
                  Haven is the only party in the transaction whose sole job is to make sure{' '}
                  <em className="text-slate-200 not-italic font-medium">you</em> understand
                  what you're signing—and why it matters.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Security Section ─────────────────────────────────────────────────────────

function SecuritySection() {
  const checks = [
    'Title company name and address',
    'Escrow officer name and contact',
    'Expected closing date',
    'Expected wire amount',
    'Lender name and account details',
    'Bank routing and account numbers',
  ]

  const mockRows = [
    { label: 'CD Wire Amount', value: '$88,450.00' },
    { label: 'Title Co. Name', value: 'Capital Title LLC' },
    { label: 'Escrow Account', value: '****4892' },
    { label: 'Routing Number', value: 'Verified' },
    { label: 'Closing Date', value: 'Mar 15, 2025' },
  ]

  return (
    <section id="security" className="py-28 bg-slate-50" aria-labelledby="security-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
              Closing Protection AI
            </span>
            <h2
              id="security-heading"
              className="text-4xl font-bold text-slate-900 tracking-tight mb-4 leading-tight"
            >
              Wire fraud is real.
              <br />
              Protect every dollar.
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 max-w-lg">
              Closing-day wire fraud causes millions in losses each year. Criminals intercept
              closing communications and substitute fraudulent wire instructions. Our AI
              cross-checks every detail before you send a single dollar.
            </p>

            <ul className="space-y-2.5 mb-8" aria-label="What we verify">
              {checks.map((check, i) => (
                <motion.li
                  key={check}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-emerald-600" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-700">{check}</span>
                </motion.li>
              ))}
            </ul>

            <a
              href="/app/closing"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
            >
              Verify your closing docs
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </a>
          </motion.div>

          {/* Right: UI mock */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {/* Warning banner */}
            <div
              role="alert"
              className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
            >
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Wire fraud is a top closing-day risk—verify before you send.
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  The FBI reports over $1B lost annually to real estate wire fraud.
                  Fraudulent instructions look identical to real ones.
                </p>
              </div>
            </div>

            {/* Mock verification UI */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Closing Document Check
                </h4>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check size={10} strokeWidth={3} /> All clear
                </span>
              </div>
              <div className="space-y-0">
                {mockRows.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
                  >
                    <span className="text-xs text-slate-500">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-800">{value}</span>
                      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check size={9} className="text-emerald-600" strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: 'Do you store my financial data?',
    a: 'We only store what\'s needed to generate your results. We never sell your data to lenders, advertisers, or third parties. Your information is encrypted at rest and in transit.',
  },
  {
    q: 'Do you replace my lender or agent?',
    a: 'No. Home Haven is an independent decision-support tool. We work alongside your existing team so you can make better-informed decisions—not replace the professionals you trust.',
  },
  {
    q: 'How does the wire checker work?',
    a: 'You upload your Closing Disclosure and the wire instructions you received. Our AI extracts and cross-references key details—title company name, account numbers, amounts, and dates—and flags anything that doesn\'t match or looks unusual.',
  },
  {
    q: 'Is this financial or legal advice?',
    a: 'No. Home Haven provides educational information and analytical tools to help you understand your situation. Always consult a licensed financial advisor or attorney for advice specific to your circumstances.',
  },
  {
    q: 'How accurate are the cost estimates?',
    a: 'Our estimates are based on your actual inputs and current market data, and are designed to be significantly more accurate than the pre-approval letters you\'ll typically receive—which often omit taxes, HOA fees, insurance, and maintenance costs.',
  },
  {
    q: 'Who is Home Haven for?',
    a: 'Anyone buying a home who wants to understand what they\'re actually getting into—especially first-time buyers navigating an unfamiliar and high-stakes process for the first time.',
  },
]

function FAQItem({
  faq,
  isOpen,
  onToggle,
  index,
}: {
  faq: (typeof faqs)[0]
  isOpen: boolean
  onToggle: () => void
  index: number
}) {
  const id = `faq-answer-${index}`
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
      >
        <span className="text-[15px] font-medium text-slate-900 group-hover:text-blue-700 transition-colors pr-6">
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-slate-500 leading-relaxed max-w-2xl">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-28 bg-white" aria-labelledby="faq-heading">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            FAQ
          </span>
          <h2 id="faq-heading" className="text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Questions answered.
          </h2>
          <p className="text-lg text-slate-500">No jargon. No runarounds.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl px-6"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── Get Started Links ────────────────────────────────────────────────────────

type LinkColor = 'blue' | 'emerald' | 'violet'

const linkColors: Record<
  LinkColor,
  { icon: string; bg: string; border: string; btn: string; btnHover: string; shadow: string }
> = {
  blue: {
    icon: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    btn: 'bg-blue-600 text-white',
    btnHover: 'hover:bg-blue-700',
    shadow: 'shadow-blue-200',
  },
  emerald: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    btn: 'bg-emerald-600 text-white',
    btnHover: 'hover:bg-emerald-700',
    shadow: 'shadow-emerald-200',
  },
  violet: {
    icon: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    btn: 'bg-violet-600 text-white',
    btnHover: 'hover:bg-violet-700',
    shadow: 'shadow-violet-200',
  },
}

const startPaths: {
  icon: React.ComponentType<{ size: number; className: string }>
  title: string
  desc: string
  href: string
  color: LinkColor
  cta: string
  microcopy: string
}[] = [
  {
    icon: DollarSign,
    title: 'Financial Checkup',
    desc: 'Calculate your true monthly cost, explore loan scenarios, and see what you can actually afford—not just what you pre-qualify for.',
    href: '/app/financial',
    color: 'blue',
    cta: 'Start financial checkup',
    microcopy: '~3 min · No credit pull',
  },
  {
    icon: BarChart3,
    title: 'Check Your Readiness',
    desc: 'Get your personalized readiness score and a clear, step-by-step plan to get purchase-ready on your timeline.',
    href: '/app/readiness',
    color: 'emerald',
    cta: 'See my readiness score',
    microcopy: '~2 min · Free',
  },
  {
    icon: Shield,
    title: 'Verify Closing Docs',
    desc: 'Upload your Closing Disclosure and wire instructions. We\'ll cross-check every detail before you send any funds.',
    href: '/app/closing',
    color: 'violet',
    cta: 'Verify my closing docs',
    microcopy: 'Upload & verify · Free',
  },
]

function GetStartedLinks() {
  return (
    <section
      id="get-started"
      className="py-28 bg-slate-50 border-t border-slate-100"
      aria-labelledby="get-started-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-4">
            Get Started
          </span>
          <h2
            id="get-started-heading"
            className="text-4xl font-bold text-slate-900 tracking-tight mb-4"
          >
            Where would you like to start?
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            Each tool works on its own. Use one, two, or all three—depending on where you
            are in the homebuying process.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {startPaths.map((path, i) => {
            const colors = linkColors[path.color]
            const Icon = path.icon
            return (
              <motion.div
                key={path.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-white border border-slate-200 rounded-2xl p-7 flex flex-col hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/80 transition-all"
              >
                <div
                  className={`inline-flex p-2.5 rounded-xl ${colors.bg} border ${colors.border} mb-5 w-fit`}
                >
                  <Icon size={20} className={colors.icon} />
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2">{path.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{path.desc}</p>
                <a
                  href={path.href}
                  className={`inline-flex items-center justify-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 shadow-sm ${colors.shadow} transition-all ${colors.btn} ${colors.btnHover} hover:shadow-md hover:-translate-y-0.5 active:translate-y-0`}
                >
                  {path.cta}
                  <ArrowRight size={14} />
                </a>
                <p className="text-xs text-slate-400 text-center mt-2.5">{path.microcopy}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-slate-400 mt-10"
        >
          Free to use · No account required to explore · No credit pull
        </motion.p>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section
      className="py-36 bg-slate-950 relative overflow-hidden"
      aria-labelledby="final-cta-heading"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-64 -right-64 w-[600px] h-[600px] bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            id="final-cta-heading"
            className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight mb-5"
          >
            Buy with clarity.
            <br />
            <span className="text-blue-400">Close with confidence.</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            You're about to make one of the biggest financial decisions of your life. Make
            sure you actually understand it.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <a
              href="/app"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-blue-600 rounded-xl px-7 py-4 hover:bg-blue-500 transition-all shadow-xl shadow-blue-950/60 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
              <ArrowRight size={16} />
            </a>
            <button
              onClick={() => scrollTo('mission')}
              className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-300 border border-slate-700 rounded-xl px-7 py-4 hover:bg-slate-800 hover:border-slate-600 transition-all"
            >
              Our Mission
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Takes ~2 minutes · No credit pull · Free
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear()

  const footerLinks: ({ label: string; target: string; href?: undefined } | { label: string; href: string; target?: undefined })[] = [
    { label: 'Product', target: 'product' },
    { label: 'How it Works', target: 'how-it-works' },
    { label: 'Mission', target: 'mission' },
    { label: 'FAQ', target: 'faq' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ]

  return (
    <footer
      className="bg-slate-950 border-t border-slate-800/50 py-12"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
          {/* Wordmark */}
          <a href="/" className="flex items-center gap-2" aria-label="Home Haven home">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Home size={12} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Home Haven</span>
          </a>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-5">
            {footerLinks.map(({ label, target, href }) =>
              target ? (
                <button
                  key={label}
                  onClick={() => scrollTo(target)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {label}
                </button>
              ) : (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {label}
                </a>
              )
            )}
          </nav>
        </div>

        <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-slate-600">© {year} Home Haven. All rights reserved.</p>
          <p className="text-xs text-slate-700 max-w-xl leading-relaxed">
            Home Haven provides educational tools and information only. Nothing on this
            platform constitutes financial, legal, or real estate advice. Always consult
            qualified professionals before making financial decisions.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased bg-white text-slate-900">
      <Navbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <ProductPillars />
        <HowItWorks />
        <MissionSection />
        <SecuritySection />
        <FAQSection />
        <GetStartedLinks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
