import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="about" className="py-24 bg-[#0a0a0a] relative overflow-hidden border-t border-gray-800/50">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-800/10 to-gray-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-gray-700/10 to-gray-800/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            About Me
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left - Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-gray-200">
              Full-Stack & Cloud Engineer passionate about AI, Data Science, and scalable systems.
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Experienced across MERN, Python, and Cloud (AWS/Azure), with DevOps and Flutter. B.Tech CSE (KIET, 2024).
              Certifications: AWS Academy Cloud Foundations, IBM AI & ML, Microsoft Azure Data Scientist Associate.
            </p>

            {/* Experience */}
            <div className="space-y-4 pt-6">
              <h4 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                Experience
              </h4>

              <div className="space-y-3">
                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <h5 className="font-semibold text-gray-200">Programmer Analyst Trainee – FTE</h5>
                  <p className="text-gray-400">Cognizant Technology Solutions</p>
                  <p className="text-sm text-gray-500">Dec 2024 – Present</p>
                </motion.div>

                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <h5 className="font-semibold text-gray-200">Programmer Analyst Intern</h5>
                  <p className="text-gray-400">Cognizant</p>
                  <p className="text-sm text-gray-500">Jul 2024 – Nov 2024</p>
                </motion.div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-4 pt-6">
              <h4 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
                <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
                Education
              </h4>

              <div className="space-y-3">
                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <h5 className="font-semibold text-gray-200">B.Tech – Computer Science & Engineering</h5>
                  <p className="text-gray-400">KIET Group of Institutions</p>
                  <p className="text-sm text-gray-500">2020–2024</p>
                </motion.div>

                <motion.div
                  className="p-4 rounded-xl bg-white/5 border border-gray-800 hover:border-gray-700 transition-all backdrop-blur-sm glass"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <h5 className="font-semibold text-gray-200">Class XII (PCM)</h5>
                  <p className="text-gray-400">Saraswati Vihar Sr. Sec. School</p>
                  <p className="text-sm text-gray-500">2019</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right - Certifications */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h4 className="text-2xl font-semibold text-gray-300 flex items-center gap-2">
              <div className="w-1 h-6 bg-gray-500 rounded-full"></div>
              Certifications
            </h4>

            <div className="space-y-4">
              {[
                {
                  title: "Microsoft Certified: Azure Data Scientist Associate",
                  date: "March 2025 - March 2026",
                  id: "42DF39354B276076",
                  link: "https://learn.microsoft.com/api/credentials/share/en-in/vishalpanwar/42DF39354B276076?sharingId"
                },
                {
                  title: "AWS Academy Graduate - AWS Academy Cloud Foundations",
                  date: "March 2024 - No Expiration",
                  id: "de038709-d600-4cb2-91ff-0162c9f98b68",
                  link: "https://www.credly.com/badges/de038709-d600-4cb2-91ff-0162c9f98b68/linked_in_profile"
                },
                {
                  title: "HackMol 4.0",
                  date: "Developer Student Club - NIT J, January 2023",
                  id: "f284425a-c375-4439-88db-c26f9a92c0fe",
                  link: "https://certificate.givemycertificate.com/c/f284425a-c375-4439-88db-c26f9a92c0fe"
                },
                {
                  title: "Machine Learning A-Z™: Hands-On Python & R In Data Science",
                  date: "September 2022 - September 2034",
                  id: "UC-df034de3-8ed8-456b-b0d7-8a56dabfb39b",
                  link: "https://ude.my/UC-df034de3-8ed8-456b-b0d7-8a56dabfb39b"
                },
                {
                  title: "Introduction to Artificial Intelligence (AI)",
                  date: "August 2021 - August 2034",
                  id: "6f74bd9186caf8cb74b613a866366e20",
                  link: "https://coursera.org/share/6f74bd9186caf8cb74b613a866366e20"
                }
              ].map((cert, index) => (
                <motion.a
                  key={index}
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="block p-5 rounded-xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all group"
                >
                  <h5 className="font-semibold text-gray-200 mb-2 group-hover:text-white transition-colors">{cert.title}</h5>
                  <p className="text-sm text-gray-400 mb-2">{cert.date}</p>
                  <p className="text-xs text-gray-500 font-mono">ID: {cert.id}</p>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
