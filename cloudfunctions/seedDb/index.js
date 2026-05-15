const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const collections = {
    users: [
      { _openid: 'mock_admin', nickname: '张三', role: 'admin', creditScore: 100, currentScore: 2850, totalScore: 5200, rank: '王者' },
      { _openid: 'mock_referee1', nickname: '李四', role: 'referee', creditScore: 95, currentScore: 2100, totalScore: 3800, rank: '黄金' },
      { _openid: 'mock_member1', nickname: '王五', role: 'member', creditScore: 90, currentScore: 1800, totalScore: 2500, rank: '白银' },
      { _openid: 'mock_member2', nickname: '赵六', role: 'member', creditScore: 85, currentScore: 3200, totalScore: 6000, rank: '王者' },
      { _openid: 'mock_member3', nickname: '孙七', role: 'member', creditScore: 80, currentScore: 1500, totalScore: 2000, rank: '白银' },
      { _openid: 'mock_member4', nickname: '周八', role: 'member', creditScore: 75, currentScore: 2200, totalScore: 3500, rank: '黄金' },
      { _openid: 'mock_member5', nickname: '吴九', role: 'member', creditScore: 70, currentScore: 900, totalScore: 1200, rank: '青铜' },
      { _openid: 'mock_member6', nickname: '郑十', role: 'member', creditScore: 88, currentScore: 2600, totalScore: 4200, rank: '黄金' },
      { _openid: 'mock_referee2', nickname: '陈裁判', role: 'referee', creditScore: 98, currentScore: 1900, totalScore: 3100, rank: '白银' },
      { _openid: 'mock_member7', nickname: '刘高手', role: 'member', creditScore: 92, currentScore: 3500, totalScore: 6800, rank: '王者' }
    ],
    seasons: [
      { name: '2026年春季赛季', startTime: '2026-03-01T00:00:00Z', endTime: '2026-06-30T23:59:59Z', status: 'active', isActive: true, archived: false }
    ],
    activities: [
      { title: '周日常规训练', description: '每周日早上8点常规乒乓球训练', type: 'training', status: 'open', maxEnroll: 20, enrollCount: 12, location: '体育馆A馆', startTime: '2026-05-18T08:00:00Z', endTime: '2026-05-18T11:00:00Z' },
      { title: '乒乓球友谊赛', description: '月度友谊赛，分ABCD四组循环赛', type: 'match', status: 'open', maxEnroll: 32, enrollCount: 24, location: '体育馆B馆', startTime: '2026-05-25T09:00:00Z', endTime: '2026-05-25T17:00:00Z' },
      { title: '新手训练营', description: '专为初学者开设的训练营', type: 'training', status: 'open', maxEnroll: 15, enrollCount: 8, location: '训练馆3楼', startTime: '2026-05-20T14:00:00Z', endTime: '2026-05-20T16:00:00Z' },
      { title: '夏季联赛-小组赛', description: '夏季联赛小组赛阶段', type: 'tournament', status: 'ongoing', maxEnroll: 64, enrollCount: 48, location: '主体育馆', startTime: '2026-06-01T08:00:00Z', endTime: '2026-06-30T18:00:00Z' }
    ],
    matches: [
      { playerA: 'mock_member1', playerB: 'mock_member2', scoreA: 4, scoreB: 2, winner: 'mock_member1', matchType: 'singles', status: 'completed' },
      { playerA: 'mock_member3', playerB: 'mock_member4', scoreA: 3, scoreB: 3, winner: '', matchType: 'singles', status: 'completed' },
      { playerA: 'mock_member5', playerB: 'mock_member6', scoreA: 4, scoreB: 1, winner: 'mock_member5', matchType: 'singles', status: 'completed' },
      { playerA: 'mock_member7', playerB: 'mock_member1', scoreA: 2, scoreB: 4, winner: 'mock_member1', matchType: 'singles', status: 'completed' },
      { playerA: 'mock_member2', playerB: 'mock_member3', scoreA: 4, scoreB: 3, winner: 'mock_member2', matchType: 'doubles', status: 'completed' },
      { playerA: 'mock_member4', playerB: 'mock_member5', scoreA: 4, scoreB: 0, winner: 'mock_member4', matchType: 'singles', status: 'completed' }
    ],
    feedbacks: [
      { userId: 'mock_member1', content: '建议增加晚上训练时间', type: 'suggestion', status: 'pending' },
      { userId: 'mock_member2', content: '体育馆A馆的空调需要维修', type: 'complaint', status: 'pending' },
      { userId: 'mock_member3', content: '希望组织更多双打比赛', type: 'suggestion', status: 'resolved' }
    ],
    messages: [
      { userId: 'mock_member1', type: 'system', title: '欢迎加入', content: '欢迎加入JJU乒乓球俱乐部！', isRead: true },
      { userId: 'mock_member1', type: 'activity', title: '报名成功', content: '您已成功报名周日常规训练', isRead: false },
      { userId: 'mock_member2', type: 'match', title: '比赛结果', content: '您在友谊赛中获胜，积分+50', isRead: false },
      { userId: 'mock_member3', type: 'system', title: '赛季更新', content: '2026年春季赛季已开始', isRead: true },
      { userId: 'mock_member4', type: 'activity', title: '活动提醒', content: '您报名的训练营明天开始', isRead: false }
    ],
    tournaments: [
      { name: '2026夏季联赛', description: '年度最大规模乒乓球联赛', status: 'ongoing', maxPlayers: 64, currentPlayers: 48 },
      { name: '端午杯邀请赛', description: '端午节特别邀请赛', status: 'ended', maxPlayers: 32, currentPlayers: 32 }
    ],
    credit_rules: [
      { tempCancelScore: 2, absentScore: 5, threshold: 60 }
    ],
    score_rules: [
      { seasonId: '2026春季赛季', rules: [
        { matchType: 'singles', matchTypeName: '单打', winScore: 50, loseScore: 10, weight: 1.0 },
        { matchType: 'doubles', matchTypeName: '双打', winScore: 40, loseScore: 8, weight: 0.8 },
        { matchType: 'training', matchTypeName: '训练赛', winScore: 20, loseScore: 5, weight: 0.5 }
      ]}
    ]
  }

  const results = {}
  for (const [name, docs] of Object.entries(collections)) {
    try {
      const inserted = []
      for (const doc of docs) {
        doc.createdAt = db.serverDate()
        doc.updatedAt = db.serverDate()
        const res = await db.collection(name).add({ data: doc })
        inserted.push(res._id)
      }
      results[name] = { success: true, count: inserted.length }
    } catch (err) {
      results[name] = { success: false, error: err.message }
    }
  }
  return { code: 0, data: results }
}
