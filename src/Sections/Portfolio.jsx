import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Github } from 'lucide-react'
import tableTapLogo from '../assets/Tabletap.png'
import tarzbygazalaLogo from '../assets/tarzbygazala.png' // Add this import

export default function Portfolio() {
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

  const projects = [
    {
      title: "Table Tap",
      description: "Food ordering platform with contactless QR ordering, AI-assisted restaurant manager, and real-time order tracking.",
      tech: ["React", "MERN", "Firebase", "LLM", "AWS", "Azure"],
      features: ["Contactless QR ordering", "AI restaurant manager", "Real-time tracking", "Multi-cloud deployment"],
      image: tableTapLogo,
      github: "https://github.com/vishalpanwar416",
      live: "https://table-tap-qr.vercel.app"
    },
    {
      title: "Tarzbygazala",
      description: "Modern e-commerce clothing store website with responsive design, product catalog, and seamless shopping experience.",
      tech: ["React", "Next.js", "Tailwind CSS", "Stripe", "MongoDB", "Vercel"],
      features: ["Responsive design", "Product catalog", "Shopping cart", "Secure payments", "Admin dashboard"],
      image: tarzbygazalaLogo, // Use the imported logo
      github: null,
      live: "https://tarzbygazala.com"
    },
    {
      title: "PG Flow",
      description: "Wholesome PG management & growth tool for efficient resident management and operations analytics.",
      tech: ["Flutter", "Dart", "Firebase", "Analytics"],
      features: ["Resident management", "Operations dashboard", "Analytics & insights", "Mobile-first design"],
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
      github: "https://github.com/vishalpanwar416",
      live: "#"
    },
    {
      title: "Smart Parking System",
      description: "YOLOv8-powered parking detection system achieving 90%+ accuracy with scalable video stream processing.",
      tech: ["Python", "YOLOv8", "OpenCV", "ML", "Computer Vision"],
      features: ["90%+ detection accuracy", "100+ concurrent streams", "Real-time processing", "Scalable architecture"],
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
      github: "https://github.com/vishalpanwar416",
      live: "#"
    },
    {
      title: "AI/ML & Cloud Projects",
      description: "Comprehensive AI/ML solutions including predictive analytics, data pipelines, and LLM integrations.",
      tech: ["Python", "scikit-learn", "MLflow", "Apache Airflow", "Azure Data Factory", "ChatGPT API"],
      features: ["Predictive analytics", "Data pipelines", "LLM integrations", "Twilio & Nodemailer"],
      image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg",
      github: "https://github.com/vishalpanwar416",
      live: "#"
    }
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % projects.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + projects.length) % projects.length)
  }

  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const projectVariants = {
    hidden: { y: 100, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

  const imageVariants = {
    hidden: { scale: 1.2, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <section id="portfolio" className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden font-spartan">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-36 h-36 bg-blue-100 rounded-full blur-3xl"
          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-28 h-28 bg-purple-100 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent font-spartan">
            Featured Projects
          </h2>
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mb-4"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <p className="text-xl text-gray-600 mt-4 max-w-3xl mx-auto font-spartan">
            Showcasing innovative solutions across web, mobile, and AI domains
          </p>
        </motion.div>

        {/* Desktop Grid Layout */}
        {!isMobile && (
          <motion.div 
            className="grid md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {projects.map((project, index) => (
              <motion.div 
                key={index} 
                className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100"
                variants={projectVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Project Image */}
                <motion.div 
                  className="relative h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden"
                  variants={imageVariants}
                >
                  {project.image ? (
                    <motion.div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                      <motion.img 
                        src={project.image} 
                        alt={project.title}
                        className="max-w-full max-h-full object-contain p-4"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                    </motion.div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                      <div className="text-center text-white">
                        <div className="w-20 h-20 mx-auto mb-3 bg-white/30 rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            {project.title.includes("Tarzbygazala") && (
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            )}
                            {project.title.includes("PG Flow") && (
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            )}
                            {project.title.includes("Smart Parking") && (
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h8v2H6v-2z"/>
                            )}
                            {project.title.includes("AI/ML") && (
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            )}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Project Content */}
                <div className="p-6">
                  <motion.h3 
                    className="text-2xl font-bold text-gray-800 mb-4 text-center font-spartan"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    {project.title}
                  </motion.h3>
                  
                  <motion.p 
                    className="text-gray-600 mb-4 leading-relaxed font-spartan"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {project.description}
                  </motion.p>
                  
                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Key Features:
                    </h4>
                    <ul className="space-y-1">
                      {project.features.map((feature, featureIndex) => (
                        <motion.li 
                          key={featureIndex} 
                          className="text-sm text-gray-600 flex items-center"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: featureIndex * 0.1 }}
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Tech Stack:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <motion.span 
                          key={techIndex} 
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: techIndex * 0.05 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Project Links */}
                  <div className="flex space-x-4">
                    {project.github && (
                      <motion.a 
                        href={project.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 px-4 rounded-xl text-center font-medium hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Code
                      </motion.a>
                    )}
                    <motion.a 
                      href={project.live} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`text-center font-medium py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                        project.github 
                          ? 'flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                          : 'w-full bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {project.github ? 'Live Demo' : 'Visit Website'}
                    </motion.a>
                  </div>
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
                {projects.map((project, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <motion.div
                      className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-gray-100 touch-manipulation"
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      {/* Project Image - Mobile */}
                      <div className="relative h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {project.image ? (
                          <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                            <img 
                              src={project.image} 
                              alt={project.title}
                              className="max-w-full max-h-full object-contain p-3"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                            <div className="text-center text-white">
                              <div className="w-16 h-16 mx-auto mb-2 bg-white/30 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  {project.title.includes("Tarzbygazala") && (
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  )}
                                  {project.title.includes("PG Flow") && (
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                                  )}
                                  {project.title.includes("Smart Parking") && (
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h8v2H6v-2z"/>
                                  )}
                                  {project.title.includes("AI/ML") && (
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  )}
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Project Content - Mobile */}
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-3 text-center font-spartan">
                          {project.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-3 leading-relaxed text-sm font-spartan">{project.description}</p>
                        
                        {/* Features */}
                        <div className="mb-3">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                            Key Features:
                          </h4>
                          <ul className="space-y-1">
                            {project.features.slice(0, 2).map((feature, featureIndex) => (
                              <li key={featureIndex} className="text-xs text-gray-600 flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tech Stack */}
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-gray-800 mb-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-1.5"></span>
                            Tech Stack:
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {project.tech.slice(0, 3).map((tech, techIndex) => (
                              <span 
                                key={techIndex} 
                                className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-xs font-medium border border-blue-200"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {/* Project Links - Mobile */}
                        <div className="flex space-x-2">
                          {project.github && (
                            <a
                              href={project.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2 px-3 rounded-lg font-medium hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl text-center text-sm"
                            >
                              <Github className="w-3 h-3 inline mr-1" />
                              Code
                            </a>
                          )}
                          <a
                            href={project.live}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-white py-2 px-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl text-center text-sm ${
                              project.github 
                                ? 'flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                                : 'w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                            }`}
                          >
                            <ExternalLink className="w-3 h-3 inline mr-1" />
                            {project.github ? 'Demo' : 'Website'}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Touch-Friendly Navigation */}
            <div className="flex justify-center items-center mt-6 space-x-4">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 touch-manipulation active:scale-95"
                aria-label="Previous project"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              
              <div className="flex space-x-3">
                {projects.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-4 h-4 rounded-full transition-all duration-200 touch-manipulation active:scale-110 ${
                      index === currentSlide ? 'bg-blue-600 scale-110' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to project ${index + 1}`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 touch-manipulation active:scale-95"
                aria-label="Next project"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Touch Instructions */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                💡 Swipe left/right or use arrows to browse projects
              </p>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-lg text-gray-600 mb-6 font-spartan">Want to see more of my work?</p>
          <motion.a 
            href="https://github.com/vishalpanwar416" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-3 rounded-xl font-semibold hover:from-gray-800 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>View All Projects</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}