import z from 'zod';
import { ISignupRequest } from './auth.type';

export const signupSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  username: z.string().min(4, 'Tên đăng nhập phải có ít nhất 4 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
}) satisfies z.ZodType<ISignupRequest>;


