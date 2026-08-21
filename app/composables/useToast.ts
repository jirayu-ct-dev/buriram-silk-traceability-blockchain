export const useToast = () => {
  return {
    add: (options: { title: string; description: string; color?: string }) => {
      console.log('Toast:', options)
    },
    success: (message: string) => {
      console.log('Toast success:', message)
    },
    error: (message: string) => {
      console.log('Toast error:', message)
    },
    warning: (message: string) => {
      console.log('Toast warning:', message)
    },
    info: (message: string) => {
      console.log('Toast info:', message)
    },
  }
}
