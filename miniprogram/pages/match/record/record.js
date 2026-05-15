const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

Page({
  data: {
    hasPermission: false,
    userList: [],
    playerA: null,
    playerB: null,
    playerAIndex: -1,
    playerBIndex: -1,
    matchTypeOptions: ['娱乐赛', '内部赛', '交流赛'],
    matchTypeIndex: 0,
    matchType: '娱乐赛',
    scoreA: '',
    scoreB: '',
    activityId: '',
    submitting: false
  },

  onLoad() {
    this.checkPermission()
  },

  /**
   * Check if current user has referee or admin permission
   */
  checkPermission() {
    const hasAuth = auth.requireAuth(this, 'referee')
    if (hasAuth) {
      this.setData({ hasPermission: true })
      this.loadUsers()
    } else {
      this.setData({ hasPermission: false })
    }
  },

  /**
   * Load all available users for player selection
   */
  loadUsers() {
    db.callFunction('getUsers', {}).then(res => {
      if (res && res.data) {
        this.setData({ userList: res.data })
      }
    }).catch(err => {
      console.error('Failed to load users:', err)
      wx.showToast({ title: '加载用户列表失败', icon: 'none' })
    })
  },

  /**
   * Handle Player A picker change
   */
  onPlayerAPick(e) {
    const index = parseInt(e.detail.value)
    const player = this.data.userList[index]
    this.setData({
      playerAIndex: index,
      playerA: player
    })
  },

  /**
   * Handle Player B picker change
   */
  onPlayerBPick(e) {
    const index = parseInt(e.detail.value)
    const player = this.data.userList[index]
    this.setData({
      playerBIndex: index,
      playerB: player
    })
  },

  /**
   * Handle match type picker change
   */
  onMatchTypePick(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      matchTypeIndex: index,
      matchType: this.data.matchTypeOptions[index]
    })
  },

  /**
   * Handle activity ID input
   */
  onActivityIdInput(e) {
    this.setData({ activityId: e.detail.value })
  },

  /**
   * Handle score A input
   */
  onScoreAInput(e) {
    this.setData({ scoreA: e.detail.value })
  },

  /**
   * Handle score B input
   */
  onScoreBInput(e) {
    this.setData({ scoreB: e.detail.value })
  },

  /**
   * Validate form and submit match result
   * Two-step: first createMatch, then submitMatchResult
   */
  handleSubmit() {
    const { playerA, playerB, scoreA, scoreB, matchType, activityId } = this.data

    // Validation
    if (!playerA || !playerB) {
      wx.showToast({ title: '请选择两位选手', icon: 'none' })
      return
    }

    if (playerA._id === playerB._id) {
      wx.showToast({ title: '两位选手不能是同一人', icon: 'none' })
      return
    }

    const numScoreA = parseInt(scoreA)
    const numScoreB = parseInt(scoreB)

    if (isNaN(numScoreA) || isNaN(numScoreB) || numScoreA < 0 || numScoreB < 0) {
      wx.showToast({ title: '请输入有效的比分', icon: 'none' })
      return
    }

    if (numScoreA === numScoreB) {
      wx.showToast({ title: '比分不能相同，必须分出胜负', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    // Step 1: Create match
    const matchData = {
      playerA: playerA._id,
      playerB: playerB._id,
      matchType: matchType,
      activityId: activityId || undefined
    }

    db.callFunction('createMatch', matchData).then(res => {
      if (res && res.matchId) {
        const matchId = res.matchId

        // Step 2: Submit match result
        return db.callFunction('submitMatchResult', {
          matchId: matchId,
          scoreA: numScoreA,
          scoreB: numScoreB
        })
      } else {
        throw new Error('创建比赛失败')
      }
    }).then(res => {
      this.setData({ submitting: false })
      wx.showToast({
        title: '成绩录入成功',
        icon: 'success',
        duration: 1500
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(err => {
      console.error('Submit match failed:', err)
      this.setData({ submitting: false })
      wx.showToast({
        title: err.message || '提交失败，请重试',
        icon: 'none'
      })
    })
  }
})
