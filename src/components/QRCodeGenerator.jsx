import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, QrCode, X } from 'lucide-react'

export default function QRCodeGenerator() {
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState('')

  const generateQR = () => {
    const url = window.location.href
    const contactInfo = {
      name: 'Vishal Panwar',
      email: 'vishalpanwar416@gmail.com',
      phone: '+91 7500988212',
      linkedin: 'linkedin.com/in/vishalpanwar416',
      github: 'github.com/vishalpanwar416',
      blinq: 'blinq.me/cTA1XtayJD14xDIFFz33'
    }
    
    // Create vCard format for QR code
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contactInfo.name}
EMAIL:${contactInfo.email}
TEL:${contactInfo.phone}
URL:${url}
END:VCARD`
    
    setQrData(vCard)
    setShowQR(true)
  }

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.download = 'vishal-panwar-contact-qr.png'
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  return (
    <>
      <motion.button
        onClick={generateQR}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm glass"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <QrCode className="w-4 h-4" />
        <span className="text-sm">Get QR Code</span>
      </motion.button>

      {showQR && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowQR(false)}
        >
          <motion.div
            className="relative bg-gray-900 p-8 rounded-2xl border border-gray-800 max-w-md w-full mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-200 mb-4">Contact QR Code</h3>
            <p className="text-sm text-gray-400 mb-6">Scan to save contact information</p>
            
            <div className="flex justify-center mb-6 p-4 bg-white rounded-xl">
              <img
                id="qr-canvas"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`}
                alt="Contact QR Code"
                className="w-64 h-64"
              />
            </div>
            
            <button
              onClick={downloadQR}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

