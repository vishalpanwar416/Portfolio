// Portfolio content lives in the database: edited in the admin (Portfolio
// page), published through /api/admin/portfolio. That covers the profile,
// projects, skills, experience, education, certifications, contact details,
// links and section text. src/data is only the copy shown until the API
// answers (and if it's down); the last published copy is kept in localStorage
// so repeat visits render it straight away. Sections read everything through
// usePortfolio(), never from src/data directly.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Award, Calendar, ExternalLink, Github, Instagram, Linkedin, Mail, Phone, Star, Trophy, Twitter } from 'lucide-react'
import {
  certifications as defaultCertifications, education as defaultEducation, personalInfo as defaultPersonal,
  projects as defaultProjects, skillCategories as defaultSkills, typingAnimationTexts as defaultTyping,
  workExperience as defaultExperience, sectionContent as defaultText, socialLinks as defaultSocial,
  contactLinks as defaultContactLinks, externalLinks as defaultExternal, appLinks as defaultApps,
} from '../data'

const CACHE_KEY = 'portfolio_content_v1'
const ICONS = { award: Award, trophy: Trophy, star: Star }
export const LINK_ICONS = { github: Github, linkedin: Linkedin, email: Mail, instagram: Instagram, twitter: Twitter, phone: Phone, calendar: Calendar, link: ExternalLink }
const linkIcon = (kind) => LINK_ICONS[kind] || ExternalLink
const bare = (url) => String(url || '').replace(/^(https?:\/\/|mailto:|tel:)/, '').replace(/^www\./, '').replace(/\/$/, '')

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || null } catch { return null }
}

const pick = (v, fallback) => (Array.isArray(v) && v.length ? v : fallback)
const text = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback)

/** Section text: published values over the built-in sectionContent. */
function mergeText(t = {}) {
  const d = defaultText
  return {
    ...d,
    hero: { ...d.hero, description: text(t.heroDescription, d.hero.description) },
    about: { ...d.about, title: text(t.aboutTitle, d.about.title), subtitle: text(t.aboutSubtitle, d.about.subtitle), content: pick(t.about, d.about.content) },
    skills: { ...d.skills, title: text(t.skillsTitle, d.skills.title), subtitle: text(t.skillsSubtitle, d.skills.subtitle) },
    portfolio: { ...d.portfolio, title: text(t.portfolioTitle, d.portfolio.title), subtitle: text(t.portfolioSubtitle, d.portfolio.subtitle) },
    certifications: { ...d.certifications, title: text(t.certificationsTitle, d.certifications.title), subtitle: text(t.certificationsSubtitle, d.certifications.subtitle) },
    contact: { ...d.contact, title: text(t.contactTitle, d.contact.title), subtitle: text(t.contactSubtitle, d.contact.subtitle) },
    footer: { ...d.footer, tagline: text(t.footerTagline, d.footer.tagline) },
  }
}

/** Published content laid over the built-in data, in the shapes the sections use. */
export function mergeContent(c) {
  const p = c?.profile || {}
  const ct = c?.contact || {}
  const links = Array.isArray(c?.links) && c.links.length ? c.links : null
  const phone = text(ct.phone, defaultPersonal.contact.phone)
  const digits = phone.replace(/[^\d+]/g, '')
  const kindUrl = (kind) => links?.find((l) => l.kind === kind)?.url
  return {
    personalInfo: {
      ...defaultPersonal,
      contact: {
        email: text(ct.email, defaultPersonal.contact.email),
        phone, phoneFormatted: phone, phoneLink: `tel:${digits}`,
        whatsapp: text(ct.whatsapp, defaultPersonal.contact.whatsapp).replace(/\D/g, ''),
      },
      title: text(p.title, defaultPersonal.title),
      location: { ...defaultPersonal.location, display: text(p.location, defaultPersonal.location.display) },
      availability: {
        ...defaultPersonal.availability,
        workPreference: text(ct.workPreference, defaultPersonal.availability.workPreference),
        noticePeriod: text(ct.noticePeriod, defaultPersonal.availability.noticePeriod),
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
    sectionContent: mergeText(c?.text),
    appLinks: pick(c?.apps, defaultApps),
    socialLinks: links
      ? links.filter((l) => l.social && l.url).map((l) => ({ name: l.label, icon: linkIcon(l.kind), url: l.url, username: l.handle || bare(l.url) }))
      : defaultSocial,
    contactLinks: links
      ? links.filter((l) => l.contact && l.url).map((l) => ({ icon: linkIcon(l.kind), label: l.label, value: l.handle || bare(l.url), link: l.url }))
      : defaultContactLinks,
    externalLinks: {
      ...defaultExternal,
      github: kindUrl('github') || defaultExternal.github,
      resume: text(ct.resume, defaultExternal.resume),
      calendarBooking: text(ct.calendar, defaultExternal.calendarBooking),
    },
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
