import express, { Request, Response } from 'express'
import { verifyUser } from '../middlewares/authMiddleware'

const router = express.Router()

router.get('/protected', verifyUser, (req: Request, res: Response) => {
  res.json({ message: 'Bạn đã truy cập route được bảo vệ thành công!' })
})

export default router
