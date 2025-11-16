import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default function AvailabilityCalendar() {
  const [selectedDate, setSelectedDate] = useState(null)

  // Sample availability data
  const availability = {
    available: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    unavailable: ['Saturday', 'Sunday'],
    timezone: 'IST (UTC+5:30)',
    hours: '9:00 AM - 6:00 PM'
  }

  const getCurrentWeek = () => {
    const today = new Date()
    const week = []
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      week.push(date)
    }
    return week
  }

  const isAvailable = (dayName) => {
    return availability.available.includes(dayName)
  }

  return (
    <motion.div
      className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-gray-400" />
        <h3 className="text-2xl font-semibold text-gray-200">Availability</h3>
      </div>

      <div className="space-y-4">
        {/* Current Week */}
        <div className="grid grid-cols-7 gap-2">
          {getCurrentWeek().map((date, index) => {
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
            const isAvail = isAvailable(dayName)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <motion.button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-3 rounded-xl border transition-all ${
                  isToday
                    ? 'border-gray-500 bg-gray-800/50'
                    : isAvail
                    ? 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
                    : 'border-gray-800 bg-gray-900/20 opacity-50'
                }`}
                whileHover={isAvail ? { scale: 1.05 } : {}}
                whileTap={isAvail ? { scale: 0.95 } : {}}
              >
                <p className="text-xs text-gray-400 mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-semibold ${
                  isToday ? 'text-white' : isAvail ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {date.getDate()}
                </p>
                {isAvail ? (
                  <CheckCircle2 className="w-4 h-4 text-gray-400 mx-auto mt-1" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-600 mx-auto mt-1" />
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Availability Info */}
        <div className="pt-4 border-t border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{availability.hours}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-sm">Timezone: {availability.timezone}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-300 border border-gray-700">
              Available: {availability.available.join(', ')}
            </span>
          </div>
        </div>

        {/* Status and Booking */}
        <div className="pt-4 flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-gray-700">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300 font-medium">Available for opportunities</span>
          </div>

          {/* Book a Meeting Button */}
          <motion.a
            href="https://cal.com/vishal-panwar-mz0tfc"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-5 h-5" />
            <span>Book a Meeting</span>
          </motion.a>
        </div>
      </div>
    </motion.div>
  )
}
