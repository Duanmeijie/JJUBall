const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // Query users collection by _openid
    const userRes = await db.collection('users').where({
      _openid: OPENID
    }).get()

    let userInfo

    if (userRes.data.length === 0) {
      // User not exists, create new user with defaults
      const newUser = {
        _openid: OPENID,
        role: 'member',
        creditScore: 100,
        currentScore: 0,
        totalScore: 0,
        rank: '青铜',
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }

      const addRes = await db.collection('users').add({
        data: newUser
      })

      userInfo = {
        _id: addRes._id,
        ...newUser,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } else {
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
      message: err.message || '登录失败',
      data: null
    }
  }
}
