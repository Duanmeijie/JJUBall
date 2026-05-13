// components/activity-card/activity-card.js
const { formatDateTime } = require('../../utils/format')
const constants = require('../../utils/constants')

Component({
  properties: {
    activity: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'activity': function (activity) {
      if (!activity) return

      const enrolledCount = activity.enrolledCount || 0
      const maxCount = activity.maxCount || 1
      const enrollPercent = Math.min(Math.round((enrolledCount / maxCount) * 100), 100)

      this.setData({
        typeText: constants.ACTIVITY_TYPE_NAMES[activity.type] || '未知',
        statusText: constants.ACTIVITY_STATUS_NAMES[activity.status] || '未知',
        timeRange: this._formatTimeRange(activity.startTime, activity.endTime),
        enrollPercent
      })
    }
  },

  data: {
    typeText: '',
    statusText: '',
    timeRange: '',
    enrollPercent: 0
  },

  methods: {
    /**
     * 点击卡片跳转到活动详情
     */
    onTap() {
      const { activity } = this.data
      if (!activity || !activity._id) return
      wx.navigateTo({
        url: `/pages/activity/detail/detail?id=${activity._id}`
      })
    },

    /**
     * 格式化时间范围
     */
    _formatTimeRange(startTime, endTime) {
      if (!startTime) return ''
      const start = formatDateTime(startTime)
      if (!endTime) return start
      const end = formatDateTime(endTime)
      return `${start} - ${end}`
    }
  }
})
