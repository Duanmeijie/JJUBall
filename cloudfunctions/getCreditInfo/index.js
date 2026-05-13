const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { userId } = event

    // If no userId, use OPENID
    const targetUserId = userId || OPENID

    // Query user's creditScore from users
    const userRes = await db.collection('users').where({ _openid: targetUserId }).get()
    if (userRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const creditScore = userRes.data[0].creditScore

    // Query recent 10 credit_records for this user, ordered by createdAt desc
    const recordsRes = await db.collection('credit_records').where({
      userId: targetUserId
    })
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get()

    return {
      code: 0,
      message: 'ok',
      data: {
        creditScore,
        records: recordsRes.data
      }
    }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
