const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, skills, targetUserId } = event

  try {
    if (action === 'getProfile') {
      const userId = targetUserId || OPENID
      const { data: existing } = await db.collection('skill_profiles')
        .where({ userId })
        .get()

      if (existing.length > 0) {
        const badges = await getBadges(userId)
        return {
          code: 0,
          data: { ...existing[0], badges }
        }
      }

      const defaultProfile = {
        userId,
        skills: {
          serving: 0, receive: 0, forehand: 0, backhand: 0, footwork: 0, tactics: 0
        },
        badges: [],
        totalAssessments: 0,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }

      await db.collection('skill_profiles').add({ data: defaultProfile })
      return { code: 0, data: { ...defaultProfile, badges: [] } }
    }

    if (action === 'updateSkills') {
      const { data: existing } = await db.collection('skill_profiles')
        .where({ userId: OPENID })
        .get()

      const now = db.serverDate()
      const baseSkills = {
        serving: 0, receive: 0, forehand: 0, backhand: 0, footwork: 0, tactics: 0
      }

      if (existing.length > 0) {
        const mergedSkills = { ...baseSkills }
        const current = existing[0].skills || {}
        Object.keys(mergedSkills).forEach(k => {
          mergedSkills[k] = Math.min(100, (current[k] || 0) + (skills[k] || 0))
        })

        await db.collection('skill_profiles').doc(existing[0]._id).update({
          data: {
            skills: mergedSkills,
            totalAssessments: (existing[0].totalAssessments || 0) + 1,
            updatedAt: now
          }
        })
      } else {
        await db.collection('skill_profiles').add({
          data: {
            userId: OPENID,
            skills: { ...baseSkills, ...skills },
            totalAssessments: 1,
            createdAt: now,
            updatedAt: now
          }
        })
      }

      const { data: updated } = await db.collection('skill_profiles')
        .where({ userId: OPENID })
        .get()

      const badges = await getBadges(OPENID)
      return { code: 0, data: { ...updated[0], badges } }
    }

    return { code: -1, message: '未知操作' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

async function getBadges(userId) {
  const { data: profile } = await db.collection('skill_profiles')
    .where({ userId })
    .get()

  if (profile.length === 0) return []

  const skills = profile[0].skills || {}
  const badges = []

  const allEarned = Object.entries(skills).every(([_, v]) => v >= 60)
  if (allEarned) badges.push({ name: '全能选手', icon: '⭐', desc: '所有技能达到60分' })

  if (skills.serving >= 80) badges.push({ name: '发球大师', icon: '🎯', desc: '发球技能达到80分' })
  if (skills.forehand >= 80) badges.push({ name: '正手杀手', icon: '💥', desc: '正手技能达到80分' })
  if (skills.backhand >= 80) badges.push({ name: '反手专家', icon: '🛡️', desc: '反手技能达到80分' })
  if (skills.footwork >= 80) badges.push({ name: '步法灵动', icon: '⚡', desc: '步法技能达到80分' })
  if (skills.tactics >= 80) badges.push({ name: '战术大师', icon: '🧠', desc: '战术技能达到80分' })
  if (profile[0].totalAssessments >= 10) badges.push({ name: '勤奋练习', icon: '🔥', desc: '完成10次技能评估' })

  return badges
}
