import { motion } from 'framer-motion'
import CodingStats from '../components/CodingStats'
import SectionHeader from '../components/SectionHeader'
import { skillCategories, personalInfo, sectionContent } from '../data'

export default function Skills() {
  return (
    <section id="skills" className="section-shell bg-canvas">
      <div className="absolute inset-0 bg-hero-glow opacity-50 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <SectionHeader
          label="Expertise"
          title={sectionContent.skills.title}
          subtitle={sectionContent.skills.subtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {skillCategories.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="card card-hover p-6"
            >
              <h3 className="font-display text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-accent" />
                {category.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <CodingStats
            githubUsername={personalInfo.username.github}
            leetcodeUsername={personalInfo.username.leetcode}
          />
        </motion.div>
      </div>
    </section>
  )
}
