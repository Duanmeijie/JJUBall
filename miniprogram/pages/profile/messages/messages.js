// pages/profile/messages/messages.js
const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const { formatRelativeTime } = require('../../../utils/format')
const constants = require('../../../utils/constants')

Page({
  data: {
    messageList: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    if (!auth.requireLogin()) return
    this.loadMessages()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ page: 1, messageList: [], hasMore: true })
    this.loadMessages().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 触底加载更多
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  /**
   * 加载消息列表
   */
  async loadMessages() {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const result = await db.callFunction('getMessages', {
        action: 'list',
        page: this.data.page,
        pageSize: constants.PAGE_SIZE
      })

      if (result && result.code === 0) {
        const { list, hasMore } = result.data
        // 格式化相对时间
        const formattedList = (list || []).map(item => ({
          ...item,
          relativeTime: formatRelativeTime(item.createdAt)
        }))

        const currentList = this.data.page === 1 ? formattedList : [...this.data.messageList, ...formattedList]

        this.setData({
          messageList: currentList,
          hasMore: hasMore
        })
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    } catch (err) {
      console.error('加载消息失败:', err)
      wx.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载更多
   */
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadMessages()
  },

  /**
   * 点击消息
   */
  async onMessageTap(e) {
    const { index } = e.currentTarget.dataset
    const message = this.data.messageList[index]
    if (!message) return

    // 标记已读
    if (!message.isRead) {
      try {
        await db.callFunction('markMessageRead', { messageId: message._id })
        // 更新本地状态
        const key = `messageList[${index}].isRead`
        this.setData({ [key]: true })
      } catch (err) {
        console.error('标记已读失败:', err)
      }
    }

    // 根据消息类型跳转
    this.navigateByMessage(message)
  },

  /**
   * 根据消息类型导航到对应页面
   */
  navigateByMessage(message) {
    const { type, relatedId } = message

    switch (type) {
      case 'activity':
        if (relatedId) {
          wx.navigateTo({ url: `/pages/activity/detail/detail?id=${relatedId}` })
        }
        break
      case 'match':
        if (relatedId) {
          wx.navigateTo({ url: `/pages/match/detail/detail?id=${relatedId}` })
        }
        break
      case 'system':
      default:
        // 系统消息无需跳转，已展示内容
        break
    }
  }
})
