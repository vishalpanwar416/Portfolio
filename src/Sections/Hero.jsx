import { Download, ArrowDown, MapPin, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts } from '../data'

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-canvas bg-grid-pattern bg-[size:64px_64px]" />
      <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1 text-center lg:text-left"
          >
            <p className="text-sm font-medium text-accent uppercase tracking-[0.2em] mb-4">
              {sectionContent.hero.greeting}
            </p>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.05]">
              {personalInfo.name.first}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-accent">
                {personalInfo.name.last}
              </span>
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-slate-300 font-display font-medium">
              {personalInfo.title}
            </p>

            <div className="mt-5 text-lg sm:text-xl text-slate-400">
              I build{' '}
              <span className="text-white font-medium">
                <TypingAnimation
                  texts={typingAnimationTexts}
                  typingSpeed={70}
                  deletingSpeed={35}
                  delayBetween={2200}
                />
              </span>
            </div>

            <p className="mt-6 text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {sectionContent.hero.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
              <span className="chip inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent" />
                Hyderabad, India
              </span>
              <span className="chip inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-accent" />
                2+ years experience
              </span>
              <span className="chip text-emerald-300/90 border-emerald-500/20 bg-emerald-500/10">
                Open to opportunities
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 justify-center lg:justify-start">
              <motion.button
                onClick={() => smoothScrollTo('portfolio')}
                className="btn-primary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {sectionContent.hero.cta.primary}
                <ArrowDown className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => smoothScrollTo('contact')}
                className="btn-secondary"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {sectionContent.hero.cta.secondary}
              </motion.button>
              <a href={externalLinks.resume} download className="btn-secondary">
                <Download className="w-4 h-4" />
                {sectionContent.hero.downloadResume}
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
              {socialLinks.slice(0, 5).map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:border-accent/40 hover:bg-accent/10 transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="order-1 lg:order-2 flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-accent/30 via-transparent to-indigo-500/20 rounded-[2rem] blur-2xl" />
              <div className="relative p-1 rounded-[1.75rem] bg-gradient-to-br from-accent/50 via-white/10 to-transparent">
                <img
                  src={profilePhoto}
                  alt={personalInfo.name.full}
                  className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 object-cover rounded-[1.5rem] grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -right-2 card px-4 py-2 shadow-card">
                <p className="text-xs text-slate-400">Currently at</p>
                <p className="font-display font-semibold text-white">Bluecopa</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.button
          onClick={() => smoothScrollTo('about')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 hover:text-accent transition-colors"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.button>
      </div>
    </section>
  )
}
