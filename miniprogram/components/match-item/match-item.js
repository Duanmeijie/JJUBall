// components/match-item/match-item.js
const { formatDate } = require('../../utils/format')
const constants = require('../../utils/constants')

Component({
  properties: {
    match: {
      type: Object,
      value: {}
    }
  },

  observers: {
    'match': function (match) {
      if (!match) return
      this.setData({
        matchTypeText: constants.ACTIVITY_TYPE_NAMES[match.type] || '友谊赛',
        matchDate: formatDate(match.matchDate || match.createdAt)
      })
    }
  },

  data: {
    matchTypeText: '',
    matchDate: ''
  },

  methods: {
    /**
     * 点击跳转到比赛详情
     */
    onTap() {
      const { match } = this.data
      if (!match || !match._id) return
      wx.navigateTo({
        url: `/pages/match/detail/detail?id=${match._id}`
      })
    }
  }
})
