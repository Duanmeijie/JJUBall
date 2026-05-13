const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { tempCancelScore, absentScore, threshold } = event

    // Check caller is admin
    const callerRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (callerRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const caller = callerRes.data[0]
    if (caller.role !== 'admin') {
      return { code: -1, message: '无权限，仅管理员可操作', data: null }
    }

    // Query existing credit_rules (get first record)
    const existingRes = await db.collection('credit_rules').limit(1).get()

    if (existingRes.data.length > 0) {
      // If exists, update it
      await db.collection('credit_rules').doc(existingRes.data[0]._id).update({
        data: {
          tempCancelScore,
          absentScore,
          threshold
        }
      })
    } else {
      // If not exists, create new
      await db.collection('credit_rules').add({
        data: {
          ruleName: '默认信誉分规则',
          tempCancelScore,
          absentScore,
          threshold
        }
      })
    }

    return { code: 0, message: 'ok', data: { success: true } }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
