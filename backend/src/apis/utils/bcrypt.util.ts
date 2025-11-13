import bcrypt from 'bcrypt'
export const hashPwd = (pwd: string): Promise<string> => bcrypt.hash(pwd, Number(process.env.BCRYPT_ROUNDS) || 10)
export const comparePwd = (pwd: string, hash: string): Promise<boolean> => bcrypt.compare(pwd, hash)
