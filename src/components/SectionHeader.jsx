import { motion } from 'framer-motion'

export default function SectionHeader({ label, title, subtitle, className = '' }) {
  const words = title ? title.split(' ') : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-12 md:mb-16 ${className}`}
    >
      {label && (
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="h-px w-10 bg-orange-500/50 origin-left"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-[0.32em]">
            {label.includes('/') ? (
              <>
                <span className="text-orange-500 font-semibold">{label.split('/')[0]}</span>
                <span className="text-gray-600">/</span>
                <span>{label.split('/')[1]}</span>
              </>
            ) : (
              label
            )}
          </p>
        </div>
      )}
      <h2
        className="font-serif-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        <span className="sr-only">{title}</span>
        <span aria-hidden>
          {words.map((w, i) => (
            <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom pb-[0.08em]">
              <motion.span
                className={`inline-block ${i === words.length - 1 ? 'text-orange-500' : ''}`}
                initial={{ y: '105%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {w}
              </motion.span>
              {i < words.length - 1 && '\u00a0'}
            </span>
          ))}
        </span>
      </h2>
      {subtitle && (
        <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed border-l-2 border-white/10 pl-4">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
