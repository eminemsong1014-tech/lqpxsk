                                                                                                                                           
export function createAugmentReceiptStore(key        , local               , cache       ) {
  function failure(errors           , confirmed         )        {
    const names = errors.map(e => (e                   )?.name)
    const quota = names.length > 0 && names.every(n => n === 'QuotaExceededError' || n === 'NS_ERROR_DOM_QUOTA_REACHED')
    const reason = quota ? '设备可用的游戏存储空间不足。请先在手机系统中释放一些空间，再回到本页重试。' : '当前页面暂时无法保存游戏数据。请先返回虎扑，再从原入口重新进入游戏重试；仍不行请更新虎扑后再试。'
    const message = confirmed
      ? '广告已完成，奖励待保存，无需再看广告。请保持游戏页面打开，释放手机空间后点击原换卡按钮重试领取；仍失败请截图反馈。'
      : '本次尚未打开广告。' + reason
    return new Error(message + '请勿清除虎扑数据、网页存储或卸载 App，以免丢失本机存档。')
  }
  async function writeVerified(storageKey        , value         , confirmed         ) {
    const serialized = JSON.stringify(value), errors            = []
    let saved = false
    try { const s = local(); s.setItem(storageKey, serialized); if (s.getItem(storageKey) !== serialized) throw new Error('Storage verification failed'); saved = true } catch (e) { errors.push(e) }
    try { await cache.write(storageKey, value); if (JSON.stringify(await cache.read(storageKey)) !== serialized) throw new Error('Cache unavailable'); saved = true } catch (e) { errors.push(e) }
    if (!saved) throw failure(errors, confirmed)
  }
  async function clear(storageKey = key) {
    try { local().removeItem(storageKey) } catch {}
    try { await cache.remove(storageKey) } catch {}
  }
  return {
    async prepare(value         ) {
      // Probe the complete receipt size under a separate, never-replayed key.
      const probe = key + ':check'
      try { await writeVerified(probe, value, false) } finally { await clear(probe) }
    },
    commit: (value         ) => writeVerified(key, value, true),
    clear,
  }
}
