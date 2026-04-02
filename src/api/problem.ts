import request from '../utils/request'
import type { BaseResponse } from './auth'

export interface ProblemVO {
  id: string
  title: string
  categoryId: string
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
  creatorId: string
  creatorUsername?: string
  creatorRealName?: string
  createTime: string
  updateTime: string
}

export interface ProblemCaseVO {
  id?: string
  caseNo?: number
  inputData: string
  outputData: string
  score?: number
  isSample?: number
}

export interface ProblemUpdateRequest {
  title: string
  categoryId?: string
  content: string
  inputDesc?: string
  outputDesc?: string
  sampleInput?: string
  sampleOutput?: string
  hint?: string
  difficulty: number
  timeLimit: number
  memoryLimit: number
  judgeMode: 'ACM' | 'OI'
  status: number
  caseList?: ProblemCaseVO[]
}

export interface ProblemCreateRequest extends ProblemUpdateRequest {}

export interface ProblemCreateVO {
  problemId: string
}

export interface ProblemPageQueryRequest {
  current?: number
  pageSize?: number
  title?: string
  categoryId?: string
  difficulty?: number
  status?: number
}

export interface ProblemCategoryVO {
  id: string
  categoryName: string
  parentId?: string
  parentName?: string
  sortNo?: number
  status?: number
  createTime?: string
  updateTime?: string
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

export async function getProblemCategoryList(
  onlyEnabled?: boolean,
): Promise<BaseResponse<ProblemCategoryVO[]>> {
  const params = onlyEnabled === undefined ? undefined : { onlyEnabled }
  const response = await request.get('/problem-category/list', { params })
  return response as unknown as BaseResponse<ProblemCategoryVO[]>
}

export async function deleteProblem(
  problemId: string,
): Promise<BaseResponse<boolean>> {
  const response = await request.delete(`/problem/${problemId}`)
  return response as unknown as BaseResponse<boolean>
}

export async function getProblemDetail(
  problemId: string,
): Promise<BaseResponse<ProblemVO>> {
  const response = await request.get(`/problem/${problemId}`)
  return response as unknown as BaseResponse<ProblemVO>
}

export async function listProblemCases(
  problemId: string,
): Promise<BaseResponse<ProblemCaseVO[]>> {
  const response = await request.get(`/problem/${problemId}/cases`)
  return response as unknown as BaseResponse<ProblemCaseVO[]>
}

export async function updateProblem(
  problemId: string,
  payload: ProblemUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/problem/${problemId}`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function createProblem(
  payload: ProblemCreateRequest,
): Promise<BaseResponse<ProblemCreateVO>> {
  const response = await request.post('/problem', payload)
  return response as unknown as BaseResponse<ProblemCreateVO>
}
