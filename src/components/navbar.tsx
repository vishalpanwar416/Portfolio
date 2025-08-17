import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-white font-bold text-xl">VP</Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link to="#about" className="text-white hover:text-gray-300">About</Link>
            <Link to="#skills" className="text-white hover:text-gray-300">Skills</Link>
            <Link to="#portfolio" className="text-white hover:text-gray-300">Portfolio</Link>
            <Link to="#contact" className="border border-white px-4 py-1 hover:bg-white hover:text-black">Contact</Link>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-[#1d1d1d] absolute top-full left-0 w-full">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link to="#about" className="text-white" onClick={() => setIsOpen(false)}>About</Link>
              <Link to="#skills" className="text-white" onClick={() => setIsOpen(false)}>Skills</Link>
              <Link to="#portfolio" className="text-white" onClick={() => setIsOpen(false)}>Portfolio</Link>
              <Link to="#contact" className="text-white" onClick={() => setIsOpen(false)}>Contact</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}