import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { smoothScrollTo } from '../lib/utils.js'
import { navItems, sectionContent, personalInfo } from '../data'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const navigate = (id) => {
    smoothScrollTo(id)
    setIsOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-canvas/90 backdrop-blur-xl border-b border-white/[0.06] shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 md:h-[4.5rem]">
          <button
            type="button"
            onClick={() => navigate('hero')}
            className="font-display font-bold text-lg text-white hover:text-accent transition-colors"
          >
            {personalInfo.name.first}
            <span className="text-accent">.</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => navigate(item.href.slice(1))}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {item.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate('contact')}
              className="ml-2 btn-primary text-sm py-2.5 px-5"
            >
              {sectionContent.navigation.contact}
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="md:hidden relative z-50 border-t border-white/[0.06] bg-canvas/95 backdrop-blur-xl"
            >
              <div className="container mx-auto px-6 py-4 space-y-1">
                {[...navItems, { name: sectionContent.navigation.contact, href: '#contact' }].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => navigate(item.href.slice(1))}
                    className="block w-full text-left px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.04]"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
