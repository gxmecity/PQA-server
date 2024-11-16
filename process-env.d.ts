export {}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined
      PORT: string
      SANITY_SECRET_TOKEN: string
      JWT_SECRET: string
    }
  }
}
