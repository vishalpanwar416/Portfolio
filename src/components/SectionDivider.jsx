import { motion } from 'framer-motion'

export default function SectionDivider() {
  return (
    <div className="relative py-6 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Animated line */}
        <motion.div
          className="h-px w-full bg-gradient-to-r from-transparent via-gray-700/40 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Animated dots */}
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-gray-600"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.4, 0.8, 0.4],
              scale: [0, 1, 1, 1.2, 1],
            }}
            viewport={{ once: true }}
            transition={{
              delay: i * 0.2,
              duration: 2,
              repeat: Infinity,
              times: [0, 0.25, 0.5, 0.75, 1],
            }}
          />
        ))}
      </div>
    </div>
  )
}

