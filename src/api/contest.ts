import request from '../utils/request'
import type { BaseResponse } from './auth'

export interface ContestCreateRequest {
  title: string
  description?: string
  type: 'CONTEST' | 'HOMEWORK'
  accessType?: 'PUBLIC' | 'PRIVATE'
  accessPassword?: string
  submitLimit?: number
  resultVisibleMode?: 'REALTIME' | 'AFTER_END'
  startTime: string
  endTime: string
  status?: number
}

export interface ContestCreateVO {
  contestId: string
}

export interface ContestVO {
  id: string
  title: string
  description?: string
  type: 'CONTEST' | 'HOMEWORK' | string
  status: number
  statusText?: string
  startTime?: string
  endTime?: string
  creatorId?: string
  creatorUsername?: string
  creatorRealName?: string
  participantCount?: number
  problemCount?: number
  joined?: boolean
}

export interface ContestProblemVO {
  problemId: string
  problemTitle?: string
  displayOrder?: number
  score?: number
}

export interface ContestDetailVO extends ContestVO {
  accessType?: 'PUBLIC' | 'PRIVATE' | string
  resultVisibleMode?: 'REALTIME' | 'AFTER_END' | string
  submitLimit?: number
  problemList?: ContestProblemVO[]
}

export interface ContestRankVO {
  rank: number
  userId: string
  username?: string
  realName?: string
  acCount?: number
  totalScore?: number
  penaltyMinutes?: number
}

export interface ContestPageQueryRequest {
  current?: number
  pageSize?: number
  title?: string
  type?: string
  status?: number
  mine?: boolean
}

export interface ContestRankPageQueryRequest {
  current?: number
  pageSize?: number
}

export interface ContestScorePageQueryRequest {
  current?: number
  pageSize?: number
  usernameKeyword?: string
  classKeyword?: string
}

export interface ContestScoreVO {
  rank: number
  userId: string
  username?: string
  realName?: string
  studentNo?: string
  acCount?: number
  totalScore?: number
  penaltyMinutes?: number
  submitCount?: number
}

export type ContestScoreExportFormat = 'csv' | 'xlsx'

export interface ContestRegisterRequest {
  accessPassword?: string
}

export interface ContestStatusUpdateRequest {
  status: 0 | 1 | 3
}

export interface ContestBindProblemItem {
  problemId: string
  displayOrder?: number
  score?: number
}

export interface ContestBindProblemsRequest {
  problemList: ContestBindProblemItem[]
}

export interface PageResult<T> {
  current: number
  total: number
  records: T[]
  pages: number
  size: number
}

export async function createContest(
  payload: ContestCreateRequest,
): Promise<BaseResponse<ContestCreateVO>> {
  const response = await request.post('/contest', payload)
  return response as unknown as BaseResponse<ContestCreateVO>
}

export async function getContestPage(
  query: ContestPageQueryRequest,
): Promise<BaseResponse<PageResult<ContestVO>>> {
  const response = await request.get('/contest/page', { params: query })
  return response as unknown as BaseResponse<PageResult<ContestVO>>
}

export async function getContestDetail(
  contestId: string | number,
): Promise<BaseResponse<ContestDetailVO>> {
  const response = await request.get(`/contest/${contestId}`)
  return response as unknown as BaseResponse<ContestDetailVO>
}

export async function bindContestProblems(
  contestId: string | number,
  payload: ContestBindProblemsRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.post(`/contest/${contestId}/problems`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function registerContest(
  contestId: string | number,
  payload?: ContestRegisterRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.post(`/contest/${contestId}/register`, payload ?? {})
  return response as unknown as BaseResponse<boolean>
}

export async function updateContestStatus(
  contestId: string | number,
  payload: ContestStatusUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/contest/${contestId}/status`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function deleteContest(
  contestId: string | number,
): Promise<BaseResponse<boolean>> {
  const response = await request.delete(`/contest/${contestId}`)
  return response as unknown as BaseResponse<boolean>
}

export async function getContestRankPage(
  contestId: string | number,
  query: ContestRankPageQueryRequest,
): Promise<BaseResponse<PageResult<ContestRankVO>>> {
  const response = await request.get(`/contest/${contestId}/rank`, { params: query })
  return response as unknown as BaseResponse<PageResult<ContestRankVO>>
}

export async function getContestScorePage(
  contestId: string | number,
  query: ContestScorePageQueryRequest,
): Promise<BaseResponse<PageResult<ContestScoreVO>>> {
  const response = await request.get(`/contest/${contestId}/score/page`, { params: query })
  return response as unknown as BaseResponse<PageResult<ContestScoreVO>>
}

export async function exportContestScoreFile(
  contestId: string | number,
  format: ContestScoreExportFormat,
  query: Omit<ContestScorePageQueryRequest, 'current' | 'pageSize'>,
): Promise<Blob> {
  const response = await request.get(`/contest/${contestId}/score/export`, {
    params: {
      ...query,
      format,
    },
    responseType: 'blob',
  })
  return response as unknown as Blob
}
