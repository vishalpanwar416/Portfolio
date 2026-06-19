import { motion } from 'framer-motion'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { detailedCertifications } from '../data/certifications'
import { workExperience, education } from '../data/experience'
import { sectionContent } from '../data'

export default function About() {
  return (
    <SectionShell id="about">
      <SectionHeader
        label="01 / About"
        title={sectionContent.about.title}
        subtitle={sectionContent.about.subtitle}
      />

      <div className="space-y-6 mb-12 max-w-3xl">
        {sectionContent.about.content.map((paragraph, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="text-gray-400 text-base sm:text-lg leading-relaxed"
          >
            {paragraph}
          </motion.p>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 space-y-6"
        >
          <h3 className="text-xs uppercase tracking-[0.28em] text-gray-500">Experience</h3>
          <div className="space-y-4">
            {workExperience.map((exp, index) => (
              <motion.div
                key={exp.company}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="relative pl-6 border-l border-white/10 hover:border-white/20 transition-colors"
              >
                <span className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-gray-500" />
                <div className="pb-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-200">{exp.position}</h4>
                    <span className="text-xs text-gray-500">{exp.duration}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{exp.company}</p>
                  {exp.highlights?.length > 0 && (
                    <ul className="space-y-1.5">
                      {exp.highlights.map((h) => (
                        <li key={h} className="text-sm text-gray-500 flex gap-2">
                          <span className="text-gray-600 mt-1.5 shrink-0">—</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div>
            <h3 className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-4">Education</h3>
            <div className="space-y-3">
              {education.map((edu) => (
                <div
                  key={edu.degree}
                  className="p-4 rounded-xl bg-white/[0.03] border border-white/10"
                >
                  <h4 className="font-medium text-gray-200 text-sm">{edu.degree}</h4>
                  <p className="text-gray-400 text-sm mt-1">{edu.institution}</p>
                  <p className="text-xs text-gray-500 mt-1">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-4">Certifications</h3>
            <div className="space-y-3">
              {detailedCertifications.map((cert) => (
                <a
                  key={cert.id}
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors group"
                >
                  <h4 className="font-medium text-gray-200 text-sm group-hover:text-white">{cert.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{cert.date}</p>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  )
}
