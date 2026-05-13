// utils/format.js - 日期/数据格式化工具

/**
 * 格式化日期为 YYYY-MM-DD HH:mm
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
function formatDateTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  const hour = padZero(d.getHours())
  const minute = padZero(d.getMinutes())
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  return `${year}-${month}-${day}`
}

/**
 * 格式化时间为 HH:mm
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const hour = padZero(d.getHours())
  const minute = padZero(d.getMinutes())
  return `${hour}:${minute}`
}

/**
 * 相对时间（几分钟前、几小时前等）
 * @param {Date|String|Number} date 日期
 * @returns {String}
 */
function formatRelativeTime(date) {
  if (!date) return ''
  const now = Date.now()
  const d = new Date(date).getTime()
  const diff = now - d

  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  return formatDateTime(date)
}

/**
 * 补零
 * @param {Number} n
 * @returns {String}
 */
function padZero(n) {
  return n < 10 ? '0' + n : '' + n
}

/**
 * 格式化积分变动（带正负号）
 * @param {Number} score 积分变动值
 * @returns {String}
 */
function formatScoreChange(score) {
  if (score > 0) return '+' + score
  return '' + score
}

/**
 * 格式化大数字（如1.2k）
 * @param {Number} num
 * @returns {String}
 */
function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return '' + num
}

/**
 * 判断活动是否即将开始（2小时内）
 * @param {Date|String} startTime 开始时间
 * @returns {Boolean}
 */
function isActivitySoon(startTime) {
  if (!startTime) return false
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const diff = start - now
  return diff > 0 && diff < 2 * 60 * 60 * 1000
}

/**
 * 判断活动是否已过期
 * @param {Date|String} endTime 结束时间
 * @returns {Boolean}
 */
function isActivityExpired(endTime) {
  if (!endTime) return false
  return new Date(endTime).getTime() < Date.now()
}

module.exports = {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatScoreChange,
  formatNumber,
  isActivitySoon,
  isActivityExpired,
  padZero
}
