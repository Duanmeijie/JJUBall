// utils/constants.js - 常量定义

/**
 * 用户角色
 */
const ROLES = {
  MEMBER: 'member',
  REFEREE: 'referee',
  ADMIN: 'admin'
}

const ROLE_NAMES = {
  member: '普通会员',
  referee: '裁判/干事',
  admin: '管理员'
}

/**
 * 活动类型
 */
const ACTIVITY_TYPES = {
  ENTERTAINMENT: 'entertainment',
  INTERNAL: 'internal',
  EXTERNAL: 'external'
}

const ACTIVITY_TYPE_NAMES = {
  entertainment: '娱乐赛',
  internal: '协会内部赛',
  external: '对外交流赛'
}

/**
 * 活动状态
 */
const ACTIVITY_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
}

const ACTIVITY_STATUS_NAMES = {
  open: '报名中',
  closed: '已满员',
  cancelled: '已取消',
  completed: '已结束'
}

/**
 * 比赛状态
 */
const MATCH_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const MATCH_STATUS_NAMES = {
  pending: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

/**
 * 段位系统
 */
const RANKS = {
  BRONZE: '青铜',
  SILVER: '白银',
  GOLD: '黄金',
  KING: '王者'
}

const RANK_THRESHOLDS = [
  { min: 600, rank: '王者' },
  { min: 300, rank: '黄金' },
  { min: 100, rank: '白银' },
  { min: 0, rank: '青铜' }
]

const RANK_COLORS = {
  '青铜': '#CD7F32',
  '白银': '#C0C0C0',
  '黄金': '#FFD700',
  '王者': '#FF4500'
}

/**
 * 消息类型
 */
const MESSAGE_TYPES = {
  SYSTEM: 'system',
  ACTIVITY: 'activity',
  MATCH: 'match'
}

const MESSAGE_TYPE_NAMES = {
  system: '系统消息',
  activity: '活动消息',
  match: '比赛消息'
}

/**
 * 信誉分相关
 */
const CREDIT = {
  INITIAL_SCORE: 100,
  LOW_THRESHOLD: 60,
  TEMP_CANCEL_DEDUCT: -10,
  ABSENT_DEDUCT: -20
}

/**
 * 分页默认值
 */
const PAGE_SIZE = 10

module.exports = {
  ROLES,
  ROLE_NAMES,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_NAMES,
  ACTIVITY_STATUS,
  ACTIVITY_STATUS_NAMES,
  MATCH_STATUS,
  MATCH_STATUS_NAMES,
  RANKS,
  RANK_THRESHOLDS,
  RANK_COLORS,
  MESSAGE_TYPES,
  MESSAGE_TYPE_NAMES,
  CREDIT,
  PAGE_SIZE
}
