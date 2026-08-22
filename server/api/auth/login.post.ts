import { z } from 'zod'
import { verifyUserPassword } from '../../utils/auth'

const loginSchema = z.object({
  username: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลที่ส่งไม่ถูกต้อง', 400)
  }

  const { username, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: username, isActive: true },
    include: { organization: true },
  })

  if (!user || !verifyUserPassword(password, user.passwordHash)) {
    throw createApiError('INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)
  }

  const sessionUser = {
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    organizationId: user.organizationId ?? null,
    organizationName: user.organization?.name || '',
  }

  await setUserSession(event, {
    user: sessionUser,
    loggedInAt: new Date().toISOString(),
  })

  return sessionUser
})
