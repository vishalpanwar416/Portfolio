import { motion } from 'framer-motion'

export default function About() {
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

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  }

    return (
    <section id="about" className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 left-10 w-24 h-24 bg-purple-100 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-3 md:px-6 relative z-10">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-800 to-blue-600 bg-clip-text text-transparent">
            About Me
          </h2>
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: 96 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-8 items-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {/* Left side - Intro text */}
          <motion.div className="space-y-4" variants={itemVariants}>
            <motion.h3 
              className="text-2xl font-semibold text-gray-800 mb-3 leading-relaxed"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              Full-Stack & Cloud Engineer passionate about AI, Data Science, and scalable systems.
            </motion.h3>
            <motion.p 
              className="text-gray-600 leading-relaxed text-lg"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              Experienced in MERN, Python, Cloud (AWS/Azure), DevOps, and Flutter. 
              Graduated with B.Tech in CSE (2024) from KIET Group of Institutions. 
              Certified Azure Data Scientist Associate.
            </motion.p>
            
            {/* Experience */}
            <motion.div className="space-y-4" variants={itemVariants}>
              <h4 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Experience
              </h4>
              <div className="space-y-3">
                <motion.div 
                  className="border-l-4 border-blue-600 pl-4 py-2 hover:bg-blue-50 rounded-r-lg transition-colors duration-300"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h5 className="font-semibold text-gray-800">Programmer Analyst Trainee – FTE</h5>
                  <p className="text-gray-600">Cognizant Technology Solutions</p>
                  <p className="text-sm text-gray-500">Dec 2024 – Present</p>
                </motion.div>
                <motion.div 
                  className="border-l-4 border-blue-600 pl-4 py-2 hover:bg-blue-50 rounded-r-lg transition-colors duration-300"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h5 className="font-semibold text-gray-800">Programmer Analyst Intern</h5>
                  <p className="text-gray-600">Cognizant</p>
                  <p className="text-sm text-gray-500">Jul 2024 – Nov 2024</p>
                </motion.div>
              </div>
            </motion.div>

            {/* Education */}
            <motion.div className="space-y-4" variants={itemVariants}>
              <h4 className="text-xl font-semibold text-gray-800 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3"></span>
                Education
              </h4>
              <div className="space-y-3">
                <motion.div 
                  className="border-l-4 border-green-600 pl-4 py-2 hover:bg-green-50 rounded-r-lg transition-colors duration-300"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h5 className="font-semibold text-gray-800">B.Tech – Computer Science & Engineering</h5>
                  <p className="text-gray-600">KIET Group of Institutions</p>
                  <p className="text-sm text-gray-500">2020–2024</p>
                </motion.div>
                <motion.div 
                  className="border-l-4 border-green-600 pl-4 py-2 hover:bg-green-50 rounded-r-lg transition-colors duration-300"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <h5 className="font-semibold text-gray-800">Class XII (PCM)</h5>
                  <p className="text-gray-600">Saraswati Vihar Sr. Sec. School</p>
                  <p className="text-sm text-gray-500">2019</p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right side - Certifications */}
          <motion.div 
            className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100"
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-2xl font-semibold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Certifications
            </h4>
            <div className="space-y-4">
              <motion.div 
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">Microsoft Certified: Azure Data Scientist Associate</h5>
                  <p className="text-sm text-gray-600">March 2025 - March 2026</p>
                  <p className="text-xs text-blue-600 hover:underline">
                    <a href="https://learn.microsoft.com/api/credentials/share/en-in/vishalpanwar/42DF39354B276076?sharingId" target="_blank" rel="noopener noreferrer">
                      Credential ID: 42DF39354B276076
                    </a>
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">HackMol 4.0</h5>
                  <p className="text-sm text-gray-600">Developer Student Club - NIT J, January 2023</p>
                  <p className="text-xs text-green-600 hover:underline">
                    <a href="https://certificate.givemycertificate.com/c/f284425a-c375-4439-88db-c26f9a92c0fe" target="_blank" rel="noopener noreferrer">
                      Credential ID: f284425a-c375-4439-88db-c26f9a92c0fe
                    </a>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
      </section>
  )
  }