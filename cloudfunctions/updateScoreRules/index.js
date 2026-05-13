const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { seasonId, rules } = event

    // Check caller is admin
    const callerRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (callerRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const caller = callerRes.data[0]
    if (caller.role !== 'admin') {
      return { code: -1, message: '无权限，仅管理员可操作', data: null }
    }

    // For each rule in input
    for (const rule of rules) {
      const { matchType, winScore, loseScore, weight } = rule

      // Try to find existing rule by seasonId + matchType
      const existingRes = await db.collection('score_rules').where({
        seasonId,
        matchType
      }).get()

      if (existingRes.data.length > 0) {
        // If exists, update it
        await db.collection('score_rules').doc(existingRes.data[0]._id).update({
          data: {
            winScore,
            loseScore,
            matchTypeWeight: weight,
            isActive: true
          }
        })
      } else {
        // If not exists, create new rule
        await db.collection('score_rules').add({
          data: {
            ruleName: matchType + '规则',
            winScore,
            loseScore,
            absentScore: -5,
            matchTypeWeight: weight,
            seasonId,
            isActive: true
          }
        })
      }
    }

    return { code: 0, message: 'ok', data: { success: true } }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
