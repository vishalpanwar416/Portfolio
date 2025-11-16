import { motion } from 'framer-motion'
import { detailedCertifications } from '../data/certifications'
import { workExperience, education } from '../data/experience'

export default function About() {
  return (
    <section id="about" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/20">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-800/10 to-gray-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-gray-700/10 to-gray-800/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            About Me
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-200">
              Full-Stack & Cloud Engineer passionate about AI, Data Science, and scalable systems.
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Experienced across MERN, Python, and Cloud (AWS/Azure), with DevOps and Flutter. B.Tech CSE (KIET, 2024).
              Certifications: AWS Academy Cloud Foundations, IBM AI & ML, Microsoft Azure Data Scientist Associate.
            </p>

            {/* Experience */}
            <div className="space-y-4 pt-6">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                Experience
              </h4>

              <div className="space-y-3">
                {workExperience.map((experience, index) => (
                  <motion.div
                    key={index}
                    className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <h5 className="font-semibold text-gray-200">{experience.position}</h5>
                    <p className="text-gray-400">{experience.company}</p>
                    <p className="text-sm text-gray-500">{experience.duration}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4 pt-6">
              <h4 className="text-lg sm:text-xl font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                Education
              </h4>

              <div className="space-y-3">
                {education.map((edu, index) => (
                  <motion.div
                    key={index}
                    className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <h5 className="font-semibold text-gray-200">{edu.degree}</h5>
                    <p className="text-gray-400">{edu.institution}</p>
                    <p className="text-sm text-gray-500">{edu.year}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h4 className="text-xl sm:text-2xl font-semibold text-gray-300 flex items-center gap-2">
              <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
              Certifications
            </h4>

            <div className="space-y-4">
              {detailedCertifications.map((cert, index) => (
                <motion.a
                  key={index}
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="block p-5 rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group"
                >
                  <h5 className="font-semibold text-gray-200 mb-2 group-hover:text-white transition-colors">{cert.title}</h5>
                  <p className="text-sm text-gray-400 mb-2">{cert.date}</p>
                  <p className="text-xs text-gray-500 font-mono">ID: {cert.id}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
