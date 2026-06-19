import { Download, ArrowDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts } from '../data'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] },
})

export default function Hero() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${8 + ((i * 17) % 84)}%`,
        top: `${10 + ((i * 23) % 80)}%`,
        duration: 3.5 + (i % 5) * 0.4,
        delay: (i % 7) * 0.35,
      })),
    [],
  )

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={profilePhoto}
          alt={personalInfo.name.full}
          className="w-full h-full object-cover object-[center_20%] sm:object-center scale-105"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-gray-950/80 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/70" />
      </div>

      {/* Ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 left-0 w-[28rem] h-[28rem] bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[24rem] h-[24rem] bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, -24, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      {/* Particles — stable positions, no re-render jitter */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{ left: p.left, top: p.top }}
            animate={{ y: [0, -80, 0], opacity: [0, 0.8, 0] }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-5 sm:px-6 py-12 md:py-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
          <motion.p {...fadeUp(0.15)} className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.3em]">
            {sectionContent.hero.greeting}
          </motion.p>

          <motion.h1
            {...fadeUp(0.25)}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              {personalInfo.name.first}
            </span>
            <span className="block bg-gradient-to-r from-gray-300 via-gray-100 to-white bg-clip-text text-transparent mt-1 sm:mt-2">
              {personalInfo.name.last}
            </span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.35)}
            className="text-sm sm:text-base text-gray-400 max-w-xl leading-relaxed"
          >
            {personalInfo.title}
          </motion.p>

          <motion.div
            {...fadeUp(0.45)}
            className="text-lg sm:text-xl md:text-2xl text-gray-300 font-light min-h-[2.5rem] sm:min-h-[3rem]"
          >
            I build{' '}
            <TypingAnimation
              texts={typingAnimationTexts}
              typingSpeed={70}
              deletingSpeed={35}
              delayBetween={2200}
            />
          </motion.div>

          <motion.div
            {...fadeUp(0.55)}
            className="w-full max-w-2xl p-5 sm:p-7 rounded-2xl backdrop-blur-xl bg-black/45 border border-white/15 shadow-2xl"
          >
            <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">
              {sectionContent.hero.description}
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.65)}
            className="flex flex-wrap gap-3 sm:gap-4 justify-center items-center"
          >
            <motion.button
              onClick={() => smoothScrollTo('portfolio')}
              className="group relative px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white overflow-hidden"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-700 transition-transform group-hover:scale-105" />
              <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
                {sectionContent.hero.cta.primary}
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              onClick={() => smoothScrollTo('contact')}
              className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-semibold text-white text-sm sm:text-base backdrop-blur-xl bg-black/35 border border-white/25 hover:bg-black/50 hover:border-white/40 transition-all"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {sectionContent.hero.cta.secondary}
            </motion.button>
          </motion.div>

          <motion.div {...fadeUp(0.75)} className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {socialLinks.slice(0, 5).map((social) => (
              <motion.a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 sm:p-3 rounded-xl backdrop-blur-xl bg-black/30 border border-white/20 text-gray-300 hover:text-white hover:border-white/50 transition-all"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={social.name}
              >
                <social.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.a>
            ))}

            <motion.a
              href={externalLinks.resume}
              download={`${personalInfo.name.full}_Resume.pdf`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl backdrop-blur-xl bg-black/30 border border-white/20 text-gray-300 hover:text-white hover:border-white/45 transition-all text-sm"
              whileHover={{ scale: 1.04 }}
            >
              <Download className="w-4 h-4" />
              <span>{sectionContent.hero.downloadResume}</span>
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Scroll hint — anchored to section bottom */}
      <motion.button
        type="button"
        {...fadeUp(0.9)}
        onClick={() => smoothScrollTo('about')}
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <ArrowDown className="w-4 h-4" />
      </motion.button>
    </section>
  )
}
