import { User } from '../models/User'
import { Request, Response } from 'express'

const authController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const auth0Id = (req as any).auth?.sub
      const email = (req as any).auth?.email
      const name = (req as any).auth?.name

      if (!auth0Id) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }

      let user = await User.findOne({ auth0Id })

      // 🔥 Nếu chưa có → tạo mới
      if (!user) {
        user = await User.create({
          auth0Id,
          email,
          name,
          avatar: '',
          role: 'User',
          phoneNumber: '',
          dob: null,
          gender: 'Khác',
        })
      }

      res.status(200).json({ user })
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const user = req.auth
      const { name, phoneNumber, dob, gender, avatar } = req.body
      if (!user) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }
      const userInfo = await User.findOne({ auth0Id: user.sub })
      if (!userInfo) {
        res.status(404).json({ message: 'User not found' })
        return
      }
      const updatedUser = await User.findByIdAndUpdate(
        userInfo._id,
        {
          name,
          phoneNumber,
          dob,
          gender,
          avatar,
        },
        { new: true },
      )
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' })
        return
      }
      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser,
      })
    } catch (error) {
      console.error('Update user error:', error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },
}

export default authController
