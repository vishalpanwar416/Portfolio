import { motion } from 'framer-motion'
import { Award, Trophy, Star, CheckCircle2 } from 'lucide-react'

export default function Certifications() {
  const certifications = [
    {
      title: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      date: "2024",
      icon: Award,
      verified: true
    },
    {
      title: "Microsoft Azure Fundamentals",
      issuer: "Microsoft",
      date: "2024",
      icon: Award,
      verified: true
    },
    {
      title: "React - The Complete Guide",
      issuer: "Udemy",
      date: "2023",
      icon: Award,
      verified: true
    },
    {
      title: "Python for Data Science",
      issuer: "Coursera",
      date: "2023",
      icon: Award,
      verified: true
    }
  ]

  const achievements = [
    {
      title: "500+ LeetCode Problems Solved",
      description: "Consistent problem-solving across Easy, Medium, and Hard",
      icon: Trophy
    },
    {
      title: "Open Source Contributor",
      description: "Active contributor to various open-source projects",
      icon: Star
    },
    {
      title: "Hackathon Winner",
      description: "1st place in College Tech Fest 2023",
      icon: Trophy
    },
    {
      title: "Tech Blogger",
      description: "Sharing knowledge through technical articles",
      icon: Star
    }
  ]

  return (
    <section id="certifications" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/50">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-bl from-gray-800/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-gradient-to-tr from-gray-700/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Certifications & Achievements
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
          <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
            Continuous learning and recognition of expertise
          </p>
        </motion.div>

        {/* Certifications Grid */}
        <div className="mb-16">
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold text-gray-200 mb-8 flex items-center gap-2"
          >
            <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
            Professional Certifications
          </motion.h3>

          <div className="grid md:grid-cols-2 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-gray-800 group-hover:border-gray-700 transition-all">
                    <cert.icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                        {cert.title}
                      </h4>
                      {cert.verified && (
                        <CheckCircle2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{cert.issuer}</p>
                    <p className="text-gray-500 text-xs">{cert.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-semibold text-gray-200 mb-8 flex items-center gap-2"
          >
            <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
            Key Achievements
          </motion.h3>

          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-gray-800 group-hover:border-gray-700 transition-all">
                    <achievement.icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors mb-2">
                      {achievement.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{achievement.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
