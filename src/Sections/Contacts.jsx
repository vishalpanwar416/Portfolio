import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, MessageSquare, Mail, Download, Calendar } from 'lucide-react'
import SectionShell from '../components/SectionShell'
import SectionHeader from '../components/SectionHeader'
import { contactLinks } from '../data/social'
import { personalInfo, sectionContent, externalLinks } from '../data'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isFocused, setIsFocused] = useState({})
  const [whatsappSent, setWhatsappSent] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const createWhatsAppMessage = () => {
    const hasContent = formData.name.trim() || formData.message.trim() || formData.email.trim()
    if (!hasContent) return ''

    let message = `${sectionContent.contact.whatsapp.greeting}%0A%0A`
    if (formData.name.trim()) {
      message += `My name is ${encodeURIComponent(formData.name.trim())}%0A%0A`
    }
    if (formData.message.trim()) {
      message += `${encodeURIComponent(formData.message.trim())}%0A%0A`
    }
    if (formData.email.trim()) {
      message += `Email: ${encodeURIComponent(formData.email.trim())}`
    }
    return message
  }

  const whatsappUrl = `https://wa.me/${personalInfo.contact.whatsapp}?text=${createWhatsAppMessage()}`

  return (
    <SectionShell id="contact" className="pb-20">
      <SectionHeader
        label="05 / Contact"
        title={sectionContent.contact.title}
        subtitle={sectionContent.contact.subtitle}
      />

      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-gray-500 mb-2">
            {sectionContent.contact.contactDetails}
          </p>

          {contactLinks.map((contact, index) => (
            <motion.a
              key={contact.label}
              href={contact.link}
              target={contact.link.startsWith('http') ? '_blank' : '_self'}
              rel={contact.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
            >
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10">
                <contact.icon className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">{contact.label}</p>
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors">{contact.value}</p>
              </div>
            </motion.a>
          ))}

          <div className="flex flex-wrap gap-3 pt-4">
            <a
              href={externalLinks.resume}
              download={`${personalInfo.name.full}_Resume.pdf`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/25 transition-all"
            >
              <Download className="w-4 h-4" />
              Resume PDF
            </a>
            <a
              href={externalLinks.calendarBooking}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/25 transition-all"
            >
              <Calendar className="w-4 h-4" />
              {sectionContent.availability.bookMeeting}
            </a>
          </div>

          <p className="text-xs text-gray-600 pt-2">
            {personalInfo.availability.workPreference} · {personalInfo.availability.noticePeriod} notice
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/10"
        >
          <h3 className="text-lg font-semibold text-gray-200 mb-1">{sectionContent.contact.sendMessage}</h3>
          <p className="text-sm text-gray-500 mb-6">{sectionContent.contact.sendMessageSubtitle}</p>

          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500 mb-2">
                  <User className="w-3.5 h-3.5" />
                  {sectionContent.contact.labels.name}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused((p) => ({ ...p, name: true }))}
                  onBlur={() => setIsFocused((p) => ({ ...p, name: false }))}
                  className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-gray-300 outline-none transition-all ${
                    isFocused.name ? 'border-white/30' : 'border-white/10'
                  }`}
                  placeholder={sectionContent.contact.placeholders.name}
                />
              </div>
              <div>
                <label htmlFor="email" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500 mb-2">
                  <Mail className="w-3.5 h-3.5" />
                  {sectionContent.contact.labels.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => setIsFocused((p) => ({ ...p, email: true }))}
                  onBlur={() => setIsFocused((p) => ({ ...p, email: false }))}
                  className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-gray-300 outline-none transition-all ${
                    isFocused.email ? 'border-white/30' : 'border-white/10'
                  }`}
                  placeholder={sectionContent.contact.placeholders.email}
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-500 mb-2">
                <MessageSquare className="w-3.5 h-3.5" />
                {sectionContent.contact.labels.message}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleInputChange}
                onFocus={() => setIsFocused((p) => ({ ...p, message: true }))}
                onBlur={() => setIsFocused((p) => ({ ...p, message: false }))}
                className={`w-full px-4 py-3 rounded-xl border bg-black/40 text-gray-300 outline-none resize-none transition-all ${
                  isFocused.message ? 'border-white/30' : 'border-white/10'
                }`}
                placeholder={sectionContent.contact.placeholders.message}
              />
            </div>

            <motion.a
              href={whatsappSent ? '#' : whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                whatsappSent ? 'bg-gray-800 text-gray-400 cursor-default' : 'bg-white text-black hover:bg-gray-200'
              }`}
              onClick={(e) => {
                if (whatsappSent) {
                  e.preventDefault()
                  return
                }
                if (!createWhatsAppMessage()) {
                  e.preventDefault()
                  return
                }
                setWhatsappSent(true)
                setTimeout(() => setWhatsappSent(false), 4000)
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              {whatsappSent ? sectionContent.contact.whatsapp.sent : sectionContent.contact.whatsapp.send}
            </motion.a>

            <p className="text-xs text-gray-600 text-center">
              {sectionContent.contact.footer}{' '}
              <a href={personalInfo.contact.phoneLink} className="text-gray-400 hover:text-white">
                {personalInfo.contact.phone}
              </a>
              {' · '}
              <a href={`mailto:${personalInfo.contact.email}`} className="text-gray-400 hover:text-white">
                {personalInfo.contact.email}
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </SectionShell>
  )
}
