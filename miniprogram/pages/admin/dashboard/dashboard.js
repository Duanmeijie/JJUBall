const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    authorized: false,
    stats: {
      totalUsers: 0,
      totalActivities: 0,
      activeSeasonName: '--',
      pendingFeedbacks: 0
    },
    recentActivities: []
  },

  onLoad() {
    auth.requireAuth(this, 'admin')
  },

  onShow() {
    if (this.data.authorized) {
      this.loadStats()
    }
  },

  onAuthSuccess() {
    this.setData({ authorized: true })
    this.loadStats()
  },

  async loadStats() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await db.callFunction('getAdminStats', {})
      if (res && res.code === 0) {
        const data = res.data
        this.setData({
          stats: {
            totalUsers: data.totalUsers || 0,
            totalActivities: data.totalActivities || 0,
            activeSeasonName: data.activeSeasonName || '--',
            pendingFeedbacks: data.pendingFeedbacks || 0
          }
        })
      }
      await this.loadRecentActivities()
    } catch (err) {
      console.error('loadStats error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  async loadRecentActivities() {
    try {
      const res = await db.callFunction('getRecentActivities', { limit: 5 })
      if (res && res.code === 0) {
        const activities = (res.data || []).map(item => {
          const statusMap = {
            open: '报名中',
            closed: '已结束',
            ongoing: '进行中',
            cancelled: '已取消'
          }
          return {
            ...item,
            formattedTime: formatDateTime(item.startTime),
            statusText: statusMap[item.status] || item.status
          }
        })
        this.setData({ recentActivities: activities })
      }
    } catch (err) {
      console.error('loadRecentActivities error:', err)
    }
  },

  goToUserManage() {
    wx.navigateTo({ url: '/pages/admin/user-manage/user-manage' })
  },

  goToCreateActivity() {
    wx.navigateTo({ url: '/pages/activity/create/create' })
  },

  goToScoreRules() {
    wx.navigateTo({ url: '/pages/admin/score-rules/score-rules' })
  },

  goToCreditRules() {
    wx.navigateTo({ url: '/pages/admin/credit-rules/credit-rules' })
  },

  goToExport() {
    wx.navigateTo({ url: '/pages/admin/data-export/data-export' })
  },

  goToWeatherCancel() {
    wx.navigateTo({ url: '/pages/admin/weather-cancel/weather-cancel' })
  }
})
