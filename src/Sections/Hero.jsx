import { Github, Linkedin, Mail, Instagram, Twitter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import profilePhoto from '../assets/E64C5D71-DC73-4B13-8BF0-F748E6BB9EC3_1_105_c.jpeg'

export default function Hero() {
  const [currentText, setCurrentText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const fullText = "Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast"
  
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const photoVariants = {
    hidden: { scale: 0.8, rotate: -5, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 3,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  }

  const floatingAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  return (
    <section id="hero" className="min-h-screen relative overflow-hidden pt-20">
      {/* Enhanced diagonal split background with gradients */}
      <div className="absolute inset-0 bg-gray-100"></div>
      <div className="absolute inset-0 bg-black transform rotate-12 origin-top-left scale-150"></div>
      
      {/* Floating geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-16 h-16 bg-green-500/10 rounded-full blur-xl"
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      <div className="relative z-10 container mx-auto px-3 md:px-6 pt-12 md:pt-16">
        <motion.div 
          className="flex flex-col md:flex-row items-center min-h-0 md:min-h-[calc(100vh-5rem)]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left side - Text content */}
          <motion.div className="md:w-1/2 mb-6 md:mb-0 text-left" variants={itemVariants}>
            {/* Name and Image Container - Mobile Layout */}
            <div className="flex items-center gap-3 mb-3 lg:hidden">
              <div className="flex-1">
                {/* Hey, I am - Mobile Layout */}
                <motion.p 
                  className="text-lg mb-2 text-gray-600 font-light"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                >
                  Hey, I am
                </motion.p>

                <motion.h1 
                  className="text-3xl md:text-7xl font-bold text-black leading-tight"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.7 }}
                >
                  <motion.span 
                    className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-2 relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    Vishal
                  </motion.span>
                  <motion.span 
                    className="block bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    Panwar
                  </motion.span>
                </motion.h1>
              </div>

              {/* Mobile Profile Image - Positioned to the right */}
              <motion.div 
                className="lg:hidden relative ml-auto mb-3 mr-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.0 }}
              >
                {/* Enhanced background frame for mobile */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-xl transform rotate-3 shadow-lg scale-110"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-xl transform -rotate-2 shadow-md scale-105"></div>
                
                {/* Main photo */}
                <img 
                  src={profilePhoto} 
                  alt="Vishal Panwar" 
                  className="relative z-10 w-32 h-40 md:w-32 md:h-40 rounded-xl object-cover border-4 border-white shadow-lg"
                />
                
                {/* Decorative elements for mobile */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-purple-500 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                />
              </motion.div>
            </div>

            {/* Desktop Name Only */}
            <motion.div className="hidden lg:block">
              <motion.p 
                className="text-lg mb-2 text-gray-600 font-light"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                Hey, I am
              </motion.p>
              
              <motion.h1 
                className="text-3xl md:text-7xl font-bold mb-3 text-black leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.7 }}
              >
                <motion.span 
                  className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-1 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  Vishal
                </motion.span>
                <motion.span 
                  className="block bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  Panwar
                </motion.span>
              </motion.h1>
            </motion.div>

            <motion.p 
              className="text-xs md:text-lg mb-6 mt-4 text-gray-600 font-medium min-h-[2rem]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <span className="hidden md:inline">Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast</span>
              <span className="md:hidden text-xs">Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast</span>
            </motion.p>

            {/* Freelance Services Section */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.8 }}
            >
              <motion.p className="text-base text-gray-500 mb-2 font-light">
                🚀 Available for freelance projects
              </motion.p>
              <div className="flex flex-wrap gap-1 md:gap-2">
                {[
                  { text: "Web Dev", color: "bg-blue-100 text-blue-800 border-blue-200" },
                  { text: "Flutter", color: "bg-green-100 text-green-800 border-green-200" },
                  { text: "AI Solutions", color: "bg-purple-100 text-purple-800 border-purple-200" },
                  { text: "Cloud", color: "bg-orange-100 text-orange-800 border-orange-200" }
                ].map((service, index) => (
                  <motion.span
                    key={index}
                    className={`px-2 py-1 md:px-2.5 md:py-1 rounded-full text-xs md:text-sm font-medium border ${service.color}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 2 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {service.text}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* Call to Action Buttons */}
            <motion.div 
              className="flex flex-row gap-2 md:gap-3"
              variants={itemVariants}
            >
              <motion.button 
                onClick={() => smoothScrollTo('contact')}
                className="bg-blue-600 text-white px-4 md:px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 text-center text-sm md:text-base flex-1"
              >
                Get In Touch
              </motion.button>
              <motion.button 
                onClick={() => smoothScrollTo('portfolio')}
                className="relative px-4 md:px-6 py-2.5 rounded-lg font-semibold overflow-hidden group transition-all duration-300 transform hover:scale-105 text-center text-sm md:text-base flex-1"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Button background with gradient border */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 p-[2px]">
                  <div className="h-full w-full rounded-lg bg-white"></div>
                </div>

                {/* Text with gradient on hover */}
                <span className="relative z-10 text-gray-800 group-hover:text-white transition-colors duration-300 font-semibold">
                  View My Work
                </span>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                
                {/* Hover background fill */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </motion.button>
            </motion.div>

            {/* Social Links */}
            <motion.div 
              className="flex items-center space-x-3 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
            >
              {[
                { icon: Github, href: "https://github.com/vishalpanwar416", color: "hover:text-gray-800" },
                { icon: Linkedin, href: "https://linkedin.com/in/vishalpanwar416", color: "hover:text-blue-600" },
                { icon: Mail, href: "mailto:vishalpanwar416@gmail.com", color: "hover:text-red-600" },
                { icon: Instagram, href: "https://instagram.com/vee.pyai", color: "hover:text-pink-600" },
                { icon: Twitter, href: "https://twitter.com/vishalpanwar416", color: "hover:text-blue-400" }
              ].map((social, index) => (
                <motion.a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-600 ${social.color} transition-colors duration-300 p-2 rounded-full hover:bg-gray-100`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 2.4 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Right side - Professional photo - Hidden on mobile */}
          <motion.div 
            className="hidden lg:block lg:w-1/2 mt-0 lg:ml-[190px] flex justify-center lg:justify-end lg:pr-0"
            variants={photoVariants}
          >
            <motion.div 
              className="relative w-80 h-96 lg:w-96 lg:h-[500px] lg:mr-0"
              animate={floatingAnimation}
            >
              {/* Enhanced background frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-2xl transform rotate-3 shadow-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-2xl transform -rotate-2 shadow-xl"></div>
              
              {/* Main photo */}
              <motion.img 
                src={profilePhoto} 
                alt="Vishal Panwar"
                className="relative z-10 object-cover w-full h-full rounded-2xl shadow-2xl"
                whileHover={{ scale: 1.02, rotate: 0 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Decorative elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-purple-500 rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}