import tableTapLogo from '../assets/Tabletap.png'

export const projects = [
  {
    title: "EditionTV",
    description: "News platform for independent, investigative journalism — Flutter reader app for Android, iOS and web, Node.js backend and CMS, a reel audio service, and GCP infrastructure in Terraform.",
    tech: ["Flutter", "Node.js", "GCP", "Cloud SQL", "Terraform"],
    features: ["Live blogs with a 30s timeline", "Search, bookmarks and history", "On-device text-to-speech", "Infra as code on GCP"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
    github: null,
    live: "https://edition.tv",
    featured: true
  },
  {
    title: "Splink Pro",
    description: "Athlete assessment platform for schools and academies — Go modular-monolith API, Next.js console and portals, an offline-first Flutter assessor app, and a private AI service, all on AWS via Terraform.",
    tech: ["Go", "PostgreSQL", "Next.js", "Flutter", "Python", "AWS", "Terraform"],
    features: ["Offline-first field capture", "Explainable individual and cohort scores", "Claude on Amazon Bedrock for guidance", "ECS Fargate + Aurora, KMS, Cognito"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original-wordmark.svg",
    github: null,
    live: "https://splinkpro.ai",
    featured: true
  },
  {
    title: "Sanero Media",
    description: "AI-powered influencer-marketing firm I built and run — Next.js 16 site with every page prerendered for SEO, an admin for creators, brands and campaigns, and AI creator matching.",
    tech: ["Next.js", "TypeScript", "Firebase", "Vercel", "LLM"],
    features: ["49 prerendered SEO routes", "AI brand–creator matching", "Campaign proposals brands approve by link", "Automated Instagram posting"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: "https://sanero.in",
    featured: true
  },
  {
    title: "Table-Tap",
    description: "Contactless QR food ordering platform with GPT-4 RAG analytics for restaurant operators — 80% faster order processing for 10K+ customers.",
    tech: ["React", "Node.js", "MongoDB", "OpenAI", "GCP", "Twilio"],
    features: ["Contactless QR ordering", "GPT-4 RAG analytics", "Event-driven notifications", "Cloud Run deployment"],
    image: tableTapLogo,
    wideImage: true,
    github: "https://github.com/vishalpanwar416/table-tap",
    live: "https://table-tap-qr.vercel.app",
    featured: true
  },
  {
    title: "Table-Tap AI",
    description: "Local OpenAI-compatible AI stack for Table Tap — Ollama models, chat UI, queue harness, and Cloudflare Tunnel so restaurant apps can call a private /v1 API like OpenAI.",
    tech: ["Node.js", "React", "Ollama", "Express", "Vite", "Cloudflare Tunnel"],
    features: ["OpenAI-compatible /v1 API", "Custom table-tap-AI models", "Chat UI + job harness", "Tunnel for remote Table Tap apps"],
    image: tableTapLogo,
    wideImage: true,
    github: null,
    live: "https://table-tap.in",
    featured: true
  },
  {
    title: "AYS Developers",
    description: "End-to-end UI/UX design and frontend development for a Dubai luxury real-estate developer — project showcases (Ventone, Breva, Tivanno, Q Gardens), mall kiosks, exhibitions, media, and SEO landing pages.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    features: ["Luxury brand website design", "Dynamic project pages", "Interactive maps & carousels", "Exhibitions & construction updates"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: "https://aysdevelopers.ae",
    featured: true
  },
  {
    title: "Aarambh",
    description: "Fitness app for a client — Flutter app, a strict-TypeScript Express 5 backend for payments, subscriptions and webhooks on Azure, and a React admin panel.",
    tech: ["Flutter", "Node.js", "TypeScript", "PostgreSQL", "Firebase", "Azure", "React"],
    features: ["Subscriptions and payment webhooks", "Admin: comp plans, cancels, audit log", "React + TanStack Query admin", "Workout charts"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg",
    github: null,
    live: "https://aarambh.app"
  },
  {
    title: "VP Control",
    description: "My private ops dashboard for every project — uptime and SSL checks, Vercel deploys, cloud bills, Razorpay revenue, app-store ratings, marketing analytics and phone alerts, plus the editor that powers this site.",
    tech: ["React", "Vercel Functions", "Firebase", "GitHub Actions", "Tailwind CSS"],
    features: ["Uptime monitor every 10 minutes", "Phone alerts via ntfy", "Traffic, SEO, campaigns and leads", "Live portfolio editor"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/Portfolio",
    live: null
  },
  {
    title: "Stacky",
    description: "Personal productivity tracker with workspaces, a focused task queue and shared tasks — plus an MCP server so Claude can read and update tasks.",
    tech: ["React", "Firebase", "MCP", "Zod"],
    features: ["Workspaces and priorities", "Task queue for focus", "Shared tasks with comments", "MCP server for AI agents"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/Stacky",
    live: "https://stackyy.vercel.app"
  },
  {
    title: "Sarai",
    description: "Search-first CRM for PGs, hostels and co-living — replaces an operator's five spreadsheets with live registers fed by public QR forms for visits, enrollment, notices and service requests.",
    tech: ["React", "Firebase"],
    features: ["QR forms, no app install", "Rooms-and-beds occupancy grid", "Visitor pipeline", "Notice and service registers"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-original.svg",
    github: null,
    live: "https://sarai.vishalpanwar.in"
  },
  {
    title: "Panwar Travels",
    description: "Website for a Saharanpur travel agency — cab booking, airport transfers, hill trips and Char Dham packages, with SEO landing pages and hand-written CSS, no UI libraries.",
    tech: ["Next.js", "TypeScript", "Resend"],
    features: ["SEO landing pages", "Booking enquiries by email", "Editorial design", "No UI framework"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: null,
    live: "https://panwar-travels.vercel.app"
  },
  {
    title: "Media-man",
    description: "AI content pipeline for the Table Tap and Sanero Instagram pages — an LLM writes the concept and caption, an image model renders the poster, and it publishes through the Instagram Graph API on a schedule.",
    tech: ["Node.js", "LLM", "Instagram Graph API", "Firestore", "systemd"],
    features: ["Posters and captions generated daily", "Scheduled publishing", "Engagement synced back", "Runs on a home server"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
    github: null,
    live: null
  },
  {
    title: "Top Selling Properties — Mobile App",
    description: "End-to-end UI/UX design and React Native development for Whassims' real-estate platform — property search, agents, projects, post-property flows, and WhatsApp lead capture.",
    tech: ["React Native", "Expo", "React Navigation", "Firebase", "JavaScript"],
    features: ["Drawer + tab navigation", "Property & project listings", "Agent marketplace", "Post property via WhatsApp"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
    github: "https://github.com/vishalpanwar416/Top-Selling-Properties",
    live: null
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
    description: "Full React Native conversion of the CREDAI Homes web product — auth, property browsing, builder dashboards, and role-based navigation with a custom design system.",
    tech: ["React Native", "TypeScript", "React Navigation", "REST APIs"],
    features: ["Web-to-mobile conversion", "Auth & user-type flows", "Property & project screens", "Builder/admin portals"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
    github: "https://github.com/vishalpanwar416/credai-mobile",
    live: null
  },
  {
    title: "A One Movers",
    description: "Complete UI/UX design and frontend development for a Canadian moving company — conversion-focused layout, service pages, reviews gallery, contact flows, and SEO-ready Next.js site.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vercel"],
    features: ["Custom brand design", "Responsive mobile-first UI", "Animated landing sections", "Contact & reviews integration"],
    image: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
    github: "https://github.com/vishalpanwar416/AOneMovers",
    live: "https://www.aonemovers.ca"
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
