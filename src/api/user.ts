import request from '../utils/request'
import type { BaseResponse } from './auth'

export interface UserProfileVO {
  id: string
  username: string
  realName: string
  studentNo: string
  email: string
  phone: string
  avatar: string
  gender: number
  status: number
}

export interface UserProfileUpdateRequest {
  username?: string
  realName?: string
  studentNo?: string
  email?: string
  phone?: string
  avatar?: string
  gender?: number
}

export interface UserPasswordUpdateRequest {
  oldPassword: string
  newPassword: string
  checkPassword: string
}

export async function getCurrentUserProfile(): Promise<BaseResponse<UserProfileVO>> {
  const response = await request.get('/user/profile')
  return response as unknown as BaseResponse<UserProfileVO>
}

export async function updateCurrentUserProfile(
  payload: UserProfileUpdateRequest,
): Promise<BaseResponse<UserProfileVO>> {
  const response = await request.put('/user/profile', payload)
  return response as unknown as BaseResponse<UserProfileVO>
}

export async function uploadUserAvatar(file: File): Promise<BaseResponse<UserProfileVO>> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await request.post('/user/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response as unknown as BaseResponse<UserProfileVO>
}

export async function updateCurrentUserPassword(
  payload: UserPasswordUpdateRequest,
): Promise<BaseResponse<boolean>> {
  const response = await request.put('/user/profile/password', payload)
  return response as unknown as BaseResponse<boolean>
}
