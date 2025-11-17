import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'

export default function AvailabilityCalendar() {
  const [calLoaded, setCalLoaded] = useState(false)

  useEffect(() => {
    // Load Cal.com embed script only once
    if (!document.querySelector('script[src*="cal.com/embed"]')) {
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://app.cal.com/embed/embed.js'
      script.async = true

      script.onload = () => {
        setCalLoaded(true)
      }

      script.onerror = () => {
        console.warn('Cal.com script failed to load')
      }

      document.head.appendChild(script)
    } else {
      setCalLoaded(true)
    }
  }, [])

  const handleBookMeeting = () => {
    if (calLoaded && window.Cal) {
      try {
        window.Cal('init', { origin: 'https://app.cal.com' })
        window.Cal('ui', {
          styles: { branding: { brandColor: '#6b7280' } },
          hideEventTypeDetails: false
        })
        window.Cal('openModal', {
          calLink: 'vishal-panwar-mz0tfc/30min',
          config: {
            layout: 'month_view',
            theme: 'dark'
          }
        })
      } catch (error) {
        console.error('Error opening Cal.com modal:', error)
        // Fallback to direct Cal.com link
        window.open('https://cal.com/vishal-panwar-mz0tfc/30min', '_blank')
      }
    } else {
      // If Cal isn't loaded, open direct link
      window.open('https://cal.com/vishal-panwar-mz0tfc/30min', '_blank')
    }
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
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-200">Book a Meeting</h3>
      </div>

      <div className="space-y-4">
        {/* Availability Info */}
        <div className="p-6 rounded-xl bg-white/5 border border-gray-700">
          <div className="flex items-start gap-4 mb-4">
            <Clock className="w-5 h-5 text-gray-400 mt-1" />
            <div>
              <h4 className="text-gray-200 font-semibold mb-2">Availability</h4>
              <p className="text-sm text-gray-400">Mon-Fri, 9:00 AM - 6:00 PM (IST)</p>
              <p className="text-sm text-gray-400 mt-1">30 minute sessions available</p>
            </div>
          </div>

          <button
            onClick={handleBookMeeting}
            className="w-full py-3 px-6 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Schedule a Meeting
          </button>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Click the button to view my calendar and book a time slot
        </p>
      </div>
    </motion.div>
  )
}
