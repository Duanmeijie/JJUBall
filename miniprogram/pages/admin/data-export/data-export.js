const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    authorized: false,
    exportTypes: [
      { key: 'users', name: '用户数据' },
      { key: 'activities', name: '活动数据' },
      { key: 'matches', name: '比赛数据' },
      { key: 'scores', name: '积分数据' }
    ],
    exportTypeIndex: 0,
    startDate: '',
    endDate: '',
    exporting: false,
    downloadUrl: '',
    exportHistory: []
  },

  onLoad() {
    auth.requireAuth(this, 'admin')
  },

  onAuthSuccess() {
    this.setData({ authorized: true })
    this.initDates()
    this.loadExportHistory()
  },

  initDates() {
    const now = new Date()
    const endDate = this.formatDate(now)
    const startDate = this.formatDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
    this.setData({ startDate, endDate })
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  onTypePick(e) {
    this.setData({ exportTypeIndex: Number(e.detail.value) })
  },

  onStartDatePick(e) {
    this.setData({ startDate: e.detail.value })
  },

  onEndDatePick(e) {
    this.setData({ endDate: e.detail.value })
  },

  async handleExport() {
    if (this.data.exporting) return

    const { exportTypes, exportTypeIndex, startDate, endDate } = this.data

    if (!startDate || !endDate) {
      wx.showToast({ title: '请选择日期范围', icon: 'none' })
      return
    }

    if (startDate > endDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return
    }

    this.setData({ exporting: true, downloadUrl: '' })

    try {
      const res = await db.callFunction('exportData', {
        type: exportTypes[exportTypeIndex].key,
        startDate,
        endDate
      })

      if (res && res.code === 0) {
        const url = res.data.downloadUrl
        this.setData({ downloadUrl: url })
        wx.showToast({ title: '导出成功', icon: 'success' })
        this.loadExportHistory()
      } else {
        wx.showToast({ title: res.message || '导出失败', icon: 'none' })
      }
    } catch (err) {
      console.error('handleExport error:', err)
      wx.showToast({ title: '导出失败', icon: 'none' })
    } finally {
      this.setData({ exporting: false })
    }
  },

  onCopyLink() {
    if (!this.data.downloadUrl) return
    wx.setClipboardData({
      data: this.data.downloadUrl,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  },

  onOpenLink() {
    if (!this.data.downloadUrl) return
    wx.setClipboardData({
      data: this.data.downloadUrl,
      success() {
        wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' })
      }
    })
  },

  async loadExportHistory() {
    try {
      const res = await db.callFunction('getExportHistory', { limit: 10 })
      if (res && res.code === 0) {
        const typeNameMap = {
          users: '用户数据',
          activities: '活动数据',
          matches: '比赛数据',
          scores: '积分数据'
        }
        const history = (res.data || []).map(item => ({
          ...item,
          typeName: typeNameMap[item.type] || item.type,
          time: formatDateTime(item.createTime)
        }))
        this.setData({ exportHistory: history })
      }
    } catch (err) {
      console.error('loadExportHistory error:', err)
    }
  },

  onHistoryTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.setClipboardData({
        data: url,
        success() {
          wx.showToast({ title: '链接已复制', icon: 'success' })
        }
      })
    }
  }
})
