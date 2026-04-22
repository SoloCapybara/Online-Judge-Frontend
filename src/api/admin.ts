import request from '../utils/request'
import type { BaseResponse } from './auth'

export type AdminRoleCode = 'STUDENT' | 'TEACHER' | 'ADMIN' | string

export interface AdminUserVO {
  id: string
  username: string
  realName: string
  studentNo?: string
  email?: string
  phone?: string
  avatar?: string
  gender?: number
  status: number
  superAdmin?: boolean
  roleCodes?: string[]
  roleNames?: string[]
  lastLoginTime?: string
  createTime?: string
}

export interface AdminRoleOptionVO {
  roleCode: string
  roleName: string
}

export interface AdminUserPageQueryRequest {
  current?: number
  pageSize?: number
  keyword?: string
  roleCode?: string
  status?: number
}

export interface AdminUserUpdateRequest {
  realName?: string
  studentNo?: string
  email?: string
  phone?: string
  gender?: number
}

export interface AdminUserStatusUpdateRequest {
  status: number
}

export interface AdminUserRolesUpdateRequest {
  roleCodes: string[]
}

export interface AdminSystemConfigVO {
  id: string
  configKey: string
  configName: string
  configValue: string
  valueType: string
  category: string
  description?: string
  status: number
  updateTime?: string
}

export interface AdminSystemConfigPageQueryRequest {
  current?: number
  pageSize?: number
  keyword?: string
  category?: string
  status?: number
}

export interface AdminSystemConfigUpdateRequest {
  configValue?: string
  description?: string
  status?: number
}

export interface PageResult<T> {
  current: number
  total: number
  records: T[]
  pages: number
  size: number
}

export async function getAdminUserPage(
  query: AdminUserPageQueryRequest,
): Promise<BaseResponse<PageResult<AdminUserVO>>> {
  const response = await request.get('/admin/users/page', { params: query })
  return response as unknown as BaseResponse<PageResult<AdminUserVO>>
}

export async function getAdminRoleOptions(): Promise<BaseResponse<AdminRoleOptionVO[]>> {
  const response = await request.get('/admin/users/roles')
  return response as unknown as BaseResponse<AdminRoleOptionVO[]>
}

export async function updateAdminUserProfile(
  userId: string | number,
  payload: AdminUserUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/admin/users/${userId}`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function updateAdminUserStatus(
  userId: string | number,
  payload: AdminUserStatusUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/admin/users/${userId}/status`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function updateAdminUserRoles(
  userId: string | number,
  payload: AdminUserRolesUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/admin/users/${userId}/roles`, payload)
  return response as unknown as BaseResponse<boolean>
}

export async function getAdminSystemConfigPage(
  query: AdminSystemConfigPageQueryRequest,
): Promise<BaseResponse<PageResult<AdminSystemConfigVO>>> {
  const response = await request.get('/admin/config/page', { params: query })
  return response as unknown as BaseResponse<PageResult<AdminSystemConfigVO>>
}

export async function getAdminSystemConfigCategories(): Promise<BaseResponse<string[]>> {
  const response = await request.get('/admin/config/categories')
  return response as unknown as BaseResponse<string[]>
}

export async function updateAdminSystemConfig(
  configId: string | number,
  payload: AdminSystemConfigUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put(`/admin/config/${configId}`, payload)
  return response as unknown as BaseResponse<boolean>
}
