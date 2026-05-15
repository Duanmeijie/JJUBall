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
      if (res && res.data) {
        const seasons = res.data
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
   * Create new season (admin only)
   */
  createSeason() {
    if (!this.data.isAdmin) {
      wx.showToast({ title: '无权限', icon: 'none' })
      return
    }
    wx.showModal({
      title: '创建赛季',
      placeholderText: '请输入赛季名称',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content) {
          wx.showLoading({ title: '创建中...' })
          try {
            const result = await db.callFunction('config', {
              action: 'createSeason',
              name: res.content
            })
            wx.hideLoading()
            if (result.code === 0) {
              wx.showToast({ title: '创建成功', icon: 'success' })
              this.loadSeasons()
            } else {
              wx.showToast({ title: result.message || '创建失败', icon: 'none' })
            }
          } catch (err) {
            wx.hideLoading()
            wx.showToast({ title: '创建失败', icon: 'none' })
          }
        }
      }
    })
  }
})
