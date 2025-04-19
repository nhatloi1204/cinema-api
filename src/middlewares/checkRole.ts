import { Request, Response, NextFunction } from 'express'

declare module 'express' {
  export interface Request {
    auth?: {
      sub: string
      email?: string
      [key: string]: any
    }
  }
}

export const checkRole = (requiredRole: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const roles = req.auth?.['https://cinema-app/roles'] || []

    if (!roles.includes(requiredRole)) {
      res.status(403).json({ message: 'Forbidden: Insufficient role' })
      return
    }

    next()
  }
}
