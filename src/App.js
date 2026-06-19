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
import BackToTop from './components/BackToTop'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1600)
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
          <div key="content" className="min-h-screen bg-canvas text-slate-200">
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
