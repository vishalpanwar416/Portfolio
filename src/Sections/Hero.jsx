import { Download, ArrowDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts } from '../data'

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          {/* Profile photo with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative group"
          >
            {/* Animated gradient ring */}
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-full blur-xl opacity-75"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Glass container for photo */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-white/20 backdrop-blur-xl bg-white/10 shadow-2xl">
              <img
                src={profilePhoto}
                alt={personalInfo.name.full}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 via-transparent to-transparent" />
            </div>

            {/* Floating decorative elements */}
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-sm"
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full blur-sm"
              animate={{
                y: [0, 10, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </motion.div>

          {/* Text content with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Greeting */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base font-medium text-cyan-400 uppercase tracking-widest"
            >
              {sectionContent.hero.greeting}
            </motion.p>

            {/* Name with gradient */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold"
              style={{
                fontFamily: "'Playfair Display', serif",
              }}
            >
              <span className="block bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                {personalInfo.name.first}
              </span>
              <span className="block bg-gradient-to-r from-cyan-200 via-pink-200 to-white bg-clip-text text-transparent mt-2">
                {personalInfo.name.last}
              </span>
            </motion.h1>

            {/* Typing animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-light"
            >
              I build <TypingAnimation
                texts={typingAnimationTexts}
                typingSpeed={80}
                deletingSpeed={40}
                delayBetween={2000}
              />
            </motion.div>

            {/* Description in glass card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl max-w-2xl mx-auto"
            >
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                {sectionContent.hero.description}
              </p>
            </motion.div>
          </motion.div>

          {/* CTA Buttons with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap gap-4 justify-center items-center"
          >
            <motion.button
              onClick={() => smoothScrollTo('portfolio')}
              className="group relative px-8 py-4 rounded-xl font-semibold text-white overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 transition-transform group-hover:scale-110" />
              <span className="relative z-10 flex items-center gap-2">
                {sectionContent.hero.cta.primary}
                <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              onClick={() => smoothScrollTo('contact')}
              className="px-8 py-4 rounded-xl font-semibold text-white backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sectionContent.hero.cta.secondary}
            </motion.button>
          </motion.div>

          {/* Social Links with glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex items-center gap-4 pt-4"
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white hover:bg-white/20 hover:border-purple-500/50 transition-all"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                aria-label={social.name}
              >
                <social.icon className="w-5 h-5" />
              </motion.a>
            ))}
          </motion.div>

          {/* Download Resume */}
          <motion.a
            href={externalLinks.resume}
            download={`${personalInfo.name.full}_Resume.pdf`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all group"
            whileHover={{ scale: 1.05 }}
          >
            <Download className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
            <span>{sectionContent.hero.downloadResume}</span>
          </motion.a>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-gray-400 cursor-pointer"
              onClick={() => smoothScrollTo('about')}
            >
              <span className="text-xs uppercase tracking-wider">Scroll</span>
              <ArrowDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
