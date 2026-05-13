const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { activityId, reason } = event

  try {
    // Check caller is admin
    const callerRes = await db.collection('users').where({
      _openid: OPENID
    }).get()

    if (callerRes.data.length === 0 || callerRes.data[0].role !== 'admin') {
      return {
        code: -1,
        message: '权限不足，仅管理员可操作',
        data: null
      }
    }

    // Update activity: weatherCancelled=true, status='cancelled'
    await db.collection('activities').doc(activityId).update({
      data: {
        weatherCancelled: true,
        status: 'cancelled',
        cancelledReason: reason,
        updatedAt: db.serverDate()
      }
    })

    // Query all signups where activityId and status='signed'
    const signupsRes = await db.collection('activity_signups').where({
      activityId: activityId,
      status: 'signed'
    }).get()

    let notifiedCount = 0

    // For each signup
    for (const signup of signupsRes.data) {
      // Insert credit_records with changeValue=0, reason='weather_exempt'
      await db.collection('credit_records').add({
        data: {
          userId: signup.userId,
          changeValue: 0,
          reason: 'weather_exempt',
          activityId: activityId,
          createdAt: db.serverDate()
        }
      })

      // Insert messages
      await db.collection('messages').add({
        data: {
          userId: signup.userId,
          type: 'activity',
          title: '活动因天气取消',
          content: `活动已因天气原因取消，原因：${reason}。您的信用分不受影响。`,
          activityId: activityId,
          read: false,
          createdAt: db.serverDate()
        }
      })

      notifiedCount++
    }

    // Try to send subscribe messages (don't fail if send fails)
    try {
      for (const signup of signupsRes.data) {
        // Get user openid for sending subscribe message
        const userRes = await db.collection('users').where({
          _openid: signup.userId
        }).get()

        if (userRes.data.length > 0) {
          await cloud.openapi.subscribeMessage.send({
            touser: signup.userId,
            templateId: '', // Template ID needs to be configured
            data: {
              thing1: { value: '活动因天气取消' },
              thing2: { value: reason.substring(0, 20) }
            }
          })
        }
      }
    } catch (subscribeErr) {
      // Don't fail if subscribe message send fails
      console.log('Subscribe message send failed:', subscribeErr.message)
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        success: true,
        notifiedCount: notifiedCount
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '取消活动失败',
      data: null
    }
  }
}
