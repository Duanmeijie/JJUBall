const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { status, type, page = 1, pageSize = 10 } = event

  try {
    // Build where clause from filters
    const where = {}
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    // Count total
    const countRes = await db.collection('activities').where(where).count()
    const total = countRes.total

    // Query activities with pagination, ordered by startTime desc
    const skip = (page - 1) * pageSize
    const listRes = await db.collection('activities')
      .where(where)
      .orderBy('startTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    const hasMore = skip + listRes.data.length < total

    return {
      code: 0,
      message: 'ok',
      data: {
        list: listRes.data,
        total: total,
        hasMore: hasMore
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '获取活动列表失败',
      data: null
    }
  }
}
