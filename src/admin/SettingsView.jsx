// Connections and preferences. Secrets are never shown — only whether each
// server key is set — and the setup steps to add the missing ones.
import { useState } from 'react'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import { monthKey, revenueIn, timeAgo } from './data'
import { GoalCard } from './MoneyView'
import { Badge, Button, Section, cx } from './ui'

const REPO = 'vishalpanwar416/Portfolio'
const CD = 'cd ~/Development/Projects/Portfolio && '

function Cmd({ children }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <div className="group relative mt-2">
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-white/[0.06] bg-black/50 px-3 py-2 pr-9 font-mono text-[11px] leading-relaxed text-zinc-300">{children}</pre>
      <button onClick={copy} className="absolute right-2 top-2 text-zinc-500 hover:text-white" aria-label="Copy">{copied ? <Check size={13} /> : <Copy size={13} />}</button>
    </div>
  )
}

function Integration({ name, ok, children, detail }) {
  const [open, setOpen] = useState(!ok)
  return (
    <li className="py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-left">
        <span className={cx('grid h-5 w-5 shrink-0 place-items-center rounded-full', ok ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-zinc-500')}>
          {ok ? <Check size={12} /> : <X size={12} />}
        </span>
        <span className="flex-1 text-sm text-zinc-100">{name}</span>
        {detail}
        <Badge tone={ok ? 'green' : 'zinc'}>{ok ? 'connected' : 'not set up'}</Badge>
      </button>
      {open && <div className="mt-2 pl-8 text-xs leading-relaxed text-zinc-400">{children}</div>}
    </li>
  )
}

export default function SettingsView({ data, install }) {
  const st = data.integrations.data || {}
  const thisMonth = data.projects.reduce((t, p) => t + revenueIn(p, monthKey()), 0)
  const mon = st.monitor
  const monitorOk = mon && mon.conclusion === 'success'

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        <GoalCard settings={data.settings} thisMonth={thisMonth} />
        <Section title="Install as an app" className="lg:col-span-2">
          <p className="text-sm text-zinc-400">Adds “VP Control” to your home screen or dock and opens it full-screen, without the browser bar.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {install ? <Button variant="primary" onClick={install}><Download size={14} /> Install</Button> : (
              <span className="text-xs text-zinc-500">
                Already installed, or your browser shows it in its own menu — Chrome: ⋮ → “Install VP Control”. iPhone Safari: Share → “Add to Home Screen”.
              </span>
            )}
          </div>
        </Section>
      </div>

      <Section title="Connections">
        {data.integrations.error ? <div className="text-sm text-zinc-500">{data.integrations.error}</div> : (
          <ul className="divide-y divide-white/[0.05]">
            <Integration name="Vercel — projects, deploys, traffic" ok={st.vercel && !data.vercelError} detail={data.vercelError && <span className="text-xs text-red-300">{data.vercelError}</span>}>
              Uses <code>VERCEL_TOKEN</code> and <code>VERCEL_TEAM_ID</code>. Traffic needs Web Analytics switched on per project in Vercel (Project → Analytics → Enable).
            </Integration>

            <Integration name="Uptime & renewal alerts (Telegram)" ok={monitorOk} detail={mon && <span className="text-xs text-zinc-500">last run {timeAgo(mon.at)}</span>}>
              A GitHub Actions job in <a className="underline" href={st.monitorWorkflow} target="_blank" rel="noreferrer">{REPO}</a> checks every site every 10 minutes and messages you when one goes down or comes back, plus a 9am note when a domain or certificate is about to expire.
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>In Telegram, message <b>@BotFather</b> → <code>/newbot</code>, copy the bot token. (Or reuse the Hermes bot.)</li>
                <li>Send your bot any message, then open <code>https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code> and copy <code>chat.id</code>.</li>
                <li>Save both as repo secrets (run in Claude Code with <code>!</code>, or a terminal):</li>
              </ol>
              <Cmd>{`gh secret set TELEGRAM_BOT_TOKEN -R ${REPO} --body "PASTE_BOT_TOKEN" && gh secret set TELEGRAM_CHAT_ID -R ${REPO} --body "PASTE_CHAT_ID" && gh workflow run monitor.yml -R ${REPO}`}</Cmd>
              Optional — also watch every Vercel custom domain, not just the ones listed on projects:
              <Cmd>{`gh secret set VERCEL_TOKEN -R ${REPO} --body "PASTE_VERCEL_TOKEN" && gh secret set VERCEL_TEAM_ID -R ${REPO} --body "team_fzknfdYzx339Ps3Qh3RTiiPb"`}</Cmd>
            </Integration>

            <Integration name="GitHub — commits, PRs, CI" ok={st.github}>
              Public repos already work. For private and org repos, create a fine-grained token at <a className="underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">github.com/settings/personal-access-tokens <ExternalLink size={10} className="inline" /></a> with read-only <i>Contents</i>, <i>Metadata</i>, <i>Pull requests</i> and <i>Actions</i> (classic token: <code>repo</code> scope), then:
              <Cmd>{`${CD}vercel env add GITHUB_TOKEN production --value "PASTE_TOKEN" --yes --force --sensitive && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>

            <Integration name="Stacky — open tasks per project" ok={st.stacky && !data.stacky.error} detail={data.stacky.error && !data.stacky.notConfigured && <span className="text-xs text-red-300">{data.stacky.error}</span>}>
              In Stacky open your profile → <b>Claude / MCP access</b> → create a token, then:
              <Cmd>{`${CD}vercel env add STACKY_MCP_TOKEN production --value "PASTE_TOKEN" --yes --force --sensitive && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
              Tasks show on a project when its Stacky project has the same name (or set the names under Edit on the project page).
            </Integration>

            <Integration name="Firebase — Firestore reads/writes" ok={st.firebase}>
              Needs a Google service account that can read Cloud Monitoring on each Firebase project:
              <Cmd>{`gcloud iam service-accounts create vp-control --project sanero-media --display-name "VP Control dashboard"
for p in sanero-media aarambh-20a47 stacky-f7f42 certificate-automation-fb39e sarai-crm; do
  gcloud projects add-iam-policy-binding $p --member serviceAccount:vp-control@sanero-media.iam.gserviceaccount.com --role roles/monitoring.viewer --condition=None
done
gcloud iam service-accounts keys create /tmp/vp-control.json --iam-account vp-control@sanero-media.iam.gserviceaccount.com
${CD}base64 -w0 /tmp/vp-control.json | vercel env add GCP_SA_KEY production --yes --force --sensitive && rm /tmp/vp-control.json && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>
          </ul>
        )}
      </Section>
    </div>
  )
}
