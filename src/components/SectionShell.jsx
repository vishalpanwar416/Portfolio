export default function SectionShell({ id, children, className = '' }) {
  return (
    <section
      id={id}
      className={`py-24 bg-black relative overflow-hidden border-t border-white/[0.06] ${className}`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 noise-texture opacity-[0.015] pointer-events-none" />
      <div className="container mx-auto px-5 sm:px-8 relative z-10">{children}</div>
    </section>
  )
}
