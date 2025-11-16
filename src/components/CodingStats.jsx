import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { TrendingUp, Code2, Flame, Star, GitFork } from 'lucide-react'

export default function CodingStats({
  githubUsername = 'vishalpanwar416',
  leetcodeUsername = 'vishalpanwar416'
}) {
  const [leetcodeStats, setLeetcodeStats] = useState(null)
  const [leetcodeError, setLeetcodeError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchLeetCodeStats = async () => {
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
          body: JSON.stringify({ query, variables: { username: leetcodeUsername } }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error('Network response was not ok')
        const data = await res.json()
        if (!data?.data?.matchedUser) throw new Error('User not found or API blocked')

        const submit = data.data.matchedUser.submitStats.acSubmissionNum || []
        const total = submit.find(s => s.difficulty === 'All')?.count || 0
        const easy = submit.find(s => s.difficulty === 'Easy')?.count || 0
        const medium = submit.find(s => s.difficulty === 'Medium')?.count || 0
        const hard = submit.find(s => s.difficulty === 'Hard')?.count || 0

        setLeetcodeStats({ total, easy, medium, hard })
      } catch (e) {
        setLeetcodeError(true)
      }
    }

    fetchLeetCodeStats()
    return () => controller.abort()
  }, [leetcodeUsername])

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
          Coding Activity
        </h3>
        <div className="w-20 h-1 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 mx-auto rounded-full"></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* GitHub Streak */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-gray-400" />
            <h4 className="text-xl font-semibold text-gray-200">GitHub Streak</h4>
          </div>
          <div className="flex justify-center bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
            <img
              src={`https://github-readme-streak-stats.herokuapp.com/?user=${githubUsername}&theme=dark&background=00000000&border=1f2937&stroke=4b5563&ring=6b7280&fire=9ca3af&currStreakNum=d1d5db&sideNums=9ca3af&currStreakLabel=9ca3af&sideLabels=6b7280&dates=6b7280&hide_border=true`}
              alt="GitHub Streak Stats"
              className="w-full max-w-lg"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* LeetCode Stats */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-6 h-6 text-gray-400" />
            <h4 className="text-xl font-semibold text-gray-200">LeetCode Stats</h4>
          </div>

          {leetcodeError || !leetcodeStats ? (
            <div className="flex justify-center bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50">
              <img
                src={`https://leetcard.jacoblin.cool/${leetcodeUsername}?theme=dark&font=Source%20Code%20Pro&ext=contest`}
                alt="LeetCode Stats"
                className="w-full"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Solved" value={leetcodeStats.total} />
              <StatCard label="Easy" value={leetcodeStats.easy} />
              <StatCard label="Medium" value={leetcodeStats.medium} />
              <StatCard label="Hard" value={leetcodeStats.hard} />
            </div>
          )}
        </motion.div>
      </div>

      {/* GitHub Stats Cards */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* GitHub Stats */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-gray-400" />
            <h4 className="text-xl font-semibold text-gray-200">GitHub Stats</h4>
          </div>
          <div className="flex justify-center bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
            <img
              src={`https://github-readme-stats.vercel.app/api?username=${githubUsername}&show_icons=true&theme=dark&bg_color=00000000&title_color=d1d5db&text_color=9ca3af&icon_color=6b7280&border_color=1f2937&hide_border=true`}
              alt="GitHub Stats"
              className="w-full max-w-lg"
              loading="lazy"
            />
          </div>
        </motion.div>

        {/* Top Languages */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-6 h-6 text-gray-400" />
            <h4 className="text-xl font-semibold text-gray-200">Most Used Languages</h4>
          </div>
          <div className="flex justify-center bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
            <img
              src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${githubUsername}&layout=compact&theme=dark&bg_color=00000000&title_color=d1d5db&text_color=9ca3af&border_color=1f2937&hide_border=true`}
              alt="Top Languages"
              className="w-full max-w-lg"
              loading="lazy"
            />
          </div>
        </motion.div>
      </div>

      {/* GitHub Contribution Graph */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-800 hover:border-gray-700 transition-all"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-gray-400" />
          <h4 className="text-xl font-semibold text-gray-200">GitHub Contributions</h4>
        </div>
        <div className="flex justify-center bg-gray-900/50 rounded-xl p-4 border border-gray-800/50 overflow-x-auto">
          <img
            src={`https://ghchart.rshah.org/404040/${githubUsername}`}
            alt="GitHub Contribution Chart"
            className="w-full min-w-[600px]"
            loading="lazy"
            style={{ filter: 'brightness(1.1) contrast(1.1)' }}
          />
        </div>
      </motion.div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 text-center">
      <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-2xl md:text-3xl font-bold text-gray-200">{value}</div>
    </div>
  )
}
