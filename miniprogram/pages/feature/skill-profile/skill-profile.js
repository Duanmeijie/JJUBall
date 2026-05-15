const db = require('../../../utils/db')
const auth = require('../../../utils/auth')

const SKILL_NAMES = {
  'serving': '发球',
  'receive': '接发',
  'forehand': '正手',
  'backhand': '反手',
  'footwork': '步法',
  'tactics': '战术'
}

const SKILL_ICONS = {
  'serving': '🎯', 'receive': '🛡️', 'forehand': '💥',
  'backhand': '🔁', 'footwork': '⚡', 'tactics': '🧠'
}

Page({
  data: {
    loading: true,
    editable: false,
    userProfile: null,
    skills: {},
    skillKeys: ['serving', 'receive', 'forehand', 'backhand', 'footwork', 'tactics'],
    skillNames: SKILL_NAMES,
    skillIcons: SKILL_ICONS,
    badges: [],
    currentView: 'radar',
    showAssessPanel: false,
    editingSkill: null,
    assessScore: 0,
    assessValues: {},
    avgScore: 0
  },

  onLoad() {
    if (!auth.requireLogin()) return
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    this.setData({ loading: true })
    try {
      const result = await db.callFunction('skillProfile', { action: 'getProfile' })
      if (result.code === 0) {
        const profile = result.data
        const skills = profile.skills || {}
        const values = Object.values(skills)
        const avgScore = values.length > 0
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : 0
        const masteredCount = Object.keys(skills).filter(k => skills[k] >= 80).length

        this.setData({
          userProfile: profile,
          skills,
          badges: profile.badges || [],
          avgScore,
          masteredCount,
          assessValues: Object.keys(SKILL_NAMES).reduce((acc, k) => {
            acc[k] = skills[k] || 0
            return acc
          }, {})
        })

        setTimeout(() => { this.drawRadar(skills) }, 300)
      }
    } catch (err) {
      console.error('加载技术档案失败:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  drawRadar(skills) {
    const ctx = wx.createCanvasContext('radarCanvas')
    const keys = Object.keys(SKILL_NAMES)
    const n = keys.length
    const width = 500
    const height = 500
    const cx = width / 2
    const cy = height / 2
    const radius = 180
    const levels = 5

    ctx.clearRect(0, 0, width, height)

    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level
      ctx.beginPath()
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.setStrokeStyle('#EDEDF0')
      ctx.setLineWidth(2)
      ctx.stroke()
    }

    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.setStrokeStyle('#EDEDF0')
      ctx.setLineWidth(2)
      ctx.stroke()

      const labelR = radius + 36
      const lx = cx + labelR * Math.cos(angle)
      const ly = cy + labelR * Math.sin(angle)
      ctx.setFontSize(22)
      ctx.setFillStyle('#2D2D3A')
      ctx.setTextAlign('center')
      ctx.setTextBaseline('middle')
      ctx.fillText(SKILL_NAMES[keys[i]], lx, ly)
    }

    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const idx = i % n
      const value = Math.min(100, Math.max(0, skills[keys[idx]] || 0)) / 100
      const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
      const r = radius * value
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.setFillStyle('rgba(212, 54, 60, 0.15)')
    ctx.setStrokeStyle('#D4363C')
    ctx.setLineWidth(3)
    ctx.fill()
    ctx.stroke()

    for (let i = 0; i < n; i++) {
      const value = Math.min(100, Math.max(0, skills[keys[i]] || 0)) / 100
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const r = radius * value
      const x = cx + r * Math.cos(angle)
      const y = cy + r * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.setFillStyle('#D4363C')
      ctx.fill()
    }

    ctx.draw()
  },

  switchView(e) {
    const view = e.currentTarget.dataset.view
    this.setData({ currentView: view })
    if (view === 'radar') {
      setTimeout(() => { this.drawRadar(this.data.skills) }, 200)
    }
  },

  openAssess(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      showAssessPanel: true,
      editingSkill: key,
      assessScore: this.data.skills[key] || 0
    })
  },

  closeAssess() {
    this.setData({ showAssessPanel: false })
  },

  sliderChange(e) {
    this.setData({ assessScore: e.detail.value })
  },

  async submitAssess() {
    const { editingSkill, assessScore, skills } = this.data
    wx.showLoading({ title: '提交中...' })
    try {
      const result = await db.callFunction('skillProfile', {
        action: 'updateSkills',
        skills: { [editingSkill]: assessScore - (skills[editingSkill] || 0) }
      })

      wx.hideLoading()
      if (result.code === 0) {
        wx.showToast({ title: '评估成功', icon: 'success' })
        this.setData({ showAssessPanel: false })
        this.loadProfile()
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  }
})
