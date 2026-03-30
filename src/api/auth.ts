import request from '../utils/request'

export interface BaseResponse<T> {
  code: number
  data: T
  message: string
}

export interface UserRegisterRequest {
  username: string
  password: string
  checkPassword: string
  realName: string
  email?: string
}

export interface RegisterResult {
  userId: number
}

export async function registerUser(payload: UserRegisterRequest): Promise<BaseResponse<RegisterResult>> {
  const response = await request.post('/auth/register', payload)
  return response as unknown as BaseResponse<RegisterResult>
}

export interface UserLoginRequest {
  username: string
  password: string
}

export interface LoginUserInfo {
  id: number
  username: string
  realName: string
  avatar: string
  status: number
  roles: string[]
}

export interface LoginResult {
  token: string
  userInfo: LoginUserInfo
}

export async function loginUser(payload: UserLoginRequest): Promise<BaseResponse<LoginResult>> {
  const response = await request.post('/auth/login', payload)
  return response as unknown as BaseResponse<LoginResult>
}

export async function logoutUser(): Promise<BaseResponse<boolean>> {
  const response = await request.post('/auth/logout')
  return response as unknown as BaseResponse<boolean>
}
