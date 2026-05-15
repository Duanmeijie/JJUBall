const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

Page({
  data: {
    authorized: false,
    rules: [],
    editing: false,
    seasonId: '',
    seasonName: '--',
    originalRules: []
  },

  onLoad() {
    auth.requireAuth(this, 'admin')
  },

  onAuthSuccess() {
    this.setData({ authorized: true })
    this.loadRules()
  },

  async loadRules() {
    wx.showLoading({ title: '加载中...' })
    try {
      const res = await db.callFunction('getScoreRules', {})
      if (res && res.code === 0) {
        const data = res.data
        const rules = (data.rules || []).map(rule => ({
          ...rule,
          matchTypeName: rule.matchTypeName || rule.matchType
        }))

        this.setData({
          rules,
          originalRules: JSON.parse(JSON.stringify(rules)),
          seasonId: data.seasonId || '',
          seasonName: data.seasonName || '--'
        })
      }
    } catch (err) {
      console.error('loadRules error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  toggleEdit() {
    if (this.data.editing) {
      // Cancel edit, restore original
      this.setData({
        editing: false,
        rules: JSON.parse(JSON.stringify(this.data.originalRules))
      })
    } else {
      this.setData({ editing: true })
    }
  },

  onRuleChange(e) {
    const { index, field } = e.currentTarget.dataset
    const value = Number(e.detail.value) || 0
    const key = `rules[${index}].${field}`
    this.setData({ [key]: value })
  },

  async handleSave() {
    wx.showLoading({ title: '保存中...' })
    try {
      const res = await db.callFunction('updateScoreRules', {
        seasonId: this.data.seasonId,
        rules: this.data.rules.map(rule => ({
          matchType: rule.matchType,
          winScore: rule.winScore,
          loseScore: rule.loseScore,
          weight: rule.weight
        }))
      })

      if (res && res.code === 0) {
        this.setData({
          editing: false,
          originalRules: JSON.parse(JSON.stringify(this.data.rules))
        })
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('handleSave error:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})
