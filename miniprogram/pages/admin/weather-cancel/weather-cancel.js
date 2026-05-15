const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    authorized: false,
    openActivities: [],
    selectedIndex: -1,
    selectedActivity: null,
    reason: '',
    submitting: false,
    result: null
  },

  onLoad() {
    auth.requireAuth(this, 'admin')
  },

  onAuthSuccess() {
    this.setData({ authorized: true })
    this.loadOpenActivities()
  },

  async loadOpenActivities() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await db.callFunction('getOpenActivities', {})
      if (res && res.code === 0) {
        const activities = (res.data || []).map(item => ({
          ...item,
          formattedTime: formatDateTime(item.startTime),
          enrollCount: item.enrollCount || 0
        }))
        this.setData({ openActivities: activities })
      }
    } catch (err) {
      console.error('loadOpenActivities error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  onActivityPick(e) {
    const index = Number(e.detail.value)
    const activity = this.data.openActivities[index]
    this.setData({
      selectedIndex: index,
      selectedActivity: activity,
      result: null
    })
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value })
  },

  handleCancel() {
    if (this.data.submitting) return
    if (!this.data.selectedActivity) {
      wx.showToast({ title: '请选择活动', icon: 'none' })
      return
    }
    if (!this.data.reason.trim()) {
      wx.showToast({ title: '请输入取消原因', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认取消',
      content: `确定因天气原因取消活动「${this.data.selectedActivity.title}」吗？取消后将通知所有报名用户，且不会扣除信誉分。`,
      confirmText: '确认取消',
      confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          this.doCancel()
        }
      }
    })
  },

  async doCancel() {
    this.setData({ submitting: true })
    try {
      const res = await db.callFunction('cancelActivityByWeather', {
        activityId: this.data.selectedActivity._id,
        reason: this.data.reason.trim()
      })

      if (res && res.code === 0) {
        const data = res.data
        this.setData({
          result: {
            notifiedCount: data.notifiedCount || 0,
            reason: this.data.reason.trim()
          },
          selectedActivity: null,
          selectedIndex: -1,
          reason: ''
        })
        wx.showToast({ title: '取消成功', icon: 'success' })
        // Reload activities list
        this.loadOpenActivities()
      } else {
        wx.showToast({ title: res.message || '取消失败', icon: 'none' })
      }
    } catch (err) {
      console.error('doCancel error:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
