import request from '../utils/request'
import type { BaseResponse } from './auth'
import type { SubmissionStatus } from './submission'

export interface HomeRecentSubmissionVO {
  id: string
  userId?: string
  username?: string
  userRealName?: string
  problemId?: string
  problemTitle?: string
  language?: string
  status?: SubmissionStatus
  timeUsed?: number
  memoryUsed?: number
  submitTime?: string
}

export interface HomeRecentContestVO {
  id: string
  title: string
  type?: 'CONTEST' | 'HOMEWORK' | string
  accessType?: 'PUBLIC' | 'PRIVATE' | string
  statusText?: string
  startTime?: string
  endTime?: string
}

export interface HomeOverviewVO {
  problemCount?: number
  todaySubmissionCount?: number
  queueTaskCount?: number
  globalAcRate?: number
  recentContests?: HomeRecentContestVO[]
  recentSubmissions?: HomeRecentSubmissionVO[]
  serverTime?: string
}

export async function getHomeOverview(): Promise<BaseResponse<HomeOverviewVO>> {
  const response = await request.get('/home/overview')
  return response as unknown as BaseResponse<HomeOverviewVO>
}
