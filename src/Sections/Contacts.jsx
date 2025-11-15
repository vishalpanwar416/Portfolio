import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, Send, MapPin, Clock, Briefcase, MessageCircle, User, MessageSquare, Instagram, Twitter } from 'lucide-react'

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
      link: "mailto:vishalpanwar416@gmail.com",
      color: "bg-gradient-to-br from-gray-700 to-gray-800",
      hoverColor: "hover:from-gray-800 hover:to-gray-900"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+91 7500988212",
      link: "tel:+917500988212",
      color: "bg-gradient-to-br from-gray-800 to-gray-900",
      hoverColor: "hover:from-gray-900 hover:to-black"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "linkedin.com/in/vishalpanwar416",
      link: "https://linkedin.com/in/vishalpanwar416",
      color: "bg-gradient-to-br from-black to-gray-900",
      hoverColor: "hover:from-gray-900 hover:to-gray-800"
    },
    {
      icon: Instagram,
      label: "Instagram",
      value: "instagram.com/vee.pyai",
      link: "https://instagram.com/vee.pyai",
      color: "bg-gradient-to-br from-gray-600 to-gray-700",
      hoverColor: "hover:from-gray-700 hover:to-gray-800"
    },
    {
      icon: Twitter,
      label: "X (Twitter)",
      value: "twitter.com/vishalpanwar416",
      link: "https://twitter.com/vishalpanwar416",
      color: "bg-gradient-to-br from-gray-700 to-gray-900",
      hoverColor: "hover:from-gray-800 hover:to-black"
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Use useMemo to prevent infinite re-renders
  const { isValid, validationErrors } = useMemo(() => {
    const newErrors = {}
    
    // Only validate fields that have content
    if (formData.name.trim() && formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (formData.message.trim() && formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    // Allow sending a message as long as there are no validation errors
    return {
      isValid: Object.keys(newErrors).length === 0,
      validationErrors: newErrors
    }
  }, [formData])

  const createWhatsAppMessage = () => {
    // Check if we have any content to send
    const hasContent = formData.name.trim() || formData.message.trim() || formData.email.trim()
    if (!hasContent) {
      return ''
    }
    
    let message = 'Hello Vishal Panwar..!!%0A%0A'  // %0A is URL-encoded newline
    
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

  // Instagram message function removed

  // These handlers are no longer needed as buttons are always active

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }

  return (
    <section id="contact" className="py-24 bg-gradient-to-br from-white via-gray-50 to-white relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-20 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        {/* Geometric grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        {/* Floating circles */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 border border-gray-200 rounded-full opacity-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-48 h-48 border-2 border-gray-300 rounded-full opacity-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container mx-auto px-3 md:px-8 relative z-10 max-w-full">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-black via-gray-800 to-black bg-clip-text text-transparent mb-6 tracking-tight">
              Let's Connect
            </h2>
          </motion.div>
          <motion.div
            className="flex items-center justify-center gap-3 mb-6"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-black"></div>
            <div className="w-2 h-2 bg-black rounded-full"></div>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-black"></div>
          </motion.div>
          <motion.p
            className="text-xl md:text-2xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            I'm always excited to discuss new opportunities, innovative projects, and creative collaborations.
            <br />
            <span className="text-black font-medium">Let's build something extraordinary together!</span>
          </motion.p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Information */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-10">
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-3 flex items-center gap-3">
                <div className="w-1 h-8 bg-black rounded-full"></div>
                Contact Details
              </h3>
              <p className="text-gray-600 ml-7 text-lg">Choose your preferred way to reach out</p>
            </div>

            <div className="space-y-4">
              {contactInfo.map((contact, index) => (
                <motion.div
                  key={index}
                  className="group"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <a
                    href={contact.link}
                    target={contact.link.startsWith('http') ? "_blank" : "_self"}
                    rel={contact.link.startsWith('http') ? "noopener noreferrer" : ""}
                    className="relative block p-6 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-gray-100 hover:border-black transition-all duration-300 overflow-hidden group-hover:shadow-2xl"
                  >
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {/* Content */}
                    <div className="relative flex items-center gap-4">
                      {/* Icon */}
                      <motion.div
                        className={`p-4 rounded-xl ${contact.color} ${contact.hoverColor} transition-all duration-300 shadow-lg`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <contact.icon className="w-6 h-6 text-white" />
                      </motion.div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{contact.label}</p>
                        <p className="text-gray-900 font-semibold text-lg group-hover:text-black transition-colors duration-200 break-words">
                          {contact.value}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <motion.div
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        initial={{ x: -10 }}
                        whileHover={{ x: 0 }}
                      >
                        <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Bottom accent line */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-black to-gray-800 rounded-full"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Availability Section - REMOVED */}
            {/* <motion.div 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <Clock className="w-6 h-6 text-blue-600 mr-2" />
                Current Availability
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { icon: Briefcase, text: "Full-time opportunities" },
                  { icon: Clock, text: "Freelance projects" },
                  { icon: MessageCircle, text: "Open source contributions" },
                  { icon: MessageCircle, text: "Technical discussions" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <item.icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{item.text}</span>
            </div>
                ))}
          </div>
            </motion.div> */}
          </motion.div>

          {/* Enhanced Contact Form */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {/* Form container with glass morphism */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 p-6 sm:p-10 rounded-3xl border-2 border-gray-200 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Decorative corner elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-200 to-transparent rounded-bl-full opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-gray-200 to-transparent rounded-tr-full opacity-20"></div>

              <div className="relative">
                <div className="mb-10">
                  <h3 className="text-3xl md:text-4xl font-bold text-black mb-3 flex items-center gap-3">
                    <div className="w-1 h-8 bg-black rounded-full"></div>
                    Send Message
                  </h3>
                  <p className="text-gray-600 ml-7 text-lg">Fill out the form and I'll get back to you soon</p>
                </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full overflow-hidden">
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  <label htmlFor="name" className="block text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                    <User className="w-4 h-4 text-black" />
                    Name
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      className={`w-full px-5 py-4 border-2 rounded-xl transition-all duration-200 ${
                        errors.name
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : isFocused.name
                            ? 'border-black focus:ring-2 focus:ring-gray-200'
                            : 'border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-gray-200'
                      } bg-white placeholder-gray-400 text-gray-900 font-medium outline-none`}
                      placeholder="John Doe"
                      required
                    />
                    {errors.name && (
                      <motion.p
                        className="text-red-500 text-sm mt-2 ml-1 font-medium"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                    <Mail className="w-4 h-4 text-black" />
                    Email
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-5 py-4 border-2 rounded-xl transition-all duration-200 ${
                        errors.email
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : isFocused.email
                            ? 'border-black focus:ring-2 focus:ring-gray-200'
                            : 'border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-gray-200'
                      } bg-white placeholder-gray-400 text-gray-900 font-medium outline-none`}
                      placeholder="john@example.com"
                      required
                    />
                    {errors.email && (
                      <motion.p
                        className="text-red-500 text-sm mt-2 ml-1 font-medium"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <label htmlFor="message" className="block text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-black" />
                  Message
                </label>
                <div className="relative group">
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                    className={`w-full px-5 py-4 border-2 rounded-xl transition-all duration-200 resize-none ${
                      errors.message
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : isFocused.message
                          ? 'border-black focus:ring-2 focus:ring-gray-200'
                          : 'border-gray-200 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-gray-200'
                    } bg-white placeholder-gray-400 text-gray-900 font-medium outline-none`}
                    placeholder="Tell me about your project, ideas, or how we can collaborate..."
                    required
                  ></textarea>
                  {errors.message && (
                    <motion.p
                      className="text-red-500 text-sm mt-2 ml-1 font-medium"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.message}
                    </motion.p>
                  )}
                </div>
              </motion.div>

              {/* WhatsApp Button - Redesigned */}
              <motion.div
                className="w-full pt-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <motion.a
                  href={whatsappSent ? '#' : `https://wa.me/917500988212?text=${createWhatsAppMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`relative w-full py-5 px-6 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden group ${
                    whatsappSent
                      ? 'bg-gradient-to-r from-gray-700 to-gray-900 cursor-default'
                      : 'bg-gradient-to-r from-black via-gray-900 to-black hover:shadow-black/20 cursor-pointer'
                  } text-white border-2 border-black`}
                  whileHover={whatsappSent ? {} : { y: -2 }}
                  whileTap={whatsappSent ? {} : { scale: 0.98 }}
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
                  {/* Shine effect */}
                  {!whatsappSent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  )}

                  {/* Icon */}
                  <motion.div
                    animate={whatsappSent ? {} : { rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                    </svg>
                  </motion.div>

                  <span className="relative z-10">{whatsappSent ? 'Message Sent!' : 'Send via WhatsApp'}</span>

                  {whatsappSent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute right-4"
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </motion.a>
              </motion.div>

              {/* Message Preview - Redesigned */}
              {createWhatsAppMessage() && (
                <motion.div
                  className="relative p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-black to-gray-700"></div>

                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Preview</h4>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line break-words leading-relaxed font-medium">
                      {`Hello Vishal Panwar..!!

${formData.name.trim() ? `My name is ${formData.name}

` : ''}${formData.message.trim() ? `${formData.message}

` : ''}${formData.email.trim() ? `Email: ${formData.email}` : ''}`}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Footer note */}
              <motion.div
                className="text-center pt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                  Or reach me directly at{' '}
                  <a href="tel:+917500988212" className="font-semibold text-black hover:underline">
                    +91 7500988212
                  </a>
                </p>
              </motion.div>
            </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}