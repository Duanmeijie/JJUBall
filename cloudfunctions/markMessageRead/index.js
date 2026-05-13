const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { messageId } = event

    // Verify message belongs to current user
    const { data: message } = await db.collection('messages').doc(messageId).get()

    if (message.toUserId !== OPENID) {
      return {
        code: -1,
        message: 'No permission to mark this message',
        data: null
      }
    }

    // Update message as read
    await db.collection('messages').doc(messageId).update({
      data: {
        isRead: true
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: { success: true }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || 'Failed to mark message as read',
      data: null
    }
  }
}
