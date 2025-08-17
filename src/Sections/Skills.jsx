import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Skills() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const carouselRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Touch gesture handlers
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  const skillCategories = [
    {
      title: "Programming Languages",
      skills: [
        { name: "Python", icon: "🐍", color: "bg-blue-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
        { name: "Java", icon: "☕", color: "bg-orange-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" },
        { name: "JavaScript", icon: "⚡", color: "bg-yellow-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
        { name: "TypeScript", icon: "🔷", color: "bg-blue-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" },
        { name: "Dart", icon: "🎯", color: "bg-blue-400", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg" }
      ]
    },
    {
      title: "Frontend Development",
      skills: [
        { name: "React", icon: "⚛️", color: "bg-cyan-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
        { name: "Next.js", icon: "⚡", color: "bg-black", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" },
        { name: "Flutter", icon: "📱", color: "bg-blue-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg" },
        { name: "Tailwind CSS", icon: "🎨", color: "bg-cyan-400", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" }
      ]
    },
    {
      title: "Backend Development",
      skills: [
        { name: "Node.js", icon: "🟢", color: "bg-green-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
        { name: "Express", icon: "🚂", color: "bg-gray-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" },
        { name: "Django", icon: "🐍", color: "bg-green-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" }
      ]
    },
    {
      title: "Databases",
      skills: [
        { name: "MySQL", icon: "🐬", color: "bg-blue-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" },
        { name: "PostgreSQL", icon: "🐘", color: "bg-blue-700", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
        { name: "MongoDB", icon: "🐳", color: "bg-green-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg" },
        { name: "Redis", icon: "🔴", color: "bg-red-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" },
        { name: "Firebase", icon: "🔥", color: "bg-orange-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" }
      ]
    },
    {
      title: "Cloud & DevOps",
      skills: [
        { name: "AWS", icon: "☁️", color: "bg-orange-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" },
        { name: "Azure", icon: "🔵", color: "bg-blue-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" },
        { name: "Docker", icon: "🐳", color: "bg-blue-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" },
        { name: "Kubernetes", icon: "⚓", color: "bg-blue-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" },
        { name: "Terraform", icon: "🏗️", color: "bg-purple-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg" }
      ]
    },
    {
      title: "Tools & Others",
      skills: [
        { name: "Git", icon: "📚", color: "bg-orange-600", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
        { name: "Linux", icon: "🐧", color: "bg-yellow-500", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg" }
      ]
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % skillCategories.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + skillCategories.length) % skillCategories.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const skillVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "backOut"
      }
    }
  }

  return (
    <section id="skills" className="py-16 bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-3 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            Skills & Technologies
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 mx-auto rounded-full"></div>
          <p className="text-xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed">
            A comprehensive toolkit of technologies and frameworks I've mastered through hands-on experience and continuous learning.
          </p>
        </motion.div>

        {/* Desktop Grid Layout */}
        {!isMobile && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {skillCategories.map((category, index) => (
              <motion.div
                key={index}
                className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                variants={cardVariants}
              >
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">{category.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {category.skills.map((skill, skillIndex) => (
                    <motion.div
                      key={skillIndex}
                      className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                      variants={skillVariants}
                    >
                      <div className="w-12 h-12 rounded-xl bg-white shadow-md flex items-center justify-center mb-2 p-2">
                        <img 
                          src={skill.logo} 
                          alt={skill.name}
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            // Fallback to emoji if logo fails to load
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'block'
                          }}
                        />
                        <span className="text-2xl hidden">{skill.icon}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 text-center">{skill.name}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Mobile Carousel Layout - Touch Friendly */}
        {isMobile && (
          <div className="relative">
            <motion.div 
              className="overflow-hidden touch-pan-y"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              ref={carouselRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <motion.div
                className="flex transition-transform duration-300 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {skillCategories.map((category, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <motion.div
                      className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 touch-manipulation"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">{category.title}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {category.skills.map((skill, skillIndex) => (
                          <motion.div
                            key={skillIndex}
                            className="flex flex-col items-center p-3 bg-gray-50 rounded-lg touch-manipulation"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: skillIndex * 0.1 }}
                            viewport={{ once: true }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center mb-2 p-1.5">
                              <img 
                                src={skill.logo} 
                                alt={skill.name}
                                className="w-7 h-7 object-contain"
                                onError={(e) => {
                                  // Fallback to emoji if logo fails to load
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'block'
                                }}
                              />
                              <span className="text-xl hidden">{skill.icon}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-700 text-center">{skill.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Touch-Friendly Navigation */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 touch-manipulation active:scale-95"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              
              <div className="flex space-x-3">
                {skillCategories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-200 touch-manipulation active:scale-110 ${
                      index === currentSlide ? 'bg-blue-600 scale-110' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 touch-manipulation active:scale-95"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Touch Instructions */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                💡 Swipe left/right or use arrows to navigate
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}