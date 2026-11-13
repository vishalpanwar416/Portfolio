// Portfolio content edited in the admin (Portfolio page), published through
// /api/admin/portfolio. Anything not published falls back to src/data, so the
// site renders straight away and still works if the API is down. The last
// copy is kept in localStorage so repeat visits don't flash old content.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Award, Star, Trophy } from 'lucide-react'
import {
  certifications as defaultCertifications, education as defaultEducation, personalInfo as defaultPersonal,
  projects as defaultProjects, skillCategories as defaultSkills, typingAnimationTexts as defaultTyping,
  workExperience as defaultExperience,
} from '../data'

const CACHE_KEY = 'portfolio_content_v1'
const ICONS = { award: Award, trophy: Trophy, star: Star }

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null } catch { return null }
}

const pick = (v, fallback) => (Array.isArray(v) && v.length ? v : fallback)
const text = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback)

/** Published content laid over the built-in data, in the shapes the sections use. */
export function mergeContent(c) {
  const p = c?.profile || {}
  return {
    personalInfo: {
      ...defaultPersonal,
      title: text(p.title, defaultPersonal.title),
      location: { ...defaultPersonal.location, display: text(p.location, defaultPersonal.location.display) },
      availability: {
        ...defaultPersonal.availability,
        status: text(p.status, defaultPersonal.availability.status),
        badge: text(p.badge, defaultPersonal.availability.badge),
        badgeShort: text(p.badgeShort, defaultPersonal.availability.badgeShort),
      },
      heroStats: { ...defaultPersonal.heroStats, stack: pick(p.stack, defaultPersonal.heroStats.stack) },
    },
    typingAnimationTexts: pick(p.typing, defaultTyping),
    projects: pick(c?.projects, defaultProjects).filter((x) => !x.hidden),
    skillCategories: pick(c?.skills, defaultSkills),
    workExperience: pick(c?.experience, defaultExperience),
    education: pick(c?.education, defaultEducation),
    certifications: c?.certifications?.length
      ? c.certifications.map((x) => ({ ...x, icon: ICONS[x.icon] || Award, verified: true }))
      : defaultCertifications,
  }
}

const PortfolioContext = createContext(mergeContent(null))

export function PortfolioProvider({ children }) {
  const [content, setContent] = useState(readCache)
  useEffect(() => {
    let live = true
    fetch('/api/admin/portfolio')
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!live || !c) return
        setContent(c)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)) } catch { /* private mode */ }
      })
      .catch(() => {})
    return () => { live = false }
  }, [])
  const value = useMemo(() => mergeContent(content), [content])
  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
}

export const usePortfolio = () => useContext(PortfolioContext)
