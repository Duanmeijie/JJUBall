const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

Page({
  data: {
    title: '',
    type: '',
    typeIndex: 0,
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    maxCount: '20',
    today: '',
    submitting: false,
    typeOptions: [
      { label: '娱乐赛', value: 'entertainment' },
      { label: '内部赛', value: 'internal' },
      { label: '交流赛', value: 'friendly' }
    ]
  },

  onLoad() {
    // Check admin permission
    if (!auth.isAdmin()) {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    // Set today's date as minimum date for pickers
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const today = `${year}-${month}-${day}`

    this.setData({ today })
  },

  /**
   * Handle generic input change
   */
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [field]: value })
  },

  /**
   * Handle type picker change
   */
  onTypePick(e) {
    const index = Number(e.detail.value)
    this.setData({
      typeIndex: index,
      type: this.data.typeOptions[index].value
    })
  },

  /**
   * Handle start date picker change
   */
  onStartDatePick(e) {
    this.setData({ startDate: e.detail.value })
  },

  /**
   * Handle start time picker change
   */
  onStartTimePick(e) {
    this.setData({ startTime: e.detail.value })
  },

  /**
   * Handle end date picker change
   */
  onEndDatePick(e) {
    this.setData({ endDate: e.detail.value })
  },

  /**
   * Handle end time picker change
   */
  onEndTimePick(e) {
    this.setData({ endTime: e.detail.value })
  },

  /**
   * Validate form fields
   * @returns {string|null} Error message or null if valid
   */
  validate() {
    const { title, type, location, startDate, startTime, endDate, endTime, maxCount } = this.data

    if (!title.trim()) {
      return '请输入活动标题'
    }

    if (!type) {
      return '请选择活动类型'
    }

    if (!location.trim()) {
      return '请输入活动地点'
    }

    if (!startDate || !startTime) {
      return '请选择开始时间'
    }

    if (!endDate || !endTime) {
      return '请选择结束时间'
    }

    // Check startTime is in the future
    const startDateTime = new Date(`${startDate}T${startTime}:00`)
    const now = new Date()
    if (startDateTime <= now) {
      return '开始时间必须晚于当前时间'
    }

    // Check endTime > startTime
    const endDateTime = new Date(`${endDate}T${endTime}:00`)
    if (endDateTime <= startDateTime) {
      return '结束时间必须晚于开始时间'
    }

    if (!maxCount || Number(maxCount) <= 0) {
      return '请输入有效的人数上限'
    }

    return null
  },

  /**
   * Handle form submission
   */
  async handleSubmit() {
    if (this.data.submitting) return

    // Validate
    const error = this.validate()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const { title, type, location, startDate, startTime, endDate, endTime, maxCount } = this.data

      // Combine date and time into full datetime strings
      const startTimeStr = `${startDate} ${startTime}`
      const endTimeStr = `${endDate} ${endTime}`

      await db.callFunction('createActivity', {
        title: title.trim(),
        type,
        location: location.trim(),
        startTime: startTimeStr,
        endTime: endTimeStr,
        maxCount: Number(maxCount)
      })

      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 1500
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      console.error('Create activity failed:', err)
      const message = (err.result && err.result.message) || '发布失败，请重试'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
