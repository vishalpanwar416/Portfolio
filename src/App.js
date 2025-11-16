import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/navbar.jsx'
import Hero from './Sections/Hero'
import About from './Sections/About'
import Skills from './Sections/Skills'
import Certifications from './Sections/Certifications'
import Portfolio from './Sections/Portfolio'
import Contact from './Sections/Contacts'
import Footer from './Sections/Footer'
import LoadingScreen from './components/LoadingScreen'
import ScrollProgress from './components/ScrollProgress'
import ParticleBackground from './components/ParticleBackground'
import BackToTop from './components/BackToTop'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <ScrollProgress />
      <BackToTop />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
        ) : (
          <div
            key="content"
            className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] relative"
          >
            {/* Global noise texture overlay */}
            <div className="fixed inset-0 opacity-[0.02] noise-texture pointer-events-none z-0"></div>

            {/* Particle Background */}
            <ParticleBackground />

            <Navbar />
            <Hero />
            <About />
            <Skills />
            <Certifications />
            <Portfolio />
            <Contact />
            <Footer />
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
