import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { detailedCertifications } from '../data/certifications'
import { workExperience, education } from '../data/experience'
import { sectionContent } from '../data'

export default function About() {
  return (
    <section id="about" className="section-shell bg-surface/50">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-40 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <SectionHeader
          label="About"
          title={sectionContent.about.title}
          subtitle={sectionContent.about.subtitle}
        />

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="card p-6 md:p-8">
              {sectionContent.about.content.map((paragraph, i) => (
                <p key={i} className={`text-slate-400 leading-relaxed ${i > 0 ? 'mt-4' : ''}`}>
                  {paragraph}
                </p>
              ))}
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Education
              </h3>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index} className="card card-hover p-4">
                    <h4 className="font-medium text-white">{edu.degree}</h4>
                    <p className="text-sm text-slate-400 mt-1">{edu.institution}</p>
                    <p className="text-xs text-slate-500 mt-1">{edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Experience
            </h3>
            <div className="relative pl-6 border-l border-accent/20 space-y-6">
              {workExperience.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  <span className="absolute -left-[1.6rem] top-1.5 w-3 h-3 rounded-full bg-accent ring-4 ring-accent/20" />
                  <div className="card card-hover p-5">
                    <p className="text-xs font-medium text-accent uppercase tracking-wider">{exp.duration}</p>
                    <h4 className="font-display text-lg font-semibold text-white mt-2">{exp.position}</h4>
                    <p className="text-slate-400 mt-1">{exp.company}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <h3 className="font-display text-lg font-semibold text-white mt-10 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Certifications
            </h3>
            <div className="space-y-3">
              {detailedCertifications.slice(0, 4).map((cert, index) => (
                <a
                  key={index}
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover p-4 flex items-start justify-between gap-3 group"
                >
                  <div>
                    <h4 className="font-medium text-white group-hover:text-accent transition-colors text-sm sm:text-base">
                      {cert.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{cert.date}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-accent shrink-0 mt-0.5" />
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
