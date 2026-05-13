const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { page = 1, pageSize = 20 } = event

    const skip = (page - 1) * pageSize

    // Query messages for current user
    const { data: list } = await db.collection('messages')
      .where({
        toUserId: OPENID
      })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // Get total count
    const { total } = await db.collection('messages')
      .where({
        toUserId: OPENID
      })
      .count()

    // Get unread count
    const { total: unreadCount } = await db.collection('messages')
      .where({
        toUserId: OPENID,
        isRead: false
      })
      .count()

    const hasMore = skip + list.length < total

    return {
      code: 0,
      message: 'ok',
      data: {
        list,
        total,
        hasMore,
        unreadCount
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || 'Failed to get messages',
      data: null
    }
  }
}
