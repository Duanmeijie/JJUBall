const db = require('../../../utils/db')
const auth = require('../../../utils/auth')
const constants = require('../../../utils/constants')

const PAGE_SIZE = 10

Page({
  data: {
    activityList: [],
    statusFilter: '',
    typeFilter: '',
    page: 1,
    hasMore: true,
    loading: false,
    isAdmin: false
  },

  onLoad() {
    this.checkAdminRole()
    this.loadActivities()
  },

  onShow() {
    this.checkAdminRole()
  },

  /**
   * Check if current user has admin role
   */
  checkAdminRole() {
    const isAdmin = auth.isAdmin()
    this.setData({ isAdmin })
  },

  /**
   * Load activities from cloud function
   */
  async loadActivities(isLoadMore = false) {
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const params = {
        page: this.data.page,
        pageSize: PAGE_SIZE
      }

      if (this.data.statusFilter) {
        params.status = this.data.statusFilter
      }

      if (this.data.typeFilter) {
        params.type = this.data.typeFilter
      }

      const res = await db.callFunction('getActivityList', params)
      const { list = [], total = 0 } = res.result || {}

      const activityList = isLoadMore
        ? [...this.data.activityList, ...list]
        : list

      const hasMore = activityList.length < total

      this.setData({
        activityList,
        hasMore,
        loading: false
      })
    } catch (err) {
      console.error('Failed to load activities:', err)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  /**
   * Handle status filter tab change
   */
  onFilterChange(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.statusFilter) return

    this.setData({
      statusFilter: value,
      page: 1,
      activityList: [],
      hasMore: true
    })
    this.loadActivities()
  },

  /**
   * Handle type filter change
   */
  onTypeChange(e) {
    const value = e.currentTarget.dataset.value
    if (value === this.data.typeFilter) return

    this.setData({
      typeFilter: value,
      page: 1,
      activityList: [],
      hasMore: true
    })
    this.loadActivities()
  },

  /**
   * Load more activities (pagination)
   */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return

    this.setData({
      page: this.data.page + 1
    })
    this.loadActivities(true)
  },

  /**
   * Pull down refresh handler
   */
  async onPullDownRefresh() {
    this.setData({
      page: 1,
      activityList: [],
      hasMore: true
    })
    await this.loadActivities()
    wx.stopPullDownRefresh()
  },

  /**
   * Reach bottom handler for load more
   */
  onReachBottom() {
    this.loadMore()
  },

  /**
   * Navigate to activity detail
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity/detail/detail?id=${id}`
    })
  },

  /**
   * Navigate to create activity page (admin only)
   */
  goToCreate() {
    wx.navigateTo({
      url: '/pages/activity/create/create'
    })
  }
})
