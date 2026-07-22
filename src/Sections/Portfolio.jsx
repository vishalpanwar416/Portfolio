import { motion } from 'framer-motion'
import { ExternalLink, Github, Lock } from 'lucide-react'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { projects, sectionContent } from '../data'

function ProjectCard({ project, className = '', index = 0 }) {
  const hasLive = project.live && !project.private
  const hasGithub = Boolean(project.github)

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all ${className}`}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`${project.wideImage ? 'h-14 w-28' : 'h-14 w-14'} rounded-xl bg-black border border-white/10 flex items-center justify-center p-1 overflow-hidden`}>
          {project.image && (
            <img src={project.image} alt={`${project.title} logo`} className="max-h-full max-w-full object-contain" />
          )}
        </div>
        {project.private && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 border border-white/10 rounded-full">
            <Lock className="w-3 h-3" />
            NDA
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-200 mb-2">{project.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{project.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tech.slice(0, 5).map((tech) => (
          <span
            key={tech}
            className="px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-500 border border-white/5 rounded"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-auto">
        {hasGithub && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-white/10 text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            {sectionContent.portfolio.viewCode}
          </a>
        )}
        {hasLive ? (
          <a
            href={project.live}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white text-black hover:bg-gray-200 transition-colors ${hasGithub ? 'flex-1' : 'w-full'}`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {sectionContent.portfolio.viewDemo}
          </a>
        ) : project.private ? (
          <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-500 border border-white/5">
            Company product
          </span>
        ) : hasGithub ? (
          <span className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs text-gray-500 border border-white/5">
            Private repo
          </span>
        ) : null}
      </div>
    </motion.article>
  )
}

export default function Portfolio() {
  const featured = projects.filter((p) => p.featured)
  const rest = projects.filter((p) => !p.featured)

  return (
    <SectionShell id="portfolio">
      <SectionHeader
        label="04 / Work"
        title={sectionContent.portfolio.title}
        subtitle={sectionContent.portfolio.subtitle}
      />

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {featured.map((project, i) => (
          <ProjectCard
            key={project.title}
            project={project}
            index={i}
            className="md:min-h-[320px]"
          />
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rest.map((project, i) => (
          <ProjectCard key={project.title} project={project} index={i + featured.length} />
        ))}
      </div>
    </SectionShell>
  )
}
