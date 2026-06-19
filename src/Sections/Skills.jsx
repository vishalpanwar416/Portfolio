import { motion } from 'framer-motion'
import CodingStats from '../components/CodingStats'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { skillCategories, personalInfo, sectionContent } from '../data'

export default function Skills() {
  return (
    <SectionShell id="skills">
      <SectionHeader
        label="02 / Skills"
        title={sectionContent.skills.title}
        subtitle={sectionContent.skills.subtitle}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {skillCategories.map((category, index) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
            whileHover={{ y: -4 }}
          >
            <h3 className="text-sm font-semibold text-gray-200 mb-4 uppercase tracking-wider">
              {category.category}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-xs rounded-lg bg-black/40 text-gray-400 border border-white/5 hover:border-white/15 hover:text-gray-300 transition-all"
                >
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
      >
        <CodingStats
          githubUsername={personalInfo.username.github}
          leetcodeUsername={personalInfo.username.leetcode}
        />
      </motion.div>
    </SectionShell>
  )
}
