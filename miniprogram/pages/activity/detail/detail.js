const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    activityId: '',
    activity: null,
    signupList: [],
    isSignedUp: false,
    loading: true,
    submitting: false,
    enrollPercent: 0
  },

  onLoad(options) {
    const activityId = options.id
    if (!activityId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ activityId })
    this.loadDetail()
  },

  onShow() {
    if (this.data.activityId) {
      this.loadDetail()
    }
  },

  /**
   * Load activity detail and signup list
   */
  async loadDetail() {
    this.setData({ loading: true })

    try {
      const res = await db.callFunction('getActivityDetail', {
        activityId: this.data.activityId
      })

      const { activity, signupList = [], isSignedUp = false } = res.result || {}

      if (!activity) {
        wx.showToast({ title: '活动不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      // Calculate enrollment percentage
      const currentCount = activity.currentCount || 0
      const maxCount = activity.maxCount || 1
      const enrollPercent = Math.min(Math.round((currentCount / maxCount) * 100), 100)

      // Format activity data for display
      const formattedActivity = {
        ...activity,
        typeName: constants.ACTIVITY_TYPE_NAMES[activity.type] || activity.type,
        statusName: constants.ACTIVITY_STATUS_NAMES[activity.status] || activity.status,
        startTimeFormatted: formatDateTime(activity.startTime),
        endTimeFormatted: formatDateTime(activity.endTime)
      }

      this.setData({
        activity: formattedActivity,
        signupList,
        isSignedUp,
        enrollPercent,
        loading: false
      })
    } catch (err) {
      console.error('Failed to load activity detail:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  /**
   * Handle signup action
   */
  async handleSignup() {
    if (this.data.submitting) return

    // Check login status
    if (!auth.isLoggedIn()) {
      auth.requireAuth()
      return
    }

    this.setData({ submitting: true })

    try {
      await db.callFunction('signupActivity', {
        activityId: this.data.activityId
      })

      wx.showToast({ title: '报名成功', icon: 'success' })
      this.loadDetail()
    } catch (err) {
      console.error('Signup failed:', err)
      const message = (err.result && err.result.message) || '报名失败，请重试'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * Handle cancel signup with confirmation
   */
  handleCancelSignup() {
    if (this.data.submitting) return

    wx.showModal({
      title: '确认取消',
      content: '确定要取消报名吗？',
      confirmColor: '#D4363C',
      success: (res) => {
        if (res.confirm) {
          this.doCancelSignup()
        }
      }
    })
  },

  /**
   * Execute cancel signup
   */
  async doCancelSignup() {
    this.setData({ submitting: true })

    try {
      await db.callFunction('cancelSignup', {
        activityId: this.data.activityId
      })

      wx.showToast({ title: '已取消报名', icon: 'success' })
      this.loadDetail()
    } catch (err) {
      console.error('Cancel signup failed:', err)
      const message = (err.result && err.result.message) || '取消失败，请重试'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * Navigate back
   */
  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/activity/list/list' })
      }
    })
  }
})
