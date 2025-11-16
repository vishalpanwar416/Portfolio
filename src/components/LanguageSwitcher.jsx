import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, changeLanguage, languages } = useLanguage()

  return (
    <div className="relative group">
      <motion.button
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm glass"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{languages[language]?.flag}</span>
      </motion.button>

      <div className="absolute top-full right-0 mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-2 min-w-[120px] backdrop-blur-sm glass">
          {Object.values(languages).map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                language === lang.code
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

