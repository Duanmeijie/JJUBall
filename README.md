# JJUBall 校园约球小程序

> 九江学院乒乓球协会官方小程序 | 基于微信云开发的校园约球与积分管理平台

---

## 一、项目概述

JJUBall 是面向九江学院乒乓球协会的微信小程序，解决协会活动报名、约球匹配、积分统计、赛季管理的数字化需求。项目以"快速落地、好用易交接、长期稳定运营"为核心目标，采用微信云开发实现零服务器、零域名、零备案的全栈方案。

**核心定位**：辅助工具，不替代微信群，降低管理成本，提升会员参与感。

**核心价值**：
- **对会员**：快速报名活动、查看积分排名、了解赛季进度
- **对管理员**：高效管理活动、统计赛事数据、配置积分规则
- **对协会**：数字化运营、数据可追溯、换届易交接

---

## 二、技术栈与环境配置

### 2.1 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 微信小程序原生 | WXML + WXSS + JavaScript (ES6+) |
| 后端 | 微信云开发 | 云函数 (Node.js 12+) + 云数据库 + 云存储 |
| 部署 | 微信云开发环境 | 无需服务器、域名、备案、HTTPS 证书 |
| 鉴权 | 微信原生登录 | 免鉴权获取 openid，一键接入订阅消息 |

### 2.2 环境配置

- **小程序 AppID**: `wxb1dbe132920d5c1c`
- **云开发环境**: 需在小程序后台开通云开发，记录环境 ID
- **最低基础库**: 2.14.0（支持云开发最新能力）
- **类目**: 体育 > 体育场馆/赛事服务（备选：体育 > 体育资讯/服务）
- **开发工具**: 微信开发者工具 Stable 版

### 2.3 初始化步骤

1. 微信开发者工具导入项目，填写 AppID
2. 右键 `cloudfunctions/` 目录，选择"创建并部署云开发环境"
3. 在 `app.js` 中初始化云开发：
   ```javascript
   wx.cloud.init({
     env: 'your-env-id', // 替换为实际环境 ID
     traceUser: true
   })
   ```
4. 创建数据库集合（见第四章），设置相应权限
5. 部署所有云函数并配置触发器（如需要定时任务）

---

## 三、项目目录结构

```
JJUBall/
├── miniprogram/                    # 小程序前端
│   ├── app.js                      # 应用入口，初始化云开发
│   ├── app.json                    # 全局配置（页面路由、窗口样式）
│   ├── app.wxss                    # 全局样式
│   ├── components/                 # 公共组件
│   │   ├── activity-card/          # 活动卡片组件（展示活动信息、报名状态）
│   │   ├── match-item/             # 比赛记录项组件（展示比赛结果、积分变动）
│   │   ├── ranking-item/           # 排行榜项组件（展示排名、积分、段位）
│   │   └── message-tip/            # 消息红点组件（未读消息提示）
│   ├── pages/
│   │   ├── index/                  # 首页（活动列表+快捷入口，所有角色可见）
│   │   ├── activity/
│   │   │   ├── list/               # 活动列表页（筛选、分页，所有角色可见）
│   │   │   ├── detail/             # 活动详情页（报名/取消/查看名单，已登录可见）
│   │   │   └── create/             # 发布活动页（仅 admin 可见）
│   │   ├── match/
│   │   │   ├── record/             # 录入比赛成绩页（仅 referee/admin 可见）
│   │   │   ├── history/            # 个人比赛历史页（所有角色可见）
│   │   │   └── detail/             # 比赛详情页（所有角色可见）
│   │   ├── ranking/
│   │   │   ├── ranking/            # 积分排行榜页（本赛季，所有角色可见）
│   │   │   └── season/             # 赛季信息/历史赛季页（所有角色可见）
│   │   ├── profile/
│   │   │   ├── profile/            # 个人中心（积分/信誉分/段位，已登录可见）
│   │   │   ├── edit/               # 编辑资料页（学号/姓名，已登录可见）
│   │   │   ├── messages/           # 站内消息中心（已登录可见）
│   │   │   └── feedback/           # 意见反馈页（已登录可见）
│   │   └── admin/
│   │       ├── dashboard/          # 管理后台首页（仅 admin 可见）
│   │       ├── user-manage/        # 用户管理页（角色调整，仅 admin 可见）
│   │       ├── score-rules/        # 积分规则配置页（仅 admin 可见）
│   │       ├── credit-rules/       # 信誉分规则配置页（仅 admin 可见）
│   │       ├── data-export/        # 数据导出页（仅 admin 可见）
│   │       └── weather-cancel/     # 天气取消活动页（仅 admin 可见）
│   ├── utils/
│   │   ├── db.js                   # 云数据库操作封装
│   │   ├── auth.js                 # 权限校验工具（角色判断、登录态检查）
│   │   ├── constants.js            # 常量定义（角色、段位、赛事类型）
│   │   └── format.js               # 日期/数据格式化工具
│   └── static/                     # 静态资源
│       └── images/                 # 图片资源（图标、占位图）
├── cloudfunctions/                 # 云函数（Node.js）
│   ├── login/                      # 微信登录/自动注册
│   ├── getUserInfo/                # 获取用户信息
│   ├── updateUserRole/             # 更新用户角色（管理员）
│   ├── createActivity/             # 创建活动
│   ├── getActivityList/            # 获取活动列表（分页）
│   ├── getActivityDetail/          # 获取活动详情
│   ├── signupActivity/             # 活动报名（乐观锁）
│   ├── cancelSignup/               # 取消报名
│   ├── cancelActivityByWeather/    # 天气原因取消活动
│   ├── createMatch/                # 创建比赛记录
│   ├── submitMatchResult/          # 提交比赛结果（积分事务计算）
│   ├── getScoreList/               # 获取积分排行榜
│   ├── getUserScore/               # 获取用户积分详情
│   ├── getCreditInfo/              # 获取信誉分信息
│   ├── updateScoreRules/           # 更新积分规则（管理员）
│   ├── updateCreditRules/          # 更新信誉分规则（管理员）
│   ├── sendSubscribeMessage/       # 发送订阅消息
│   ├── getMessages/                # 获取站内消息
│   ├── markMessageRead/            # 标记消息已读
│   ├── submitFeedback/             # 提交反馈
│   ├── exportData/                 # 数据导出（CSV/JSON，管理员）
│   └── config/                     # 全局配置读取
├── README.md
└── project.config.json
```

---

## 四、数据库集合设计

云数据库为文档型（类 MongoDB），所有集合默认权限：**仅创建者可读写**。管理员相关集合需调整为"所有用户可读，仅创建者可写"或由云函数统一管控。

### 4.1 users（用户表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _openid | String | 是 | - | 微信 openid，唯一标识 |
| nickName | String | 否 | '' | 微信昵称 |
| avatarUrl | String | 否 | '' | 微信头像 URL |
| studentId | String | 否 | '' | 学号 |
| name | String | 否 | '' | 真实姓名 |
| role | String | 是 | 'member' | 角色：member / referee / admin |
| creditScore | Number | 是 | 100 | 当前信誉分 |
| currentScore | Number | 是 | 0 | 本赛季积分 |
| totalScore | Number | 是 | 0 | 历史总积分 |
| seasonId | String | 否 | '' | 当前参与赛季 ID |
| rank | String | 是 | '青铜' | 段位：青铜 / 白银 / 黄金 / 王者 |
| createdAt | Date | 是 | 当前时间 | 注册时间 |
| updatedAt | Date | 是 | 当前时间 | 更新时间 |

**索引**: `_openid`（唯一）, `role`, `currentScore`（倒序）

**权限**: 所有用户可读（脱敏），仅本人可写，admin 可修改 role

### 4.2 activities（活动表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 活动 ID |
| title | String | 是 | - | 活动标题 |
| type | String | 是 | 'entertainment' | 类型：entertainment / internal / external |
| location | String | 是 | - | 活动地点（校内场馆） |
| startTime | Date | 是 | - | 开始时间 |
| endTime | Date | 是 | - | 结束时间 |
| maxCount | Number | 是 | 20 | 人数上限 |
| currentCount | Number | 是 | 0 | 已报名人数 |
| status | String | 是 | 'open' | 状态：open / closed / cancelled / completed |
| creatorId | String | 是 | - | 创建者 openid |
| weatherCancelled | Boolean | 是 | false | 是否天气原因取消 |
| cancelledReason | String | 否 | '' | 取消原因 |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**索引**: `startTime`（倒序）, `status`, `type`

**权限**: 所有用户可读，仅 admin 可写

### 4.3 activity_signups（活动报名表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| activityId | String | 是 | - | 活动 ID |
| userId | String | 是 | - | 用户 openid |
| status | String | 是 | 'signed' | 状态：signed / cancelled / absent |
| signupTime | Date | 是 | 当前时间 | 报名时间 |
| cancelTime | Date | 否 | null | 取消时间 |

**索引**: `activityId` + `userId`（联合唯一）, `userId`

**权限**: 所有用户可读（仅本人记录），本人可写 status

### 4.4 matches（比赛表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 比赛 ID |
| activityId | String | 否 | '' | 关联活动 ID |
| playerA | String | 是 | - | 选手 A openid |
| playerB | String | 是 | - | 选手 B openid |
| scoreA | Number | 是 | 0 | A 得分 |
| scoreB | Number | 是 | 0 | B 得分 |
| winnerId | String | 否 | '' | 胜者 openid |
| matchType | String | 是 | 'entertainment' | 赛事类型（决定权重） |
| seasonId | String | 是 | - | 所属赛季 |
| refereeId | String | 否 | '' | 裁判 openid |
| status | String | 是 | 'pending' | 状态：pending / completed / cancelled |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**索引**: `activityId`, `playerA`, `playerB`, `seasonId`

**权限**: 所有用户可读，仅 referee/admin 可写

### 4.5 score_rules（积分规则表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 规则 ID |
| ruleName | String | 是 | - | 规则名称 |
| winScore | Number | 是 | 3 | 胜场加分 |
| loseScore | Number | 是 | 1 | 负场加分（参与分） |
| absentScore | Number | 是 | -5 | 缺席扣分 |
| matchTypeWeight | Number | 是 | 1.0 | 赛事权重系数 |
| seasonId | String | 是 | - | 适用赛季 |
| isActive | Boolean | 是 | true | 是否生效 |

**权限**: 所有用户可读，仅 admin 可写

### 4.6 scores（积分流水表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 流水 ID |
| userId | String | 是 | - | 用户 openid |
| seasonId | String | 是 | - | 赛季 ID |
| scoreChange | Number | 是 | 0 | 变动值（可负） |
| totalScore | Number | 是 | 0 | 变动后总积分 |
| reason | String | 是 | - | 原因：win / lose / absent / rule |
| matchId | String | 否 | '' | 关联比赛 ID |
| activityId | String | 否 | '' | 关联活动 ID |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**索引**: `userId` + `seasonId`, `createdAt`（倒序）

**权限**: 所有用户可读（仅本人记录），仅云函数可写

### 4.7 credit_rules（信誉分规则表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 规则 ID |
| ruleName | String | 是 | - | 规则名称 |
| tempCancelScore | Number | 是 | -10 | 临时取消扣分 |
| absentScore | Number | 是 | -20 | 无故缺席扣分 |
| threshold | Number | 是 | 60 | 低分限制阈值 |

**权限**: 所有用户可读，仅 admin 可写

### 4.8 credit_records（信誉分记录表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 记录 ID |
| userId | String | 是 | - | 用户 openid |
| changeValue | Number | 是 | 0 | 变动值 |
| reason | String | 是 | - | 原因：temp_cancel / absent / weather_exempt |
| activityId | String | 否 | '' | 关联活动 |
| matchId | String | 否 | '' | 关联比赛 |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**权限**: 所有用户可读（仅本人记录），仅云函数可写

### 4.9 seasons（赛季表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 赛季 ID |
| name | String | 是 | - | 赛季名称（如：2025 春季学期） |
| startDate | Date | 是 | - | 开始日期 |
| endDate | Date | 是 | - | 结束日期 |
| isActive | Boolean | 是 | true | 是否当前赛季 |
| isArchived | Boolean | 是 | false | 是否已归档 |

**权限**: 所有用户可读，仅 admin 可写

### 4.10 messages（站内消息表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 消息 ID |
| toUserId | String | 是 | - | 接收者 openid |
| type | String | 是 | 'system' | 类型：system / activity / match |
| title | String | 是 | - | 标题 |
| content | String | 是 | - | 内容 |
| relatedId | String | 否 | '' | 关联活动/比赛 ID |
| isRead | Boolean | 是 | false | 是否已读 |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**索引**: `toUserId` + `isRead`

**权限**: 仅接收者本人可读/写（标记已读），仅云函数可写新消息

### 4.11 feedbacks（反馈表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| _id | String | 是 | 自动生成 | 反馈 ID |
| userId | String | 是 | - | 提交者 openid |
| content | String | 是 | - | 反馈内容 |
| contact | String | 否 | '' | 联系方式 |
| status | String | 是 | 'pending' | 状态：pending / resolved |
| reply | String | 否 | '' | 管理员回复 |
| createdAt | Date | 是 | 当前时间 | 创建时间 |

**权限**: 提交者本人和 admin 可读，仅 admin 可写 reply

---

## 五、云函数 API 设计

所有云函数统一返回格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 5.1 用户相关

#### login

- **说明**: 微信登录，获取 openid，自动创建用户（如不存在）
- **入参**: 无（使用云函数上下文 openid）
- **出参**: 用户信息对象（含 role, creditScore, currentScore, rank）
- **业务逻辑**:
  1. 从 `cloud.getWXContext()` 获取 openid
  2. 查询 users 集合，若不存在则插入新用户记录
  3. 返回用户信息

#### getUserInfo

- **入参**: `{ userId?: String }`（不传则查询自己）
- **出参**: 用户详情（脱敏处理，不返回敏感字段）
- **权限**: 已登录用户

#### updateUserRole

- **入参**: `{ userId: String, role: 'member' | 'referee' | 'admin' }`
- **出参**: 更新后的用户信息
- **权限**: 仅 admin
- **业务逻辑**:
  1. 校验调用者角色为 admin
  2. 更新目标用户的 role 字段
  3. 写入站内消息通知用户角色变更

### 5.2 活动相关

#### createActivity

- **入参**: `{ title: String, type: String, location: String, startTime: Date, endTime: Date, maxCount: Number }`
- **出参**: `{ activityId: String }`
- **权限**: 仅 admin
- **业务逻辑**:
  1. 校验活动开始时间不能早于当前时间
  2. 插入 activities 集合
  3. 返回新建活动 ID

#### getActivityList

- **入参**: `{ status?: String, type?: String, page: Number, pageSize: Number }`
- **出参**: `{ list: Array, total: Number, hasMore: Boolean }`
- **业务逻辑**:
  1. 按条件过滤 activities 集合
  2. 按 startTime 倒序排序
  3. 分页返回，附带已报名人数

#### getActivityDetail

- **入参**: `{ activityId: String }`
- **出参**: 活动详情 + 当前用户报名状态 + 报名名单
- **业务逻辑**:
  1. 查询活动详情
  2. 查询当前用户在该活动的报名记录
  3. 查询报名名单（脱敏）

#### signupActivity

- **入参**: `{ activityId: String }`
- **出参**: `{ success: Boolean, message: String }`
- **权限**: 已登录用户
- **核心逻辑（乐观锁防超卖）**:
  ```javascript
  const activity = db.collection('activities');
  const result = await activity.doc(activityId).update({
    data: {
      currentCount: _.inc(1)
    },
    where: {
      currentCount: _.lt(maxCount),
      status: 'open'
    }
  });
  if (result.stats.updated === 0) {
    throw new Error('活动已满员或已关闭');
  }
  ```
  1. 检查活动状态为 open 且未满员
  2. 使用云数据库条件更新实现乐观锁
  3. 插入 activity_signups 记录
  4. 发送订阅消息通知创建者

#### cancelSignup

- **入参**: `{ activityId: String, reason?: String }`
- **出参**: `{ success: Boolean, message: String, creditDeducted: Boolean }`
- **权限**: 已登录用户（仅限本人报名）
- **业务逻辑**:
  1. 查询报名记录，验证用户已报名
  2. 计算取消时间距活动开始的时长
  3. 若 < 2 小时，扣除信誉分（写入 credit_records，更新 users.creditScore）
  4. 更新 activity_signups.status 为 'cancelled'
  5. activities.currentCount - 1
  6. 发送站内消息通知活动创建者

#### cancelActivityByWeather

- **入参**: `{ activityId: String, reason: String }`
- **出参**: `{ success: Boolean, notifiedCount: Number }`
- **权限**: 仅 admin
- **业务逻辑**:
  1. 设置 activities.weatherCancelled = true, status = 'cancelled'
  2. 遍历该活动所有报名者，不扣信誉分（写入 credit_records，reason = 'weather_exempt'）
  3. 发送站内消息和订阅消息通知所有报名者
  4. 返回通知人数

### 5.3 比赛与积分相关

#### createMatch

- **入参**: `{ activityId?: String, playerA: String, playerB: String, matchType: String, seasonId: String }`
- **出参**: `{ matchId: String }`
- **权限**: referee / admin
- **业务逻辑**:
  1. 校验选手不能相同
  2. 查询当前活跃赛季（若未传 seasonId）
  3. 插入 matches 集合，status = 'pending'

#### submitMatchResult

- **入参**: `{ matchId: String, scoreA: Number, scoreB: Number }`
- **出参**: `{ success: Boolean, scoreChanges: { playerA: Number, playerB: Number } }`
- **权限**: referee / admin
- **业务逻辑（事务）**:
  1. 开启云数据库事务
  2. 更新 matches：scoreA, scoreB, winnerId, status = 'completed'
  3. 读取 score_rules（根据 matchType 和 seasonId）
  4. 计算双方积分变动：
     - 胜方：winScore * matchTypeWeight
     - 负方：loseScore * matchTypeWeight
  5. 更新 users.currentScore / totalScore
  6. 写入 scores 流水记录（双方各一条）
  7. 检查段位晋升（根据 totalScore 范围更新 users.rank）：
     - 青铜: 0-99
     - 白银: 100-299
     - 黄金: 300-599
     - 王者: 600+
  8. 提交事务
  9. 发送站内消息通知双方比赛结果和积分变动

#### getScoreList

- **入参**: `{ seasonId?: String, page: Number, pageSize: Number }`
- **出参**: `{ list: Array, total: Number }`（含 nickName, avatarUrl, currentScore, rank）
- **业务逻辑**:
  1. 若未传 seasonId，查询当前活跃赛季
  2. 按 currentScore 倒序排序
  3. 分页返回排行榜

#### getUserScore

- **入参**: `{ userId?: String, seasonId?: String }`
- **出参**: `{ userInfo: Object, currentScore: Number, totalScore: Number, rank: String, history: Array }`
- **业务逻辑**:
  1. 查询用户积分概览
  2. 查询近 10 条积分流水
  3. 返回积分详情

#### getCreditInfo

- **入参**: `{ userId?: String }`
- **出参**: `{ creditScore: Number, records: Array }`
- **业务逻辑**:
  1. 查询用户当前信誉分
  2. 查询近 10 条信誉分记录
  3. 返回信誉分详情

### 5.4 规则配置（管理员）

#### updateScoreRules

- **入参**: `{ seasonId: String, rules: Array<{ matchType: String, winScore: Number, loseScore: Number, weight: Number }> }`
- **出参**: `{ success: Boolean }`
- **权限**: 仅 admin
- **业务逻辑**:
  1. 批量更新 score_rules 集合
  2. 记录操作日志

#### updateCreditRules

- **入参**: `{ tempCancelScore: Number, absentScore: Number, threshold: Number }`
- **出参**: `{ success: Boolean }`
- **权限**: 仅 admin
- **业务逻辑**:
  1. 查询现有规则记录
  2. 更新 credit_rules 集合

### 5.5 消息相关

#### sendSubscribeMessage

- **入参**: `{ touser: String, templateId: String, data: Object, page?: String }`
- **出参**: `{ success: Boolean }`
- **权限**: 云函数调用（内部使用）
- **业务逻辑**:
  1. 调用 `cloud.openapi.subscribeMessage.send`
  2. 发送微信订阅消息
  3. 记录发送日志

#### getMessages

- **入参**: `{ page: Number, pageSize: Number }`
- **出参**: `{ list: Array, unreadCount: Number }`
- **权限**: 已登录用户
- **业务逻辑**:
  1. 查询当前用户的站内消息
  2. 按 createdAt 倒序排序
  3. 统计未读消息数量

#### markMessageRead

- **入参**: `{ messageId: String }`
- **出参**: `{ success: Boolean }`
- **权限**: 已登录用户（仅限本人消息）
- **业务逻辑**:
  1. 验证消息归属
  2. 更新 messages.isRead = true

#### submitFeedback

- **入参**: `{ content: String, contact?: String }`
- **出参**: `{ success: Boolean, feedbackId: String }`
- **权限**: 已登录用户
- **业务逻辑**:
  1. 插入 feedbacks 集合
  2. 发送站内消息通知管理员

### 5.6 数据导出（管理员）

#### exportData

- **入参**: `{ type: String, startDate?: Date, endDate?: Date }`
- **出参**: `{ fileID: String, downloadUrl: String }`
- **权限**: 仅 admin
- **业务逻辑**:
  1. 根据 type 查询对应集合（users / activities / matches / scores）
  2. 生成 CSV 文件
  3. 上传至云存储
  4. 返回文件下载链接

#### config

- **入参**: 无
- **出参**: 全局配置对象（积分规则、信誉分规则、赛季信息等）
- **业务逻辑**: 读取各配置集合并返回

---

## 六、页面路由设计

### 6.1 路由列表

| 页面路径 | 页面名称 | 角色可见性 | 功能说明 |
|----------|----------|------------|----------|
| `pages/index/index` | 首页 | 所有用户 | 活动快捷入口、近期活动预览、未读消息提示 |
| `pages/activity/list/list` | 活动列表 | 所有用户 | 按状态/类型筛选活动、分页加载、跳转到详情 |
| `pages/activity/detail/detail` | 活动详情 | 已登录用户 | 查看活动信息、报名/取消操作、查看报名名单 |
| `pages/activity/create/create` | 发布活动 | 仅 admin | 填写活动信息、提交创建活动 |
| `pages/match/record/record` | 录入成绩 | referee / admin | 选择比赛、输入比分、提交结果 |
| `pages/match/history/history` | 比赛历史 | 所有用户 | 查看个人参与的比赛记录、筛选赛季 |
| `pages/match/detail/detail` | 比赛详情 | 所有用户 | 查看比赛比分、胜者、积分变动 |
| `pages/ranking/ranking/ranking` | 排行榜 | 所有用户 | 本赛季积分排名、查看自己排名、切换赛季 |
| `pages/ranking/season/season` | 赛季管理 | 所有用户 | 查看当前赛季信息、历史赛季归档 |
| `pages/profile/profile/profile` | 个人中心 | 已登录用户 | 查看个人信息、积分、信誉分、段位、设置 |
| `pages/profile/edit/edit` | 编辑资料 | 已登录用户 | 修改学号、姓名、头像 |
| `pages/profile/messages/messages` | 消息中心 | 已登录用户 | 查看站内消息、标记已读、跳转关联页面 |
| `pages/profile/feedback/feedback` | 意见反馈 | 已登录用户 | 提交反馈、查看反馈状态 |
| `pages/admin/dashboard/dashboard` | 管理后台 | 仅 admin | 数据统计、快捷操作入口、待处理事项 |
| `pages/admin/user-manage/user-manage` | 用户管理 | 仅 admin | 查看用户列表、修改角色、搜索用户 |
| `pages/admin/score-rules/score-rules` | 积分规则 | 仅 admin | 查看/编辑积分规则、按赛季配置 |
| `pages/admin/credit-rules/credit-rules` | 信誉规则 | 仅 admin | 查看/信誉分规则配置 |
| `pages/admin/data-export/data-export` | 数据导出 | 仅 admin | 选择数据类型、时间范围、导出文件下载 |
| `pages/admin/weather-cancel/weather-cancel` | 天气取消 | 仅 admin | 选择活动、填写取消原因、确认取消并通知 |

### 6.2 导航栏设计

```
底部 TabBar:
  - 首页 (pages/index/index)
  - 活动 (pages/activity/list/list)
  - 排行 (pages/ranking/ranking/ranking)
  - 我的 (pages/profile/profile/profile)

页面内导航:
  - 个人中心 -> 消息中心 / 编辑资料 / 意见反馈
  - 活动列表 -> 活动详情 -> 报名/取消
  - 管理后台 -> 用户管理 / 规则配置 / 数据导出 / 天气取消
```

---

## 七、核心功能实现细节

### 7.1 乐观锁防超卖

**场景**: 活动报名时，多人同时报名导致超员。

**实现方案**:

```javascript
// cloudfunctions/signupActivity/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { activityId } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 使用数据库条件更新实现乐观锁
    const activityResult = await db.collection('activities').doc(activityId).update({
      data: {
        currentCount: _.inc(1)
      },
      where: {
        currentCount: _.lt(db.collection('activities').doc(activityId).field({ maxCount: true })),
        status: 'open'
      }
    });

    if (activityResult.stats.updated === 0) {
      return { code: -1, message: '活动已满员或已关闭', data: null };
    }

    // 插入报名记录
    await db.collection('activity_signups').add({
      data: {
        activityId,
        userId: OPENID,
        status: 'signed',
        signupTime: db.serverDate()
      }
    });

    return { code: 0, message: '报名成功', data: { success: true } };
  } catch (err) {
    return { code: -2, message: '报名失败', data: err };
  }
};
```

**关键点**:
- 使用云数据库的 `_.inc()` 和条件更新
- `stats.updated === 0` 表示条件不满足（已满员）
- 无需手动加锁，数据库层面保证原子性

### 7.2 信誉分机制

**设计目的**: 约束用户报名后无故缺席或临时取消的行为。

**规则配置**（credit_rules 集合）:

| 行为 | 扣分 | 说明 |
|------|------|------|
| 临时取消（活动开始前 2 小时内） | -10 | 影响活动组织 |
| 无故缺席（报名后未参加且未取消） | -20 | 严重影响活动 |
| 天气原因取消 | 0 | 免责情况 |

**实现流程**:

1. **取消报名时**:
   ```javascript
   const startTime = activity.startTime.getTime();
   const cancelTime = Date.now();
   const hoursBefore = (startTime - cancelTime) / (1000 * 60 * 60);

   if (hoursBefore < 2) {
     // 扣除信誉分
     const creditRules = await db.collection('credit_rules').where({}).get();
     const deductScore = creditRules.data[0].tempCancelScore;

     await db.collection('credit_records').add({
       data: {
         userId: OPENID,
         changeValue: deductScore,
         reason: 'temp_cancel',
         activityId,
         createdAt: db.serverDate()
       }
     });

     await db.collection('users').doc(OPENID).update({
       data: { creditScore: _.inc(deductScore) }
     });
   }
   ```

2. **活动结束后的缺席检查**（可由定时任务触发）:
   ```javascript
   // 云函数：定时任务触发
   exports.main = async (event, context) => {
     const now = Date.now();
     // 查询已结束但未标记完成的活动
     const activities = await db.collection('activities')
       .where({
         endTime: _.lt(new Date(now)),
         status: 'open'
       })
       .get();

     for (const activity of activities.data) {
       // 查询所有报名者
       const signups = await db.collection('activity_signups')
         .where({ activityId: activity._id, status: 'signed' })
         .get();

       for (const signup of signups.data) {
         // 标记为缺席并扣分
         await db.collection('activity_signups').doc(signup._id).update({
           data: { status: 'absent' }
         });

         await db.collection('credit_records').add({
           data: {
             userId: signup.userId,
             changeValue: -20,
             reason: 'absent',
             activityId: activity._id,
             createdAt: db.serverDate()
           }
         });

         await db.collection('users').doc(signup.userId).update({
           data: { creditScore: _.inc(-20) }
         });
       }

       // 更新活动状态
       await db.collection('activities').doc(activity._id).update({
         data: { status: 'completed' }
       });
     }
   };
   ```

3. **信誉分阈值限制**:
   - 信誉分低于 60 的用户，限制报名新活动
   - 在 signupActivity 云函数中增加校验：
     ```javascript
     const user = await db.collection('users').doc(OPENID).get();
     if (user.data.creditScore < 60) {
       return { code: -3, message: '信誉分过低，无法报名活动', data: null };
     }
     ```

### 7.3 天气容错取消

**场景**: 因暴雨等恶劣天气，管理员需要临时取消活动。

**实现流程**:

1. 管理员在 `pages/admin/weather-cancel/weather-cancel` 选择活动
2. 填写取消原因（如"暴雨天气，场地湿滑"）
3. 调用 `cancelActivityByWeather` 云函数
4. 云函数执行:
   ```javascript
   exports.main = async (event, context) => {
     const { activityId, reason } = event;

     // 1. 更新活动状态
     await db.collection('activities').doc(activityId).update({
       data: {
         weatherCancelled: true,
         status: 'cancelled',
         cancelledReason: reason
       }
     });

     // 2. 查询所有报名者
     const signups = await db.collection('activity_signups')
       .where({ activityId, status: 'signed' })
       .get();

     // 3. 不扣信誉分，记录免责原因
     for (const signup of signups.data) {
       await db.collection('credit_records').add({
         data: {
           userId: signup.userId,
           changeValue: 0,
           reason: 'weather_exempt',
           activityId,
           createdAt: db.serverDate()
         }
       });

       // 4. 发送站内消息
       await db.collection('messages').add({
         data: {
           toUserId: signup.userId,
           type: 'activity',
           title: '活动因天气取消',
           content: `活动因${reason}已取消，不影响您的信誉分。`,
           relatedId: activityId,
           isRead: false,
           createdAt: db.serverDate()
         }
       });
     }

     // 5. 发送订阅消息（需用户授权）
     for (const signup of signups.data) {
       await cloud.openapi.subscribeMessage.send({
         touser: signup.userId,
         templateId: 'weather_cancel_template_id',
         data: {
           thing1: { value: '活动因天气取消' },
           thing2: { value: reason },
           time3: { value: formatTime(new Date()) }
         }
       });
     }

     return { code: 0, message: '取消成功', data: { notifiedCount: signups.data.length } };
   };
   ```

**关键点**:
- 天气取消不扣信誉分
- 同时发送站内消息和订阅消息
- 记录免责原因便于追溯

### 7.4 积分事务计算

**场景**: 提交比赛结果时，需要同时更新比赛记录、双方积分、积分流水，保证数据一致性。

**实现方案**（云数据库事务）:

```javascript
// cloudfunctions/submitMatchResult/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { matchId, scoreA, scoreB } = event;
  const { OPENID } = cloud.getWXContext();

  // 权限校验
  const user = await db.collection('users').doc(OPENID).get();
  if (user.data.role !== 'referee' && user.data.role !== 'admin') {
    return { code: -1, message: '无权限', data: null };
  }

  // 开启事务
  const transaction = await db.startTransaction();

  try {
    // 1. 查询比赛记录
    const match = await transaction.collection('matches').doc(matchId).get();
    if (match.data.status !== 'pending') {
      throw new Error('比赛已结束或取消');
    }

    // 2. 确定胜者
    const winnerId = scoreA > scoreB ? match.data.playerA : match.data.playerB;

    // 3. 查询积分规则
    const rules = await transaction.collection('score_rules')
      .where({
        seasonId: match.data.seasonId,
        matchType: match.data.matchType,
        isActive: true
      })
      .get();
    const rule = rules.data[0];

    // 4. 计算积分变动
    const winnerChange = rule.winScore * rule.matchTypeWeight;
    const loserChange = rule.loseScore * rule.matchTypeWeight;

    // 5. 更新比赛记录
    await transaction.collection('matches').doc(matchId).update({
      data: {
        scoreA,
        scoreB,
        winnerId,
        status: 'completed'
      }
    });

    // 6. 更新双方积分
    await transaction.collection('users').doc(match.data.playerA).update({
      data: {
        currentScore: _.inc(scoreA > scoreB ? winnerChange : loserChange),
        totalScore: _.inc(scoreA > scoreB ? winnerChange : loserChange)
      }
    });

    await transaction.collection('users').doc(match.data.playerB).update({
      data: {
        currentScore: _.inc(scoreB > scoreA ? winnerChange : loserChange),
        totalScore: _.inc(scoreB > scoreA ? winnerChange : loserChange)
      }
    });

    // 7. 写入积分流水
    await transaction.collection('scores').add({
      data: {
        userId: match.data.playerA,
        seasonId: match.data.seasonId,
        scoreChange: scoreA > scoreB ? winnerChange : loserChange,
        totalScore: /* 查询后更新 */,
        reason: scoreA > scoreB ? 'win' : 'lose',
        matchId,
        createdAt: db.serverDate()
      }
    });

    await transaction.collection('scores').add({
      data: {
        userId: match.data.playerB,
        seasonId: match.data.seasonId,
        scoreChange: scoreB > scoreA ? winnerChange : loserChange,
        totalScore: /* 查询后更新 */,
        reason: scoreB > scoreA ? 'win' : 'lose',
        matchId,
        createdAt: db.serverDate()
      }
    });

    // 8. 检查段位晋升
    await checkRankPromotion(transaction, match.data.playerA);
    await checkRankPromotion(transaction, match.data.playerB);

    // 9. 提交事务
    await transaction.commit();

    // 10. 发送站内消息（事务外）
    await sendMatchNotification(match.data.playerA, match.data.playerB, scoreA, scoreB, matchId);

    return {
      code: 0,
      message: '提交成功',
      data: {
        success: true,
        scoreChanges: {
          playerA: scoreA > scoreB ? winnerChange : loserChange,
          playerB: scoreB > scoreA ? winnerChange : loserChange
        }
      }
    };
  } catch (err) {
    // 回滚事务
    await transaction.rollback();
    return { code: -2, message: '提交失败', data: err.message };
  }
};

// 段位检查函数
async function checkRankPromotion(transaction, userId) {
  const user = await transaction.collection('users').doc(userId).get();
  const totalScore = user.data.totalScore;

  let newRank = user.data.rank;
  if (totalScore >= 600) newRank = '王者';
  else if (totalScore >= 300) newRank = '黄金';
  else if (totalScore >= 100) newRank = '白银';

  if (newRank !== user.data.rank) {
    await transaction.collection('users').doc(userId).update({
      data: { rank: newRank }
    });

    // 发送晋升通知消息
    await db.collection('messages').add({
      data: {
        toUserId: userId,
        type: 'system',
        title: '段位晋升',
        content: `恭喜！您的段位已从 ${user.data.rank} 晋升为 ${newRank}！`,
        isRead: false,
        createdAt: db.serverDate()
      }
    });
  }
}
```

**关键点**:
- 使用云数据库事务保证原子性
- 任何一步失败都会回滚
- 段位晋升自动检测并通知

### 7.5 赛季段位系统

**赛季设计**:
- 每个学期一个赛季（如"2025 春季学期"）
- 赛季结束时，currentScore 清零，totalScore 保留
- 历史赛季数据归档，可查看但不可修改

**段位规则**:

| 段位 | 总积分范围 | 说明 |
|------|------------|------|
| 青铜 | 0-99 | 新手入门 |
| 白银 | 100-299 | 积极参与 |
| 黄金 | 300-599 | 核心成员 |
| 王者 | 600+ | 协会顶尖 |

**赛季切换流程**（管理员操作）:
1. 在 `seasons` 集合中创建新赛季记录
2. 将旧赛季的 isActive 设为 false，isArchived 设为 true
3. 批量更新所有用户的 currentScore 为 0（保留 totalScore）
4. 更新 users.seasonId 为新区赛 ID

### 7.6 三级权限拦截

**角色定义**:

| 角色 | 标识 | 权限说明 |
|------|------|----------|
| 普通会员 | member | 浏览活动、报名、查看积分、个人中心 |
| 裁判/干事 | referee | 录入比赛成绩、查看管理数据 |
| 会长/管理员 | admin | 创建活动、管理用户、配置规则、数据导出 |

**前端拦截**（auth.js）:

```javascript
// utils/auth.js
function checkRole(requiredRole) {
  const userRole = wx.getStorageSync('userRole');
  const roleLevel = { member: 1, referee: 2, admin: 3 };
  return roleLevel[userRole] >= roleLevel[requiredRole];
}

function requireAuth(page, requiredRole) {
  if (!checkRole(requiredRole)) {
    wx.showToast({ title: '无权限访问', icon: 'none' });
    wx.navigateBack();
    return false;
  }
  return true;
}

module.exports = { checkRole, requireAuth };
```

**页面使用示例**:

```javascript
// pages/admin/dashboard/dashboard.js
const auth = require('../../../utils/auth');

Page({
  onLoad() {
    if (!auth.requireAuth(this, 'admin')) return;
    // 正常加载管理后台数据
  }
});
```

**后端拦截**（云函数中）:

```javascript
// 每个需要权限的云函数开头
const { OPENID } = cloud.getWXContext();
const user = await db.collection('users').doc(OPENID).get();

if (user.data.role !== 'admin') {
  return { code: -1, message: '无权限操作', data: null };
}
```

---

## 八、订阅消息与站内消息设计

### 8.1 订阅消息（微信原生）

**说明**: 订阅消息需用户在小程序内授权，用于重要通知的即时推送。

**消息模板配置**（小程序后台 -> 订阅消息）:

| 模板名称 | 模板 ID | 触发场景 | 关键词 |
|----------|---------|----------|--------|
| 活动报名成功 | `signup_success` | 用户报名活动 | 活动名称、时间、地点 |
| 活动取消通知 | `activity_cancel` | 活动被取消（含天气） | 活动名称、取消原因 |
| 比赛结果通知 | `match_result` | 比赛成绩录入 | 对手、比分、积分变动 |
| 段位晋升通知 | `rank_promotion` | 用户段位晋升 | 原段位、新段位 |

**发送示例**:

```javascript
// cloudfunctions/sendSubscribeMessage/index.js
exports.main = async (event, context) => {
  const { touser, templateId, data, page } = event;

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser,
      templateId,
      data,
      page: page || 'pages/index/index'
    });

    return { code: 0, message: '发送成功', data: result };
  } catch (err) {
    return { code: -1, message: '发送失败', data: err };
  }
};
```

**用户授权引导**:
- 在报名成功、比赛结束等关键节点弹出授权弹窗
- 在个人中心提供"开启通知"入口，引导用户授权

### 8.2 站内消息（云数据库）

**说明**: 站内消息存储在 messages 集合中，用户打开小程序时主动拉取。

**消息类型**:

| 类型 | 标识 | 触发场景 |
|------|------|----------|
| 系统消息 | system | 段位晋升、规则变更、赛季切换 |
| 活动消息 | activity | 活动报名成功、活动取消、天气取消 |
| 比赛消息 | match | 比赛结果、积分变动 |

**未读消息提示**:

```javascript
// 首页加载时查询未读数量
const messages = await db.collection('messages')
  .where({ toUserId: OPENID, isRead: false })
  .count();

this.setData({ unreadCount: messages.total });
```

**消息中心页面逻辑**:
1. 分页加载消息列表
2. 点击消息标记为已读
3. 点击关联活动/比赛跳转到对应页面

### 8.3 消息策略

| 场景 | 订阅消息 | 站内消息 |
|------|----------|----------|
| 报名成功 | 是 | 是 |
| 活动取消 | 是 | 是 |
| 比赛结果 | 是 | 是 |
| 段位晋升 | 是 | 是 |
| 管理员回复反馈 | 否 | 是 |
| 赛季切换 | 否 | 是 |

---

## 九、开发路线图

### Phase 1: MVP（最小可行产品）

**目标**: 核心流程跑通，可用于实际活动组织。

**功能清单**:
- [x] 微信登录与自动注册
- [x] 活动创建（仅 admin）
- [x] 活动列表与详情查看
- [x] 活动报名与取消（含乐观锁）
- [x] 个人中心（基本信息、积分查看）
- [x] 基础订阅消息（报名成功、活动取消）
- [x] 管理后台首页

**交付物**: 可上架审核的版本，支持协会日常活动报名。

### Phase 2: 迭代一（积分与比赛系统）

**目标**: 完善比赛管理与积分统计，提升会员参与感。

**功能清单**:
- [x] 比赛录入（referee/admin）
- [x] 积分事务计算与流水
- [x] 积分排行榜
- [x] 个人比赛历史
- [x] 比赛详情查看
- [x] 段位系统（青铜/白银/黄金/王者）
- [x] 订阅消息扩展（比赛结果、段位晋升）

**交付物**: 完整的比赛管理与积分排名系统。

### Phase 3: 迭代二（运营与管理增强）

**目标**: 强化管理能力和容错机制，支持长期运营。

**功能清单**:
- [x] 信誉分机制（临时取消扣分、缺席扣分）
- [x] 天气容错取消
- [x] 赛季管理（创建、切换、归档）
- [x] 积分规则/信誉分规则可配置
- [x] 站内消息中心
- [x] 意见反馈系统
- [x] 用户管理（角色调整）
- [x] 数据导出（CSV/JSON）
- [x] 低信誉分限制报名

**交付物**: 功能完备的协会管理工具，可长期稳定运营。

---

## 十、部署与交接文档

### 10.1 云开发环境配置

**步骤**:

1. **开通云开发**:
   - 登录小程序后台 -> 云开发 -> 开通
   - 记录环境 ID（如 `prod-xxxx`）

2. **配置环境 ID**:
   ```javascript
   // app.js
   wx.cloud.init({
     env: 'prod-xxxx', // 替换为实际环境 ID
     traceUser: true
   });
   ```

3. **创建数据库集合**:
   - 按第四章设计，在云开发控制台创建所有集合
   - 设置权限（见 10.1.2）

4. **部署云函数**:
   ```bash
   # 右键 cloudfunctions/ 目录 -> 上传并部署：云端安装依赖
   # 或逐个部署
   cd cloudfunctions/login && npm install
   # 右键 login 目录 -> 上传并部署
   ```

5. **配置订阅消息模板**:
   - 小程序后台 -> 订阅消息 -> 添加模板
   - 记录模板 ID，更新到云函数代码中

6. **配置定时任务**（如需）:
   - 云开发控制台 -> 云函数 -> 触发器
   - 添加缺席检查定时任务（如每天凌晨 2 点执行）

#### 10.1.1 云函数部署清单

| 云函数 | 依赖 | 环境变量 | 触发器 |
|--------|------|----------|--------|
| login | wx-server-sdk | 无 | 无 |
| getUserInfo | wx-server-sdk | 无 | 无 |
| updateUserRole | wx-server-sdk | 无 | 无 |
| createActivity | wx-server-sdk | 无 | 无 |
| getActivityList | wx-server-sdk | 无 | 无 |
| getActivityDetail | wx-server-sdk | 无 | 无 |
| signupActivity | wx-server-sdk | 无 | 无 |
| cancelSignup | wx-server-sdk | 无 | 无 |
| cancelActivityByWeather | wx-server-sdk | 无 | 无 |
| createMatch | wx-server-sdk | 无 | 无 |
| submitMatchResult | wx-server-sdk | 无 | 无 |
| getScoreList | wx-server-sdk | 无 | 无 |
| getUserScore | wx-server-sdk | 无 | 无 |
| getCreditInfo | wx-server-sdk | 无 | 无 |
| updateScoreRules | wx-server-sdk | 无 | 无 |
| updateCreditRules | wx-server-sdk | 无 | 无 |
| sendSubscribeMessage | wx-server-sdk | 模板 ID | 无 |
| getMessages | wx-server-sdk | 无 | 无 |
| markMessageRead | wx-server-sdk | 无 | 无 |
| submitFeedback | wx-server-sdk | 无 | 无 |
| exportData | wx-server-sdk, node-csv | 无 | 无 |
| config | wx-server-sdk | 无 | 无 |

#### 10.1.2 数据库权限配置

| 集合 | 权限设置 |
|------|----------|
| users | 所有用户可读（脱敏），仅创建者可写，admin 可修改 role |
| activities | 所有用户可读，仅 admin 可写 |
| activity_signups | 所有用户可读（仅本人），本人可写 status |
| matches | 所有用户可读，仅 referee/admin 可写 |
| score_rules | 所有用户可读，仅 admin 可写 |
| scores | 所有用户可读（仅本人），仅云函数可写 |
| credit_rules | 所有用户可读，仅 admin 可写 |
| credit_records | 所有用户可读（仅本人），仅云函数可写 |
| seasons | 所有用户可读，仅 admin 可写 |
| messages | 仅接收者本人可读/写，仅云函数可写新消息 |
| feedbacks | 提交者本人和 admin 可读，仅 admin 可写 reply |

### 10.2 数据备份

**定期备份策略**:

1. **手动备份**:
   - 云开发控制台 -> 数据库 -> 选择集合 -> 导出
   - 导出为 JSON 文件，保存到本地或云存储

2. **自动备份**:
   - 使用云函数定时任务，定期将数据导出到云存储
   ```javascript
   // 定时任务：每周日凌晨 3 点执行
   const cloud = require('wx-server-sdk');
   cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
   const db = cloud.database();

   exports.main = async (event, context) => {
     const collections = ['users', 'activities', 'matches', 'scores', 'credit_records'];
     const backupDate = new Date().toISOString().split('T')[0];

     for (const collection of collections) {
       const data = await db.collection(collection).get();
       // 上传到云存储
       const fileContent = JSON.stringify(data.data, null, 2);
       const upload = await cloud.uploadFile({
         cloudPath: `backups/${collection}_${backupDate}.json`,
         fileContent: Buffer.from(fileContent)
       });
     }

     return { success: true, backupDate };
   };
   ```

3. **恢复流程**:
   - 云开发控制台 -> 数据库 -> 选择集合 -> 导入
   - 或使用云函数读取备份文件并批量插入

### 10.3 账号交接清单

**换届交接时，需要交接以下内容**:

| 项目 | 说明 | 交接方式 |
|------|------|----------|
| 小程序管理员账号 | 微信公众平台登录账号 | 账号密码交接，修改绑定手机/邮箱 |
| 云开发环境 | 云开发控制台访问权限 | 添加新管理员，移除旧管理员 |
| AppID | wxb1dbe132920d5c1c | 文档记录 |
| 环境 ID | 云开发环境标识 | 文档记录 |
| 源码仓库 | Git 仓库地址 | 交接仓库权限 |
| 订阅消息模板 ID | 各消息模板标识 | 文档记录（README 中已列出） |
| 数据库权限配置 | 各集合权限规则 | 本文档第四章已详细说明 |
| 云函数列表 | 22 个云函数 | 本文档第三章已列出 |

**交接检查清单**:
- [ ] 确认新管理员已开通云开发访问权限
- [ ] 确认小程序后台已更换管理员绑定
- [ ] 确认源码仓库已转移权限
- [ ] 确认本文档已交给新管理员
- [ ] 新管理员已完成一次完整部署流程

### 10.4 常见运维操作

#### 10.4.1 新增活动类型

1. 修改 `utils/constants.js` 中的活动类型枚举
2. 更新 activities 集合的 type 字段说明
3. 重新部署前端代码

#### 10.4.2 调整积分规则

1. 管理员登录小程序 -> 管理后台 -> 积分规则配置
2. 修改对应赛季的规则
3. 规则立即生效，不影响历史数据

#### 10.4.3 处理用户投诉

1. 查看反馈记录（管理后台 -> 意见反馈）
2. 在反馈记录中回复
3. 如需手动调整积分/信誉分，通过云开发控制台直接修改

#### 10.4.4 云函数日志查看

1. 云开发控制台 -> 云函数 -> 选择函数 -> 日志
2. 按时间范围筛选，查看调用记录和错误信息

---

## 十一、运营建议

### 11.1 冷启动策略

**目标**: 快速积累初始用户，形成使用习惯。

**具体措施**:

1. **首次推广活动**:
   - 选择一场协会内部比赛作为首次线上活动
   - 管理员现场指导会员使用小程序报名
   - 现场录入比赛成绩，实时展示积分排名

2. **种子用户激励**:
   - 首批注册用户赠送 10 积分
   - 首次报名活动额外赠送 5 积分
   - 在微信群中宣传排行榜，激发竞争意识

3. **线下引导**:
   - 在球馆张贴小程序码
   - 制作简易使用指南（图文/短视频）
   - 协会干事带头使用，形成示范效应

### 11.2 激励闭环

**设计思路**: 参与 -> 积分 -> 排名 -> 荣誉感 -> 更多参与

**具体实现**:

1. **积分可视化**:
   - 每次比赛后立即显示积分变动
   - 个人中心展示积分趋势图

2. **排行榜效应**:
   - 首页展示 TOP 3 玩家
   - 定期在微信群公布排行榜截图
   - 赛季结束时颁发实体奖品（按排名）

3. **段位荣誉感**:
   - 达到新段位时推送全屏祝贺动画
   - 在个人名片展示段位徽章
   - 高段位用户在排行榜有特殊标识

4. **信誉分约束**:
   - 低信誉分限制报名，形成约束
   - 信誉分恢复需要时间，培养守约习惯

### 11.3 反馈通道

**建立多渠道反馈机制**:

1. **小程序内反馈**:
   - 个人中心 -> 意见反馈
   - 管理员 24 小时内回复

2. **微信群反馈**:
   - 设立专门的反馈收集时段（每周一次）
   - 管理员整理反馈并录入小程序

3. **定期调研**:
   - 每学期末发布问卷，收集使用体验
   - 根据反馈优先级规划下一版本功能

4. **数据驱动优化**:
   - 通过云开发统计功能使用频率
   - 分析用户流失节点（如报名流程、登录流程）
   - 针对性优化体验

### 11.4 长期运营建议

1. **保持更新节奏**:
   - 每学期初更新赛季
   - 根据实际需求调整积分规则
   - 及时修复 bug 和优化体验

2. **培养接班人**:
   - 提前培养 1-2 名熟悉系统的干事
   - 保留完整的技术文档和交接清单
   - 确保换届后系统能持续运行

3. **与微信群协同**:
   - 小程序不替代微信群，而是降低管理成本
   - 重要通知仍在群内发布，小程序作为工具
   - 鼓励用户在群内分享排行榜和比赛结果

4. **数据安全**:
   - 定期备份数据（每周一次）
   - 限制管理员权限，避免误操作
   - 敏感信息（学号、姓名）脱敏展示

---

## 附录

### A. 微信开发者工具快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + S | 保存并编译 |
| Ctrl + B | 编译 |
| Ctrl + Shift + P | 预览 |
| Ctrl + Alt + F | 格式化代码 |

### B. 云开发常用命令

| 操作 | 方式 |
|------|------|
| 部署云函数 | 右键云函数目录 -> 上传并部署：云端安装依赖 |
| 查看日志 | 云开发控制台 -> 云函数 -> 日志 |
| 导出数据 | 云开发控制台 -> 数据库 -> 集合 -> 导出 |
| 上传文件 | cloud.uploadFile API |

### C. 段位晋升规则速查

| 总积分 | 段位 |
|--------|------|
| 0-99 | 青铜 |
| 100-299 | 白银 |
| 300-599 | 黄金 |
| 600+ | 王者 |

### D. 信誉分规则速查

| 行为 | 扣分 |
|------|------|
| 临时取消（< 2 小时） | -10 |
| 无故缺席 | -20 |
| 天气取消 | 0 |
| 信誉分阈值限制 | < 60 无法报名 |

---

> **JJUBall** —— 让每一次挥拍都有记录，让每一场比赛都有意义。
