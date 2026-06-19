import { useState } from 'react'
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

const LOADER_KEY = 'portfolio_loader_seen'

export default function App() {
  const [isLoading, setIsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem(LOADER_KEY)
    } catch {
      return true
    }
  })

  const handleLoadComplete = () => {
    try {
      sessionStorage.setItem(LOADER_KEY, '1')
    } catch {
      /* ignore */
    }
    setIsLoading(false)
  }

  return (
    <>
      <ScrollProgress />
      <BackToTop />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={handleLoadComplete} />
        ) : (
          <div key="content" className="min-h-screen bg-black relative">
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
