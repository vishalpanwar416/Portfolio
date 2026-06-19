import tableTapLogo from '../assets/Tabletap.png'

export const projects = [
  {
    title: "Table-Tap",
    description: "Contactless QR food ordering platform with GPT-4 RAG analytics for restaurant operators — 80% faster order processing for 10K+ customers.",
    tech: ["React", "Node.js", "MongoDB", "OpenAI", "GCP", "Twilio"],
    features: ["Contactless QR ordering", "GPT-4 RAG analytics", "Event-driven notifications", "Cloud Run deployment"],
    image: tableTapLogo,
    github: "https://github.com/vishalpanwar416/table-tap",
    live: "https://table-tap-qr.vercel.app"
  },
  {
    title: "Freddy — Job Automation",
    description: "Autonomous job pipeline: search → tailor resume → apply → cold email → track replies across Indeed, LinkedIn, Naukri, and Dice.",
    tech: ["Node.js", "Playwright", "SQLite", "LLM", "MCP", "Firebase"],
    features: ["Multi-platform apply", "ATS resume tailoring", "Personalised outreach", "Dashboard & mobile sync"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    github: "https://github.com/vishalpanwar416/job-automation",
    live: "#"
  },
  {
    title: "Discovr.ai",
    description: "AI-powered social analytics dashboard aggregating 10K+ daily signals from 5+ platforms with LLM sentiment analysis.",
    tech: ["Next.js", "Go", "PostgreSQL", "GCP", "Terraform", "Python"],
    features: ["50K+ posts/day ingestion", "LLM review agents", "Real-time dashboards", "99.9% uptime on Cloud Run"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: "#"
  },
  {
    title: "E-Commerce Aggregator",
    description: "Distributed price comparison engine integrating 5+ e-commerce APIs with async workers, caching, and real-time WebSocket updates.",
    tech: ["Node.js", "Redis", "Bull Queue", "WebSockets", "Firebase"],
    features: ["500+ req/min throughput", "99.5% success rate", "Multi-layer caching", "Circuit breakers"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg",
    github: "https://github.com/vishalpanwar416/Scrapper",
    live: "#"
  },
  {
    title: "Tarzbygazala",
    description: "Modern e-commerce clothing store with responsive design, product catalog, and secure checkout.",
    tech: ["React", "Next.js", "Tailwind CSS", "Stripe", "MongoDB", "Vercel"],
    features: ["Responsive design", "Product catalog", "Shopping cart", "Secure payments"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: null,
    live: "https://tarzbygazala.com"
  }
]
