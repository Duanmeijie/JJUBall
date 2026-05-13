// pages/profile/feedback/feedback.js
const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatRelativeTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    content: '',
    contact: '',
    feedbackList: [],
    submitting: false,
    loading: false
  },

  onLoad() {
    if (!auth.requireLogin()) return
    this.loadHistory()
  },

  /**
   * 反馈内容输入
   */
  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  /**
   * 联系方式输入
   */
  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  /**
   * 提交反馈
   */
  async handleSubmit() {
    const { content, contact, submitting } = this.data
    if (submitting) return

    // 校验
    if (!content.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }
    if (content.trim().length < 5) {
      wx.showToast({ title: '反馈内容至少5个字', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      const result = await db.callFunction('submitFeedback', {
        content: content.trim(),
        contact: contact.trim()
      })

      if (result && result.code === 0) {
        wx.showToast({ title: '提交成功', icon: 'success' })
        this.setData({ content: '', contact: '' })
        // 重新加载反馈历史
        this.loadHistory()
      } else {
        wx.showToast({ title: result.message || '提交失败', icon: 'none' })
      }
    } catch (err) {
      console.error('提交反馈失败:', err)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  /**
   * 加载我的反馈历史
   */
  async loadHistory() {
    this.setData({ loading: true })

    try {
      const result = await db.callFunction('getMyFeedback', {
        page: 1,
        pageSize: 20
      })

      if (result && result.code === 0) {
        const list = (result.data.list || []).map(item => ({
          ...item,
          timeText: formatRelativeTime(item.createdAt)
        }))
        this.setData({ feedbackList: list })
      }
    } catch (err) {
      console.error('加载反馈历史失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  }
})
