const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

const RANK_COLORS_MAP = {
  '青铜': '#CD7F32', '白银': '#9E9EB0', '黄金': '#F5A623', '王者': '#D4363C'
}

Page({
  data: {
    loading: true,
    nickName: '',
    avatarLetter: '?',
    rankColor: '#CD7F32',
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    currentScore: 0,
    totalScore: 0,
    creditScore: 100,
    creditClass: 'green',
    rank: '青铜',
    nextRankProgress: 0,
    seasonName: '--',
    monthlyData: [],
    maxMonthlyMatches: 0,
    favoriteOpponent: null,
    recentMatches: []
  },

  onLoad() {
    if (!auth.requireLogin()) return
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const userInfo = wx.getStorageSync('userInfo') || {}
      const nickName = userInfo.nickName || '用户'
      const rank = userInfo.rank || '青铜'
      const rankColor = RANK_COLORS_MAP[rank] || '#CD7F32'

      this.setData({
        nickName,
        avatarLetter: nickName.charAt(0).toUpperCase(),
        rankColor,
        rank
      })

      const result = await db.callFunction('getUserStats', {})
      if (result.code === 0) {
        const d = result.data
        const losses = d.totalMatches - d.wins
        const maxMonthlyMatches = d.monthlyData && d.monthlyData.length > 0
          ? Math.max(...d.monthlyData.map(m => m.matches)) : 0

        this.setData({
          totalMatches: d.totalMatches,
          wins: d.wins,
          losses,
          winRate: d.winRate,
          currentScore: d.currentScore,
          totalScore: d.totalScore,
          creditScore: d.creditScore,
          creditClass: d.creditScore >= 80 ? 'green' : (d.creditScore >= 60 ? 'orange' : 'red'),
          nextRankProgress: d.nextRankProgress || 0,
          seasonName: d.seasonName || '--',
          monthlyData: (d.monthlyData || []).map(m => ({
            ...m,
            shortMonth: m.month ? m.month.slice(5) : ''
          })),
          maxMonthlyMatches,
          favoriteOpponent: d.favoriteOpponent,
          recentMatches: d.recentMatches || []
        })
      }
    } catch (err) {
      console.error('加载数据看板失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
