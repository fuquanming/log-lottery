/**
 * 浏览器端加密安全洗牌（无需指定抽取数量）
 * @param array 要洗牌的数组
 * @returns 洗牌后的新数组
 */
function shuffleBrowserCrypto<T>(array: T[]): T[] {
    const newArray = [...array]
    if (newArray.length <= 1)
        return newArray

    // 遍历数组，每轮生成一个随机索引
    for (let i = newArray.length - 1; i > 0; i--) {
        // 步骤1：生成一个 32 位无符号加密随机数（仅需1个）
        const randomBuffer = new Uint32Array(1) // 长度1表示只生成1个随机数
        crypto.getRandomValues(randomBuffer)

        // 步骤2：将随机数映射到 [0, i] 范围（核心：动态适配当前i的范围）
        const randomIndex = randomBuffer[0] % (i + 1);

        // 步骤3：交换元素
        [newArray[i], newArray[randomIndex]] = [newArray[randomIndex], newArray[i]]
    }
    return newArray
}

/**
 * @description 从源数组中随机获取指定数量的元素
 * @param {Array} sourceArray 源数组
 * @param {number} count 要获取的元素数量
 * @returns {Array} 随机获取的元素
 */

export function getRandomElements<T>(sourceArray: T[], count: number): T[] {
    if (count <= 0)
        return []
    if (count >= sourceArray.length) {
        return shuffleBrowserCrypto([...sourceArray])
    } // 抽全部=洗牌

    const newArray = [...sourceArray]
    const result: T[] = []

    // 抽取 count 个元素，每轮选一个随机索引加入结果，然后从原数组移除
    for (let i = 0; i < count; i++) {
        const randomBuffer = new Uint32Array(1)
        crypto.getRandomValues(randomBuffer)
        const randomIndex = randomBuffer[0] % newArray.length

        // 添加选中的元素到结果数组
        result.push(newArray[randomIndex])
        // 从原数组中移除已选中的元素，避免重复选择
        newArray.splice(randomIndex, 1)
    }

    return result
}



import type { AppointRule } from '@/types/appoint'
/**
 * @description 从源数组中随机获取指定数量的元素（支持指定奖项指定人）
 */
export function getRandomElementsWithPrize<
    T extends { uid?: string }
>(
    sourceArray: T[],
    count: number,
    currentPrizeId: string | null, // 当前抽奖的奖项
    appointRules: AppointRule[], // 指定奖项、人员
    alreadyPersonList: T[] // personConfig.getAlreadyPersonList 已中奖人员
): T[] {
    if (count <= 0) return []
  if (!currentPrizeId) {
    return getRandomElements(sourceArray, count)
  }

  // 1、已中奖人员 UID（绝对排除）
  const alreadyWinUidSet = new Set(
    alreadyPersonList
      .map(p => p.uid)
      .filter(Boolean)
  )

  // 2、当前奖项指定人员
  const currentPrizeUidSet = new Set(
    appointRules
      .filter(r => r.prizeId === currentPrizeId)
      .map(r => r.personUid)
  )

  // 3、所有被指定过的人员
  const allAppointUidSet = new Set(
    appointRules.map(r => r.personUid)
  )

  const appointPersons: T[] = []
  const normalPool: T[] = []

  sourceArray.forEach(item => {
    if (!item.uid) return

    // 已中奖：绝对排除
    if (alreadyWinUidSet.has(item.uid)) {
      return
    }

    // 被指定过的人
    if (allAppointUidSet.has(item.uid)) {
      // 只允许在“自己的奖项”出现
      if (currentPrizeUidSet.has(item.uid)) {
        appointPersons.push(item)
      }
      return
    }

    // 普通人
    normalPool.push(item)
  })

  // 4、结果：优先指定人员
  const result: T[] = []
  for (let i = 0; i < appointPersons.length && result.length < count; i++) {
    result.push(appointPersons[i])
  }

  const remainingCount = count - result.length
  if (remainingCount <= 0) {
    // 防止顺序可疑
    return shuffleBrowserCrypto(result).slice(0, count)
  }

  // 5、普通人员随机补位
  const newArray = [...normalPool]
  for (let i = 0; i < remainingCount && newArray.length > 0; i++) {
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const randomIndex = randomBuffer[0] % newArray.length

    result.push(newArray[randomIndex])
    newArray.splice(randomIndex, 1)
  }

  // 6、最终洗牌（隐藏内定）
  return shuffleBrowserCrypto(result)
}
/*
nginx 配置
location /log-lottery/ {
    alias /home/log-lottery/dist/;
    index index.html;
    try_files $uri $uri/ /log-lottery/index.html;
}
*/