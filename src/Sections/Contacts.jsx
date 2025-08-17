import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, Linkedin, Github, Code, Send, MapPin, Clock, Briefcase, MessageCircle, User, MessageSquare, Instagram } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [isFocused, setIsFocused] = useState({})

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: "vishalpanwar416@gmail.com",
      link: "mailto:vishalpanwar416@gmail.com",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700"
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+91 7500988212",
      link: "tel:+917500988212",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700"
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "linkedin.com/in/vishalpanwar416",
      link: "https://linkedin.com/in/vishalpanwar416",
      color: "bg-gradient-to-br from-blue-600 to-blue-700",
      hoverColor: "hover:from-blue-700 hover:to-blue-800"
    },
    {
      icon: Github,
      label: "GitHub",
      value: "github.com/vishalpanwar416",
      link: "https://github.com/vishalpanwar416",
      color: "bg-gradient-to-br from-gray-700 to-gray-800",
      hoverColor: "hover:from-gray-800 hover:to-gray-900"
    },
    {
      icon: Code,
      label: "LeetCode",
      value: "leetcode.com/vishalpanwar416",
      link: "https://leetcode.com/vishalpanwar416",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700"
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email.trim()) {
      newErrors.name = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    return {
      isValid: Object.keys(newErrors).length === 0,
      validationErrors: newErrors
    }
  }, [formData])

  const createWhatsAppMessage = () => {
    if (!isValid) return null
    
    const message = `Hello Vishal Panwar..!! 

My name is ${formData.name}

${formData.message}

Email: ${formData.email}`
    
    return encodeURIComponent(message)
  }

  const createInstagramMessage = () => {
    if (!isValid) return null
    
    const message = `Hello Vishal Panwar..!! 

My name is ${formData.name}

${formData.message}

Email: ${formData.email}`
    
    return encodeURIComponent(message)
  }

  const handleWhatsAppClick = (e) => {
    if (!isValid) {
      e.preventDefault()
      setErrors(validationErrors)
      return
    }
  }

  const handleInstagramClick = (e) => {
    if (!isValid) {
      e.preventDefault()
      setErrors(validationErrors)
      return
    }
  }

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent mb-6">
            Get In Touch
          </h2>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 mx-auto rounded-full"></div>
          <p className="text-xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed">
            I'm always open to discussing new opportunities, interesting projects, and innovative ideas.
            Let's create something amazing together!
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Information */}
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
              <MapPin className="w-8 h-8 text-blue-600 mr-3" />
              Contact Information
            </h3>
            
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
                    className="block p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 hover:border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${contact.color} ${contact.hoverColor} transition-all duration-300 group-hover:scale-110`}>
                        <contact.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{contact.label}</p>
                        <p className="text-gray-800 font-medium group-hover:text-blue-600 transition-colors duration-200">
                      {contact.value}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Briefcase, text: "Full-time opportunities" },
                  { icon: Clock, text: "Freelance projects" },
                  { icon: Github, text: "Open source contributions" },
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
            className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
              <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
              Send a Message
            </h3>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Name
                  </label>
                  <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('name')}
                      onBlur={() => handleBlur('name')}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                        errors.name 
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                          : isFocused.name 
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                            : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      } bg-gray-50 focus:bg-white`}
                    placeholder="Your name"
                    required
                  />
                    {errors.name && (
                      <motion.p 
                        className="text-red-500 text-sm mt-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-600" />
                    Email
                  </label>
                  <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => handleFocus('email')}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                        errors.email 
                          ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                          : isFocused.email 
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                            : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      } bg-gray-50 focus:bg-white`}
                    placeholder="your@email.com"
                    required
                  />
                    {errors.email && (
                      <motion.p 
                        className="text-red-500 text-sm mt-1"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                  Message
                </label>
                <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                    value={formData.message}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                    className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 resize-none ${
                      errors.message 
                        ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                        : isFocused.message 
                          ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    } bg-gray-50 focus:bg-white`}
                  placeholder="Tell me about your project or opportunity..."
                  required
                ></textarea>
                  {errors.message && (
                    <motion.p 
                      className="text-red-500 text-sm mt-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.message}
                    </motion.p>
                  )}
                </div>
              </div>
              
              {/* Social Media Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* WhatsApp Button */}
                <motion.a
                  href={createWhatsAppMessage() ? `https://wa.me/917500988212?text=${createWhatsAppMessage()}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppClick}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform flex items-center justify-center space-x-3 ${
                    createWhatsAppMessage() 
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-xl hover:scale-105 cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white`}
                  whileHover={createWhatsAppMessage() ? { scale: 1.02 } : {}}
                  whileTap={createWhatsAppMessage() ? { scale: 0.98 } : {}}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span>WhatsApp</span>
                </motion.a>

                {/* Instagram Button */}
                <motion.a
                  href={createInstagramMessage() ? `https://www.instagram.com/direct/t/vishalpanwar416` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleInstagramClick}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 transform flex items-center justify-center space-x-3 ${
                    createInstagramMessage() 
                      ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 hover:shadow-xl hover:scale-105 cursor-pointer' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white`}
                  whileHover={createInstagramMessage() ? { scale: 1.02 } : {}}
                  whileTap={createInstagramMessage() ? { scale: 0.98 } : {}}
                >
                  <Instagram className="w-6 h-6" />
                  <span>Instagram</span>
                </motion.a>
              </div>

              {/* Message Preview - Updated */}
              {createWhatsAppMessage() && (
                <motion.div 
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Message Preview:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {`Hello Vishal Panwar..!! 

My name is ${formData.name}

${formData.message}

Email: ${formData.email}`}
                  </p>
                </motion.div>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Or contact me directly at: +91 7500988212
                </p>
              </div>
          </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}