const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { userId, seasonId } = event

    // If no userId, use OPENID
    const targetUserId = userId || OPENID

    // If no seasonId, get current active season
    let currentSeasonId = seasonId
    if (!currentSeasonId) {
      const seasonRes = await db.collection('seasons').where({ isActive: true }).get()
      if (seasonRes.data.length === 0) {
        return { code: -1, message: '当前没有活跃赛季', data: null }
      }
      currentSeasonId = seasonRes.data[0]._id
    }

    // Query user info
    const userRes = await db.collection('users').where({ _openid: targetUserId }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const user = userRes.data[0]

    // Query recent 10 score records for this user+season, ordered by createdAt desc
    const historyRes = await db.collection('scores').where({
      userId: targetUserId,
      seasonId: currentSeasonId
    })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    return {
      code: 0,
      message: 'ok',
      data: {
        userInfo: user,
        currentScore: user.currentScore,
        totalScore: user.totalScore,
        rank: user.rank,
        history: historyRes.data
      }
    }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
