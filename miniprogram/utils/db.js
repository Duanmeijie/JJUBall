// utils/db.js - 云数据库操作封装
const db = wx.cloud.database()
const _ = db.command

/**
 * 通用数据库操作封装
 */
const DB = {
  /**
   * 获取集合引用
   * @param {String} name 集合名称
   */
  collection(name) {
    return db.collection(name)
  },

  /**
   * 分页查询
   * @param {String} collectionName 集合名
   * @param {Object} where 查询条件
   * @param {Object} orderBy 排序字段 {field, order}
   * @param {Number} page 页码（从1开始）
   * @param {Number} pageSize 每页数量
   */
  async getList(collectionName, where = {}, orderBy = { field: 'createdAt', order: 'desc' }, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize
    const countResult = await db.collection(collectionName).where(where).count()
    const total = countResult.total

    let query = db.collection(collectionName).where(where)
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.order)
    }
    const listResult = await query.skip(skip).limit(pageSize).get()

    return {
      list: listResult.data,
      total,
      hasMore: skip + pageSize < total
    }
  },

  /**
   * 获取单条记录
   * @param {String} collectionName 集合名
   * @param {String} docId 文档ID
   */
  async getDoc(collectionName, docId) {
    try {
      const result = await db.collection(collectionName).doc(docId).get()
      return result.data
    } catch (e) {
      return null
    }
  },

  /**
   * 按条件查询单条
   * @param {String} collectionName 集合名
   * @param {Object} where 查询条件
   */
  async getOne(collectionName, where) {
    const result = await db.collection(collectionName).where(where).limit(1).get()
    return result.data.length > 0 ? result.data[0] : null
  },

  /**
   * 新增文档
   * @param {String} collectionName 集合名
   * @param {Object} data 文档数据
   */
  async add(collectionName, data) {
    const result = await db.collection(collectionName).add({ data })
    return result._id
  },

  /**
   * 更新文档
   * @param {String} collectionName 集合名
   * @param {String} docId 文档ID
   * @param {Object} data 更新数据
   */
  async update(collectionName, docId, data) {
    const result = await db.collection(collectionName).doc(docId).update({ data })
    return result.stats.updated > 0
  },

  /**
   * 条件更新
   * @param {String} collectionName 集合名
   * @param {Object} where 条件
   * @param {Object} data 更新数据
   */
  async updateWhere(collectionName, where, data) {
    const result = await db.collection(collectionName).where(where).update({ data })
    return result.stats.updated
  },

  /**
   * 调用云函数
   * @param {String} name 函数名
   * @param {Object} data 参数
   */
  async callFunction(name, data = {}) {
    try {
      const result = await wx.cloud.callFunction({ name, data })
      return result.result
    } catch (err) {
      console.error(`云函数[${name}]调用失败:`, err)
      return { code: -1, message: '网络错误，请重试', data: null }
    }
  }
}

module.exports = DB
