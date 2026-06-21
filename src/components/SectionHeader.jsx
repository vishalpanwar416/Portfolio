import { motion } from 'framer-motion'

export default function SectionHeader({ label, title, subtitle, className = '' }) {
  const words = title ? title.split(' ') : []
  const lastWord = words.length > 0 ? words[words.length - 1] : ''
  const otherWords = words.length > 1 ? words.slice(0, -1).join(' ') : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`mb-12 md:mb-16 ${className}`}
    >
      {label && (
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-10 bg-gradient-to-r from-orange-500 to-transparent" />
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
        {otherWords ? `${otherWords} ` : ''}
        {lastWord && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
            {lastWord}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-2xl leading-relaxed border-l-2 border-white/10 pl-4">
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
