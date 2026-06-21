import { Download, ArrowDown, ArrowUpRight, MapPin, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts, workExperience } from '../data'

const ease = [0.22, 1, 0.36, 1]

const reveal = (delay = 0, x = 0) => ({
  initial: { opacity: 0, y: 28, x },
  animate: { opacity: 1, y: 0, x: 0 },
  transition: { duration: 0.75, delay, ease },
})

export default function Hero() {
  const titleParts = personalInfo.title.split('|').map((s) => s.trim())
  const currentRole = workExperience[0]

  return (
    <section id="hero" className="relative min-h-screen bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
      <div className="absolute inset-0 noise-texture opacity-[0.025] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-white/[0.03] to-transparent pointer-events-none hidden lg:block" />

      <motion.div
        {...reveal(0.1)}
        className="absolute top-24 md:top-28 left-0 right-0 z-20 container mx-auto px-5 sm:px-8 flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.35em] text-gray-600"
      >
        <span>{sectionContent.hero.metaYear}</span>
        <span className="hidden sm:inline">{personalInfo.availability.badge}</span>
        <span className="sm:hidden">{personalInfo.availability.badgeShort}</span>
      </motion.div>

      <div className="relative z-10 container mx-auto px-5 sm:px-8 pt-32 md:pt-36 pb-24 lg:pb-16 min-h-screen flex flex-col lg:flex-row lg:items-stretch gap-10 lg:gap-6">
        <div className="flex-1 flex flex-col justify-center lg:max-w-[54%] xl:max-w-[52%]">
          <motion.div {...reveal(0.2)} className="flex items-center gap-3 mb-6 md:mb-8">
            <span className="h-px w-10 bg-gray-600" />
            <p className="text-xs sm:text-sm text-gray-400 uppercase tracking-[0.28em]">
              {sectionContent.hero.greeting}
            </p>
          </motion.div>

          <motion.h1
            {...reveal(0.28)}
            className="font-serif-display text-[2.75rem] sm:text-6xl md:text-7xl xl:text-[5.25rem] leading-[0.92] font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="block text-white">{personalInfo.name.first}</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 mt-1">
              {personalInfo.name.last}
            </span>
          </motion.h1>

          <motion.div {...reveal(0.36)} className="mt-6 flex flex-wrap gap-2">
            {titleParts.map((part) => (
              <span
                key={part}
                className="px-3 py-1 text-[11px] sm:text-xs uppercase tracking-wider text-gray-300 border border-white/10 rounded-full bg-white/[0.03]"
              >
                {part}
              </span>
            ))}
          </motion.div>

          <motion.p {...reveal(0.4)} className="mt-4 text-xs text-gray-500 uppercase tracking-wider">
            {personalInfo.availability.status}
          </motion.p>

          <motion.div
            {...reveal(0.44)}
            className="mt-6 text-lg sm:text-xl md:text-2xl text-gray-300 font-light min-h-[2.25rem] sm:min-h-[2.75rem]"
          >
            I build{' '}
            <span className="text-white font-normal">
              <TypingAnimation
                texts={typingAnimationTexts}
                typingSpeed={65}
                deletingSpeed={32}
                delayBetween={2400}
              />
            </span>
          </motion.div>

          <motion.p
            {...reveal(0.52)}
            className="mt-6 text-sm sm:text-base text-gray-400 leading-relaxed max-w-xl border-l-2 border-white/10 pl-4"
          >
            {sectionContent.hero.description}
          </motion.p>

          <motion.div {...reveal(0.6)} className="mt-8 flex flex-wrap gap-3">
            <motion.button
              onClick={() => smoothScrollTo('portfolio')}
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {sectionContent.hero.cta.primary}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
            <motion.a
              href={externalLinks.calendarBooking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 text-sm font-semibold text-gray-200 hover:bg-white/5 hover:border-white/35 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Calendar className="w-4 h-4" />
              {sectionContent.hero.cta.bookMeeting}
            </motion.a>
            <motion.button
              onClick={() => smoothScrollTo('contact')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/10 text-sm font-semibold text-gray-400 hover:text-white hover:border-white/25 transition-all"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {sectionContent.hero.cta.secondary}
            </motion.button>
            <motion.a
              href={externalLinks.resume}
              download={`${personalInfo.name.full}_Resume.pdf`}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/25 transition-all"
              whileHover={{ scale: 1.03 }}
            >
              <Download className="w-4 h-4" />
              {sectionContent.hero.downloadResume}
            </motion.a>
          </motion.div>

          <motion.div {...reveal(0.68)} className="mt-8 flex items-center gap-3">
            {socialLinks.slice(0, 4).map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="p-2.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          {...reveal(0.35, 24)}
          className="flex-1 relative flex items-end justify-center lg:justify-end lg:items-center min-h-[340px] sm:min-h-[420px] lg:min-h-0"
        >
          <div className="absolute top-8 right-4 lg:right-8 w-32 h-32 border border-white/[0.06] rounded-full" />
          <div className="absolute bottom-16 left-4 lg:left-auto lg:right-24 w-20 h-20 border border-white/[0.08] rounded-full" />

          <div className="relative w-full max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] xl:max-w-[460px]">
            <div className="absolute inset-y-0 -left-16 w-32 bg-gradient-to-r from-black to-transparent z-10 hidden lg:block pointer-events-none" />

            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0a] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />
              <img
                src={profilePhoto}
                alt={personalInfo.name.full}
                className="w-full aspect-[4/5] object-cover object-[center_15%] contrast-[1.05] brightness-95 hover:brightness-100 transition-all duration-700"
                fetchPriority="high"
              />

              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl backdrop-blur-md bg-black/50 border border-white/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">{sectionContent.hero.currentlyLabel}</p>
                  <p className="text-sm sm:text-base font-medium text-white">
                    {currentRole.company} · {currentRole.position.split(' ')[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">{sectionContent.hero.experienceLabel}</p>
                  <p className="text-sm sm:text-base font-medium text-white">{personalInfo.experienceYears} Years</p>
                </div>
              </div>
            </div>

            <motion.div
              {...reveal(0.75)}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-auto lg:-right-4 lg:bottom-12 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-black/70 border border-white/10 text-xs text-gray-300 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {personalInfo.location.display}
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        {...reveal(0.85)}
        className="absolute bottom-0 inset-x-0 z-20 border-t border-white/[0.06] bg-black/60 backdrop-blur-sm"
      >
        <div className="container mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {personalInfo.heroStats.stack.map((item) => (
              <span key={item} className={item.includes('/') ? 'hidden sm:inline' : undefined}>
                {item}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => smoothScrollTo('about')}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors uppercase tracking-[0.2em]"
          >
            Explore
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </button>
        </div>
      </motion.div>
    </section>
  )
}
