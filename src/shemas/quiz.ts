import { Schema, model } from 'mongoose'

interface Answer {
  answer_text: string
  is_blackbox?: boolean
}

interface Question {
  question_text: string
  question_type: string
  question_media?: {
    type: string
    url: string
  }
  multi_choice_options?: string[]
  standalone_media: boolean
}

interface QuizQuestion {
  question: Question
  answer: Answer
}

interface Round {
  round_name: string
  round_type: string
  questions: QuizQuestion[]
  timer: number
}

interface Quiz {
  description?: string
  creator: Schema.Types.ObjectId
  publish: boolean
  plays: number
  title: string
  rounds: Round[]
}

interface Score {
  player: {
    name: string
    id: string
    team_id?: Schema.Types.ObjectId
  }
  score: number
}

interface QuizEvent {
  title: string
  host_entry_code: string
  entry_code: string
  quiz: Schema.Types.ObjectId
  scheduled_date?: Date
  leaderboard: Score[]
  creator: Schema.Types.ObjectId
  event_started: boolean
  event_ended: boolean
  activeRound: number
  activeQuestion: number
}

interface QuizSeries {
  title: string
  creator: Schema.Types.ObjectId
  events: Schema.Types.ObjectId[]
}

const QuestionSchema: Schema<QuizQuestion> = new Schema({
  question: {
    question_text: { type: String },
    question_type: { type: String, required: true },
    question_media: {
      type: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    multi_choice_options: {
      type: [String],
      default: [],
    },
    standalone_media: { type: Boolean, default: false },
  },
  answer: {
    answer_text: { type: String },
    is_blackbox: { type: Boolean, default: false },
  },
})

const RoundSchema: Schema<Round> = new Schema({
  round_name: { type: String, required: true },
  round_type: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] },
  timer: { type: Number, required: true },
})

const QuizSchema: Schema<Quiz> = new Schema(
  {
    description: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publish: { type: Boolean, default: false },
    plays: { type: Number, default: 0 },
    title: { type: String, required: true },
    rounds: { type: [RoundSchema], default: [] },
  },
  {
    timestamps: true,
  }
)

const ScoreSchema: Schema<Score> = new Schema({
  player: {
    name: { type: String, required: true },
    id: { type: String, required: true },
    team_id: { type: Schema.Types.ObjectId, ref: 'Team' },
  },
  score: { type: Number, default: 0 },
})

const QuizEventSchema: Schema<QuizEvent> = new Schema(
  {
    title: { type: String, required: true },
    host_entry_code: { type: String },
    entry_code: { type: String },
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz' },
    scheduled_date: { type: Date },
    event_ended: { type: Boolean, default: false },
    creator: { type: Schema.Types.ObjectId, ref: 'User' },
    leaderboard: { type: [ScoreSchema], default: [] },
    event_started: { type: Boolean, default: false },
    activeQuestion: { type: Number, default: 0 },
    activeRound: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
)

const QuizSeriesSchema: Schema<QuizSeries> = new Schema(
  {
    title: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    events: [{ type: Schema.Types.ObjectId, ref: 'QuizEvent', default: [] }],
  },
  {
    timestamps: true,
  }
)

export const QuizModel = model('Quiz', QuizSchema)
export const QuizEventModel = model('QuizEvent', QuizEventSchema)
export const QuizSeriesModel = model('QuizSeries', QuizSeriesSchema)
