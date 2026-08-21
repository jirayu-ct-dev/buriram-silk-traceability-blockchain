export function createApiError(code: string, message: string, statusCode = 400) {
  return createError({
    statusCode,
    statusMessage: code,
    data: {
      code,
      message,
    },
  })
}
