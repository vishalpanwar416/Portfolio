import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Github } from 'lucide-react'
import tableTapLogo from '../assets/Tabletap.png'
import tarzbygazalaLogo from '../assets/tarzbygazala.png'

export default function Portfolio() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const carouselRef = useRef(null)
  const [expanded, setExpanded] = useState(false)

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
      image: tarzbygazalaLogo,
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

  return (
    <section id="portfolio" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/50">
      {/* Static background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-bl from-gray-800/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-gradient-to-tr from-gray-700/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Featured Projects
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
          <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
            Showcasing innovative solutions across web, mobile, and AI domains
          </p>
        </motion.div>

        {/* Desktop Grid Layout with Show More */}
        {!isMobile && (
          <>
          {expanded ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group backdrop-blur-sm glass"
                  whileHover={{ scale: 1.02, y: -5 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Project Image */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-900/80 to-black/60 rounded-xl flex items-center justify-center overflow-hidden mb-6">
                    {project.image && (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <motion.img
                          src={project.image}
                          alt={project.title}
                          className="max-w-full max-h-full object-contain transition-all duration-500"
                          whileHover={{ scale: 1.1 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Project Content */}
                  <h3 className="text-2xl font-semibold text-gray-200 mb-3">
                    {project.title}
                  </h3>

                  <p className="text-gray-400 mb-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                      Key Features
                    </h4>
                    <ul className="space-y-1">
                      {project.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="text-sm text-gray-500 flex items-center gap-2"
                        >
                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                      <div className="w-1 h-4 bg-gray-500 rounded-full"></div>
                      Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 text-xs rounded-lg bg-white/5 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-all"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Project Links */}
                  <div className="flex gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-300 border border-gray-800 hover:border-gray-600 hover:bg-white/10 transition-all text-center text-sm font-medium"
                      >
                        <Github className="w-4 h-4 inline mr-1.5" />
                        Code
                      </a>
                    )}
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-2.5 rounded-lg text-center text-sm font-medium transition-all ${
                        project.github
                          ? 'flex-1 bg-white text-black hover:bg-gray-200'
                          : 'w-full bg-white text-black hover:bg-gray-200'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4 inline mr-1.5" />
                      {project.github ? 'Demo' : 'Visit'}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="-mx-2">
              <div className="overflow-x-auto overflow-y-hidden no-scrollbar px-2">
                <div className="flex gap-6 snap-x snap-mandatory pb-4">
                  {projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="min-w-[340px] lg:min-w-[380px] xl:min-w-[420px] snap-start p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
                    >
                      {/* Project Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-900/80 to-black/60 rounded-xl flex items-center justify-center overflow-hidden mb-6">
                        {project.image && (
                          <div className="w-full h-full flex items-center justify-center p-4">
                            <img
                              src={project.image}
                              alt={project.title}
                              className="max-w-full max-h-full object-contain transition-all duration-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <h3 className="text-2xl font-semibold text-gray-200 mb-3">{project.title}</h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">{project.description}</p>

                      {/* Project Links */}
                      <div className="flex gap-3">
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 text-gray-300 border border-gray-800 hover:border-gray-600 hover:bg-white/10 transition-all text-center text-sm font-medium"
                          >
                            <Github className="w-4 h-4 inline mr-1.5" />
                            Code
                          </a>
                        )}
                        <a
                          href={project.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2.5 rounded-lg text-center text-sm font-medium transition-all ${
                            project.github
                              ? 'flex-1 bg-white text-black hover:bg-gray-200'
                              : 'w-full bg-white text-black hover:bg-gray-200'
                          }`}
                        >
                          <ExternalLink className="w-4 h-4 inline mr-1.5" />
                          {project.github ? 'Demo' : 'Visit'}
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </>
        )}

        {/* Mobile: when expanded, show stacked grid of all projects */}
        {isMobile && expanded && (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800"
              >
                {/* Project Image - Mobile grid */}
                <div className="relative h-40 bg-gradient-to-br from-gray-900/80 to-black/60 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                  {project.image && (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-200 mb-2">{project.title}</h3>
                <p className="text-gray-400 mb-3 text-sm leading-relaxed">{project.description}</p>

                {/* Project Links */}
                <div className="flex gap-2">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-gray-300 border border-gray-800 hover:border-gray-600 transition-all text-center text-sm"
                    >
                      <Github className="w-3 h-3 inline mr-1" />
                      Code
                    </a>
                  )}
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-2 rounded-lg text-center text-sm transition-all ${
                      project.github
                        ? 'flex-1 bg-white text-black'
                        : 'w-full bg-white text-black'
                    }`}
                  >
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    {project.github ? 'Demo' : 'Visit'}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Mobile Carousel Layout - Touch Friendly */}
        {isMobile && !expanded && (
          <div className="relative">
            <div
              className="overflow-hidden touch-pan-y"
              ref={carouselRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-300 ease-in-out will-change-transform"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {projects.map((project, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-2">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 touch-manipulation">
                      {/* Project Image - Mobile */}
                      <div className="relative h-40 bg-gradient-to-br from-gray-900/80 to-black/60 rounded-xl flex items-center justify-center overflow-hidden mb-4">
                        {project.image && (
                          <div className="w-full h-full flex items-center justify-center p-3">
                            <img
                              src={project.image}
                              alt={project.title}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* Project Content - Mobile */}
                      <h3 className="text-xl font-semibold text-gray-200 mb-2">
                        {project.title}
                      </h3>

                      <p className="text-gray-400 mb-3 text-sm leading-relaxed">{project.description}</p>

                      {/* Features */}
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                          <div className="w-1 h-3 bg-gray-500 rounded-full"></div>
                          Key Features
                        </h4>
                        <ul className="space-y-1">
                          {project.features.slice(0, 2).map((feature, featureIndex) => (
                            <li key={featureIndex} className="text-xs text-gray-500 flex items-center gap-1">
                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tech Stack */}
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1">
                          <div className="w-1 h-3 bg-gray-500 rounded-full"></div>
                          Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {project.tech.slice(0, 3).map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className="px-2 py-0.5 text-xs rounded bg-white/5 text-gray-400 border border-gray-800"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Project Links - Mobile */}
                      <div className="flex gap-2">
                        {project.github && (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-gray-300 border border-gray-800 transition-all text-center text-sm"
                          >
                            <Github className="w-3 h-3 inline mr-1" />
                            Code
                          </a>
                        )}
                        <a
                          href={project.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-2 rounded-lg text-center text-sm transition-all ${
                            project.github
                              ? 'flex-1 bg-white text-black'
                              : 'w-full bg-white text-black'
                          }`}
                        >
                          <ExternalLink className="w-3 h-3 inline mr-1" />
                          {project.github ? 'Demo' : 'Visit'}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Touch-Friendly Navigation */}
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white/5 border border-gray-800 hover:bg-white/10 transition-all touch-manipulation active:scale-95"
                aria-label="Previous project"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>

              <div className="flex gap-2">
                {projects.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 touch-manipulation ${
                      index === currentSlide ? 'bg-white w-6' : 'bg-gray-600'
                    }`}
                    aria-label={`Go to project ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white/5 border border-gray-800 hover:bg-white/10 transition-all touch-manipulation active:scale-95"
                aria-label="Next project"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Touch Instructions */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Swipe left/right or use arrows to browse projects
              </p>
            </div>
          </div>
        )}

        {/* Show More / Show Less Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-8 py-3 rounded-xl font-semibold bg-white text-black hover:bg-gray-200 transition-all"
            aria-expanded={expanded}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
        </div>
      </div>
    </section>
  )
}
