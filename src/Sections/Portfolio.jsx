import { motion } from 'framer-motion'
import { ExternalLink, Github } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { projects } from '../data/projects'
import { sectionContent } from '../data'

function ProjectCard({ project, featured = false }) {
  const hasLive = project.live && project.live !== '#'
  const hasGithub = !!project.github

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`card card-hover p-6 flex flex-col h-full ${featured ? 'lg:col-span-2' : ''}`}
    >
      <div className={`relative mb-5 rounded-xl overflow-hidden bg-surface border border-white/[0.06] flex items-center justify-center ${featured ? 'h-52' : 'h-40'}`}>
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="max-h-[70%] max-w-[70%] object-contain"
          />
        ) : null}
      </div>

      <h3 className="font-display text-xl font-semibold text-white">{project.title}</h3>
      <p className="mt-2 text-sm text-slate-400 leading-relaxed flex-1">{project.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.slice(0, featured ? 6 : 4).map((t) => (
          <span key={t} className="chip text-[11px]">{t}</span>
        ))}
      </div>

      {project.features?.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {project.features.slice(0, 3).map((f) => (
            <li key={f} className="text-xs text-slate-500 flex items-start gap-2">
              <span className="text-accent mt-0.5">▸</span>
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/[0.06]">
        {hasGithub && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm py-2 px-4"
          >
            <Github className="w-4 h-4" />
            Code
          </a>
        )}
        {hasLive && (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm py-2 px-4"
          >
            <ExternalLink className="w-4 h-4" />
            Live Demo
          </a>
        )}
      </div>
    </motion.article>
  )
}

export default function Portfolio() {
  const [featured, ...rest] = projects

  return (
    <section id="portfolio" className="section-shell bg-surface/50">
      <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 max-w-6xl">
        <SectionHeader
          label="Work"
          title={sectionContent.portfolio.title}
          subtitle={sectionContent.portfolio.subtitle}
        />

        <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
          <ProjectCard project={featured} featured />
          {rest.map((project) => (
            <ProjectCard key={project.title} project={project} />
          ))}
        </div>
      </div>
    </section>
  )
}
