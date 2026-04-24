import request from '../utils/request'
import type { BaseResponse } from './auth'

export type SubmissionStatus =
  | 'WAITING'
  | 'JUDGING'
  | 'ACCEPTED'
  | 'PARTIAL_ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'SYSTEM_ERROR'
  | string

export interface SubmissionCreateRequest {
  problemId: string | number
  contestId?: string | number
  language: 'JAVA17' | 'PYTHON3142' | 'C17' | 'CPP17'
  sourceCode: string
}

export interface SubmissionCreateVO {
  submissionId: string
  status: SubmissionStatus
}

export interface SubmissionPageQueryRequest {
  current?: number
  pageSize?: number
  status?: string
  problemId?: string | number
  contestId?: string | number
  language?: string
  userId?: string | number
  mine?: boolean
}

export interface SubmissionVO {
  id: string
  userId: string
  username?: string
  userRealName?: string
  problemId: string
  problemTitle?: string
  contestId?: string
  contestTitle?: string
  contestType?: 'CONTEST' | 'HOMEWORK' | string
  language: string
  status: SubmissionStatus
  timeUsed?: number
  memoryUsed?: number
  score?: number
  errorMessage?: string
  submitTime?: string
  judgeTime?: string
}

export interface SubmissionDetailVO extends SubmissionVO {
  sourceCode?: string
}

export interface SubmissionCaseVO {
  caseNo: number
  status: SubmissionStatus
  timeUsed?: number
  memoryUsed?: number
  message?: string
}

export interface JudgeOverviewVO {
  queueTaskCount: number
  onlineNodeCount: number
  serviceStatus: 'NORMAL' | 'BUSY' | 'DOWN' | string
  todaySubmissionCount: number
}

export interface JudgeDailyStatsVO {
  statDate: string
  submitCount: number
  acceptedCount: number
  acRate: number
}

export interface JudgeSystemMetricsVO {
  osName: string
  osArch: string
  systemCpuUsage: number
  processCpuUsage: number
  systemLoadAverage: number
  systemMemoryTotal: number
  systemMemoryFree: number
  jvmHeapTotal: number
  jvmHeapUsed: number
  diskTotal: number
  diskUsable: number
  processUptimeMs: number
  containerized: boolean
  runtimeEnvironment: 'HOST' | 'CONTAINER' | string
  containerHint?: string
  collectedAt: string
}

export interface PageResult<T> {
  current: number
  total: number
  records: T[]
  pages: number
  size: number
}

export async function createSubmission(
  payload: SubmissionCreateRequest,
): Promise<BaseResponse<SubmissionCreateVO>> {
  const response = await request.post('/submission', payload)
  return response as unknown as BaseResponse<SubmissionCreateVO>
}

export async function getSubmissionPage(
  query: SubmissionPageQueryRequest,
): Promise<BaseResponse<PageResult<SubmissionVO>>> {
  const response = await request.get('/submission/page', { params: query })
  return response as unknown as BaseResponse<PageResult<SubmissionVO>>
}

export async function getSubmissionDetail(
  submissionId: string | number,
): Promise<BaseResponse<SubmissionDetailVO>> {
  const response = await request.get(`/submission/${submissionId}`)
  return response as unknown as BaseResponse<SubmissionDetailVO>
}

export async function listSubmissionCases(
  submissionId: string | number,
): Promise<BaseResponse<SubmissionCaseVO[]>> {
  const response = await request.get(`/submission/${submissionId}/cases`)
  return response as unknown as BaseResponse<SubmissionCaseVO[]>
}

export async function rejudgeSubmission(
  submissionId: string | number,
): Promise<BaseResponse<boolean>> {
  const response = await request.post(`/submission/${submissionId}/rejudge`)
  return response as unknown as BaseResponse<boolean>
}

export async function getJudgeOverview(): Promise<BaseResponse<JudgeOverviewVO>> {
  const response = await request.get('/judge/overview')
  return response as unknown as BaseResponse<JudgeOverviewVO>
}

export async function getJudgeDailyStats(days = 7): Promise<BaseResponse<JudgeDailyStatsVO[]>> {
  const response = await request.get('/judge/daily-stats', {
    params: { days },
  })
  return response as unknown as BaseResponse<JudgeDailyStatsVO[]>
}

export async function getJudgeSystemMetrics(): Promise<BaseResponse<JudgeSystemMetricsVO>> {
  const response = await request.get('/judge/system-metrics')
  return response as unknown as BaseResponse<JudgeSystemMetricsVO>
}
