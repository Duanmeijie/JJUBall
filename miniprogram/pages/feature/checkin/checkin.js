const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

Page({
  data: {
    loading: true,
    checkedIn: false,
    stats: {
      currentStreak: 0,
      totalCheckins: 0,
      totalDuration: 0,
      monthCount: 0
    },
    monthProgress: 0,
    calendarDays: [],
    records: []
  },

  onLoad() {
    if (!auth.requireLogin()) return
  },

  onShow() {
    this.loadData()
    this.generateCalendar()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const result = await db.callFunction('checkinTraining', { action: 'getStats' })
      if (result.code === 0) {
        const stats = result.data
        this.setData({
          stats,
          monthProgress: Math.round((stats.monthCount / 30) * 100),
          checkedIn: this.checkTodayChecked(stats.records),
          records: (stats.records || []).slice(0, 30)
        })
        this.generateCalendar(stats.records || [])
      }
    } catch (err) {
      console.error('加载打卡数据失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  checkTodayChecked(records) {
    const today = new Date().toISOString().split('T')[0]
    return (records || []).some(r => r.date === today)
  },

  generateCalendar(records) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() || 7

    const checkedDates = new Set((records || []).map(r => r.date))

    const days = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayOfWeek = d === 1 ? startDayOfWeek : ((startDayOfWeek + d - 2) % 7) + 1
      const isToday = now.getDate() === d && now.getMonth() === month && now.getFullYear() === year

      days.push({
        day: d,
        dateStr,
        dayOfWeek,
        isToday,
        checked: checkedDates.has(dateStr),
        isCurrentMonth: true
      })
    }

    if (startDayOfWeek > 1) {
      const prevMonth = new Date(year, month, 0)
      const prevDays = prevMonth.getDate()
      for (let i = startDayOfWeek - 1; i > 0; i--) {
        days.unshift({
          day: prevDays - i + 1,
          dayOfWeek: i,
          isToday: false,
          checked: false,
          isCurrentMonth: false
        })
      }
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining && i <= 14; i++) {
      days.push({
        day: i,
        dayOfWeek: ((startDayOfWeek + daysInMonth + i - 2) % 7) + 1,
        isToday: false,
        checked: false,
        isCurrentMonth: false
      })
    }

    this.setData({ calendarDays: days })
  },

  async handleCheckin() {
    if (this.data.checkedIn) {
      wx.showToast({ title: '今日已打卡', icon: 'success' })
      return
    }

    wx.showLoading({ title: '打卡中...' })
    try {
      const result = await db.callFunction('checkinTraining', {
        action: 'checkin',
        duration: 60,
        notes: ''
      })

      wx.hideLoading()
      if (result.code === 0) {
        wx.showToast({ title: '打卡成功！🔥', icon: 'none' })
        this.loadData()
      } else if (result.code === 1) {
        wx.showToast({ title: '今日已打卡', icon: 'success' })
        this.setData({ checkedIn: true })
      } else {
        wx.showToast({ title: result.message || '打卡失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  }
})
