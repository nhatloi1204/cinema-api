// middlewares/authMiddleware.ts
import { expressjwt } from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import dotenv from 'dotenv'

dotenv.config()

const getTokenFromHeader = (req: any) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1]
  }
  return null
}

export const verifyUser = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256'],
  getToken: getTokenFromHeader,
})
