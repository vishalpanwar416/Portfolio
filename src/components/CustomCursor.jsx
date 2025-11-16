import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    // Only show custom cursor on desktop
    const checkDesktop = () => {
      setIsDesktop(window.matchMedia('(min-width: 1024px)').matches && window.matchMedia('(pointer: fine)').matches)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)

    if (!isDesktop) return

    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    // Add hover detection for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]')
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    window.addEventListener('mousemove', updateMousePosition)

    return () => {
      window.removeEventListener('resize', checkDesktop)
      window.removeEventListener('mousemove', updateMousePosition)
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [isDesktop])

  if (!isDesktop) return null

  return (
    <>
      {/* Hide default cursor only on desktop */}
      <style>{`
        @media (min-width: 1024px) and (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
      `}</style>
      
      {/* Custom cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-difference hidden lg:block"
        animate={{
          x: mousePosition.x - 12,
          y: mousePosition.y - 12,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 28,
        }}
      >
        <motion.div
          className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400"
          animate={{
            scale: isHovering ? 1.5 : 1,
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
      
      {/* Cursor trail */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9997] hidden lg:block"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
        }}
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-gray-500/30" />
      </motion.div>
    </>
  )
}

