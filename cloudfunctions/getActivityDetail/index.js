const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { activityId } = event

  try {
    // Query activity by _id
    const activityRes = await db.collection('activities').doc(activityId).get()
    const activity = activityRes.data

    // Query current user's signup record for this activity
    const mySignupRes = await db.collection('activity_signups').where({
      activityId: activityId,
      userId: OPENID,
      status: 'signed'
    }).get()

    const isSignedUp = mySignupRes.data.length > 0

    // Query all signups for this activity (with user info)
    const signupsRes = await db.collection('activity_signups').where({
      activityId: activityId,
      status: 'signed'
    }).get()

    // Get user info for each signup
    const signupList = []
    for (const signup of signupsRes.data) {
      const userRes = await db.collection('users').where({
        _openid: signup.userId
      }).field({
        nickName: true,
        avatarUrl: true
      }).get()

      signupList.push({
        ...signup,
        nickName: userRes.data[0] ? userRes.data[0].nickName : '',
        avatarUrl: userRes.data[0] ? userRes.data[0].avatarUrl : ''
      })
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        activity: activity,
        isSignedUp: isSignedUp,
        signupList: signupList
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '获取活动详情失败',
      data: null
    }
  }
}
