const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    const { matchId, scoreA, scoreB } = event

    // Check caller is referee or admin
    const callerRes = await db.collection('users').where({ _openid: OPENID }).get()
    if (callerRes.data.length === 0) {
      return { code: -1, message: '用户不存在', data: null }
    }
    const caller = callerRes.data[0]
    if (caller.role !== 'referee' && caller.role !== 'admin') {
      return { code: -1, message: '无权限，仅裁判或管理员可提交比赛结果', data: null }
    }

    // START TRANSACTION
    const transaction = await db.startTransaction()

    try {
      // 1. Get match record, verify status='pending'
      const matchRes = await transaction.collection('matches').doc(matchId).get()
      const match = matchRes.data
      if (match.status !== 'pending') {
        await transaction.rollback()
        return { code: -1, message: '比赛状态不是待处理', data: null }
      }

      // 2. Determine winnerId
      const winnerId = scoreA > scoreB ? match.playerA : match.playerB
      const loserId = scoreA > scoreB ? match.playerB : match.playerA

      // 3. Query score_rules by seasonId + matchType + isActive=true
      const ruleRes = await transaction.collection('score_rules').where({
        seasonId: match.seasonId,
        matchType: match.matchType,
        isActive: true
      }).get()

      if (ruleRes.data.length === 0) {
        await transaction.rollback()
        return { code: -1, message: '未找到对应的积分规则', data: null }
      }
      const rule = ruleRes.data[0]

      // 4. Calculate score changes
      const winnerChange = rule.winScore * rule.matchTypeWeight
      const loserChange = rule.loseScore * rule.matchTypeWeight

      // 5. Update match: scoreA, scoreB, winnerId, status='completed'
      await transaction.collection('matches').doc(matchId).update({
        data: {
          scoreA,
          scoreB,
          winnerId,
          status: 'completed'
        }
      })

      // 6. Update playerA's users score
      const playerAChange = match.playerA === winnerId ? winnerChange : loserChange
      await transaction.collection('users').where({ _openid: match.playerA }).update({
        data: {
          currentScore: _.inc(playerAChange),
          totalScore: _.inc(playerAChange)
        }
      })

      // 7. Update playerB's users score
      const playerBChange = match.playerB === winnerId ? winnerChange : loserChange
      await transaction.collection('users').where({ _openid: match.playerB }).update({
        data: {
          currentScore: _.inc(playerBChange),
          totalScore: _.inc(playerBChange)
        }
      })

      // 8. Insert 2 score records into scores collection
      await transaction.collection('scores').add({
        data: {
          userId: match.playerA,
          matchId,
          seasonId: match.seasonId,
          matchType: match.matchType,
          scoreChange: playerAChange,
          reason: match.playerA === winnerId ? '胜利' : '失败',
          createdAt: db.serverDate()
        }
      })
      await transaction.collection('scores').add({
        data: {
          userId: match.playerB,
          matchId,
          seasonId: match.seasonId,
          matchType: match.matchType,
          scoreChange: playerBChange,
          reason: match.playerB === winnerId ? '胜利' : '失败',
          createdAt: db.serverDate()
        }
      })

      // 9. Check rank promotion for both players
      const checkAndUpdateRank = async (playerId) => {
        const userRes = await transaction.collection('users').where({ _openid: playerId }).get()
        if (userRes.data.length === 0) return
        const user = userRes.data[0]
        const totalScore = user.totalScore

        let newRank = '青铜'
        if (totalScore >= 600) {
          newRank = '王者'
        } else if (totalScore >= 300) {
          newRank = '黄金'
        } else if (totalScore >= 100) {
          newRank = '白银'
        }

        // 10. If rank changed, update user rank and send rank promotion message
        if (user.rank !== newRank) {
          await transaction.collection('users').where({ _openid: playerId }).update({
            data: { rank: newRank }
          })
          // Send rank promotion message (站内消息)
          await transaction.collection('messages').add({
            data: {
              userId: playerId,
              type: 'rank_promotion',
              title: '段位晋升通知',
              content: `恭喜您晋升为「${newRank}」段位！`,
              isRead: false,
              createdAt: db.serverDate()
            }
          })
        }
      }

      await checkAndUpdateRank(match.playerA)
      await checkAndUpdateRank(match.playerB)

      // 11. COMMIT transaction
      await transaction.commit()

      // After transaction: send match result messages to both players (站内消息)
      await db.collection('messages').add({
        data: {
          userId: match.playerA,
          type: 'match_result',
          title: '比赛结果通知',
          content: `您的比赛已结束，比分 ${scoreA}:${scoreB}，积分变化：${playerAChange > 0 ? '+' : ''}${playerAChange}`,
          isRead: false,
          createdAt: db.serverDate()
        }
      })
      await db.collection('messages').add({
        data: {
          userId: match.playerB,
          type: 'match_result',
          title: '比赛结果通知',
          content: `您的比赛已结束，比分 ${scoreA}:${scoreB}，积分变化：${playerBChange > 0 ? '+' : ''}${playerBChange}`,
          isRead: false,
          createdAt: db.serverDate()
        }
      })

      return {
        code: 0,
        message: 'ok',
        data: {
          success: true,
          scoreChanges: {
            playerA: playerAChange,
            playerB: playerBChange
          }
        }
      }
    } catch (e) {
      await transaction.rollback()
      throw e
    }
  } catch (e) {
    return { code: -1, message: e.message, data: null }
  }
}
