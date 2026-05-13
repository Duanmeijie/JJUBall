const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { userId } = event

  try {
    let userInfo

    if (userId) {
      // Query specific user by _id
      const userRes = await db.collection('users').doc(userId).get()
      userInfo = userRes.data

      // Desensitize: remove _openid when querying others
      if (userInfo._openid !== OPENID) {
        delete userInfo._openid
      }
    } else {
      // Query self by OPENID
      const userRes = await db.collection('users').where({
        _openid: OPENID
      }).get()

      if (userRes.data.length === 0) {
        return {
          code: -1,
          message: '用户不存在',
          data: null
        }
      }

      userInfo = userRes.data[0]
    }

    return {
      code: 0,
      message: 'ok',
      data: userInfo
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '获取用户信息失败',
      data: null
    }
  }
}
