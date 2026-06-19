import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 400)
          return 100
        }
        return prev + 4
      })
    }, 25)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-canvas flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-50" />
      <div className="relative text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-accent mb-4">Portfolio</p>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white">Vishal Panwar</h1>
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto mt-8">
          <motion.div
            className="h-full bg-accent rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        <p className="text-slate-500 text-sm mt-3 tabular-nums">{progress}%</p>
      </div>
    </motion.div>
  )
}
