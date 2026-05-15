const db = require('../../../../utils/db')
const auth = require('../../../../utils/auth')

Page({
  data: {
    albumId: '',
    album: null,
    photos: [],
    loading: true
  },

  onLoad(options) {
    if (!auth.requireLogin()) return
    this.setData({ albumId: options.id })
  },

  onShow() {
    this.loadAlbumDetail()
  },

  async loadAlbumDetail() {
    this.setData({ loading: true })
    try {
      const result = await db.callFunction('albumManager', {
        action: 'getPhotos',
        albumId: this.data.albumId
      })
      if (result.code === 0) {
        this.setData({ photos: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载相册详情失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  viewPhoto(e) {
    const photoId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/feature/album/photo-detail/photo-detail?photoId=${photoId}`
    })
  }
})
