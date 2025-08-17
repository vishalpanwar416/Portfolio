import Navbar from './components/navbar.jsx'
import Hero from './Sections/Hero'
import About from './Sections/About'
import Skills from './Sections/Skills'
import Portfolio from './Sections/Portfolio'
import Contact from './Sections/Contacts'
import Footer from './Sections/Footer'

export default function App() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Portfolio />
      <Contact />
      <Footer />
    </div>
  )
}
