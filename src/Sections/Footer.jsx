import { Github, Linkedin, Mail, ExternalLink, Twitter, Instagram } from 'lucide-react'
import logo from '../assets/logo.png'
import VisitorCounter from '../components/VisitorCounter'

export default function Footer() {
  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/vishalpanwar416"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com/in/vishalpanwar416"
    },
    {
      name: "Email",
      icon: Mail,
      url: "mailto:vishalpanwar416@gmail.com"
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/vee.pyai"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/vishalpanwar416"
    },
    {
      name: "Blinq",
      icon: ExternalLink,
      url: "https://blinq.me/cTA1XtayJD14xDIFFz33"
    }
  ]

  return (
    <footer className="bg-[#0a0a0a] border-t border-gray-800/50 text-gray-300 py-12 relative overflow-hidden">
      {/* Static background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-800/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-gray-700/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-3 gap-10 items-start mb-10">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img
                src={logo}
                alt="Vishal Panwar Logo"
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Quick Links</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {["About", "Skills", "Portfolio", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-semibold mb-4 text-gray-200">Connect With Me</h4>
            <div className="flex justify-center md:justify-end flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-white/10 hover:border-gray-700 transition-all"
                  aria-label={social.name}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800/50 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <p className="text-gray-500 text-sm text-center md:text-left">
              © 2025 Vishal Panwar. All rights reserved.
            </p>
            <VisitorCounter />
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a
              href="https://leetcode.com/vishalpanwar416"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              <span>LeetCode</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="https://github.com/vishalpanwar416"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-gray-300 transition-colors"
            >
              <span>Source Code</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
