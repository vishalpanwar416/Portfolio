import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

export default function InteractiveMap() {
  // Hyderabad, India coordinates
  // Latitude: 17.3850, Longitude: 78.4867
  // Bounding box for Hyderabad area
  const hyderabadBbox = "78.3,17.3,78.6,17.5"
  const hyderabadLat = 17.3850
  const hyderabadLng = 78.4867
  
  // Using OpenStreetMap (no API key needed)
  const openStreetMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${hyderabadBbox}&layer=mapnik&marker=${hyderabadLat},${hyderabadLng}`

  return (
    <motion.div
      className="w-full h-96 rounded-2xl overflow-hidden border border-gray-800 glass backdrop-blur-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative w-full h-full">
        {/* Map Container */}
        <iframe
          src={openStreetMapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location Map - Hyderabad, India"
        />
        
        {/* Overlay with location info */}
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-800">
          <div className="flex items-center gap-2 text-gray-200">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-semibold">Based in Hyderabad, India</p>
              <p className="text-sm text-gray-400">Available Worldwide</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

