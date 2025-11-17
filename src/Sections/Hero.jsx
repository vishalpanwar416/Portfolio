import { Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import { useMagneticButton } from '../hooks/useMagneticButton'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts } from '../data'

export default function Hero() {
  const magneticButton1 = useMagneticButton(0.3)
  const magneticButton2 = useMagneticButton(0.3)

  return (
    <section id="hero" className="min-h-screen relative overflow-hidden pt-0 lg:pt-12 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      {/* Ambient background effects with animated gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-48 w-96 h-96 bg-gradient-to-br from-gray-800/20 to-gray-900/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-48 w-96 h-96 bg-gradient-to-tl from-gray-700/20 to-gray-800/10 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gray-800/10 to-transparent rounded-full blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        {/* Additional subtle overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-transparent to-gray-900/50"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 min-h-screen flex items-center py-8 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">
          {/* Left Content */}
        <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Name */}
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-sm md:text-base mb-2"
              >
                {sectionContent.hero.greeting}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '-0.02em',
                  fontWeight: 700,
                  fontStyle: 'normal'
                }}
              >
                <span className="block">{personalInfo.name.first}</span>
                <span className="block mt-1 md:mt-2">{personalInfo.name.last}</span>
              </motion.h1>
            </div>

            {/* Title with Typing Animation */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-400 max-w-xl"
            >
              I build <TypingAnimation
                texts={typingAnimationTexts}
                typingSpeed={80}
                deletingSpeed={40}
                delayBetween={2000}
              />
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed"
            >
              {sectionContent.hero.description}
            </motion.p>

            {/* CTA Buttons with magnetic effect */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                ref={magneticButton1}
                onClick={() => smoothScrollTo('portfolio')}
                className="group relative px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-xl font-semibold overflow-hidden transition-all hover:scale-105 active:scale-95 ripple text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">{sectionContent.hero.cta.primary}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>

              <motion.button
                ref={magneticButton2}
                onClick={() => smoothScrollTo('contact')}
                className="group px-6 py-3 md:px-8 md:py-4 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-all hover:scale-105 active:scale-95 ripple backdrop-blur-sm glass text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sectionContent.hero.cta.secondary}
              </motion.button>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4"
            >
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </motion.div>

            {/* Download Resume */}
            <motion.a
              href={externalLinks.resume}
              download={`${personalInfo.name.full}_Resume.pdf`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <Download className="w-5 h-5" />
              <span className="border-b border-gray-600 group-hover:border-white transition-colors">{sectionContent.hero.downloadResume}</span>
            </motion.a>
          </motion.div>

          {/* Right - Profile Image with 3D tilt effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex justify-center items-center"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Animated gray gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-gray-700/30 via-gray-800/20 to-gray-900/30 blur-3xl rounded-full"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.4, 0.3],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Image container with glassmorphism and 3D tilt */}
              <motion.div
                className="relative w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-3xl overflow-hidden border border-gray-700/30 bg-gradient-to-br from-gray-800/20 to-gray-900/40 backdrop-blur-sm shadow-2xl"
                whileHover={{ rotateY: 5, rotateX: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <img
                src={profilePhoto}
                alt="Vishal Panwar"
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-110"
                />
                {/* Gray overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-gray-800/20"></div>
              </motion.div>

              {/* Floating decorative gray elements */}
              <motion.div
                className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-16 h-16 sm:w-24 sm:h-24 border-2 border-gray-700/40 rounded-full"
                animate={{ rotate: [0, 360], y: [0, -10, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-20 h-20 sm:w-32 sm:h-32 border-2 border-gray-800/30 rounded-full"
                animate={{ rotate: [360, 0], y: [0, 10, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute top-1/2 -left-4 sm:-left-8 w-12 h-12 sm:w-16 sm:h-16 bg-gray-700/10 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/4 -right-4 sm:-right-8 w-14 h-14 sm:w-20 sm:h-20 bg-gray-600/10 rounded-full blur-xl"
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
