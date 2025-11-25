import z from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Họ và tên là bắt buộc'),
  email: z.string().min(1, 'Email là bắt buộc').email('Email không hợp lệ'),
  gender: z.string().optional(),
  dob: z.string().optional().refine((val) => {
    if (!val) return true; // Cho phép để trống nếu optional
    const dob = new Date(val);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const dayDiff = today.getDate() - dob.getDate();
    
    // Tính tuổi chính xác
    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) 
      ? age - 1 
      : age;
    
    return actualAge >= 18;
  }, {
    message: 'Bạn phải đủ 18 tuổi trở lên',
  }),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
})

export type IUpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// Schema cho change password
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
  path: ['confirmPassword'],
});

export type IChangePasswordRequest = z.infer<typeof changePasswordSchema>;