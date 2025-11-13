import jwt from 'jsonwebtoken'
const SECRET = process.env.JWT_SECRET!

export const signToken = (payload: object): string => jwt.sign(payload, SECRET, { expiresIn: '7d' })

export const verifyToken = (token: string): any => jwt.verify(token, SECRET)
