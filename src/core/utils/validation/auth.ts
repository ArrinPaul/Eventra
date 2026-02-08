import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Common fields for all registration types
const commonFields = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  foodChoice: z.enum(['veg', 'non-veg', 'vegan']),
  emergencyContactName: z.string().min(2, { message: 'Emergency contact name is required.' }),
  emergencyContactNumber: z.string().min(10, { message: 'Emergency contact number is required.' }),
};

const passwordMatchRefine = [
  (data: any) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
] as const;

export const studentSchema = z.object({
  ...commonFields,
  role: z.literal('student'),
  interests: z.string().min(3, { message: 'Please list at least one interest.' }),
  college: z.string().min(2, { message: 'College name is required.' }),
  degree: z.enum(['ug', 'pg']),
  year: z.coerce.number().min(1).max(5),
}).refine(...passwordMatchRefine);

export const professionalSchema = z.object({
  ...commonFields,
  role: z.literal('professional'),
  interests: z.string().min(3, { message: 'Please list at least one interest.' }),
  company: z.string().min(2, { message: 'Company name is required.' }),
  designation: z.string().min(2, { message: 'Designation is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  bloodGroup: z.string().min(1, { message: 'Blood group is required.' }),
}).refine(...passwordMatchRefine);

export const organizerSchema = z.object({
  ...commonFields,
  role: z.literal('organizer'),
  company: z.string().min(2, { message: 'Organization Name is required.' }),
  designation: z.string().min(2, { message: 'Position is required.' }),
  verificationCode: z.string().min(1, { message: "Organizer verification code is required." }),
}).refine(...passwordMatchRefine);

export const registerSchema = z.discriminatedUnion('role', [
  z.object({ ...commonFields, role: z.literal('student'), interests: z.string().min(3), college: z.string(), degree: z.enum(['ug', 'pg']), year: z.coerce.number() }),
  z.object({ ...commonFields, role: z.literal('professional'), interests: z.string().min(3), company: z.string(), designation: z.string(), country: z.string(), gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']), bloodGroup: z.string() }),
  z.object({ ...commonFields, role: z.literal('organizer'), company: z.string(), designation: z.string(), verificationCode: z.string() }),
]).refine(...passwordMatchRefine);

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof studentSchema> | z.infer<typeof professionalSchema> | z.infer<typeof organizerSchema>;
