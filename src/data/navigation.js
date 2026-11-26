export const navItems = [
  { name: "About", href: "#about" },
  { name: "Skills", href: "#skills" },
  { name: "Certifications", href: "#certifications" },
  { name: "Portfolio", href: "#portfolio" },
  { name: "Apps", href: "#apps" }
]

export const footerLinks = [
  "About",
  "Skills",
  "Portfolio",
  "Apps",
  "Contact"
]

// My own apps that anyone can use: the Apps section and the footer
// (editable in the admin: Portfolio → Contact & links; this is the built-in copy).
// icon: learn | docs | tasks | app
export const appLinks = [
  {
    label: "Learn", url: "https://learn.vishalpanwar.in", note: "System design checklist", icon: "learn", cta: "Start learning",
    description: "A free, structured path through system design: a study plan, a revision queue and notes for every topic. Sign in with Google to keep your progress on every device."
  },
  {
    label: "Docs", url: "https://docs.vishalpanwar.in", note: "Shared docs and workspaces", icon: "docs", cta: "Open Docs",
    description: "Documents, notes and files I share with clients and teams, grouped into workspaces. Sign in with Google to open the ones shared with you."
  },
  {
    label: "Stacky", url: "https://stacky.vishalpanwar.in", note: "Task queue and workspaces", icon: "tasks", cta: "Try Stacky",
    description: "A focused task tracker: workspaces, priorities and a queue that shows what to do next, with shared tasks and an MCP server so AI agents can work on them too."
  }
]
