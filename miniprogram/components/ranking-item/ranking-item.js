// components/ranking-item/ranking-item.js
const constants = require('../../utils/constants')

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    },
    index: {
      type: Number,
      value: 0
    }
  },

  observers: {
    'item': function (item) {
      if (!item) return
      this.setData({
        rankLevel: this._getRankLevel(item.rank)
      })
    }
  },

  data: {
    rankLevel: 'bronze'
  },

  methods: {
    /**
     * 获取段位对应的样式级别
     */
    _getRankLevel(rank) {
      switch (rank) {
        case '王者': return 'king'
        case '黄金': return 'gold'
        case '白银': return 'silver'
        case '青铜':
        default: return 'bronze'
      }
    }
  }
})
