import { Github, Linkedin, Mail, ExternalLink, Twitter, Instagram } from 'lucide-react'
import logo from '../assets/logo.png'

export default function Footer() {
  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/vishalpanwar416",
      color: "hover:text-gray-800"
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com/in/vishalpanwar416",
      color: "hover:text-blue-600"
    },
    {
      name: "Email",
      icon: Mail,
      url: "mailto:vishalpanwar416@gmail.com",
      color: "hover:text-red-600"
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/vee.pyai",
      color: "hover:text-pink-500"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/vishalpanwar416",
      color: "hover:text-blue-400"
    }
  ]

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <img 
                src={logo} 
                alt="Vishal Panwar Logo" 
                className="h-12 w-auto mr-3"
              />
              <h3 className="text-xl font-bold">Vishal Panwar</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Full-Stack Developer | AI & Cloud Engineer | Flutter Enthusiast
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {["About", "Skills", "Portfolio", "Contact"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-right">
            <h4 className="text-lg font-semibold mb-4">Connect With Me</h4>
            <div className="flex justify-center md:justify-end space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-4 pt-1">
          
        </div>

        {/* Additional Links - Moved to same line as copyright */}
        <div className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © 2025 Vishal Panwar. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <a 
                href="https://leetcode.com/vishalpanwar416" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-white transition-colors duration-200"
              >
                <span>LeetCode Profile</span>
                <ExternalLink size={14} />
              </a>
              <a 
                href="https://github.com/vishalpanwar416" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-white transition-colors duration-200"
              >
                <span>View Source Code</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}