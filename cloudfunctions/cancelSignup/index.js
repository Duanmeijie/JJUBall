const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { activityId, reason } = event

  try {
    // Verify user has signed up
    const signupRes = await db.collection('activity_signups').where({
      activityId: activityId,
      userId: OPENID,
      status: 'signed'
    }).get()

    if (signupRes.data.length === 0) {
      return {
        code: -1,
        message: '您未报名该活动',
        data: null
      }
    }

    const signup = signupRes.data[0]

    // Get activity startTime
    const activityRes = await db.collection('activities').doc(activityId).get()
    const activity = activityRes.data

    // Calculate hours before start
    const startTime = new Date(activity.startTime).getTime()
    const now = Date.now()
    const hoursBefore = (startTime - now) / (1000 * 60 * 60)

    let creditDeducted = false

    // If < 2 hours, deduct credit score
    if (hoursBefore < 2) {
      creditDeducted = true

      // Query credit_rules for tempCancelScore
      const ruleRes = await db.collection('credit_rules').where({
        ruleType: 'tempCancelScore'
      }).get()

      let deductScore = -10 // default deduction
      if (ruleRes.data.length > 0) {
        deductScore = -Math.abs(ruleRes.data[0].score)
      }

      // Insert credit_records
      await db.collection('credit_records').add({
        data: {
          userId: OPENID,
          changeValue: deductScore,
          reason: 'temp_cancel',
          activityId: activityId,
          createdAt: db.serverDate()
        }
      })

      // Update users creditScore
      await db.collection('users').where({
        _openid: OPENID
      }).update({
        data: {
          creditScore: _.inc(deductScore),
          updatedAt: db.serverDate()
        }
      })
    }

    // Update activity_signups status to 'cancelled'
    await db.collection('activity_signups').doc(signup._id).update({
      data: {
        status: 'cancelled',
        cancelTime: db.serverDate(),
        cancelReason: reason || ''
      }
    })

    // Decrease activities.currentCount by 1
    await db.collection('activities').doc(activityId).update({
      data: {
        currentCount: _.inc(-1)
      }
    })

    // Send message to activity creator about cancellation
    await db.collection('messages').add({
      data: {
        userId: activity.creatorId,
        type: 'activity',
        title: '取消报名通知',
        content: `有成员取消了活动「${activity.title}」的报名${reason ? '，原因：' + reason : ''}`,
        activityId: activityId,
        read: false,
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: {
        success: true,
        creditDeducted: creditDeducted
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '取消报名失败',
      data: null
    }
  }
}
