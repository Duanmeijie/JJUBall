const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, targetId, message, status, page = 1, pageSize = 20 } = event

  try {
    if (action === 'findOpponents') {
      const currentUser = await db.collection('users').where({ _openid: OPENID }).get()
      if (currentUser.data.length === 0) {
        return { code: -1, message: '用户未找到' }
      }

      const user = currentUser.data[0]
      const userScore = user.currentScore || 0
      const scoreRange = 200

      const candidates = await db.collection('users')
        .where({
          _openid: _.neq(OPENID),
          currentScore: _.gte(userScore - scoreRange).and(_.lte(userScore + scoreRange))
        })
        .orderBy('currentScore', 'desc')
        .limit(50)
        .get()

      const scored = candidates.data.map(c => {
        const diff = Math.abs((c.currentScore || 0) - userScore)
        const matchScore = Math.max(0, 100 - diff / 2)
        return { ...c, matchScore: Math.round(matchScore) }
      })

      scored.sort((a, b) => b.matchScore - a.matchScore)

      return {
        code: 0,
        data: {
          list: scored.slice(0, pageSize),
          total: scored.length,
          myScore: userScore
        }
      }
    }

    if (action === 'sendChallenge') {
      await db.collection('match_requests').add({
        data: {
          fromUserId: OPENID,
          toUserId: targetId,
          status: 'pending',
          message: message || '',
          createdAt: db.serverDate()
        }
      })

      await db.collection('messages').add({
        data: {
          toUserId: targetId,
          fromUserId: OPENID,
          type: 'match',
          title: '新的约球邀请',
          content: message || '快来一起打球吧！',
          isRead: false,
          createdAt: db.serverDate()
        }
      })

      return { code: 0, message: '约球邀请已发送' }
    }

    if (action === 'myRequests') {
      const where = { fromUserId: OPENID }
      if (status) where.status = status

      const { total } = await db.collection('match_requests').where(where).count()
      const skip = (page - 1) * pageSize
      const { data: requests } = await db.collection('match_requests')
        .where(where)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      const userOpenids = [...new Set(requests.map(r => r.toUserId))]
      const { data: users } = await db.collection('users')
        .where({ _openid: _.in(userOpenids) })
        .get()

      const userMap = {}
      users.forEach(u => { userMap[u._openid] = u })

      const list = requests.map(r => ({
        ...r,
        opponent: userMap[r.toUserId] || null
      }))

      return {
        code: 0,
        data: { list, total, hasMore: skip + list.length < total }
      }
    }

    return { code: -1, message: '未知操作' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
