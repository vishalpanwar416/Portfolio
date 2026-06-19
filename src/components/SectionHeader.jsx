import { motion } from 'framer-motion'

export default function SectionHeader({ label, title, subtitle, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-12 md:mb-16 ${className}`}
    >
      {label && (
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-10 bg-gray-600" />
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-[0.32em]">{label}</p>
        </div>
      )}
      <h2
        className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed border-l-2 border-white/10 pl-4">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
