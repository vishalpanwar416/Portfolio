import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import profilePhoto from '../assets/vishal-panwar-profile.jpeg'
import { personalInfo } from '../data'

const MIN_MS = 1200

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = resolve
    img.onerror = resolve
    img.src = src
  })
}

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    let frame = 0
    const started = Date.now()

    preloadImage(profilePhoto).then(() => {
      if (mounted) setReady(true)
    })

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const elapsed = Date.now() - started
      const timeProgress = Math.min(92, (elapsed / MIN_MS) * 92)
      const loadProgress = ready ? 100 : timeProgress
      setProgress((prev) => Math.max(prev, Math.round(loadProgress)))

      if (ready && elapsed >= MIN_MS) {
        cancelAnimationFrame(frame)
        setProgress(100)
        setTimeout(onComplete, 350)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => {
      mounted = false
      cancelAnimationFrame(frame)
    }
  }, [onComplete, ready])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#0a0a0a] flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:80px_80px]" />
      <div className="absolute inset-0 opacity-[0.03] noise-texture" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        <motion.p
          className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-[0.35em] mb-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Portfolio
        </motion.p>

        <motion.h1
          className="text-4xl sm:text-6xl md:text-7xl font-bold leading-tight whitespace-nowrap"
          style={{ fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            {personalInfo.name.first} {personalInfo.name.last}
          </span>
        </motion.h1>

        <motion.p
          className="mt-4 text-sm sm:text-base text-gray-400 font-light tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {personalInfo.title}
        </motion.p>

        <motion.div
          className="w-56 sm:w-64 h-px bg-gray-800 rounded-full overflow-hidden mx-auto mt-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-gray-600 via-gray-300 to-gray-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          />
        </motion.div>

        <p className="text-gray-500 mt-3 text-xs tabular-nums tracking-widest">
          {progress}%
        </p>
      </div>
    </motion.div>
  )
}
