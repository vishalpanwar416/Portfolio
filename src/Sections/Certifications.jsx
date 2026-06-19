import { CheckCircle2, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import SectionHeader from '../components/SectionHeader'
import { certifications, achievements, sectionContent } from '../data'

export default function Certifications() {
  return (
    <section id="certifications" className="section-shell bg-canvas">
      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <SectionHeader
          label="Credentials"
          title={sectionContent.certifications.title}
          subtitle={sectionContent.certifications.subtitle}
        />

        <div className="grid md:grid-cols-2 gap-5 mb-12">
          {certifications.map((cert, index) => (
            <motion.div
              key={cert.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="card card-hover p-5 flex gap-4"
            >
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 h-fit">
                <cert.icon className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-white">{cert.title}</h4>
                  {cert.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-sm text-slate-400 mt-1">{cert.issuer}</p>
                <p className="text-xs text-slate-500 mt-1">{cert.date}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          {sectionContent.certifications.keyAchievements}
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 text-center"
            >
              <item.icon className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-sm font-medium text-white">{item.title}</p>
              <p className="text-xs text-slate-500 mt-1">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
