import { motion } from 'framer-motion'

export default function SectionDivider() {
  return (
    <div className="relative py-16 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Animated line */}
        <motion.div
          className="h-px w-full bg-gradient-to-r from-transparent via-gray-600 to-transparent"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      
      {/* Animated dots */}
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gray-500"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2, duration: 0.5 }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  )
}

