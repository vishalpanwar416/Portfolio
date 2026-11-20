// "Try my apps": tools I built that anyone can sign in to and use. The list
// comes from published content (admin → Portfolio → Contact & links), with
// src/data/navigation.js as the built-in copy.
import { motion } from 'framer-motion'
import { AppWindow, ArrowUpRight, FileText, GraduationCap, ListTodo } from 'lucide-react'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { usePortfolio } from '../contexts/PortfolioContext'

const ICONS = { learn: GraduationCap, docs: FileText, tasks: ListTodo, app: AppWindow }
const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

export default function Apps() {
  const { appLinks, sectionContent } = usePortfolio()
  if (!appLinks.length) return null
  const text = sectionContent.apps || { title: 'Try My Apps', subtitle: '' }
  return (
    <SectionShell id="apps">
      <SectionHeader label="05 / Apps" title={text.title} subtitle={text.subtitle} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appLinks.map((app, index) => {
          const Icon = ICONS[app.icon] || AppWindow
          return (
            <motion.a
              key={app.url}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/25"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <Icon className="h-5 w-5 text-gray-300" />
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-emerald-300/90">Free</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{app.label}</h3>
              {app.note && <p className="mt-1 text-sm text-gray-500">{app.note}</p>}
              {app.description && <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-400">{app.description}</p>}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <span className="truncate font-mono text-xs text-gray-600">{host(app.url)}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black transition group-hover:bg-gray-200">
                  {app.cta || `Open ${app.label}`} <ArrowUpRight size={14} />
                </span>
              </div>
            </motion.a>
          )
        })}
      </div>
    </SectionShell>
  )
}
