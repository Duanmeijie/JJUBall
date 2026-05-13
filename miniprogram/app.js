// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'your-env-id', // 替换为实际云开发环境 ID
      traceUser: true
    })

    // 自动登录
    this.autoLogin()
  },

  globalData: {
    userInfo: null,
    isLogin: false
  },

  // 自动登录
  autoLogin: function () {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo._openid) {
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
    } else {
      this.login()
    }
  },

  // 调用云函数登录
  login: function () {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then(res => {
        if (res.result.code === 0) {
          const userInfo = res.result.data
          this.globalData.userInfo = userInfo
          this.globalData.isLogin = true
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('userRole', userInfo.role)
          resolve(userInfo)
        } else {
          reject(res.result)
        }
      }).catch(err => {
        console.error('登录失败', err)
        reject(err)
      })
    })
  },

  // 获取用户信息（确保已登录）
  getUserInfo: function () {
    return new Promise((resolve, reject) => {
      if (this.globalData.userInfo) {
        resolve(this.globalData.userInfo)
      } else {
        this.login().then(resolve).catch(reject)
      }
    })
  }
})
