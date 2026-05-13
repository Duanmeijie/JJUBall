const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // Query current active season
    const { data: seasons } = await db.collection('seasons')
      .where({
        status: 'active'
      })
      .limit(1)
      .get()

    const season = seasons.length > 0 ? seasons[0] : null

    // Query active score rules
    const { data: scoreRules } = await db.collection('score_rules')
      .where({
        status: 'active'
      })
      .get()

    // Query credit rules (first record)
    const { data: creditRulesData } = await db.collection('credit_rules')
      .limit(1)
      .get()

    const creditRules = creditRulesData.length > 0 ? creditRulesData[0] : null

    return {
      code: 0,
      message: 'ok',
      data: {
        season,
        scoreRules,
        creditRules
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message || 'Failed to get config',
      data: null
    }
  }
}
