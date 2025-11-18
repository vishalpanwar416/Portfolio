import { Download } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import TypingAnimation from '../components/TypingAnimation'
import { personalInfo, socialLinks, externalLinks, sectionContent, typingAnimationTexts } from '../data'

export default function Hero() {
  return (
    <section id="hero" className="min-h-screen relative overflow-hidden pt-20 lg:pt-12 bg-black lg:bg-gradient-to-br lg:from-[#0a0a0a] lg:via-[#1a1a1a] lg:to-[#0a0a0a]">
      {/* Ambient background effects with animated gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden lg:block">
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
      
      <div className="relative z-10 container mx-auto px-6 min-h-screen flex items-center py-12 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-12 items-center w-full">
          {/* Left Content */}
        <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* Name */}
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 text-xs md:text-sm mb-3 tracking-wide uppercase font-medium"
              >
                {sectionContent.hero.greeting}
              </motion.p>
              <div className="flex items-start gap-3 lg:block">
                <div className="flex-1">
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-bold text-white lg:bg-gradient-to-r lg:from-white lg:via-gray-200 lg:to-gray-400 lg:bg-clip-text lg:text-transparent"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      letterSpacing: '-0.02em',
                      fontWeight: 700,
                      fontStyle: 'normal'
                    }}
                  >
                    <span className="block">{personalInfo.name.first}</span>
                    <span className="block mt-1">{personalInfo.name.last}</span>
                  </motion.h1>
                </div>
                <div className="lg:hidden w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-lg overflow-hidden border border-gray-800 flex-shrink-0">
                  <img src={profilePhoto} alt="Vishal Panwar" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Title with Typing Animation */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-xl font-light"
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
              className="text-gray-600 text-xs sm:text-sm md:text-base max-w-xl leading-relaxed font-light"
            >
              {sectionContent.hero.description}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-wrap gap-3"
            >
              <button
                onClick={() => smoothScrollTo('portfolio')}
                className="px-6 py-3 md:px-8 md:py-4 bg-white text-black rounded-lg font-medium transition-opacity hover:opacity-90 text-xs sm:text-sm md:text-base"
              >
                {sectionContent.hero.cta.primary}
              </button>

              <button
                onClick={() => smoothScrollTo('contact')}
                className="px-6 py-3 md:px-8 md:py-4 border border-gray-700 text-white rounded-lg font-medium hover:border-gray-600 transition-colors text-xs sm:text-sm md:text-base"
              >
                {sectionContent.hero.cta.secondary}
              </button>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-3"
            >
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-lg border border-gray-800 text-gray-500 hover:text-gray-400 hover:border-gray-700 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
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
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-400 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="border-b border-gray-700 hover:border-gray-600 transition-colors">{sectionContent.hero.downloadResume}</span>
            </motion.a>
          </motion.div>

          {/* Right - Profile Image with 3D tilt effect - Hidden on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:flex justify-center items-center"
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
