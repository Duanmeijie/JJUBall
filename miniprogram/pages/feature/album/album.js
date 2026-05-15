const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    activeTab: 'albums',
    albums: [],
    photos: []
  },

  onLoad() {
    if (!auth.requireLogin()) return
  },

  onShow() {
    this.loadAlbums()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab, loading: true })
    if (tab === 'photos') {
      this.loadPhotos()
    } else {
      this.loadAlbums()
    }
  },

  async loadAlbums() {
    try {
      const result = await db.callFunction('albumManager', { action: 'getAlbums' })
      if (result.code === 0) {
        this.setData({ albums: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载相册失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async loadPhotos() {
    try {
      const result = await db.callFunction('albumManager', { action: 'getPhotos', page: 1, pageSize: 30 })
      if (result.code === 0) {
        this.setData({ photos: result.data.list || [] })
      }
    } catch (err) {
      console.error('加载照片失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  viewAlbum(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/feature/album/album-detail/album-detail?id=${id}`
    })
  },

  viewPhotoDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/feature/album/photo-detail/photo-detail?photoId=${id}`
    })
  }
})
