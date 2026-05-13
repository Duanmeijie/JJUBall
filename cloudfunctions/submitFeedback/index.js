const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { content, contact } = event

    // Insert feedback record
    const { _id: feedbackId } = await db.collection('feedbacks').add({
      data: {
        userId: OPENID,
        content,
        contact: contact || '',
        status: 'pending',
        reply: '',
        createdAt: db.serverDate()
      }
    })

    // Send message to all admins
    const { data: admins } = await db.collection('users')
      .where({
        role: 'admin'
      })
      .get()

    // Insert a message for each admin
    const messagePromises = admins.map(admin => {
      return db.collection('messages').add({
        data: {
          toUserId: admin._openid || admin.openId,
          fromUserId: OPENID,
          type: 'feedback',
          title: 'New Feedback',
          content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          relatedId: feedbackId,
          isRead: false,
          createdAt: db.serverDate()
        }
      })
    })

    await Promise.all(messagePromises)

    return {
      code: 0,
      message: 'ok',
      data: { success: true, feedbackId }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || 'Failed to submit feedback',
      data: null
    }
  }
}
