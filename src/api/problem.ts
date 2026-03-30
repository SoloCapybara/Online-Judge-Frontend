import request from '../utils/request'
import type { BaseResponse } from './auth'

export interface ProblemVO {
  id: number
  title: string
  categoryId: number
  categoryName?: string
  content: string
  inputDesc: string
  outputDesc: string
  sampleInput: string
  sampleOutput: string
  hint: string
  difficulty: number
  timeLimit: number
  memoryLimit: number
  judgeMode: string
  submitCount: number
  acceptCount: number
  acceptRate: number
  status: number
  creatorId: number
  creatorUsername?: string
  creatorRealName?: string
  createTime: string
  updateTime: string
}

export interface ProblemPageQueryRequest {
  current?: number
  pageSize?: number
  title?: string
  categoryId?: number
  difficulty?: number
  status?: number
}

export interface PageResult<T> {
  current: number
  total: number
  records: T[]
  pages: number
  size: number
}

function appendQueryParam(
  params: Record<string, string | number>,
  key: keyof ProblemPageQueryRequest,
  value: string | number | undefined,
) {
  if (value === undefined || value === '') {
    return
  }
  params[String(key)] = value
  params[`queryRequest.${String(key)}`] = value
}

export async function getProblemPage(
  query: ProblemPageQueryRequest,
): Promise<BaseResponse<PageResult<ProblemVO>>> {
  const params: Record<string, string | number> = {}
  appendQueryParam(params, 'current', query.current)
  appendQueryParam(params, 'pageSize', query.pageSize)
  appendQueryParam(params, 'title', query.title)
  appendQueryParam(params, 'categoryId', query.categoryId)
  appendQueryParam(params, 'difficulty', query.difficulty)
  appendQueryParam(params, 'status', query.status)

  const response = await request.get('/problem/page', { params })
  return response as unknown as BaseResponse<PageResult<ProblemVO>>
}
