import { ExternalLink } from 'lucide-react'
import logo from '../assets/logo.png'
import { socialLinks, footerLinks, sectionContent, externalLinks, personalInfo } from '../data'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.06] text-gray-300 py-12 relative overflow-hidden">
      <div className="absolute inset-0 noise-texture opacity-[0.01] pointer-events-none" />

      <div className="container mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-10 items-start mb-10">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img src={logo} alt="Vishal Panwar Logo" className="h-10 w-auto opacity-90" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{sectionContent.footer.tagline}</p>
            <p className="text-xs text-gray-600 mt-2">{personalInfo.availability.status}</p>
          </div>

          <div className="text-center">
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
              {sectionContent.footer.quickLinks}
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              {footerLinks.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-gray-500 hover:text-gray-200 transition-colors text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div className="text-center md:text-right">
            <h4 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
              {sectionContent.footer.connectWithMe}
            </h4>
            <div className="flex justify-center md:justify-end flex-wrap gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full border border-white/10 text-gray-500 hover:text-white hover:border-white/25 transition-all"
                  aria-label={social.name}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs text-center md:text-left">{sectionContent.footer.copyright}</p>

          <div className="flex items-center gap-6 text-xs text-gray-600">
            <a
              href={externalLinks.leetcode}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              {sectionContent.footer.links.leetcode}
              <ExternalLink size={12} />
            </a>
            <a
              href={externalLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              {sectionContent.footer.links.sourceCode}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
