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
              className="text-2xl font-semibold text-gray-800 mb-3 leading-relaxed break-words"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              Full-Stack & Cloud Engineer passionate about AI, Data Science, and scalable systems.
            </motion.h3>
            <motion.p 
              className="text-gray-600 leading-relaxed text-lg max-w-full break-words"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              Experienced in MERN, Python, Cloud (AWS/Azure), DevOps, and Flutter. 
              Graduated with B.Tech in CSE (2024) from KIET Group of Institutions. 
              Certified in AWS Academy Cloud Foundations, IBM AI, Machine Learning, and Azure Data Scientist Associate.
            </motion.p>
            
            {/* Experience */}
            <motion.div className="space-y-4" variants={itemVariants}>
              <h4 className="text-xl font-semibold text-gray-800 flex items-center break-words">
                <span className="w-2 h-2 bg-blue-600 rounded-full mr-3 flex-shrink-0"></span>
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
              <h4 className="text-xl font-semibold text-gray-800 flex items-center break-words">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-3 flex-shrink-0"></span>
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
            <h4 className="text-2xl font-semibold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">
              Certifications
            </h4>
            <div className="space-y-4">
              <motion.div 
                className="flex flex-col p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full overflow-hidden">
                  <h5 className="font-semibold text-gray-800 break-words">Microsoft Certified: Azure Data Scientist Associate</h5>
                  <p className="text-sm text-gray-600">March 2025 - March 2026</p>
                  <p className="text-xs text-blue-600 hover:underline overflow-hidden text-ellipsis">
                    <a href="https://learn.microsoft.com/api/credentials/share/en-in/vishalpanwar/42DF39354B276076?sharingId" target="_blank" rel="noopener noreferrer" className="break-words">
                      Credential ID: 42DF39354B276076
                    </a>
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex flex-col p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full overflow-hidden">
                  <h5 className="font-semibold text-gray-800 break-words">AWS Academy Graduate - AWS Academy Cloud Foundations</h5>
                  <p className="text-sm text-gray-600">March 2024 - No Expiration</p>
                  <p className="text-xs text-orange-600 hover:underline overflow-hidden text-ellipsis">
                    <a href="https://www.credly.com/badges/de038709-d600-4cb2-91ff-0162c9f98b68/linked_in_profile" target="_blank" rel="noopener noreferrer" className="break-words">
                      Credential ID: de038709-d600-4cb2-91ff-0162c9f98b68
                    </a>
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex flex-col p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full overflow-hidden">
                  <h5 className="font-semibold text-gray-800 break-words">HackMol 4.0</h5>
                  <p className="text-sm text-gray-600">Developer Student Club - NIT J, January 2023</p>
                  <p className="text-xs text-green-600 hover:underline overflow-hidden text-ellipsis">
                    <a href="https://certificate.givemycertificate.com/c/f284425a-c375-4439-88db-c26f9a92c0fe" target="_blank" rel="noopener noreferrer" className="break-words">
                      Credential ID: f284425a-c375-4439-88db-c26f9a92c0fe
                    </a>
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex flex-col p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full overflow-hidden">
                  <h5 className="font-semibold text-gray-800 break-words">Machine Learning A-Z™: Hands-On Python & R In Data Science</h5>
                  <p className="text-sm text-gray-600">September 2022 - September 2034</p>
                  <p className="text-xs text-indigo-600 hover:underline overflow-hidden text-ellipsis">
                    <a href="https://ude.my/UC-df034de3-8ed8-456b-b0d7-8a56dabfb39b" target="_blank" rel="noopener noreferrer" className="break-words">
                      Credential ID: UC-df034de3-8ed8-456b-b0d7-8a56dabfb39b
                    </a>
                  </p>
                </div>
              </motion.div>
              <motion.div 
                className="flex flex-col p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full overflow-hidden">
                  <h5 className="font-semibold text-gray-800 break-words">Introduction to Artificial Intelligence (AI)</h5>
                  <p className="text-sm text-gray-600">August 2021 - August 2034</p>
                  <p className="text-xs text-purple-600 hover:underline overflow-hidden text-ellipsis">
                    <a href="https://coursera.org/share/6f74bd9186caf8cb74b613a866366e20" target="_blank" rel="noopener noreferrer" className="break-words">
                      Credential ID: 6f74bd9186caf8cb74b613a866366e20
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