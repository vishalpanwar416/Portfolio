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
              <Cmd>{`export GH_TOKEN=$(gh auth token -u vishalpanwar416) && gh secret set TELEGRAM_BOT_TOKEN -R ${REPO} --body "PASTE_BOT_TOKEN" && gh secret set TELEGRAM_CHAT_ID -R ${REPO} --body "PASTE_CHAT_ID" && gh workflow run monitor.yml -R ${REPO}`}</Cmd>
              Optional — also watch every Vercel custom domain, not just the ones listed on projects:
              <Cmd>{`export GH_TOKEN=$(gh auth token -u vishalpanwar416) && gh secret set VERCEL_TOKEN -R ${REPO} --body "PASTE_VERCEL_TOKEN" && gh secret set VERCEL_TEAM_ID -R ${REPO} --body "team_fzknfdYzx339Ps3Qh3RTiiPb"`}</Cmd>
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

            <Integration name="Cloud bills — Edition TV (Google Cloud), SplinkPro (AWS + Google Cloud)" ok={st.firebase && (st.aws || []).includes('splink')}>
              <b>Google Cloud.</b> Google only exposes spend through its billing export to BigQuery, so for each billing account:
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Create the dataset the export writes into:
                  <Cmd>{`gcloud config set account editionmedia.tv@gmail.com && bq --project_id=edition-tv mk --dataset --location=US edition-tv:billing_export
gcloud config set account vishal@splinkpro.ai && bq --project_id=splink-dev-048521 mk --dataset --location=US splink-dev-048521:billing_export
gcloud config set account vishal.p@bluecopa.com`}</Cmd>
                </li>
                <li>Turn on <i>Standard usage cost</i> export into that dataset — this step is console-only:{' '}
                  <a className="underline" href="https://console.cloud.google.com/billing/0141EB-74B5DA-B315BE/export" target="_blank" rel="noreferrer">Edition TV billing</a>,{' '}
                  <a className="underline" href="https://console.cloud.google.com/billing/015C7A-EE6EDE-98074B/export" target="_blank" rel="noreferrer">SplinkPro billing</a>{' '}
                  → BigQuery export → Standard usage cost → Edit settings → project + <code>billing_export</code>. First data shows up within a day.</li>
                <li>Let the dashboard’s service account read it (create the account with the Firebase step below first):
                  <Cmd>{`SA=serviceAccount:vp-control@sanero-media.iam.gserviceaccount.com
for x in "editionmedia.tv@gmail.com edition-tv" "vishal@splinkpro.ai splink-dev-048521"; do set -- $x
  for r in roles/bigquery.dataViewer roles/bigquery.jobUser; do gcloud projects add-iam-policy-binding $2 --account $1 --member $SA --role $r --condition=None; done
done`}</Cmd>
                </li>
              </ol>
              <b className="mt-3 block">AWS (SplinkPro).</b> A read-only IAM user that can only call Cost Explorer; the keys go straight into Vercel without being printed:
              <Cmd>{`aws login --profile splink
aws iam create-user --user-name vp-control-costs --profile splink
aws iam put-user-policy --user-name vp-control-costs --policy-name cost-explorer-read --profile splink --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ce:GetCostAndUsage"],"Resource":"*"}]}'
read -r ID SECRET <<< "$(aws iam create-access-key --user-name vp-control-costs --profile splink --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)"
${CD}vercel env add AWS_COST_SPLINK_KEY_ID production --value "$ID" --yes --force --sensitive && vercel env add AWS_COST_SPLINK_SECRET production --value "$SECRET" --yes --force --sensitive && unset ID SECRET && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
              Cost Explorer charges $0.01 per lookup; the dashboard caches each bill for 3 hours.
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
