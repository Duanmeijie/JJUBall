const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

Page({
  data: {
    loading: true,
    activeTab: 'recommend',
    opponents: [],
    myRequests: [],
    myScore: 0,
    myRank: '青铜',
    statusMap: {
      'pending': '待回复',
      'accepted': '已接受',
      'rejected': '已拒绝',
      'cancelled': '已取消'
    }
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
      const result = await db.callFunction('matchmaking', { action: 'findOpponents' })
      if (result.code === 0) {
        const opponents = (result.data.list || []).map(o => ({
          ...o,
          firstLetter: (o.nickName || '?').charAt(0)
        }))
        const rankColor = constants.RANK_COLORS
        let rank = '青铜'
        const score = result.data.myScore
        for (const threshold of constants.RANK_THRESHOLDS) {
          if (score >= threshold.min) { rank = threshold.rank; break }
        }
        this.setData({
          opponents,
          myScore: score,
          myRank: rank
        })
      }
    } catch (err) {
      console.error('加载推荐失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, loading: true })
    if (tab === 'requests') {
      this.loadMyRequests()
    } else {
      this.loadData()
    }
  },

  async loadMyRequests() {
    try {
      const result = await db.callFunction('matchmaking', { action: 'myRequests' })
      if (result.code === 0) {
        this.setData({ myRequests: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载约球记录失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async sendChallenge(e) {
    const { id, name } = e.currentTarget.dataset
    wx.showModal({
      title: '约球邀请',
      content: `向 ${name} 发起约球邀请？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送中...' })
          try {
            const result = await db.callFunction('matchmaking', {
              action: 'sendChallenge',
              targetId: id,
              message: '一起打球吧！'
            })
            wx.hideLoading()
            if (result.code === 0) {
              wx.showToast({ title: '邀请已发送', icon: 'success' })
            }
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '发送失败', icon: 'none' })
          }
        }
      }
    })
  }
})
