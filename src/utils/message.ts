import { ElMessage, type MessageType } from 'element-plus'

type OjMessageOptions = {
  message?: string
  dangerouslyUseHTMLString?: boolean
  showClose?: boolean
  duration?: number
  offset?: number
  grouping?: boolean
  customClass?: string | string[]
}

type OjMessageInput = string | OjMessageOptions

const OJ_MESSAGE_CLASS = 'oj-message'

function toClassName(value: OjMessageOptions['customClass']) {
  if (!value) {
    return OJ_MESSAGE_CLASS
  }

  const classes = Array.isArray(value) ? value : String(value).split(/\s+/)
  const normalized = classes.filter(Boolean)
  if (!normalized.includes(OJ_MESSAGE_CLASS)) {
    normalized.unshift(OJ_MESSAGE_CLASS)
  }

  return normalized.join(' ')
}

function toParams(type: MessageType, input: OjMessageInput) {
  if (typeof input === 'string') {
    return {
      type,
      message: input,
      customClass: OJ_MESSAGE_CLASS,
      grouping: true,
      duration: 2200,
      offset: 22,
    }
  }

  return {
    ...input,
    type,
    customClass: toClassName(input.customClass),
    grouping: input.grouping ?? true,
    duration: input.duration ?? 2200,
    offset: input.offset ?? 22,
  }
}

function open(type: MessageType, input: OjMessageInput) {
  return ElMessage(toParams(type, input))
}

export const ojMessage = {
  success(input: OjMessageInput) {
    return open('success', input)
  },
  warning(input: OjMessageInput) {
    return open('warning', input)
  },
  error(input: OjMessageInput) {
    return open('error', input)
  },
  info(input: OjMessageInput) {
    return open('info', input)
  },
}
