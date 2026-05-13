const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { userId, role } = event

  try {
    // Validate role
    const validRoles = ['member', 'referee', 'admin']
    if (!validRoles.includes(role)) {
      return {
        code: -1,
        message: '无效的角色类型，必须为 member/referee/admin',
        data: null
      }
    }

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

    // Update target user's role
    await db.collection('users').doc(userId).update({
      data: {
        role: role,
        updatedAt: db.serverDate()
      }
    })

    // Get updated user info
    const updatedUserRes = await db.collection('users').doc(userId).get()
    const updatedUser = updatedUserRes.data

    // Send in-app message to target user about role change
    const roleNames = {
      member: '普通成员',
      referee: '裁判',
      admin: '管理员'
    }

    await db.collection('messages').add({
      data: {
        userId: userId,
        type: 'system',
        title: '角色变更通知',
        content: `您的角色已被更新为：${roleNames[role]}`,
        read: false,
        createdAt: db.serverDate()
      }
    })

    return {
      code: 0,
      message: 'ok',
      data: updatedUser
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || '更新角色失败',
      data: null
    }
  }
}
