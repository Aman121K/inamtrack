import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;

export const sendOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, "Valid 10-digit Indian mobile number required"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex),
  code: z.string().length(6, "OTP must be 6 digits"),
});

export const setPinSchema = z.object({
  phone: z.string().regex(phoneRegex),
  name: z.string().min(2).max(100),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "PIN must be numeric"),
  city: z.string().max(100).optional(),
  preferredLanguage: z.enum(["hi", "pa", "en"]).optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(phoneRegex),
  pin: z.string().length(4).regex(/^\d{4}$/),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
