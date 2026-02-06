import * as z from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Base fields without refine (so we can extend)
const baseFields = {
  role: z.enum(['student', 'professional', 'organizer']),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
  mobile: z.string().min(10, { message: 'Mobile number must be at least 10 digits.' }),
  foodChoice: z.enum(['veg', 'non-veg', 'vegan']),
  emergencyContactName: z.string().min(2, { message: 'Emergency contact name is required.' }),
  emergencyContactNumber: z.string().min(10, { message: 'Emergency contact number is required.' }),
};

// Password match refinement
const passwordMatch = (data: { password: string; confirmPassword: string }) => 
  data.password === data.confirmPassword;

const passwordMatchError = {
  message: "Passwords don't match",
  path: ["confirmPassword"],
};

export const baseRegisterSchema = z.object(baseFields).refine(passwordMatch, passwordMatchError);

export const studentSchema = z.object({
  ...baseFields,
  role: z.literal('student'),
  interests: z.string().min(3, { message: 'Please list at least one interest.' }),
  college: z.string().min(2, { message: 'College name is required.' }),
  degree: z.enum(['ug', 'pg']),
  year: z.coerce.number().min(1).max(5),
  company: z.string().optional(),
  designation: z.string().optional(),
  country: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  verificationCode: z.string().optional(),
}).refine(passwordMatch, passwordMatchError);

export const professionalSchema = z.object({
  ...baseFields,
  role: z.literal('professional'),
  interests: z.string().min(3, { message: 'Please list at least one interest.' }),
  company: z.string().min(2, { message: 'Company name is required.' }),
  designation: z.string().min(2, { message: 'Designation is required.' }),
  country: z.string().min(2, { message: 'Country is required.' }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
  bloodGroup: z.string().min(1, { message: 'Blood group is required.' }),
  college: z.string().optional(),
  degree: z.string().optional(),
  year: z.coerce.number().optional(),
  verificationCode: z.string().optional(),
}).refine(passwordMatch, passwordMatchError);

export const organizerSchema = z.object({
  ...baseFields,
  role: z.literal('organizer'),
  company: z.string().min(2, { message: 'Organization Name is required.' }),
  designation: z.string().min(2, { message: 'Position is required.' }),
  verificationCode: z.string().min(1, { message: "Organizer verification code is required." }),
  interests: z.string().optional(),
  college: z.string().optional(),
  degree: z.string().optional(),
  year: z.coerce.number().optional(),
  country: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
}).refine(passwordMatch, passwordMatchError);

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof studentSchema> | z.infer<typeof professionalSchema> | z.infer<typeof organizerSchema>;
