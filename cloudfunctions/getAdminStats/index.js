const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { total: totalUsers } = await db.collection('users').count()

    const { total: totalActivities } = await db.collection('activities').count()

    const { data: seasons } = await db.collection('seasons')
      .where({ isActive: true })
      .limit(1)
      .get()
    const activeSeasonName = seasons.length > 0 ? seasons[0].name : '--'

    const { total: pendingFeedbacks } = await db.collection('feedbacks')
      .where({ status: 'pending' })
      .count()

    return {
      code: 0,
      data: {
        totalUsers,
        totalActivities,
        activeSeasonName,
        pendingFeedbacks
      }
    }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
