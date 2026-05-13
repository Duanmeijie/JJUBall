const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { seasonId, page = 1, pageSize = 20 } = event

    // If no seasonId, get current active season
    let currentSeasonId = seasonId
    if (!currentSeasonId) {
      const seasonRes = await db.collection('seasons').where({ isActive: true }).get()
      if (seasonRes.data.length === 0) {
        return { code: -1, message: '当前没有活跃赛季', data: null }
      }
      currentSeasonId = seasonRes.data[0]._id
    }

    // Get total count
    const countRes = await db.collection('users').where({
      seasonId: currentSeasonId
    }).count()
    const total = countRes.total

    // Query users ordered by currentScore desc, with pagination
    const skip = (page - 1) * pageSize
    const listRes = await db.collection('users')
      .orderBy('currentScore', 'desc')
      .skip(skip)
      .limit(pageSize)
      .field({
        nickName: true,
        avatarUrl: true,
        currentScore: true,
        totalScore: true,
        rank: true
      })
      .get()

    const hasMore = skip + listRes.data.length < total

    return {
      code: 0,
      message: 'ok',
      data: {
        list: listRes.data,
        total,
        hasMore
      }
    }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
