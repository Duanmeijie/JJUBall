const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, date, duration, notes } = event

  try {
    if (action === 'checkin') {
      const today = date || new Date().toISOString().split('T')[0]
      const existingRes = await db.collection('training_checkins')
        .where({ userId: OPENID, date: today })
        .get()

      if (existingRes.data.length > 0) {
        return { code: 1, message: '今日已打卡', data: existingRes.data[0] }
      }

      await db.collection('training_checkins').add({
        data: {
          userId: OPENID,
          date: today,
          duration: duration || 60,
          notes: notes || '',
          createdAt: db.serverDate()
        }
      })

      const streak = await calculateStreak(OPENID)
      return { code: 0, message: '打卡成功', data: { streak, today } }
    }

    if (action === 'getStats') {
      const { data: records } = await db.collection('training_checkins')
        .where({ userId: OPENID })
        .orderBy('date', 'desc')
        .limit(365)
        .get()

      const { total } = await db.collection('training_checkins')
        .where({ userId: OPENID })
        .count()

      const streak = await calculateStreak(OPENID)
      const thisMonth = new Date().toISOString().substring(0, 7)
      const { total: monthCount } = await db.collection('training_checkins')
        .where({ userId: OPENID, date: _.regexp(`^${thisMonth}`) })
        .count()

      const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0)

      return {
        code: 0,
        data: {
          totalCheckins: total,
          currentStreak: streak,
          totalDuration,
          monthCount,
          records
        }
      }
    }

    return { code: -1, message: '未知操作' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}

async function calculateStreak(openid) {
  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const { total } = await db.collection('training_checkins')
      .where({ userId: openid, date: dateStr })
      .count()

    if (total > 0) {
      streak++
    } else {
      if (i === 0) return 0
      break
    }
  }
  return streak
}
