import { ExternalLink } from 'lucide-react'
import { socialLinks, footerLinks, sectionContent, externalLinks } from '../data'

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-surface py-12">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-10 mb-10">
          <div>
            <p className="font-display text-xl font-bold text-white">
              Vishal<span className="text-accent">.</span>
            </p>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-xs">
              {sectionContent.footer.tagline}
            </p>
          </div>

          <div className="md:text-center">
            <h4 className="text-sm font-semibold text-white mb-3">{sectionContent.footer.quickLinks}</h4>
            <div className="flex flex-wrap md:justify-center gap-x-4 gap-y-2">
              {footerLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-sm text-slate-500 hover:text-accent transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div className="md:text-right">
            <h4 className="text-sm font-semibold text-white mb-3">{sectionContent.footer.connectWithMe}</h4>
            <div className="flex md:justify-end gap-2">
              {socialLinks.slice(0, 5).map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="p-2.5 rounded-lg border border-white/10 text-slate-400 hover:text-accent hover:border-accent/30 transition-all"
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>{sectionContent.footer.copyright}</p>
          <div className="flex gap-4">
            <a href={externalLinks.leetcode} target="_blank" rel="noopener noreferrer" className="hover:text-accent inline-flex items-center gap-1">
              LeetCode <ExternalLink size={12} />
            </a>
            <a href={externalLinks.github} target="_blank" rel="noopener noreferrer" className="hover:text-accent inline-flex items-center gap-1">
              GitHub <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
