import { NextFunction } from 'express'
import { Schema, Document, model } from 'mongoose'
import { hash, genSaltSync, compare } from 'bcrypt'

interface IUser {
  fullname: string
  profile_img: string
  email: string
  password: string
  role: string
  raw_pass: string
}

export interface IUserModel extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>
}

const usersSchema: Schema<IUserModel> = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },
    raw_pass: {
      type: String,
      select: false,
    },
    profile_img: {
      type: String,
    },
    role: {
      type: String,
      enum: ['single_player', 'quiz_master'],
      default: 'quiz_master',
    },
  },
  {
    timestamps: true,
  }
)

usersSchema.pre('save', async function (next: NextFunction) {
  const user = this
  try {
    if (!user.isModified('password')) return next()

    const salt = genSaltSync(10)
    this.password = await hash(this.password, salt)
    next()
  } catch (error) {
    return next(error)
  }
})

usersSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await compare(enteredPassword, this.password)
}

export const UserModel = model('User', usersSchema)
