const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    tournaments: [],
    showBracket: false,
    bracketInfo: null,
    bracketRounds: [],
    roundLabels: ['1/4决赛', '半决赛', '决赛']
  },

  onLoad() {
    if (!auth.requireLogin()) return
  },

  onShow() {
    this.loadTournaments()
  },

  async loadTournaments() {
    this.setData({ loading: true })
    try {
      const result = await db.callFunction('tournamentManager', {
        action: 'getTournaments'
      })
      if (result.code === 0) {
        this.setData({ tournaments: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载赛事失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async viewBracket(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '加载对阵图...' })
    try {
      const result = await db.callFunction('tournamentManager', {
        action: 'getBracket',
        tournamentId: id
      })

      wx.hideLoading()
      if (result.code === 0) {
        const data = result.data
        const matches = data.matches || []

        const rounds = []
        for (let r = 0; r < 3; r++) {
          const roundMatches = matches.filter(m => m.round === r)
          if (roundMatches.length > 0 || (r === 0 && matches.length > 0)) {
            rounds.push({
              label: this.data.roundLabels[r] || `第${r + 1}轮`,
              matches: roundMatches.length > 0 ? roundMatches : this.generateEmptyMatches(r)
            })
          }
        }

        this.setData({
          showBracket: true,
          bracketInfo: data.tournament,
          bracketRounds: rounds
        })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  generateEmptyMatches(round) {
    const count = round === 0 ? 4 : (round === 1 ? 2 : 1)
    return Array(count).fill(null).map((_, i) => ({
      round,
      index: i,
      playerA: null,
      playerB: null,
      playerA_openid: null,
      playerB_openid: null,
      status: 'pending',
      isEmpty: true
    }))
  },

  closeBracket() {
    this.setData({ showBracket: false })
  }
})
