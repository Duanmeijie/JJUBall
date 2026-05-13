const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

function toCSV(data) {
  if (!data || data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row => 
    headers.map(h => {
      let val = row[h]
      if (val === null || val === undefined) val = ''
      val = String(val).replace(/"/g, '""')
      return `"${val}"`
    }).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // Check caller is admin
    const { data: userInfo } = await db.collection('users')
      .where({
        _openid: OPENID,
        role: 'admin'
      })
      .get()

    if (userInfo.length === 0) {
      return {
        code: -1,
        message: 'No permission, admin only',
        data: null
      }
    }

    const { type, startDate, endDate } = event

    // Validate type
    const validTypes = ['users', 'activities', 'matches', 'scores']
    if (!validTypes.includes(type)) {
      return {
        code: -1,
        message: 'Invalid export type',
        data: null
      }
    }

    // Build where clause
    let whereClause = {}
    if (startDate && endDate) {
      whereClause.createdAt = _.gte(new Date(startDate)).and(_.lte(new Date(endDate)))
    } else if (startDate) {
      whereClause.createdAt = _.gte(new Date(startDate))
    } else if (endDate) {
      whereClause.createdAt = _.lte(new Date(endDate))
    }

    // Query all matching records with pagination (loop with skip/limit of 100)
    let allData = []
    let batchSize = 100
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const { data: batch } = await db.collection(type)
        .where(whereClause)
        .skip(skip)
        .limit(batchSize)
        .get()

      allData = allData.concat(batch)
      skip += batchSize

      if (batch.length < batchSize) {
        hasMore = false
      }
    }

    // Convert to CSV
    const csvContent = toCSV(allData)

    // Generate file path with date
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    // Upload CSV to cloud storage
    const uploadResult = await cloud.uploadFile({
      cloudPath: `exports/${type}_${dateStr}.csv`,
      fileContent: Buffer.from(csvContent)
    })

    const fileID = uploadResult.fileID

    // Get download URL
    const urlResult = await cloud.getTempFileURL({
      fileList: [fileID]
    })

    const downloadUrl = urlResult.fileList[0].tempFileURL

    return {
      code: 0,
      message: 'ok',
      data: {
        fileID,
        downloadUrl
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || 'Failed to export data',
      data: null
    }
  }
}
