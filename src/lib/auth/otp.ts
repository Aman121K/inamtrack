import { prisma } from "../db";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOtp(): string {
  if (process.env.NODE_ENV === "development") return "123456";
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(phone: string): Promise<string> {
  console.log(`[OTP] Creating OTP for ${phone}`);

  await prisma.otpCode.updateMany({
    where: { phone, verified: false },
    data: { verified: true },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  });

  console.log(`[OTP] Created for ${phone}, expires at ${expiresAt.toISOString()}`);
  return code;
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  console.log(`[OTP] Verifying OTP for ${phone}`);

  const otp = await prisma.otpCode.findFirst({
    where: { phone, verified: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    console.warn(`[OTP] No pending OTP found for ${phone}`);
    return { valid: false, error: "OTP not found" };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    console.warn(`[OTP] Max attempts reached for ${phone} (${otp.attempts}/${MAX_ATTEMPTS})`);
    return { valid: false, error: "Too many attempts" };
  }

  if (new Date() > otp.expiresAt) {
    console.warn(`[OTP] Expired for ${phone}`);
    return { valid: false, error: "OTP expired" };
  }

  if (otp.code !== code) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    console.warn(`[OTP] Wrong code for ${phone}, attempt ${otp.attempts + 1}`);
    return { valid: false, error: "Invalid OTP" };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { verified: true },
  });

  console.log(`[OTP] Verified successfully for ${phone}`);
  return { valid: true };
}
