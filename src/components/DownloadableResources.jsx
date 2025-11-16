import { motion } from 'framer-motion'
import { Download, FileText, FileCode, BookOpen } from 'lucide-react'

export default function DownloadableResources() {
  const resources = [
    {
      title: 'Resume',
      description: 'Download my latest resume in PDF format',
      icon: FileText,
      file: '/resume/Vishal_Panwar_Resume.pdf',
      type: 'PDF'
    },
    {
      title: 'Portfolio Overview',
      description: 'Quick overview of my projects and skills',
      icon: BookOpen,
      file: '/resume/Vishal_Panwar_Resume.pdf', // You can create a separate file
      type: 'PDF'
    }
  ]

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-3">
        <Download className="w-6 h-6 text-gray-400" />
        Downloadable Resources
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        {resources.map((resource, index) => (
          <motion.a
            key={index}
            href={resource.file}
            download
            className="group p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm border border-gray-800 hover:border-gray-700 transition-all glass"
            whileHover={{ scale: 1.02, y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 group-hover:bg-gray-700/50 transition-colors">
                <resource.icon className="w-6 h-6 text-gray-300" />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-200 mb-1 group-hover:text-white transition-colors">
                  {resource.title}
                </h4>
                <p className="text-sm text-gray-400 mb-3">{resource.description}</p>
                <span className="inline-flex items-center gap-2 text-xs text-gray-500 border border-gray-800 px-2 py-1 rounded-full">
                  {resource.type}
                </span>
              </div>
              <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}

