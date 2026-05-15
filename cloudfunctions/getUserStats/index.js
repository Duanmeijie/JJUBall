const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { data: user } = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    if (user.length === 0) {
      return { code: -1, message: '用户未找到' }
    }

    const currentUser = user[0]

    const { data: allMatches } = await db.collection('matches')
      .where(_.or([
        { playerA_openid: OPENID },
        { playerB_openid: OPENID }
      ]))
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get()

    const completedMatches = allMatches.filter(m => m.status === 'completed')
    const totalMatches = completedMatches.length
    const wins = completedMatches.filter(m => m.winner_openid === OPENID).length
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    const monthlyStats = {}
    completedMatches.forEach(m => {
      if (m.createdAt) {
        const date = new Date(m.createdAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { month: monthKey, matches: 0, wins: 0 }
        }
        monthlyStats[monthKey].matches++
        if (m.winner_openid === OPENID) monthlyStats[monthKey].wins++
      }
    })

    const monthlyData = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month))

    const opponentIds = new Set()
    completedMatches.forEach(m => {
      if (m.playerA_openid === OPENID && m.playerB_openid) opponentIds.add(m.playerB_openid)
      if (m.playerB_openid === OPENID && m.playerA_openid) opponentIds.add(m.playerA_openid)
    })

    let favoriteOpponent = null
    let maxMatches = 0
    opponentIds.forEach(oppId => {
      const count = completedMatches.filter(m =>
        (m.playerA_openid === OPENID && m.playerB_openid === oppId) ||
        (m.playerB_openid === OPENID && m.playerA_openid === oppId)
      ).length
      if (count > maxMatches) {
        maxMatches = count
        favoriteOpponent = oppId
      }
    })

    let favOpponentInfo = null
    if (favoriteOpponent) {
      const { data: opp } = await db.collection('users')
        .where({ _openid: favoriteOpponent })
        .get()
      if (opp.length > 0) {
        favOpponentInfo = { nickName: opp[0].nickName, matches: maxMatches }
      }
    }

    const { data: recentMatches } = await db.collection('matches')
      .where(_.or([
        { playerA_openid: OPENID },
        { playerB_openid: OPENID }
      ]))
      .where({ status: 'completed' })
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get()

    const oppIds = new Set()
    recentMatches.forEach(m => {
      if (m.playerA_openid === OPENID && m.playerB_openid) oppIds.add(m.playerB_openid)
      if (m.playerB_openid === OPENID && m.playerA_openid) oppIds.add(m.playerA_openid)
    })

    const { data: opponents } = await db.collection('users')
      .where({ _openid: _.in([...oppIds]) })
      .get()

    const oppMap = {}
    opponents.forEach(o => { oppMap[o._openid] = o.nickName || '未知' })

    const recentWithNames = recentMatches.map(m => ({
      ...m,
      playerAName: oppMap[m.playerA_openid] || '未知',
      playerBName: oppMap[m.playerB_openid] || '未知',
      isWinner: m.winner_openid === OPENID
    }))

    const MAX_SEQUENCE = { '青铜': 99, '白银': 299, '黄金': 599, '王者': 9999 }
    const rank = currentUser.rank || '青铜'
    const currentScore = currentUser.currentScore || 0
    const maxScore = MAX_SEQUENCE[rank] || 99
    const nextRankProgress = rank === '王者' ? 100 : Math.min(100, Math.round((currentScore / maxScore) * 100))

    return {
      code: 0,
      data: {
        totalMatches,
        wins,
        totalScore: currentScore,
        creditScore: currentUser.creditScore || 100,
        winRate: totalMatches > 0 ? winRate + '%' : '--',
        nextRankProgress,
        monthlyData,
        favoriteOpponent: favOpponentInfo,
        recentMatches: recentWithNames
      }
    }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
