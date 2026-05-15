const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, tournamentId, page = 1, pageSize = 10 } = event

  try {
    if (action === 'getTournaments') {
      const skip = (page - 1) * pageSize
      const { total } = await db.collection('tournaments').count()
      const { data: list } = await db.collection('tournaments')
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      return {
        code: 0,
        data: { list, total, hasMore: skip + list.length < total }
      }
    }

    if (action === 'getBracket') {
      const { data: tournament } = await db.collection('tournaments')
        .doc(tournamentId)
        .get()

      const { data: matches } = await db.collection('matches')
        .where({ tournamentId })
        .get()

      const userOpenids = new Set()
      matches.forEach(m => {
        if (m.playerA_openid) userOpenids.add(m.playerA_openid)
        if (m.playerB_openid) userOpenids.add(m.playerB_openid)
        if (m.winner_openid) userOpenids.add(m.winner_openid)
      })

      const { data: users } = await db.collection('users')
        .where({ _openid: _.in([...userOpenids]) })
        .get()

      const userMap = {}
      users.forEach(u => {
        userMap[u._openid] = { nickName: u.nickName || '未知', avatarUrl: u.avatarUrl }
      })

      return {
        code: 0,
        data: {
          tournament,
          matches: matches.map(m => ({
            ...m,
            playerA: userMap[m.playerA_openid] || {},
            playerB: userMap[m.playerB_openid] || {},
            winner: userMap[m.winner_openid] || null
          }))
        }
      }
    }

    return { code: -1, message: '未知操作' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
