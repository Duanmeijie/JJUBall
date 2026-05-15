const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

Page({
  data: {
    authorized: false,
    rules: {
      tempCancelScore: 0,
      absentScore: 0,
      threshold: 0
    },
    editing: false,
    originalRules: null
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
      const res = await db.callFunction('getCreditRules', {})
      if (res && res.code === 0) {
        const data = res.data
        const rules = {
          tempCancelScore: data.tempCancelScore || 0,
          absentScore: data.absentScore || 0,
          threshold: data.threshold || 0
        }
        this.setData({
          rules,
          originalRules: { ...rules }
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
        rules: { ...this.data.originalRules }
      })
    } else {
      this.setData({ editing: true })
    }
  },

  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    const value = Number(e.detail.value) || 0
    const key = `rules.${field}`
    this.setData({ [key]: value })
  },

  async handleSave() {
    const { rules } = this.data

    // Validation
    if (rules.tempCancelScore < 0 || rules.absentScore < 0 || rules.threshold < 0) {
      wx.showToast({ title: '分值不能为负数', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })
    try {
      const res = await db.callFunction('updateCreditRules', {
        tempCancelScore: rules.tempCancelScore,
        absentScore: rules.absentScore,
        threshold: rules.threshold
      })

      if (res && res.code === 0) {
        this.setData({
          editing: false,
          originalRules: { ...rules }
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
