import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'

export default function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate visitor count (in production, this would be an API call)
    const getVisitorCount = () => {
      let count = localStorage.getItem('portfolioVisitors')
      if (!count) {
        // Initialize with a realistic base number
        count = 1247
        localStorage.setItem('portfolioVisitors', count.toString())
      } else {
        // Increment on each visit
        count = parseInt(count) + 1
        localStorage.setItem('portfolioVisitors', count.toString())
      }
      return count
    }

    // Delay to simulate API call
    setTimeout(() => {
      setVisitorCount(getVisitorCount())
      setIsLoading(false)
    }, 500)
  }, [])

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
    >
      <Eye className="w-4 h-4 text-gray-400" />
      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-400">Visitors:</span>
        {isLoading ? (
          <span className="text-sm text-gray-300 font-semibold">---</span>
        ) : (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-sm text-gray-300 font-semibold"
          >
            {formatNumber(visitorCount)}
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}
