import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Simple CSS-based 3D object (no Three.js dependency)
export default function ThreeDObject() {
  return (
    <motion.div
      className="relative w-64 h-64 mx-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      {/* 3D Cube using CSS */}
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: [0, 360],
            rotateX: [0, 15, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {/* Front face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'translateZ(64px)',
            }}
          >
            <div className="flex items-center justify-center h-full text-gray-300 font-bold text-2xl">
              VP
            </div>
          </div>
          
          {/* Back face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'translateZ(-64px) rotateY(180deg)',
            }}
          />
          
          {/* Right face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-600/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'rotateY(90deg) translateZ(64px)',
            }}
          />
          
          {/* Left face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-600/50 to-gray-700/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'rotateY(-90deg) translateZ(64px)',
            }}
          />
          
          {/* Top face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-500/50 to-gray-600/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'rotateX(90deg) translateZ(64px)',
            }}
          />
          
          {/* Bottom face */}
          <div
            className="absolute w-full h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-600/50 backdrop-blur-sm rounded-xl"
            style={{
              transform: 'rotateX(-90deg) translateZ(64px)',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

