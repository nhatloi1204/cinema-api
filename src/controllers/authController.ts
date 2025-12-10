import { User } from '../models/User'
import { Request, Response, NextFunction } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { get } from 'http'

const authController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      const token = req.cookies.auth_token
      if (!token) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }

      const decoded: any = jwt.decode(token)
      if (!decoded || !decoded.sub) {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }

      const userInfo = await User.findOne({ auth0Id: decoded.sub })
      if (!userInfo) {
        res.status(404).json({ message: 'User not found' })
        return
      }

      res.status(200).json({ user: userInfo })
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

  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, username } = req.body

      if (!email || !password || !username) {
        res.status(400).json({ message: 'Missing email/password/username' })
        return
      }

      await axios.post(
        `https://${process.env.AUTH0_DOMAIN}/dbconnections/signup`,
        {
          client_id: process.env.AUTH0_CLIENT_ID,
          email,
          password,
          connection: 'Username-Password-Authentication',
          user_metadata: {
            username,
          },
        },
      )

      const { data: users } = await axios.get(
        `https://${
          process.env.AUTH0_DOMAIN
        }/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.AUTH0_MANAGEMENT_API_TOKEN}`,
          },
        },
      )

      if (!users || users.length === 0) {
        res.status(400).json({ message: 'Cannot get user info from Auth0' })
        return
      }
      const user = users[0]

      const newUser = await User.create({
        auth0Id: user.user_id,
        email: user.email,
        name: username,
        avatar: user.picture || '',
        phoneNumber: '',
        role: 'user',
      })

      res.status(201).json({
        message: 'Register success!',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          role: newUser.role,
        },
      })
    } catch (error: any) {
      console.error('Register error:', error.response?.data || error.message)
      res.status(400).json({
        message: error.response?.data?.description || 'Registration failed',
      })
    }
  },

  login: (req: Request, res: Response) => {
    const authUrl =
      `https://${process.env.AUTH0_DOMAIN}/authorize?` +
      `response_type=code&` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `redirect_uri=${process.env.AUTH0_CALLBACK_URL}&` +
      `scope=openid profile email&` +
      `audience=${process.env.AUTH0_AUDIENCE}`

    res.redirect(authUrl)
  },

  // Xử lý callback từ Auth0 sau khi người dùng đăng nhập
  callback: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.method === 'GET' ? req.query.code : req.body.code

      if (!code) {
        res.status(400).json({ message: 'Authorization code is missing' })
        return
      }

      // Gửi mã xác thực tới Auth0 để lấy access_token và id_token
      const response = await axios.post(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.AUTH0_CALLBACK_URL,
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: process.env.AUTH0_AUDIENCE,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        },
      )

      const { access_token, id_token } = response.data

      let roles: string[] = []
      if (id_token) {
        const decoded: any = jwt.decode(id_token)
        roles = decoded?.['https://cinema-api/roles'] || []
      }

      const userInfoRes = await axios.get(
        `https://${process.env.AUTH0_DOMAIN}/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      )

      const { sub, email, name, picture } = userInfoRes.data
      if (!sub || !email || !name) {
        res.status(400).json({ message: 'Incomplete user info from Auth0' })
        return
      }

      let user = await User.findOne({ auth0Id: sub })
      if (!user) {
        const role = roles && roles.includes('Admin') ? 'Admin' : 'User'
        user = await User.create({
          auth0Id: sub,
          email,
          name,
          avatar: picture,
          phoneNumber: '',
          role,
          dob: null,
          gender: 'Khác',
        })
      }

      res.cookie('auth_token', access_token, {
        httpOnly: true,
        secure: true,
        path: '/',
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })

      return res.redirect(`${process.env.CLIENT_URL}`)
    } catch (error: any) {
      console.error('Callback error:', error.response?.data || error.message)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  },

  logout: (req: Request, res: Response) => {
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    })

    const returnTo = process.env.CLIENT_URL || 'http://localhost:5107'
    const logoutUrl =
      `https://${process.env.AUTH0_DOMAIN}/v2/logout?` +
      `client_id=${process.env.AUTH0_CLIENT_ID}&` +
      `returnTo=${encodeURIComponent(returnTo)}`
    res.redirect(logoutUrl)
  },
}

export default authController
