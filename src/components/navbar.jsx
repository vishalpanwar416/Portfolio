import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import logo from '../assets/logo.png'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Check if scrolled for background effect
      setScrolled(currentScrollY > 50)

      // Hide/show navbar on mobile based on scroll direction
      if (window.innerWidth <= 768) { // Mobile only
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          // Scrolling down - hide navbar
          setIsVisible(false)
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show navbar
          setIsVisible(true)
        }
      } else {
        // Desktop - always show navbar
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleNavClick = (sectionId) => {
    smoothScrollTo(sectionId)
    setIsOpen(false)
  }

  const navItems = [
    { name: "About", href: "#about" },
    { name: "Skills", href: "#skills" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Contact", href: "#contact" }
  ]

  return (
    <motion.nav 
      className={`fixed w-full z-50 transition-all duration-700 ${scrolled ? 'bg-white/10 backdrop-blur-xl py-0 shadow-2xl border-b border-white/20' : 'bg-transparent py-0'}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isVisible ? 0 : -100, 
        opacity: isVisible ? 1 : 0 
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
      
      <div className="container mx-auto relative">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <img 
              src={logo} 
              alt="Vishal Panwar Logo" 
              className="h-20 w-auto mix-blend-multiply filter drop-shadow-lg"
            />
          </motion.div>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item, index) => (
              <motion.a 
                key={item.name}
                href={item.href} 
                onClick={() => handleNavClick(item.href.slice(1))}
                className={`relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 group overflow-hidden ${
                  scrolled 
                    ? 'text-gray-800 hover:text-blue-600' 
                    : 'text-gray-800 hover:text-blue-600'
                }`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -2 }}
              >
                {/* Background hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                
                {/* Text */}
                <span className="relative z-10">{item.name}</span>
                
                {/* Underline animation */}
                <motion.div
                  className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0, x: "-50%" }}
                  whileHover={{ width: "80%", x: "-50%" }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
            
            {/* Enhanced Contact Button */}
            <motion.a 
              href="#contact" 
              onClick={() => handleNavClick('contact')}
              className="relative px-8 py-3 rounded-2xl font-medium overflow-hidden group ml-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Button background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
               
              {/* Animated border */}
              <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
                <div className="h-full w-full rounded-2xl bg-white"></div>
              </div>
               
              {/* Text */}
              <span className="relative z-10 text-gray-800 group-hover:text-white transition-colors duration-300 font-semibold">
                Contact
              </span>
               
              {/* Shine effect */}
              <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </motion.a>
          </div>

          {/* Enhanced Mobile Toggle */}
          <motion.button 
            className={`md:hidden p-3 rounded-2xl transition-all duration-300 relative overflow-hidden ${
              scrolled 
                ? 'text-gray-800 hover:bg-gray-100/50' 
                : 'text-gray-800 hover:bg-gray-100/50'
            }`}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle mobile menu"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-all duration-300"></div>
            
            {/* Icon */}
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Enhanced Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden absolute top-full left-0 w-full backdrop-blur-xl border-t border-white/20 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.div 
                className="container mx-auto px-4 py-6 space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.name}
                    href={item.href}
                    onClick={() => handleNavClick(item.href.slice(1))}
                    className="block p-4 rounded-2xl text-gray-800 hover:text-blue-600 font-medium transition-all duration-300 relative overflow-hidden group"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                  >
                    {/* Background hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                    
                    {/* Text */}
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Left border indicator */}
                    <motion.div
                      className="absolute left-0 top-1/2 w-1 h-0 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"
                      initial={{ height: 0, y: "-50%" }}
                      whileHover={{ height: "80%", y: "-50%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                ))}
                
                {/* Mobile Contact Button */}
                <motion.div
                  className="pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <motion.a
                    href="#contact"
                    onClick={() => handleNavClick('contact')}
                    className="block w-full p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-2xl font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Get In Touch
                  </motion.a>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
