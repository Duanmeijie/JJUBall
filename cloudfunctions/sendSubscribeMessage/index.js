const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { touser, templateId, data, page } = event

    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      templateId,
      data,
      page: page || 'pages/index/index'
    })

    return {
      code: 0,
      message: 'ok',
      data: { success: true }
    }
  } catch (err) {
    // Subscribe messages may fail if user hasn't granted permission
    return {
      code: -1,
      message: err.message || 'Failed to send subscribe message',
      data: null
    }
  }
}
