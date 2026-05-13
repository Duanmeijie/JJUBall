const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

const PAGE_SIZE = 20

Page({
  data: {
    authorized: false,
    userList: [],
    searchKey: '',
    page: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    auth.requireAuth(this, 'admin')
  },

  onAuthSuccess() {
    this.setData({ authorized: true })
    this.loadUsers()
  },

  async loadUsers(reset = true) {
    if (this.data.loading) return

    if (reset) {
      this.setData({ page: 1, hasMore: true, userList: [] })
    }

    this.setData({ loading: true })

    try {
      const res = await db.callFunction('getUserList', {
        searchKey: this.data.searchKey,
        page: this.data.page,
        pageSize: PAGE_SIZE
      })

      if (res.result && res.result.code === 0) {
        const roleTextMap = {
          member: '成员',
          referee: '裁判',
          admin: '管理员'
        }

        const newUsers = (res.result.data || []).map(user => ({
          ...user,
          roleText: roleTextMap[user.role] || '成员'
        }))

        const userList = reset ? newUsers : [...this.data.userList, ...newUsers]
        const hasMore = newUsers.length >= PAGE_SIZE

        this.setData({ userList, hasMore })
      }
    } catch (err) {
      console.error('loadUsers error:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  onSearch() {
    this.loadUsers(true)
  },

  onUserTap(e) {
    const index = e.currentTarget.dataset.index
    const user = this.data.userList[index]

    wx.showActionSheet({
      itemList: ['设为成员', '设为裁判', '设为管理员'],
      success: (res) => {
        const roles = ['member', 'referee', 'admin']
        const selectedRole = roles[res.tapIndex]

        if (selectedRole === user.role) {
          wx.showToast({ title: '角色未变更', icon: 'none' })
          return
        }

        wx.showModal({
          title: '确认修改',
          content: `确定将 ${user.nickname} 的角色修改为 ${['成员', '裁判', '管理员'][res.tapIndex]} 吗？`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.changeRole(user._id, selectedRole, index)
            }
          }
        })
      }
    })
  },

  async changeRole(userId, newRole, index) {
    wx.showLoading({ title: '修改中...' })
    try {
      const res = await db.callFunction('updateUserRole', {
        userId,
        role: newRole
      })

      if (res.result && res.result.code === 0) {
        const roleTextMap = {
          member: '成员',
          referee: '裁判',
          admin: '管理员'
        }

        const key = `userList[${index}].role`
        const textKey = `userList[${index}].roleText`
        this.setData({
          [key]: newRole,
          [textKey]: roleTextMap[newRole]
        })

        wx.showToast({ title: '修改成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.result.message || '修改失败', icon: 'none' })
      }
    } catch (err) {
      console.error('changeRole error:', err)
      wx.showToast({ title: '修改失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadUsers(false)
  }
})
