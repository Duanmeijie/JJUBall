// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'cloud1-d3g4as01110e1d195',
      traceUser: true
    })

    this.autoLogin()
  },

  globalData: {
    userInfo: null,
    isLogin: false
  },

  autoLogin: function () {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo._openid) {
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
    } else {
      this.loginWithRetry(3)
    }
  },

  loginWithRetry: function (maxRetries) {
    let retries = 0
    const attempt = () => {
      this.login().catch(err => {
        retries++
        if (retries < maxRetries) {
          setTimeout(attempt, 1000 * retries)
        }
      })
    }
    attempt()
  },

  login: function () {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then(res => {
        if (res.result && res.result.code === 0) {
          const userInfo = res.result.data
          this.globalData.userInfo = userInfo
          this.globalData.isLogin = true
          wx.setStorageSync('userInfo', userInfo)
          wx.setStorageSync('userRole', userInfo.role)
          resolve(userInfo)
        } else {
          reject(res.result || { message: '登录返回异常' })
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
