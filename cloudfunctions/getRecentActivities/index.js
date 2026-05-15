const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const limit = event.limit || 5

    const { data: activities } = await db.collection('activities')
      .orderBy('startTime', 'desc')
      .limit(limit)
      .get()

    return {
      code: 0,
      data: activities
    }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
