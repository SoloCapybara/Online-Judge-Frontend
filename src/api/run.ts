import type { BaseResponse } from './auth'
import request from '../utils/request'

export type RunLanguage = 'JAVA17' | 'PYTHON3142' | 'C17' | 'CPP17'

export interface RunCodeRequest {
  language: RunLanguage
  sourceCode: string
  inputData?: string
  timeLimitMs?: number
}

export interface RunCodeResponse {
  status:
    | 'SUCCESS'
    | 'COMPILE_ERROR'
    | 'RUNTIME_ERROR'
    | 'TIME_LIMIT_EXCEEDED'
    | 'UNSUPPORTED_LANGUAGE'
    | 'SYSTEM_ERROR'
    | string
  exitCode: number
  stdout: string
  stderr: string
  timeUsedMs: number
  compileTimeMs?: number
  executeTimeMs?: number
  totalTimeMs?: number
}

export async function runCode(payload: RunCodeRequest): Promise<BaseResponse<RunCodeResponse>> {
  const response = await request.post('/run', payload)
  return response as unknown as BaseResponse<RunCodeResponse>
}

export interface RunStreamCallbacks {
  onStdout?: (chunk: string) => void
  onStderr?: (chunk: string) => void
  onStatus?: (statusText: string) => void
}

export type RunWsIncomingMessage =
  | { type: 'status'; statusText?: string }
  | { type: 'stdout'; chunk?: string }
  | { type: 'stderr'; chunk?: string }
  | { type: 'result'; data?: RunCodeResponse }
  | { type: 'error'; message?: string }
  | { type: 'pong' }
  | { type: string; [key: string]: unknown }

export function createRunTerminalSocket(token?: string) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host = window.location.host
  const rawToken = token ?? localStorage.getItem('oj-token') ?? ''
  const query = rawToken ? `?token=${encodeURIComponent(rawToken)}` : ''
  return new WebSocket(`${protocol}://${host}/api/run/ws${query}`)
}

function buildAuthHeaders() {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream, application/x-ndjson, application/json',
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('oj-token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function parseServerEvent(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const lines = trimmed.split(/\r?\n/)
  let eventName = ''
  const dataLines: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
      continue
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }

  if (dataLines.length > 0) {
    const payload = dataLines.join('\n')
    try {
      const parsed = JSON.parse(payload) as Record<string, unknown>
      if (!parsed.type && eventName) {
        parsed.type = eventName
      }
      return parsed
    } catch {
      return {
        type: eventName || 'message',
        message: payload,
      }
    }
  }

  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    return {
      type: eventName || 'message',
      message: trimmed,
    }
  }
}

function toText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function extractResultLike(obj: Record<string, unknown>): RunCodeResponse | null {
  const maybeData = obj.data
  if (maybeData && typeof maybeData === 'object') {
    const data = maybeData as Record<string, unknown>
    if (typeof data.status === 'string') {
      return {
        status: String(data.status),
        exitCode: Number(data.exitCode ?? 0),
        stdout: toText(data.stdout),
        stderr: toText(data.stderr),
        timeUsedMs: Number(data.timeUsedMs ?? 0),
        compileTimeMs: Number(data.compileTimeMs ?? 0),
        executeTimeMs: Number(data.executeTimeMs ?? 0),
        totalTimeMs: Number(data.totalTimeMs ?? 0),
      }
    }
  }
  if (typeof obj.status === 'string') {
    return {
      status: String(obj.status),
      exitCode: Number(obj.exitCode ?? 0),
      stdout: toText(obj.stdout),
      stderr: toText(obj.stderr),
      timeUsedMs: Number(obj.timeUsedMs ?? 0),
      compileTimeMs: Number(obj.compileTimeMs ?? 0),
      executeTimeMs: Number(obj.executeTimeMs ?? 0),
      totalTimeMs: Number(obj.totalTimeMs ?? 0),
    }
  }
  return null
}

export async function runCodeStream(
  payload: RunCodeRequest,
  callbacks: RunStreamCallbacks = {},
  signal?: AbortSignal,
): Promise<RunCodeResponse> {
  const response = await fetch('/api/run/stream', {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(payload),
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    const error = new Error(text || `流式运行请求失败 (${response.status})`) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await response.json() as BaseResponse<RunCodeResponse>
    if (body.code !== 0 || !body.data) {
      throw new Error(body.message || '运行失败')
    }
    return body.data
  }

  if (!response.body) {
    throw new Error('浏览器不支持流式读取')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const isSse = contentType.includes('text/event-stream')
  let buffer = ''
  let finalResult: RunCodeResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const segments = isSse ? buffer.split(/\n\n+/) : buffer.split('\n')
    buffer = segments.pop() ?? ''

    for (const segment of segments) {
      const event = parseServerEvent(segment)
      if (!event) {
        continue
      }
      const type = String(event.type ?? '')
      const stdoutChunk = toText(event.stdoutChunk ?? event.stdout ?? event.output)
      const stderrChunk = toText(event.stderrChunk ?? event.stderr ?? event.error)
      const statusText = toText(event.statusText ?? event.status ?? event.message)

      if (type === 'stdout' && stdoutChunk) {
        callbacks.onStdout?.(stdoutChunk)
      } else if (type === 'stderr' && stderrChunk) {
        callbacks.onStderr?.(stderrChunk)
      } else if (type === 'status' && statusText) {
        callbacks.onStatus?.(statusText)
      } else {
        if (stdoutChunk) {
          callbacks.onStdout?.(stdoutChunk)
        }
        if (stderrChunk) {
          callbacks.onStderr?.(stderrChunk)
        }
        if (statusText) {
          callbacks.onStatus?.(statusText)
        }
      }

      const parsedResult = extractResultLike(event)
      if (parsedResult) {
        finalResult = parsedResult
      }
    }
  }

  const tail = parseServerEvent(buffer)
  if (tail) {
    const parsedResult = extractResultLike(tail)
    if (parsedResult) {
      finalResult = parsedResult
    }
  }

  if (!finalResult) {
    throw new Error('流式响应中缺少最终运行结果')
  }
  return finalResult
}
