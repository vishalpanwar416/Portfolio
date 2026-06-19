import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { certifications, sectionContent } from '../data'

export default function Certifications() {
  return (
    <SectionShell id="certifications">
      <SectionHeader
        label="03 / Credentials"
        title={sectionContent.certifications.title}
        subtitle={sectionContent.certifications.subtitle}
      />

      <h3 className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-6">
        {sectionContent.certifications.professionalCerts}
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {certifications.map((cert, index) => (
          <motion.div
            key={cert.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.06 }}
            className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
            whileHover={{ y: -4 }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                <cert.icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors">
                    {cert.title}
                  </h4>
                  {cert.verified && <CheckCircle2 className="w-4 h-4 text-gray-500 shrink-0" />}
                </div>
                <p className="text-gray-400 text-sm">{cert.issuer}</p>
                <p className="text-gray-500 text-xs mt-1">{cert.date}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  )
}
