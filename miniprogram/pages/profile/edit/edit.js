// pages/profile/edit/edit.js
const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

const app = getApp()

Page({
  data: {
    nickName: '',
    studentId: '',
    name: '',
    avatarUrl: '',
    saving: false
  },

  onLoad() {
    this.loadInfo()
  },

  /**
   * 加载当前用户信息填充表单
   */
  loadInfo() {
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo
    if (userInfo) {
      this.setData({
        nickName: userInfo.nickName || '',
        studentId: userInfo.studentId || '',
        name: userInfo.name || '',
        avatarUrl: userInfo.avatarUrl || ''
      })
    }
  },

  /**
   * 输入框值变化
   */
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [field]: e.detail.value
    })
  },

  /**
   * 选择头像
   */
  handleChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.setData({ avatarUrl: tempFilePath })
      }
    })
  },

  /**
   * 保存修改
   */
  async handleSave() {
    const { nickName, studentId, name, avatarUrl, saving } = this.data
    if (saving) return

    // 校验
    if (!nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    this.setData({ saving: true })

    try {
      let finalAvatarUrl = avatarUrl

      // 如果是本地临时文件，上传到云存储
      if (avatarUrl && avatarUrl.indexOf('tmp') !== -1) {
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.jpg`,
          filePath: avatarUrl
        })
        finalAvatarUrl = uploadRes.fileID
      }

      const updateData = {
        nickName: nickName.trim(),
        studentId: studentId.trim(),
        name: name.trim(),
        avatarUrl: finalAvatarUrl
      }

      // 调用云函数更新用户信息
      const result = await db.callFunction('updateUserInfo', updateData)

      if (result && result.code === 0) {
        // 更新本地缓存
        const userInfo = wx.getStorageSync('userInfo') || {}
        const newUserInfo = { ...userInfo, ...updateData }
        wx.setStorageSync('userInfo', newUserInfo)
        app.globalData.userInfo = newUserInfo

        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: result.message || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error('保存用户信息失败:', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  }
})
