const db = require('../../../utils/db')
const { formatDateTime, formatScoreChange } = require('../../../utils/format')

Page({
  data: {
    matchId: '',
    match: null,
    playerAInfo: {},
    playerBInfo: {}
  },

  onLoad(options) {
    if (options.matchId) {
      this.setData({ matchId: options.matchId })
      this.loadDetail(options.matchId)
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
    }
  },

  /**
   * Load match detail by matchId
   */
  loadDetail(matchId) {
    db.callFunction('getMatchDetail', { matchId }).then(res => {
      if (res && res.data) {
        const matchData = res.data
        const match = {
          ...matchData,
          formattedDate: formatDateTime(matchData.createdAt),
          scoreChangeA: matchData.scoreChangeA,
          scoreChangeB: matchData.scoreChangeB
        }

        this.setData({
          match,
          playerAInfo: matchData.playerAInfo || { nickName: '选手A', avatarUrl: '' },
          playerBInfo: matchData.playerBInfo || { nickName: '选手B', avatarUrl: '' }
        })
      } else {
        wx.showToast({ title: '比赛不存在', icon: 'none' })
      }
    }).catch(err => {
      console.error('Failed to load match detail:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  }
})
