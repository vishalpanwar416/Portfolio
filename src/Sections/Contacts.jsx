import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, User, MessageSquare, Instagram, Twitter, ExternalLink, Calendar } from 'lucide-react'
import QRCodeGenerator from '../components/QRCodeGenerator'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import InteractiveMap from '../components/InteractiveMap'
import DownloadableResources from '../components/DownloadableResources'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [isFocused, setIsFocused] = useState({})
  const [whatsappSent, setWhatsappSent] = useState(false)

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "vishalpanwar416@gmail.com",
      link: "mailto:vishalpanwar416@gmail.com"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+91 7500988212",
      link: "tel:+917500988212"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "linkedin.com/in/vishalpanwar416",
      link: "https://linkedin.com/in/vishalpanwar416"
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "instagram.com/vee.pyai",
      link: "https://instagram.com/vee.pyai"
    },
    {
      icon: Twitter,
      label: "X (Twitter)",
      value: "twitter.com/vishalpanwar416",
      link: "https://twitter.com/vishalpanwar416"
    },
    {
      icon: ExternalLink,
      label: "Digital Card",
      value: "blinq.me/cTA1XtayJD14xDIFFz33",
      link: "https://blinq.me/cTA1XtayJD14xDIFFz33"
    },
    {
      icon: Calendar,
      label: "Book a Meeting",
      value: "cal.com/vishal-panwar-mz0tfc",
      link: "https://cal.com/vishal-panwar-mz0tfc"
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const createWhatsAppMessage = () => {
    const hasContent = formData.name.trim() || formData.message.trim() || formData.email.trim()
    if (!hasContent) {
      return ''
    }

    let message = 'Hello Vishal Panwar..!!%0A%0A'

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

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }

  return (
    <section id="contact" className="py-24 pb-16 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/50">
      {/* Static background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-bl from-gray-800/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-gradient-to-tr from-gray-700/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Let's Connect
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
          <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
            I'm always excited to discuss new opportunities, innovative projects, and creative collaborations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-8">
              <h3 className="text-3xl font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                Contact Details
              </h3>
              <p className="text-gray-400 ml-7">Choose your preferred way to reach out</p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <motion.a
                  key={index}
                  href={contact.link}
                  target={contact.link.startsWith('http') ? "_blank" : "_self"}
                  rel={contact.link.startsWith('http') ? "noopener noreferrer" : ""}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="block p-5 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-gray-800 group-hover:border-gray-700 transition-all">
                      <contact.icon className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{contact.label}</p>
                      <p className="text-gray-300 font-medium group-hover:text-gray-200 transition-colors break-words">
                        {contact.value}
                      </p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* QR Code Generator */}
            <div className="mt-6">
              <QRCodeGenerator />
            </div>

            {/* Downloadable Resources */}
            <div className="mt-6">
              <DownloadableResources />
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800">
              <div className="mb-8">
                <h3 className="text-3xl font-semibold text-gray-200 mb-2 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                  Send Message
                </h3>
                <p className="text-gray-400 ml-7">Fill out the form and I'll get back to you soon</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                      <User className="w-4 h-4" />
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                        isFocused.name
                          ? 'border-gray-500 ring-2 ring-gray-500/20'
                          : 'border-gray-800 hover:border-gray-700'
                      } bg-gray-900/50 placeholder-gray-600 text-gray-300 outline-none`}
                      placeholder="Vishal Panwar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all ${
                        isFocused.email
                          ? 'border-gray-500 ring-2 ring-gray-500/20'
                          : 'border-gray-800 hover:border-gray-700'
                      } bg-gray-900/50 placeholder-gray-600 text-gray-300 outline-none`}
                      placeholder="vishalpanwar416@gmail.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wide">
                    <MessageSquare className="w-4 h-4" />
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all resize-none ${
                      isFocused.message
                        ? 'border-gray-500 ring-2 ring-gray-500/20'
                        : 'border-gray-800 hover:border-gray-700'
                    } bg-gray-900/50 placeholder-gray-600 text-gray-300 outline-none`}
                    placeholder="Tell me about your project, ideas, or how we can collaborate..."
                  ></textarea>
                </div>

                {/* WhatsApp Button */}
                <motion.a
                  href={whatsappSent ? '#' : `https://wa.me/917500988212?text=${createWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                    whatsappSent
                      ? 'bg-gray-700 cursor-default'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                  onClick={(e) => {
                    if (whatsappSent) {
                      e.preventDefault()
                      return
                    }
                    if (!formData.name.trim() && !formData.message.trim() && !formData.email.trim()) {
                      e.preventDefault()
                      alert('Please fill in at least one field before sending a message.')
                    } else {
                      setWhatsappSent(true)
                      setTimeout(() => setWhatsappSent(false), 5000)
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>{whatsappSent ? 'Message Sent!' : 'Send via WhatsApp'}</span>
                </motion.a>

                {/* Message Preview */}
                {createWhatsAppMessage() && (
                  <motion.div
                    className="p-4 bg-white/5 rounded-xl border border-gray-800"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</h4>
                    </div>
                    <p className="text-sm text-gray-400 whitespace-pre-line break-words">
                      {`Hello Vishal Panwar..!!

${formData.name.trim() ? `My name is ${formData.name}

` : ''}${formData.message.trim() ? `${formData.message}

` : ''}${formData.email.trim() ? `Email: ${formData.email}` : ''}`}
                    </p>
                  </motion.div>
                )}

                {/* Footer note */}
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                    Or reach me at{' '}
                    <a href="tel:+917500988212" className="font-semibold text-gray-300 hover:text-gray-200 transition-colors">
                      +91 7500988212
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map and Availability */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div>
            <InteractiveMap />
          </div>
          <div>
            <AvailabilityCalendar />
          </div>
        </div>
      </div>
    </section>
  )
}
