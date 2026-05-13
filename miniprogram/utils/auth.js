// utils/auth.js - 权限校验工具

/**
 * 角色等级定义
 */
const ROLE_LEVEL = {
  member: 1,
  referee: 2,
  admin: 3
}

/**
 * 检查用户是否具有指定角色权限
 * @param {String} requiredRole 需要的最低角色
 * @returns {Boolean}
 */
function checkRole(requiredRole) {
  const userRole = wx.getStorageSync('userRole') || 'member'
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[requiredRole] || 0)
}

/**
 * 检查是否已登录
 * @returns {Boolean}
 */
function isLogin() {
  const userInfo = wx.getStorageSync('userInfo')
  return !!(userInfo && userInfo._openid)
}

/**
 * 页面权限拦截
 * @param {Object} page 页面实例
 * @param {String} requiredRole 需要的最低角色
 * @returns {Boolean} 是否通过权限校验
 */
function requireAuth(page, requiredRole) {
  if (!isLogin()) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/profile/profile/profile' })
    }, 1500)
    return false
  }
  if (!checkRole(requiredRole)) {
    wx.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => {
      wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) })
    }, 1500)
    return false
  }
  return true
}

/**
 * 要求已登录
 * @returns {Boolean}
 */
function requireLogin() {
  if (!isLogin()) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      wx.switchTab({ url: '/pages/profile/profile/profile' })
    }, 1500)
    return false
  }
  return true
}

/**
 * 获取当前用户角色
 * @returns {String}
 */
function getRole() {
  return wx.getStorageSync('userRole') || 'member'
}

/**
 * 判断是否为管理员
 * @returns {Boolean}
 */
function isAdmin() {
  return getRole() === 'admin'
}

/**
 * 判断是否为裁判或管理员
 * @returns {Boolean}
 */
function isRefereeOrAdmin() {
  const role = getRole()
  return role === 'referee' || role === 'admin'
}

module.exports = {
  checkRole,
  isLogin,
  requireAuth,
  requireLogin,
  getRole,
  isAdmin,
  isRefereeOrAdmin,
  ROLE_LEVEL
}
