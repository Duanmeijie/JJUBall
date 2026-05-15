// pages/profile/profile/profile.js
const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

const app = getApp()

// 段位颜色映射（国球红主题）
const RANK_COLORS = {
  '青铜': '#CD7F32',
  '白银': '#9E9EB0',
  '黄金': '#F5A623',
  '王者': '#D4363C'
}

Page({
  data: {
    userInfo: null,
    isLogin: false,
    unreadCount: 0,
    rankColor: RANK_COLORS['青铜'],
    avatarLetter: '',
    // Match stats
    totalMatches: 0,
    wins: 0,
    winRate: '--',
    // Credit score color class
    creditColorClass: 'credit-green'
  },

  onShow() {
    this.loadUserInfo()
    if (auth.isLogin()) {
      this.loadUnreadCount()
      this.loadMatchStats()
    }
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const isLogin = auth.isLogin()
    if (isLogin) {
      const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo
      if (userInfo) {
        const roleName = constants.ROLE_NAMES[userInfo.role] || '会员'
        const rank = userInfo.rank || '青铜'
        const rankColor = RANK_COLORS[rank] || RANK_COLORS['青铜']
        const nickName = userInfo.nickName || '未设置昵称'
        const avatarLetter = nickName.charAt(0).toUpperCase()
        const creditScore = userInfo.creditScore || 100
        const creditColorClass = this.getCreditColorClass(creditScore)

        this.setData({
          userInfo: { ...userInfo, roleName },
          isLogin: true,
          rankColor,
          avatarLetter,
          creditColorClass
        })
      }
      // 尝试从云端刷新用户信息
      this.refreshUserInfo()
    } else {
      this.setData({
        userInfo: null,
        isLogin: false,
        unreadCount: 0,
        totalMatches: 0,
        wins: 0,
        winRate: '--'
      })
    }
  },

  /**
   * 从云端刷新用户信息
   */
  async refreshUserInfo() {
    try {
      const result = await db.callFunction('getMessages', {
        action: 'getUserInfo'
      })
      if (result && result.code === 0 && result.data) {
        const freshInfo = result.data
        wx.setStorageSync('userInfo', freshInfo)
        const roleName = constants.ROLE_NAMES[freshInfo.role] || '会员'
        const rank = freshInfo.rank || '青铜'
        const rankColor = RANK_COLORS[rank] || RANK_COLORS['青铜']
        const nickName = freshInfo.nickName || '未设置昵称'
        const avatarLetter = nickName.charAt(0).toUpperCase()
        const creditScore = freshInfo.creditScore || 100
        const creditColorClass = this.getCreditColorClass(creditScore)

        this.setData({
          userInfo: { ...freshInfo, roleName },
          rankColor,
          avatarLetter,
          creditColorClass
        })
      }
    } catch (err) {
      console.error('刷新用户信息失败:', err)
    }
  },

  /**
   * 加载比赛统计数据
   */
  async loadMatchStats() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo._openid) return

      const openid = userInfo._openid

      // 尝试通过云函数获取统计数据
      const result = await db.callFunction('getMessages', {
        action: 'getMatchStats'
      })

      if (result && result.code === 0 && result.data) {
        const { totalMatches, wins } = result.data
        const winRate = totalMatches > 0
          ? Math.round((wins / totalMatches) * 100) + '%'
          : '--'
        this.setData({ totalMatches, wins, winRate })
      } else {
        // 降级方案：从本地数据库查询比赛记录
        await this.loadMatchStatsLocal(openid)
      }
    } catch (err) {
      console.error('获取比赛统计失败:', err)
      // 降级方案
      try {
        const userInfo = wx.getStorageSync('userInfo')
        if (userInfo && userInfo._openid) {
          await this.loadMatchStatsLocal(userInfo._openid)
        }
      } catch (e) {
        console.error('本地比赛统计查询失败:', e)
      }
    }
  },

  /**
   * 本地查询比赛统计（降级方案）
   */
  async loadMatchStatsLocal(openid) {
    try {
      const _ = db.collection('matches') ? wx.cloud.database().command : null
      if (!_) return

      const database = wx.cloud.database()
      const cmd = database.command

      // 查询作为playerA或playerB参与的已完成比赛
      const matchesResult = await database.collection('matches')
        .where(cmd.or([
          { playerA_openid: openid, status: 'completed' },
          { playerB_openid: openid, status: 'completed' }
        ]))
        .count()

      const totalMatches = matchesResult.total

      // 查询胜场
      const winsResult = await database.collection('matches')
        .where({
          winner_openid: openid,
          status: 'completed'
        })
        .count()

      const wins = winsResult.total
      const winRate = totalMatches > 0
        ? Math.round((wins / totalMatches) * 100) + '%'
        : '--'

      this.setData({ totalMatches, wins, winRate })
    } catch (err) {
      console.error('本地查询比赛统计失败:', err)
      this.setData({ totalMatches: 0, wins: 0, winRate: '--' })
    }
  },

  /**
   * 加载未读消息数量
   */
  async loadUnreadCount() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo || !userInfo._openid) return

      const result = await db.callFunction('getMessages', {
        action: 'unreadCount'
      })
      if (result && result.code === 0) {
        this.setData({ unreadCount: result.data || 0 })
      }
    } catch (err) {
      console.error('获取未读消息数失败:', err)
    }
  },

  /**
   * 获取信誉分颜色类名
   */
  getCreditColorClass(score) {
    if (score >= 80) return 'credit-green'
    if (score >= 60) return 'credit-orange'
    return 'credit-red'
  },

  /**
   * 处理登录
   */
  handleLogin() {
    wx.showLoading({ title: '登录中...' })
    app.login().then(userInfo => {
      wx.hideLoading()
      this.loadUserInfo()
      this.loadUnreadCount()
      this.loadMatchStats()
      wx.showToast({ title: '登录成功', icon: 'success' })
    }).catch(err => {
      wx.hideLoading()
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    })
  },

  /**
   * 跳转到编辑资料
   */
  goToEdit() {
    wx.navigateTo({ url: '/pages/profile/edit/edit' })
  },

  /**
   * 跳转到消息中心
   */
  goToMessages() {
    wx.navigateTo({ url: '/pages/profile/messages/messages' })
  },

  /**
   * 跳转到比赛历史
   */
  goToHistory() {
    wx.navigateTo({ url: '/pages/match/history/history' })
  },

  /**
   * 跳转到意见反馈
   */
  goToFeedback() {
    wx.navigateTo({ url: '/pages/profile/feedback/feedback' })
  },

  /**
   * 跳转到管理后台
   */
  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/dashboard/dashboard' })
  },

  /**
   * 跳转到录入成绩
   */
  goToMatchRecord() {
    wx.navigateTo({ url: '/pages/match/record/record' })
  },

  /**
   * 跳转到训练打卡
   */
  goToCheckin() {
    wx.navigateTo({ url: '/pages/feature/checkin/checkin' })
  },

  /**
   * 跳转到智能约球
   */
  goToMatchmaking() {
    wx.navigateTo({ url: '/pages/feature/matchmaking/matchmaking' })
  },

  /**
   * 跳转到技术档案
   */
  goToSkillProfile() {
    wx.navigateTo({ url: '/pages/feature/skill-profile/skill-profile' })
  },

  /**
   * 跳转到活动相册
   */
  goToAlbum() {
    wx.navigateTo({ url: '/pages/feature/album/album' })
  },

  /**
   * 跳转到赛事图谱
   */
  goToTournament() {
    wx.navigateTo({ url: '/pages/feature/tournament/tournament' })
  },

  /**
   * 跳转到数据看板
   */
  goToDataDashboard() {
    wx.navigateTo({ url: '/pages/feature/data-dashboard/data-dashboard' })
  }
})
