const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { title, type, location, startTime, endTime, maxCount } = event

  try {
    // Check caller is admin
    const callerRes = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (callerRes.data.length === 0 || callerRes.data[0].role !== 'admin') {
      return {
        code: -1,
        message: '权限不足，仅管理员可创建活动',
        data: null
      }
    }

    // Validate startTime is in the future
    const startDate = new Date(startTime)
    if (startDate.getTime() <= Date.now()) {
      return {
        code: -1,
        message: '开始时间必须在未来',
        data: null
      }
    }

    // Insert into activities collection
    const addRes = await db.collection('activities').add({
      data: {
        title: title,
        type: type,
        location: location,
        startTime: startDate,
        endTime: new Date(endTime),
        maxCount: maxCount,
        currentCount: 0,
        status: 'open',
        creatorId: OPENID,
        weatherCancelled: false,
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        activityId: addRes._id
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '创建活动失败',
      data: null
    }
  }
}
