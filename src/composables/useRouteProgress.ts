import { readonly, ref } from 'vue'

const visible = ref(false)
const progress = ref(0)

let routePendingCount = 0
let requestPendingCount = 0

let trickleRaf: number | null = null
let settleTimer: number | null = null
let completeTimer: number | null = null
let hideTimer: number | null = null
let loadingSince = 0
let lastFrameTime = 0

function clearAllTimers() {
  if (trickleRaf !== null) {
    window.cancelAnimationFrame(trickleRaf)
    trickleRaf = null
  }
  if (settleTimer !== null) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }
  if (completeTimer !== null) {
    window.clearTimeout(completeTimer)
    completeTimer = null
  }
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
  lastFrameTime = 0
}

function hasPendingTask() {
  return routePendingCount > 0 || requestPendingCount > 0
}

function stopTrickle() {
  if (trickleRaf !== null) {
    window.cancelAnimationFrame(trickleRaf)
    trickleRaf = null
  }
  lastFrameTime = 0
}

function getTrickleCap() {
  return routePendingCount > 0 ? 0.84 : 0.93
}

function trickle(ts: number) {
  if (!hasPendingTask()) {
    stopTrickle()
    return
  }

  if (!lastFrameTime) {
    lastFrameTime = ts
  }

  const dt = Math.max(0, ts - lastFrameTime)
  lastFrameTime = ts

  const cap = getTrickleCap()
  const distance = Math.max(cap - progress.value, 0)
  if (distance > 0) {
    const easingStep = distance * (1 - Math.exp(-dt / 320))
    const minStep = Math.min(distance, (dt / 1000) * 0.06)
    progress.value = Math.min(progress.value + Math.max(easingStep, minStep), cap)
  }

  trickleRaf = window.requestAnimationFrame(trickle)
}

function startTrickle() {
  if (trickleRaf !== null) {
    return
  }
  trickleRaf = window.requestAnimationFrame(trickle)
}

function ensureLoadingState(forceRestart = false) {
  if (settleTimer !== null) {
    window.clearTimeout(settleTimer)
    settleTimer = null
  }
  if (completeTimer !== null) {
    window.clearTimeout(completeTimer)
    completeTimer = null
  }
  if (hideTimer !== null) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }

  if (!visible.value || forceRestart) {
    visible.value = true
    progress.value = 0.02
    loadingSince = performance.now()
    window.requestAnimationFrame(() => {
      if (visible.value && hasPendingTask()) {
        progress.value = Math.max(progress.value, 0.09)
      }
    })
  } else {
    progress.value = Math.max(progress.value, 0.1)
  }

  startTrickle()
}

function tryComplete() {
  if (hasPendingTask()) {
    return
  }

  if (settleTimer !== null) {
    window.clearTimeout(settleTimer)
  }
  const minVisibleDuration = 360
  const elapsed = Math.max(0, performance.now() - loadingSince)
  const waitForMinDuration = Math.max(minVisibleDuration - elapsed, 0)
  const settleDelay = Math.max(70, waitForMinDuration)

  settleTimer = window.setTimeout(() => {
    if (hasPendingTask()) {
      return
    }

    stopTrickle()
    progress.value = Math.max(progress.value, 0.72)

    completeTimer = window.setTimeout(() => {
      progress.value = 1
      hideTimer = window.setTimeout(() => {
        visible.value = false
        progress.value = 0
        loadingSince = 0
      }, 240)
    }, 120)
  }, settleDelay)
}

function resetForRouteStart() {
  if (visible.value) {
    progress.value = 0
    window.requestAnimationFrame(() => {
      if (hasPendingTask()) {
        progress.value = 0.06
      }
    })
  }
}

export function startRouteProgress() {
  const wasIdle = !hasPendingTask()
  routePendingCount += 1
  if (!wasIdle) {
    resetForRouteStart()
    ensureLoadingState(true)
    return
  }
  ensureLoadingState(true)
}

export function finishRouteProgress() {
  routePendingCount = Math.max(routePendingCount - 1, 0)
  tryComplete()
}

export function startRequestProgress() {
  const wasIdle = !hasPendingTask()
  requestPendingCount += 1
  ensureLoadingState(wasIdle)
}

export function finishRequestProgress() {
  requestPendingCount = Math.max(requestPendingCount - 1, 0)
  tryComplete()
}

export function resetRouteProgress() {
  routePendingCount = 0
  requestPendingCount = 0
  clearAllTimers()
  visible.value = false
  progress.value = 0
  loadingSince = 0
}

export function useRouteProgress() {
  return {
    visible: readonly(visible),
    progress: readonly(progress),
  }
}
