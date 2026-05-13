const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatDateTime } = require('../../../utils/format')

Page({
  data: {
    matchList: [],
    seasonList: [],
    seasonIndex: 0,
    seasonFilter: '',
    currentUserId: '',
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad() {
    const userInfo = auth.getCurrentUser()
    if (userInfo) {
      this.setData({ currentUserId: userInfo._id })
    }
    this.loadSeasons()
    this.loadHistory()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, matchList: [], hasMore: true })
    this.loadHistory().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * Load available seasons for filter
   */
  loadSeasons() {
    db.callFunction('getSeasons', {}).then(res => {
      if (res && res.result && res.result.data) {
        const seasons = [{ _id: '', name: '全部' }, ...res.result.data]
        this.setData({ seasonList: seasons })
      }
    }).catch(err => {
      console.error('Failed to load seasons:', err)
    })
  },

  /**
   * Load match history for current user
   * Filters by current user as playerA or playerB
   */
  loadHistory() {
    if (this.data.loading) return Promise.resolve()

    this.setData({ loading: true })

    const params = {
      userId: this.data.currentUserId,
      page: this.data.page,
      pageSize: this.data.pageSize
    }

    if (this.data.seasonFilter) {
      params.seasonId = this.data.seasonFilter
    }

    return db.callFunction('getMatchHistory', params).then(res => {
      if (res && res.result && res.result.data) {
        const newList = res.result.data.map(match => {
          return {
            ...match,
            formattedDate: formatDateTime(match.createdAt),
            isWin: this.isWin(match),
            opponent: this.getOpponent(match)
          }
        })

        const matchList = this.data.page === 1 ? newList : [...this.data.matchList, ...newList]
        const hasMore = newList.length >= this.data.pageSize

        this.setData({
          matchList,
          hasMore,
          loading: false
        })
      } else {
        this.setData({ loading: false, hasMore: false })
      }
    }).catch(err => {
      console.error('Failed to load history:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  /**
   * Determine if current user won the match
   */
  isWin(match) {
    const userId = this.data.currentUserId
    if (match.playerA === userId || (match.playerAInfo && match.playerAInfo._id === userId)) {
      return match.scoreA > match.scoreB
    }
    return match.scoreB > match.scoreA
  },

  /**
   * Get opponent info from match
   */
  getOpponent(match) {
    const userId = this.data.currentUserId
    if (match.playerA === userId || (match.playerAInfo && match.playerAInfo._id === userId)) {
      return match.playerBInfo || { nickName: '未知选手' }
    }
    return match.playerAInfo || { nickName: '未知选手' }
  },

  /**
   * Handle season filter change
   */
  onSeasonChange(e) {
    const index = parseInt(e.detail.value)
    const season = this.data.seasonList[index]
    this.setData({
      seasonIndex: index,
      seasonFilter: season._id,
      page: 1,
      matchList: [],
      hasMore: true
    })
    this.loadHistory()
  },

  /**
   * Load more matches
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadHistory()
  },

  /**
   * Navigate to match detail page
   */
  goToDetail(e) {
    const matchId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/match/detail/detail?matchId=${matchId}`
    })
  }
})
