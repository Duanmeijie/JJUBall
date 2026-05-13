// pages/index/index.js
const db = require('../../utils/db')
const auth = require('../../utils/auth')
const { formatDateTime } = require('../../utils/format')
const constants = require('../../utils/constants')

Page({
  data: {
    userInfo: {},
    greeting: '',
    activities: [],
    topRanking: [],
    unreadCount: 0,
    isAdmin: false,
    isRefereeOrAdmin: false,
    loading: true,
    // User stats
    currentScore: 0,
    creditScore: 100,
    rank: '青铜',
    rankColor: '#CD7F32',
    winRate: '--',
    winRatePercent: 0
  },

  onLoad() {
    this._setGreeting()
  },

  onShow() {
    this._loadUserInfo()
    this._loadData()
  },

  onPullDownRefresh() {
    this._loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 设置问候语（根据时间段）
   */
  _setGreeting() {
    const hour = new Date().getHours()
    let greeting = '你好'
    if (hour >= 6 && hour < 12) {
      greeting = '早上好'
    } else if (hour >= 12 && hour < 14) {
      greeting = '中午好'
    } else if (hour >= 14 && hour < 18) {
      greeting = '下午好'
    } else if (hour >= 18 && hour < 23) {
      greeting = '晚上好'
    }
    this.setData({ greeting })
  },

  /**
   * 加载用户信息
   */
  _loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    const isAdmin = auth.isAdmin()
    const isRefereeOrAdmin = auth.isRefereeOrAdmin()
    this.setData({ userInfo, isAdmin, isRefereeOrAdmin })
  },

  /**
   * 加载页面数据
   */
  async _loadData() {
    this.setData({ loading: true })
    try {
      await Promise.all([
        this._loadActivities(),
        this._loadTopRanking(),
        this._loadUnreadCount(),
        this._loadUserStats()
      ])
    } catch (err) {
      console.error('加载首页数据失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载用户积分和信誉分等统计数据
   */
  async _loadUserStats() {
    if (!auth.isLogin()) return
    try {
      const result = await db.callFunction('getUserStats', {})
      if (result && result.code === 0 && result.data) {
        const stats = result.data
        const currentScore = stats.totalScore || 0
        const creditScore = stats.creditScore != null ? stats.creditScore : 100

        // 计算段位
        let rank = '青铜'
        for (const threshold of constants.RANK_THRESHOLDS) {
          if (currentScore >= threshold.min) {
            rank = threshold.rank
            break
          }
        }
        const rankColor = constants.RANK_COLORS[rank] || '#CD7F32'

        // 计算胜率
        let winRate = '--'
        let winRatePercent = 0
        const totalMatches = stats.totalMatches || 0
        const wins = stats.wins || 0
        if (totalMatches > 0) {
          winRatePercent = Math.round((wins / totalMatches) * 100)
          winRate = winRatePercent + '%'
        }

        this.setData({
          currentScore,
          creditScore,
          rank,
          rankColor,
          winRate,
          winRatePercent
        })
      }
    } catch (err) {
      console.error('加载用户统计数据失败:', err)
    }
  },

  /**
   * 加载近期活动列表
   */
  async _loadActivities() {
    const result = await db.callFunction('getActivityList', {
      page: 1,
      pageSize: 5
    })
    if (result && result.code === 0 && result.data) {
      this.setData({
        activities: result.data.list || []
      })
    }
  },

  /**
   * 加载积分排行榜 Top 3
   */
  async _loadTopRanking() {
    const result = await db.callFunction('getScoreList', {
      page: 1,
      pageSize: 3
    })
    if (result && result.code === 0 && result.data) {
      this.setData({
        topRanking: result.data.list || []
      })
    }
  },

  /**
   * 加载未读消息数量
   */
  async _loadUnreadCount() {
    if (!auth.isLogin()) return
    const result = await db.callFunction('getMessages', {
      unreadOnly: true,
      page: 1,
      pageSize: 1
    })
    if (result && result.code === 0 && result.data) {
      this.setData({
        unreadCount: result.data.total || 0
      })
    }
  },

  // ==================== Navigation ====================

  /**
   * 跳转到活动列表（约球大厅）
   */
  goToActivityList() {
    wx.switchTab({
      url: '/pages/activity/list/list'
    })
  },

  /**
   * 跳转到赛事中心（比赛历史）
   */
  goToMatchHistory() {
    wx.navigateTo({
      url: '/pages/match/history/history'
    })
  },

  /**
   * 跳转到排行榜
   */
  goToRanking() {
    wx.switchTab({
      url: '/pages/ranking/ranking/ranking'
    })
  },

  /**
   * 跳转到个人中心
   */
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile/profile'
    })
  },

  /**
   * 跳转到管理后台（管理员）
   */
  goToAdmin() {
    if (!auth.requireAuth(this, 'admin')) return
    wx.navigateTo({
      url: '/pages/admin/dashboard/dashboard'
    })
  },

  /**
   * 跳转到录入成绩（裁判/管理员）
   */
  goToRecordScore() {
    if (!auth.requireAuth(this, 'referee')) return
    wx.navigateTo({
      url: '/pages/match/record/record'
    })
  },

  /**
   * 跳转到消息页
   */
  goToMessages() {
    if (!auth.requireLogin()) return
    wx.navigateTo({
      url: '/pages/profile/messages/messages'
    })
  }
})
