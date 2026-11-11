// Connections and preferences. Secrets are never shown — only whether each
// server key is set — and the setup steps to add the missing ones.
import { useState } from 'react'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import { monthKey, revenueIn, saveDoc, timeAgo } from './data'
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

      {data.hiddenProjects.length > 0 && (
        <Section title="Hidden projects">
          <p className="mb-3 text-xs text-zinc-500">Left out of the sidebar, totals and alerts until you show them again.</p>
          <ul className="divide-y divide-white/[0.05]">
            {data.hiddenProjects.map((p) => (
              <li key={p.slug} className="flex items-center gap-3 py-2 text-sm">
                <span className="flex-1 text-zinc-300">{p.name}</span>
                <span className="text-xs text-zinc-500">{p.category}</span>
                <Button className="px-2 py-0.5 text-xs" onClick={() => saveDoc(p.id, { kind: 'project', hidden: false })}>Show again</Button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Connections">
        {data.integrations.error ? <div className="text-sm text-zinc-500">{data.integrations.error}</div> : (
          <ul className="divide-y divide-white/[0.05]">
            <Integration name="Vercel — projects, deploys, traffic" ok={st.vercel && !data.vercelError} detail={data.vercelError && <span className="text-xs text-red-300">{data.vercelError}</span>}>
              Uses <code>VERCEL_TOKEN</code> and <code>VERCEL_TEAM_ID</code>. Traffic needs Web Analytics switched on per project in Vercel (Project → Analytics → Enable).
            </Integration>

            <Integration name="Alerts & phone notifications" ok={st.monitorSecret && st.ntfy && monitorOk} detail={mon && <span className="text-xs text-zinc-500">monitor ran {timeAgo(mon.at)}</span>}>
              One script sets up the Google service account (backend storage), the monitor secret, a private ntfy topic for your phone, and the laptop agent:
              <Cmd>{`bash ~/Development/Projects/Portfolio/scripts/setup.sh`}</Cmd>
              Then install <b>ntfy</b> on your phone and subscribe to the topic it prints. Test it from the <a className="underline" href="#/alerts">Alerts</a> page. Telegram is optional:
              <Cmd>{`export GH_TOKEN=$(gh auth token -u vishalpanwar416) && gh secret set TELEGRAM_BOT_TOKEN -R ${REPO} --body "PASTE_BOT_TOKEN" && gh secret set TELEGRAM_CHAT_ID -R ${REPO} --body "PASTE_CHAT_ID"`}</Cmd>
            </Integration>

            <Integration name="Razorpay — automatic revenue (Table Tap, Aarambh)" ok={['tabletap', 'aarambh'].every((l) => (st.razorpay || []).includes(l))} detail={st.razorpay?.length > 0 && <span className="text-xs text-zinc-500">{st.razorpay.join(', ')}</span>}>
              In each Razorpay account: Account &amp; Settings → API keys → generate a <b>live</b> key. Table Tap’s takings count as your revenue; Aarambh’s are shown as the client’s (toggle on the project page).
              <Cmd>{`${CD}for L in TABLETAP AARAMBH; do read -rp "$L key id: " ID; read -rsp "$L key secret: " SEC; echo
  vercel env add RAZORPAY_\${L}_KEY_ID production --value "$ID" --yes --force --sensitive && vercel env add RAZORPAY_\${L}_KEY_SECRET production --value "$SEC" --yes --force --sensitive
done; unset ID SEC; vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>

            <Integration name="Supabase — health, size, pauses (Table Tap, SplinkPro)" ok={['tabletap', 'splink'].every((l) => (st.supabase || []).includes(l))} detail={st.supabase?.length > 0 && <span className="text-xs text-zinc-500">{st.supabase.join(', ')}</span>}>
              Create a personal access token at <a className="underline" href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noreferrer">supabase.com/dashboard/account/tokens</a> in each account that owns the projects (one token is enough if both live in the same account — paste it twice):
              <Cmd>{`${CD}for L in TABLETAP SPLINK; do read -rsp "$L Supabase token: " T; echo; vercel env add SUPABASE_\${L}_TOKEN production --value "$T" --yes --force --sensitive; done; unset T; vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>

            <Integration name="Play Console — crash and ANR rates" ok={(data.apps.data?.apps || []).some((a) => a.vitals && !a.vitals.error)}>
              Store ratings and downloads already work. For Android crash rates: Play Console → Users and permissions → Invite new users → <code>vp-control@sanero-media.iam.gserviceaccount.com</code> → app access to Aarambh with <i>View app information</i>. (Create the service account in the Firebase step below first.)
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

            <Integration name="Cloud bills — Edition TV, SplinkPro, Table Tap (Google Cloud), SplinkPro (AWS), Aarambh (Azure)" ok={st.firebase && (st.aws || []).includes('splink') && (st.azure || []).includes('aarambh')}>
              <b>Google Cloud.</b> Google only exposes spend through its billing export to BigQuery, so for each billing account:
              <ol className="mt-1 list-decimal space-y-1 pl-4">
                <li>Create the dataset the export writes into:
                  <Cmd>{`gcloud config set account editionmedia.tv@gmail.com && bq --project_id=edition-tv mk --dataset --location=US edition-tv:billing_export
gcloud config set account vishal@splinkpro.ai && bq --project_id=splink-dev-048521 mk --dataset --location=US splink-dev-048521:billing_export
gcloud config set account admin@table-tap.in && bq --project_id=table-tap-qr mk --dataset --location=US table-tap-qr:billing_export
gcloud config set account vishal.p@bluecopa.com`}</Cmd>
                </li>
                <li>Turn on <i>Standard usage cost</i> export into that dataset — this step is console-only:{' '}
                  <a className="underline" href="https://console.cloud.google.com/billing/0141EB-74B5DA-B315BE/export" target="_blank" rel="noreferrer">Edition TV billing</a>,{' '}
                  <a className="underline" href="https://console.cloud.google.com/billing/015C7A-EE6EDE-98074B/export" target="_blank" rel="noreferrer">SplinkPro billing</a>,{' '}
                  <a className="underline" href="https://console.cloud.google.com/billing/0170E2-41AB2B-D03612/export" target="_blank" rel="noreferrer">Table Tap billing</a>{' '}
                  → BigQuery export → Standard usage cost → Edit settings → project + <code>billing_export</code>. First data shows up within a day.</li>
                <li>Let the dashboard’s service account read it (create the account with the Firebase step below first):
                  <Cmd>{`SA=serviceAccount:vp-control@sanero-media.iam.gserviceaccount.com
for x in "editionmedia.tv@gmail.com edition-tv" "vishal@splinkpro.ai splink-dev-048521" "admin@table-tap.in table-tap-qr"; do set -- $x
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
              <b className="mt-3 block">Azure (Aarambh backend).</b> A service principal that can only read costs on the Aarambh subscription; again nothing is printed:
              <Cmd>{`az login   # as aarambhapp.rafs@gmail.com, if not already
read -r APP SECRET TENANT <<< "$(az ad sp create-for-rbac --name vp-control-costs --role "Cost Management Reader" --scopes /subscriptions/11381ea5-8f68-4e64-ab1b-3122845ba5db --query '[appId,password,tenant]' -o tsv)"
${CD}for kv in "TENANT $TENANT" "CLIENT_ID $APP" "SECRET $SECRET" "SUBSCRIPTION 11381ea5-8f68-4e64-ab1b-3122845ba5db"; do set -- $kv; vercel env add AZURE_COST_AARAMBH_$1 production --value "$2" --yes --force --sensitive; done && unset APP SECRET TENANT && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>

            <Integration name="Google service account — Firestore usage, monitor, laptop (do this first)" ok={st.firebase}>
              Needs a Google service account that can read Cloud Monitoring on each Firebase project:
              <Cmd>{`gcloud iam service-accounts create vp-control --project sanero-media --display-name "VP Control dashboard"
for p in sanero-media aarambh-20a47 stacky-f7f42 certificate-automation-fb39e sarai-crm; do
  gcloud projects add-iam-policy-binding $p --member serviceAccount:vp-control@sanero-media.iam.gserviceaccount.com --role roles/monitoring.viewer --condition=None
done
# lets the monitor read your dashboard edits and the laptop agent save its status
gcloud projects add-iam-policy-binding sanero-media --member serviceAccount:vp-control@sanero-media.iam.gserviceaccount.com --role roles/datastore.user --condition=None
gcloud iam service-accounts keys create /tmp/vp-control.json --iam-account vp-control@sanero-media.iam.gserviceaccount.com
${CD}base64 -w0 /tmp/vp-control.json | vercel env add GCP_SA_KEY production --yes --force --sensitive && rm /tmp/vp-control.json && vercel redeploy admin.vishalpanwar.in --target production`}</Cmd>
            </Integration>
          </ul>
        )}
      </Section>
    </div>
  )
}
