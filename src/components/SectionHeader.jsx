import { motion } from 'framer-motion'

export default function SectionHeader({ label, title, subtitle, align = 'center' }) {
  const isCenter = align === 'center'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-14 md:mb-16 ${isCenter ? 'text-center' : 'text-left'}`}
    >
      {label && (
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-3">
          {label}
        </p>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base md:text-lg text-slate-400 max-w-2xl leading-relaxed ${isCenter ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
      <div className={`mt-6 h-px w-16 bg-gradient-to-r from-accent to-accent/0 ${isCenter ? 'mx-auto' : ''}`} />
    </motion.div>
  )
}
