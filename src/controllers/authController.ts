import { Request, Response } from 'express'

const authController = {
  getProfile: (req: Request, res: Response) => {
    res.json({ user: req.auth }) // Auth info nằm ở `req.auth`
  },
}

export default authController
