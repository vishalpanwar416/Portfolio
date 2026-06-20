import tableTapLogo from '../assets/Tabletap.png'

export const projects = [
  {
    title: "Table-Tap",
    description: "Contactless QR food ordering platform with GPT-4 RAG analytics for restaurant operators — 80% faster order processing for 10K+ customers.",
    tech: ["React", "Node.js", "MongoDB", "OpenAI", "GCP", "Twilio"],
    features: ["Contactless QR ordering", "GPT-4 RAG analytics", "Event-driven notifications", "Cloud Run deployment"],
    image: tableTapLogo,
    github: "https://github.com/vishalpanwar416/table-tap",
    live: "https://table-tap-qr.vercel.app",
    featured: true
  },
  {
    title: "Top Selling Properties — Mobile App",
    description: "End-to-end UI/UX design and React Native development for Whassims' real-estate platform — property search, agents, projects, post-property flows, and WhatsApp lead capture.",
    tech: ["React Native", "Expo", "React Navigation", "Firebase", "JavaScript"],
    features: ["Drawer + tab navigation", "Property & project listings", "Agent marketplace", "Post property via WhatsApp"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/Top-Selling-Properties",
    live: null,
    featured: true
  },
  {
    title: "TSP Marketing Module",
    description: "Designed and built the marketing automation dashboard for Top Selling Properties — campaigns, contact lists, WhatsApp/email outreach, templates, and scheduling.",
    tech: ["React", "Vite", "Firebase", "React Router", "Tailwind CSS"],
    features: ["Marketing dashboard UI", "Campaign management", "WhatsApp & email flows", "Contact import (XLSX)"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/TSP-Marketing",
    live: null
  },
  {
    title: "CREDAI Homes — Mobile App",
    description: "Full React Native conversion of the CREDAI Homes web product — auth, property browsing, developer dashboards, and role-based navigation with a custom design system.",
    tech: ["React Native", "TypeScript", "React Navigation", "REST APIs"],
    features: ["Web-to-mobile conversion", "Auth & user-type flows", "Property & project screens", "Developer/admin modules"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    github: "https://github.com/vishalpanwar416/credai-mobile",
    live: null
  },
  {
    title: "Tarzbygazala",
    description: "Complete UI/UX design and frontend development for a fashion e-commerce brand — custom layouts, product catalog, cart, and checkout experience.",
    tech: ["React", "Next.js", "Tailwind CSS", "Stripe", "MongoDB", "Vercel"],
    features: ["Brand UI from scratch", "Responsive storefront", "Product catalog & cart", "Secure Stripe checkout"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: "https://tarzbygazala.com"
  },
  {
    title: "Freddy — Job Automation",
    description: "Autonomous job pipeline: search → tailor resume → apply → cold email → track replies across Indeed, LinkedIn, Naukri, and Dice.",
    tech: ["Node.js", "Playwright", "SQLite", "LLM", "MCP", "Firebase"],
    features: ["Multi-platform apply", "ATS resume tailoring", "Personalised outreach", "Dashboard & mobile sync"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    github: "https://github.com/vishalpanwar416/job-automation",
    live: null
  },
  {
    title: "Discovr.ai",
    description: "Full-stack AI social analytics product — designed React/Next.js dashboards and built Go microservices for multi-platform ingestion and LLM sentiment analysis.",
    tech: ["Next.js", "React", "Go", "PostgreSQL", "GCP", "Terraform"],
    features: ["Analytics dashboard UI", "50K+ posts/day ingestion", "LLM review agents", "99.9% uptime on Cloud Run"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: null,
    private: true
  },
  {
    title: "TSP Certification Module",
    description: "React dashboard for generating and sending event certificates at scale — template management, bulk uploads, and Firebase-backed delivery.",
    tech: ["React", "Vite", "Firebase", "XLSX", "Tailwind CSS"],
    features: ["Certificate templates", "Bulk recipient import", "Automated sending", "Shared Firebase backend"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/TSP-Certification-module",
    live: null
  },
  {
    title: "E-Commerce Aggregator",
    description: "Distributed price comparison engine integrating 5+ e-commerce APIs with async workers, caching, and real-time WebSocket updates.",
    tech: ["Node.js", "Redis", "Bull Queue", "WebSockets", "Firebase"],
    features: ["500+ req/min throughput", "99.5% success rate", "Multi-layer caching", "Circuit breakers"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
    github: "https://github.com/vishalpanwar416/Scrapper",
    live: null
  }
]
