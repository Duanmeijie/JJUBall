const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { activityId } = event

  try {
    // Check user creditScore >= 60
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

    const user = userRes.data[0]
    if (user.creditScore < 60) {
      return {
        code: -1,
        message: '信用分不足，无法报名（需>=60分）',
        data: null
      }
    }

    // Check not already signed up
    const existingSignup = await db.collection('activity_signups').where({
      activityId: activityId,
      userId: OPENID,
      status: 'signed'
    }).get()

    if (existingSignup.data.length > 0) {
      return {
        code: -1,
        message: '您已报名该活动',
        data: null
      }
    }

    // Get activity to check maxCount
    const activityRes = await db.collection('activities').doc(activityId).get()
    const activity = activityRes.data

    // Optimistic lock: only increment if currentCount < maxCount and status is open
    const lockRes = await db.collection('activities').where({
      _id: activityId,
      currentCount: _.lt(activity.maxCount),
      status: 'open'
    }).update({
      data: {
        currentCount: _.inc(1)
      }
    })

    if (lockRes.stats.updated === 0) {
      return {
        code: -1,
        message: '报名失败，活动已满或已关闭',
        data: null
      }
    }

    // Insert activity_signups record
    await db.collection('activity_signups').add({
      data: {
        activityId: activityId,
        userId: OPENID,
        status: 'signed',
        signupTime: db.serverDate()
      }
    })

    // Send message to activity creator
    await db.collection('messages').add({
      data: {
        userId: activity.creatorId,
        type: 'activity',
        title: '新报名通知',
        content: `有新成员报名了活动「${activity.title}」`,
        activityId: activityId,
        read: false,
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        success: true
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '报名失败',
      data: null
    }
  }
}
