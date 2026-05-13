const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { activityId, playerA, playerB, matchType, seasonId } = event

    // Check caller is referee or admin
    const callerRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (callerRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const caller = callerRes.data[0]
    if (caller.role !== 'referee' && caller.role !== 'admin') {
      return { code: -1, message: '无权限，仅裁判或管理员可创建比赛', data: null }
    }

    // Validate playerA !== playerB
    if (playerA === playerB) {
      return { code: -1, message: '两位选手不能是同一人', data: null }
    }

    // If no seasonId, query current active season
    let currentSeasonId = seasonId
    if (!currentSeasonId) {
      const seasonRes = await db.collection('seasons').where({ isActive: true }).get()
      if (seasonRes.data.length === 0) {
        return { code: -1, message: '当前没有活跃赛季', data: null }
      }
      currentSeasonId = seasonRes.data[0]._id
    }

    // Insert into matches
    const addRes = await db.collection('matches').add({
      data: {
        activityId: activityId || '',
        playerA,
        playerB,
        scoreA: 0,
        scoreB: 0,
        winnerId: '',
        matchType,
        seasonId: currentSeasonId,
        refereeId: OPENID,
        status: 'pending',
        createdAt: db.serverDate()
      }
    })

    return { code: 0, message: 'ok', data: { matchId: addRes._id } }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
