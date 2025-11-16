import { motion } from 'framer-motion'
import LeetCodeStats from '../components/LeetCodeStats'

export default function Skills() {
  const skillCategories = [
    {
      category: "Frontend",
      skills: ["React.js", "Next.js", "Vue.js", "Tailwind CSS", "JavaScript", "TypeScript", "HTML5", "CSS3"]
    },
    {
      category: "Backend",
      skills: ["Node.js", "Express.js", "Python", "Django", "Flask", "FastAPI", "REST APIs", "GraphQL"]
    },
    {
      category: "Database",
      skills: ["MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "DynamoDB"]
    },
    {
      category: "Cloud & DevOps",
      skills: ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Git", "Linux", "Nginx"]
    },
    {
      category: "AI & ML",
      skills: ["TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "OpenCV", "NLP", "Computer Vision"]
    },
    {
      category: "Mobile",
      skills: ["Flutter", "Dart", "React Native", "Android", "iOS"]
    }
  ]

  return (
    <section id="skills" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/50">
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
            Skills & Technologies
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
          <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
            A comprehensive toolkit of technologies I've mastered through hands-on experience
          </p>
        </motion.div>

        {/* Skills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {skillCategories.map((category, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group backdrop-blur-sm glass"
              whileHover={{ scale: 1.02, y: -5 }}
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { delay: index * 0.1 },
                y: {
                  duration: 4 + index * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                {category.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-gray-400 border border-gray-800 hover:border-gray-600 hover:text-gray-300 transition-all"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* LeetCode Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <LeetCodeStats />
        </motion.div>
      </div>
    </section>
  )
}
