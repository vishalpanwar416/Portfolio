import { Github, Linkedin, Mail, Instagram, Twitter, Download, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import { useMagneticButton } from '../hooks/useMagneticButton'

export default function Hero() {
  const magneticButton1 = useMagneticButton(0.3)
  const magneticButton2 = useMagneticButton(0.3)

  return (
    <section id="hero" className="min-h-screen relative overflow-hidden pt-20 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
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
      
      <div className="relative z-10 container mx-auto px-6 h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
        <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Available for opportunities</span>
              </motion.div>

            {/* Name */}
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-400 text-lg mb-2"
              >
                Hey, I'm
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  letterSpacing: '-0.02em',
                  fontWeight: 700,
                  fontStyle: 'normal'
                }}
              >
                <span className="block">Vishal</span>
                <span className="block mt-2">Panwar</span>
              </motion.h1>
            </div>

            {/* Title */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-400 max-w-xl"
            >
              Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-gray-500 text-lg max-w-xl leading-relaxed"
            >
              Building scalable solutions with MERN, Python, Cloud (AWS/Azure), and modern technologies.
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
                className="group relative px-8 py-4 bg-white text-black rounded-xl font-semibold overflow-hidden transition-all hover:scale-105 active:scale-95 ripple"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">View My Work</span>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>

              <motion.button
                ref={magneticButton2}
                onClick={() => smoothScrollTo('contact')}
                className="group px-8 py-4 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/5 transition-all hover:scale-105 active:scale-95 ripple backdrop-blur-sm glass"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get In Touch
              </motion.button>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-4"
            >
              {[
                { icon: Github, href: "https://github.com/vishalpanwar416" },
                { icon: Linkedin, href: "https://linkedin.com/in/vishalpanwar416" },
                { icon: Mail, href: "mailto:vishalpanwar416@gmail.com" },
                { icon: Instagram, href: "https://instagram.com/vee.pyai" },
                { icon: Twitter, href: "https://twitter.com/vishalpanwar416" },
                { icon: ExternalLink, href: "https://blinq.me/cTA1XtayJD14xDIFFz33" }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:scale-110"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </motion.div>

            {/* Download Resume */}
            <motion.a
              href="/resume/Vishal_Panwar_Resume.pdf"
              download="Vishal_Panwar_Resume.pdf"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <Download className="w-5 h-5" />
              <span className="border-b border-gray-600 group-hover:border-white transition-colors">Download Resume</span>
            </motion.a>
          </motion.div>

          {/* Right - Profile Image with 3D tilt effect */}
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
                className="relative w-[400px] h-[400px] rounded-3xl overflow-hidden border border-gray-700/30 bg-gradient-to-br from-gray-800/20 to-gray-900/40 backdrop-blur-sm shadow-2xl"
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
                className="absolute -top-4 -right-4 w-24 h-24 border-2 border-gray-700/40 rounded-full"
                animate={{ rotate: [0, 360], y: [0, -10, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-32 h-32 border-2 border-gray-800/30 rounded-full"
                animate={{ rotate: [360, 0], y: [0, 10, 0] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute top-1/2 -left-8 w-16 h-16 bg-gray-700/10 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/4 -right-8 w-20 h-20 bg-gray-600/10 rounded-full blur-xl"
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
