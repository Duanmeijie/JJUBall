const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')

Page({
  data: {
    currentSeason: null,
    historicalSeasons: [],
    isAdmin: false,
    loading: false
  },

  onLoad() {
    this.checkAdmin()
    this.loadSeasons()
  },

  onShow() {
    this.loadSeasons()
  },

  /**
   * Check if current user is admin
   */
  checkAdmin() {
    const isAdmin = auth.hasRole('admin')
    this.setData({ isAdmin })
  },

  /**
   * Load all seasons and separate current from historical
   */
  loadSeasons() {
    this.setData({ loading: true })

    db.callFunction('getSeasons', {}).then(res => {
      if (res && res.result && res.result.data) {
        const seasons = res.result.data
        let currentSeason = null
        const historicalSeasons = []

        seasons.forEach(season => {
          // Format dates for display
          season.startDate = formatDateTime(season.startTime, 'date')
          season.endDate = formatDateTime(season.endTime, 'date')

          if (season.status === 'active' && !season.archived) {
            currentSeason = season
          } else {
            historicalSeasons.push(season)
          }
        })

        // Sort historical seasons by start time descending
        historicalSeasons.sort((a, b) => {
          return new Date(b.startTime) - new Date(a.startTime)
        })

        this.setData({
          currentSeason,
          historicalSeasons,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('Failed to load seasons:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  /**
   * Navigate to ranking page for a specific season
   */
  goToRanking(e) {
    const seasonId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/ranking/ranking/ranking?seasonId=${seasonId}`
    })
  },

  /**
   * Navigate to create season page (admin only)
   */
  createSeason() {
    if (!this.data.isAdmin) {
      wx.showToast({ title: '无权限', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/ranking/season/create'
    })
  }
})
