const db = require('../../../../utils/db')
const auth = require('../../../../utils/auth')

Page({
  data: {
    photoId: '',
    photo: null,
    liked: false,
    likeCount: 0,
    comments: [],
    commentText: ''
  },

  onLoad(options) {
    if (!auth.requireLogin()) return
    this.setData({ photoId: options.photoId })
  },

  onShow() {
    this.loadDetail()
  },

  async loadDetail() {
    try {
      const result = await db.callFunction('albumManager', {
        action: 'getComments',
        photoId: this.data.photoId
      })
      if (result.code === 0) {
        this.setData({ comments: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载详情失败:', err)
    }
  },

  async handleLike() {
    try {
      const result = await db.callFunction('albumManager', {
        action: 'likePhoto',
        photoId: this.data.photoId
      })
      if (result.code === 0) {
        this.setData({
          liked: result.data.liked,
          likeCount: this.data.likeCount + (result.data.liked ? 1 : -1)
        })
      }
    } catch (err) {
      console.error('点赞失败:', err)
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async submitComment() {
    const text = this.data.commentText.trim()
    if (!text) return

    wx.showLoading({ title: '发送中...' })
    try {
      const result = await db.callFunction('albumManager', {
        action: 'addComment',
        photoId: this.data.photoId,
        comment: text
      })
      wx.hideLoading()
      if (result.code === 0) {
        wx.showToast({ title: '评论成功', icon: 'success' })
        this.setData({ commentText: '' })
        this.loadDetail()
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '评论失败', icon: 'none' })
    }
  }
})
