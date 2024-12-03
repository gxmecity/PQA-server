import { NextFunction } from 'express'
import { Schema, Document, model } from 'mongoose'
import { hash, genSaltSync, compare } from 'bcrypt'
import { generateSlug } from '../helpers'

interface Team {
  name: string
  quiz_master: Schema.Types.ObjectId
  slug: string
  sigil: string
  team_members: string[]
  passphrase: string
}

export interface ITeamModel extends Team, Document {
  comparePassphrase(teamPassphrase: string): Promise<boolean>
}

const teamsSchema: Schema<ITeamModel> = new Schema(
  {
    name: { type: String },
    quiz_master: { type: Schema.Types.ObjectId, ref: 'User' },
    slug: { type: String },
    sigil: { type: String },
    team_members: {
      type: [{ type: String }],
      validate: [teamMemberLength, '{PATH} must have at least 2 members'],
    },
    passphrase: { type: String },
  },
  {
    timestamps: true,
  }
)

function teamMemberLength(val: string[]) {
  return val.length >= 2
}

teamsSchema.pre('save', async function (next: NextFunction) {
  const team = this
  if (team.isModified('name')) {
    this.slug = generateSlug(this.name)
  }

  try {
    if (!team.isModified('passphrase')) return next()

    const salt = genSaltSync(10)
    this.passphrase = await hash(this.passphrase, salt)
    next()
  } catch (error) {
    return next(error)
  }
})

teamsSchema.methods.comparePassphrase = async function (enteredPhrase: string) {
  return await compare(enteredPhrase, this.passphrase)
}

export const TeamModel = model('Team', teamsSchema)
