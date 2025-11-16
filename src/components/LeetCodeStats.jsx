import { useEffect, useState } from 'react'

export default function LeetCodeStats({ username = 'vishalpanwar416' }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchStats = async () => {
      try {
        const query = `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile { ranking }
              submitStats: submitStatsGlobal {
                acSubmissionNum { difficulty count submissions }
              }
            }
          }
        `

        const res = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { username } }),
          signal: controller.signal,
        })

        // LeetCode often blocks browser CORS. If so, fall back to badge.
        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        if (!data?.data?.matchedUser) throw new Error('User not found or API blocked')

        const submit = data.data.matchedUser.submitStats.acSubmissionNum || []
        const total = submit.find(s => s.difficulty === 'All')?.count || 0
        const easy = submit.find(s => s.difficulty === 'Easy')?.count || 0
        const medium = submit.find(s => s.difficulty === 'Medium')?.count || 0
        const hard = submit.find(s => s.difficulty === 'Hard')?.count || 0
        const ranking = data.data.matchedUser.profile?.ranking

        setStats({ total, easy, medium, hard, ranking })
      } catch (e) {
        // Silently handle CORS and network errors
        // These are expected when LeetCode API blocks browser requests
        setError(e.message || 'Failed to load LeetCode stats')
        if (process.env.NODE_ENV === 'development') {
          console.warn('LeetCode API error (expected):', e.message)
        }
      }
    }

    fetchStats()
    return () => controller.abort()
  }, [username])

  if (error && !stats) {
    return (
      <div className="w-full flex justify-center">
        <img
          src={`https://leetcard.jacoblin.cool/${username}?hide=ranking,stars&ext=heatmap`}
          alt={`LeetCode stats for ${username}`}
          className="w-full max-w-xl rounded-2xl shadow-md border border-gray-100"
          loading="lazy"
        />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="w-full flex items-center justify-center py-10">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-800">LeetCode Stats</h3>
        <a
          href={`https://leetcode.com/${username}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          View Profile
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatBadge label="Total" value={stats.total} color="from-blue-500 to-indigo-500" />
        <StatBadge label="Easy" value={stats.easy} color="from-green-500 to-emerald-500" />
        <StatBadge label="Medium" value={stats.medium} color="from-yellow-500 to-amber-500" />
        <StatBadge label="Hard" value={stats.hard} color="from-red-500 to-rose-500" />
        {typeof stats.ranking === 'number' && (
          <StatBadge label="Ranking" value={`#${stats.ranking}`} color="from-purple-500 to-fuchsia-500" />
        )}
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
      <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-white text-xs font-semibold bg-gradient-to-r ${color} shadow-sm mb-2`}>
        {label}
      </div>
      <div className="text-xl md:text-2xl font-bold text-gray-800">{value}</div>
    </div>
  )
}
