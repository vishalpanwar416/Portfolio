// Pointer-driven motion for the site: cards that tilt toward the cursor with
// a spotlight under it, buttons that lean toward the cursor, and a soft glow
// that follows the mouse. Everything switches off on touch screens and for
// people who ask their system for reduced motion.
import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'

const SPRING = { stiffness: 220, damping: 20, mass: 0.6 }

/** True on a desktop pointer with motion allowed. */
export function useFancyMotion() {
  const reduced = useReducedMotion()
  const [fine, setFine] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFine(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])
  return fine && !reduced
}

/**
 * Tilt toward the cursor and move a spotlight with it. Spread the returned
 * props onto a framer-motion element that is `relative group overflow-hidden`
 * and render <Spotlight /> inside it.
 */
export function useTilt(max = 6) {
  const on = useFancyMotion()
  const rx = useSpring(useMotionValue(0), SPRING)
  const ry = useSpring(useMotionValue(0), SPRING)
  if (!on) return {}
  return {
    style: { rotateX: rx, rotateY: ry, transformPerspective: 900 },
    onPointerMove: (e) => {
      const r = e.currentTarget.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width
      const py = (e.clientY - r.top) / r.height
      ry.set((px - 0.5) * 2 * max)
      rx.set(-(py - 0.5) * 2 * max)
      e.currentTarget.style.setProperty('--spot-x', `${px * 100}%`)
      e.currentTarget.style.setProperty('--spot-y', `${py * 100}%`)
    },
    onPointerLeave: () => { rx.set(0); ry.set(0) },
  }
}

/** The orange light that follows the cursor inside a tilt card. */
export function Spotlight({ color = 'rgba(249,115,22,0.13)' }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      style={{ background: `radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${color}, transparent 45%)` }}
    />
  )
}

/** Leans its child toward the cursor while hovered. */
export function Magnetic({ children, strength = 0.28, className = '' }) {
  const on = useFancyMotion()
  const x = useSpring(useMotionValue(0), SPRING)
  const y = useSpring(useMotionValue(0), SPRING)
  if (!on) return <span className={`inline-flex ${className}`}>{children}</span>
  return (
    <motion.span
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.span>
  )
}

/** A faint orange glow that trails the mouse across the whole page. */
export function PointerGlow() {
  const on = useFancyMotion()
  const x = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 24 })
  const y = useSpring(useMotionValue(-1000), { stiffness: 120, damping: 24 })
  useEffect(() => {
    if (!on) return undefined
    const move = (e) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [on, x, y])
  if (!on) return null
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-[520px] w-[520px] rounded-full mix-blend-screen"
      style={{ x, y, translateX: '-50%', translateY: '-50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07), transparent 60%)' }}
    />
  )
}

/** A motion.div card with tilt and spotlight built in (usable inside .map). */
export function TiltPanel({ max = 4, className = '', children, ...rest }) {
  const tilt = useTilt(max)
  return (
    <motion.div {...rest} {...tilt} className={`group relative overflow-hidden ${className}`}>
      <Spotlight />
      {children}
    </motion.div>
  )
}
