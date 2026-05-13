const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

// Rank tier color mapping
const RANK_COLORS = {
  bronze: '#CD7F32',
  silver: '#9E9EB0',
  gold: '#F5A623',
  king: '#D4363C'
}

Page({
  data: {
    activeTab: 'score', // 'score' or 'credit'
    rankingList: [],
    creditRedList: [],
    creditBlackList: [],
    myRanking: null,
    currentSeason: {},
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    currentUserId: ''
  },

  onLoad() {
    const userInfo = auth.getCurrentUser()
    if (userInfo) {
      this.setData({ currentUserId: userInfo._id })
    }
    this.loadCurrentSeason()
  },

  onPullDownRefresh() {
    if (this.data.activeTab === 'score') {
      this.setData({ page: 1, rankingList: [], hasMore: true })
      this.loadScoreRanking().then(() => {
        wx.stopPullDownRefresh()
      })
    } else {
      this.loadCreditRanking().then(() => {
        wx.stopPullDownRefresh()
      })
    }
  },

  /**
   * Switch between score and credit tabs
   */
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.activeTab) return

    this.setData({ activeTab: tab })

    if (tab === 'score') {
      if (this.data.rankingList.length === 0) {
        this.loadScoreRanking()
      }
    } else {
      this.loadCreditRanking()
    }
  },

  /**
   * Load current season info
   */
  loadCurrentSeason() {
    db.callFunction('getCurrentSeason', {}).then(res => {
      if (res && res.result && res.result.data) {
        this.setData({ currentSeason: res.result.data })
        this.loadScoreRanking()
      }
    }).catch(err => {
      console.error('Failed to load current season:', err)
      this.loadScoreRanking()
    })
  },

  /**
   * Load score ranking list
   * Calls getScoreList cloud function
   */
  loadScoreRanking() {
    if (this.data.loading) return Promise.resolve()

    this.setData({ loading: true })

    const params = {
      seasonId: this.data.currentSeason._id || '',
      page: this.data.page,
      pageSize: this.data.pageSize
    }

    return db.callFunction('getScoreList', params).then(res => {
      if (res && res.result && res.result.data) {
        const list = res.result.data.map((item, index) => {
          const rank = (this.data.page - 1) * this.data.pageSize + index + 1
          return {
            ...item,
            rank,
            nickName: item.nickName || item.name || '未知',
            rankColor: this.getRankColor(item.score),
            rankTitle: this.getRankTitle(item.score)
          }
        })

        const rankingList = this.data.page === 1 ? list : [...this.data.rankingList, ...list]
        const hasMore = list.length >= this.data.pageSize

        // Find my ranking
        let myRanking = this.data.myRanking
        if (this.data.page === 1) {
          const myItem = rankingList.find(item => item.userId === this.data.currentUserId)
          if (myItem) {
            myRanking = {
              rank: myItem.rank,
              score: myItem.score,
              rankColor: myItem.rankColor,
              rankTitle: myItem.rankTitle
            }
          } else {
            this.loadMyRanking()
          }
        }

        this.setData({
          rankingList,
          hasMore,
          loading: false,
          myRanking
        })
      } else {
        this.setData({ loading: false, hasMore: false })
      }
    }).catch(err => {
      console.error('Failed to load score ranking:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  /**
   * Load current user's ranking if not in the visible list
   */
  loadMyRanking() {
    db.callFunction('getMyRanking', {
      userId: this.data.currentUserId,
      seasonId: this.data.currentSeason._id || ''
    }).then(res => {
      if (res && res.result && res.result.data) {
        const data = res.result.data
        this.setData({
          myRanking: {
            rank: data.rank,
            score: data.score,
            rankColor: this.getRankColor(data.score),
            rankTitle: this.getRankTitle(data.score)
          }
        })
      }
    }).catch(err => {
      console.error('Failed to load my ranking:', err)
    })
  },

  /**
   * Load credit ranking (red and black lists)
   * Red list: top 5 highest credit scores
   * Black list: credit score < 80
   */
  loadCreditRanking() {
    this.setData({ loading: true })

    const dbInstance = wx.cloud.database()
    const usersCollection = dbInstance.collection('users')
    const _ = dbInstance.command

    // Query top 5 highest credit scores for red list
    const redPromise = usersCollection
      .where({
        creditScore: _.exists(true)
      })
      .orderBy('creditScore', 'desc')
      .limit(5)
      .get()

    // Query users with credit score < 80 for black list
    const blackPromise = usersCollection
      .where({
        creditScore: _.lt(80)
      })
      .orderBy('creditScore', 'asc')
      .get()

    return Promise.all([redPromise, blackPromise]).then(([redRes, blackRes]) => {
      const creditRedList = (redRes.data || []).map(item => ({
        _id: item._id,
        nickName: item.nickName || item.name || '未知',
        creditScore: item.creditScore || 100
      }))

      const creditBlackList = (blackRes.data || []).map(item => ({
        _id: item._id,
        nickName: item.nickName || item.name || '未知',
        creditScore: item.creditScore || 0
      }))

      this.setData({
        creditRedList,
        creditBlackList,
        loading: false
      })
    }).catch(err => {
      console.error('Failed to load credit ranking:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  /**
   * Get rank color based on score thresholds
   */
  getRankColor(score) {
    if (score >= 2000) return RANK_COLORS.king
    if (score >= 1500) return RANK_COLORS.gold
    if (score >= 1000) return RANK_COLORS.silver
    return RANK_COLORS.bronze
  },

  /**
   * Get rank title based on score thresholds
   */
  getRankTitle(score) {
    if (score >= 2000) return '王者'
    if (score >= 1500) return '黄金'
    if (score >= 1000) return '白银'
    return '青铜'
  },

  /**
   * Load more rankings (pagination)
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadScoreRanking()
  },

  /**
   * Navigate to season selection page
   */
  goToSeason() {
    wx.navigateTo({
      url: '/pages/ranking/season/season'
    })
  }
})
