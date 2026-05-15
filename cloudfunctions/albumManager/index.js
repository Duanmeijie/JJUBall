const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, albumId, photoId, activityId, comment, page, pageSize = 20 } = event

  try {
    if (action === 'getAlbums') {
      const p = page || 1
      const skip = (p - 1) * pageSize
      const where = activityId ? { activityId } : {}

      const { total } = await db.collection('activity_albums').where(where).count()
      const { data: albums } = await db.collection('activity_albums')
        .where(where)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      const creatorIds = [...new Set(albums.map(a => a.createdBy))]
      const { data: creators } = await db.collection('users')
        .where({ _openid: _.in(creatorIds) })
        .get()
      const userMap = {}
      creators.forEach(u => { userMap[u._openid] = { nickName: u.nickName, avatarUrl: u.avatarUrl } })

      const list = albums.map(a => ({
        ...a,
        creator: userMap[a.createdBy] || {}
      }))

      return { code: 0, data: { list, total, hasMore: skip + list.length < total } }
    }

    if (action === 'getPhotos') {
      const p = page || 1
      const skip = (p - 1) * pageSize
      const where = { albumId }

      const { total } = await db.collection('album_photos').where(where).count()
      const { data: photos } = await db.collection('album_photos')
        .where(where)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()

      const uploaderIds = [...new Set(photos.map(p => p.uploadedBy))]
      const { data: uploaders } = await db.collection('users')
        .where({ _openid: _.in(uploaderIds) })
        .get()
      const userMap = {}
      uploaders.forEach(u => { userMap[u._openid] = { nickName: u.nickName } })

      const list = photos.map(p => ({
        ...p,
        uploader: userMap[p.uploadedBy] || {}
      }))

      return { code: 0, data: { list, total, hasMore: skip + list.length < total } }
    }

    if (action === 'likePhoto') {
      const { data: existing } = await db.collection('album_likes')
        .where({ photoId, userId: OPENID })
        .get()

      if (existing.length > 0) {
        await db.collection('album_likes').doc(existing[0]._id).remove()
        return { code: 0, data: { liked: false } }
      }

      await db.collection('album_likes').add({
        data: { photoId, userId: OPENID, createdAt: db.serverDate() }
      })

      return { code: 0, data: { liked: true } }
    }

    if (action === 'addComment') {
      await db.collection('album_comments').add({
        data: {
          photoId,
          userId: OPENID,
          content: comment,
          createdAt: db.serverDate()
        }
      })
      return { code: 0, message: '评论成功' }
    }

    if (action === 'getComments') {
      const p = page || 1
      const skip = (p - 1) * 10
      const { total } = await db.collection('album_comments').where({ photoId }).count()
      const { data: comments } = await db.collection('album_comments')
        .where({ photoId })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(10)
        .get()

      const userIds = [...new Set(comments.map(c => c.userId))]
      const { data: users } = await db.collection('users')
        .where({ _openid: _.in(userIds) })
        .get()
      const userMap = {}
      users.forEach(u => { userMap[u._openid] = { nickName: u.nickName, avatarUrl: u.avatarUrl } })

      const list = comments.map(c => ({
        ...c,
        user: userMap[c.userId] || {}
      }))

      return { code: 0, data: { list, total, hasMore: skip + list.length < 10 } }
    }

    return { code: -1, message: '未知操作' }
  } catch (err) {
    return { code: -1, message: err.message }
  }
}
