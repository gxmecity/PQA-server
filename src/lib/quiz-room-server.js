const { parentPort, workerData } = require('node:worker_threads')
const { Realtime } = require('ably')

const { roomCode, hostRoomCode, quizId, eventType, quiz } = workerData

const START_TIMER_SEC = 3
let QUESTION_TIMER_SEC = 0
let QUIZ_STARTED = false
let ACTIVE_ROUND = 0
let ACTIVE_QUESTION_INDEX = 0
let skipTimer = false
let totalPlayers = 0
let dealerIndex = 0
let answeredQuestions = []

let hostChannel, roomChannel

const realtime = new Realtime({
  key: process.env.ABLY_API_KEY,
  echoMessages: false,
})

realtime.connection.on('connected', async () => {
  console.log('Room connection created')
  hostChannel = realtime.channels.get(`${roomCode}:host`)
  roomChannel = realtime.channels.get(`${roomCode}:primary`)

  if (!quiz) {
    console.error('Quiz data not found')
    roomChannel.publish('quiz-data-missing', {})
    return
  }

  parentPort.postMessage({
    roomCode,
    hostRoomCode,
    totalPlayers,
    quizId,
    isRoomActive: true,
  })

  roomChannel.publish('room-ready', {})
  subscribeToHostEvents()
})

function getRoundMetadata(roundIndex) {
  const round = quiz.rounds[roundIndex]
  answeredQuestions = []

  return {
    round: {
      title: round.round_name,
      type: round.round_type,
      time: round.timer,
      index: roundIndex,
      round_started: false,
      round_ended: false,
      isLastRound: roundIndex === quiz.rounds.length - 1,
      totalQuestions: round.questions.length,
    },
    canRevealAnswer: round.round_type !== 'trivia',
    answeredQuestions,
  }
}

function subscribeToHostEvents() {
  hostChannel.subscribe('start-quiz', () => {
    console.log('Quiz started')
    QUIZ_STARTED = true
    ACTIVE_ROUND = 0
    ACTIVE_QUESTION_INDEX = 0
    QUESTION_TIMER_SEC = quiz.rounds[0].timer

    roomChannel.publish('quiz-started', getRoundMetadata(0))
  })

  hostChannel.subscribe('start-round', async () => {
    roomChannel.publish('start-round', { round_started: true })

    const round = quiz.rounds[ACTIVE_ROUND]
    if (round.round_type === 'trivia') {
      await publishTimer('countdown-timer', START_TIMER_SEC)
      publishQuestion(ACTIVE_QUESTION_INDEX)
    }
  })

  hostChannel.subscribe('next-question', () => {
    const currentRound = quiz.rounds[ACTIVE_ROUND]
    const hasNext = ACTIVE_QUESTION_INDEX + 1 < currentRound.questions.length

    if (hasNext) {
      ACTIVE_QUESTION_INDEX += 1
      publishQuestion(
        ACTIVE_QUESTION_INDEX,
        ACTIVE_QUESTION_INDEX === currentRound.questions.length - 1
      )
    }
  })

  hostChannel.subscribe('start-answer-reveal', async () => {
    skipTimer = true
    ACTIVE_QUESTION_INDEX = 0

    await publishQuestion(ACTIVE_QUESTION_INDEX)
    roomChannel.publish('answer-reveal', {})
  })

  hostChannel.subscribe('set-question-index', async ({ data }) => {
    skipTimer = false
    const { index } = data
    const questions = quiz.rounds[ACTIVE_ROUND].questions

    if (index === null) {
      // update dealer index if no specific question is set if updated index id more than total players, reset to 0
      roomChannel.publish('new-question', {
        question: null,
        answeredQuestions,
      })
      return
    }

    if (index >= 0 && index < questions.length) {
      ACTIVE_QUESTION_INDEX = index
      await publishTimer('countdown-timer', START_TIMER_SEC)
      await publishQuestion(index)

      if (quiz.rounds[ACTIVE_ROUND].round_type === 'dealers_choice') {
        roomChannel.publish('allow-buzzer', { buzzer: true })
      }
    }
  })

  hostChannel.subscribe('reveal-answer', () => {
    skipTimer = true
    roomChannel.publish('show-answer', {})
  })

  hostChannel.subscribe('restart-round', async () => {
    skipTimer = true
    ACTIVE_QUESTION_INDEX = 0

    await publishQuestion(ACTIVE_QUESTION_INDEX)
  })

  hostChannel.subscribe('end-round', async () => {
    const isLastRound = ACTIVE_ROUND === quiz.rounds.length - 1

    if (eventType === 'online') {
      // TODO: Compute and publish round leaderboard
    } else {
      ACTIVE_ROUND += 1
      ACTIVE_QUESTION_INDEX = 0

      if (!isLastRound) {
        QUESTION_TIMER_SEC = quiz.rounds[ACTIVE_ROUND].timer
        roomChannel.publish('new-round', getRoundMetadata(ACTIVE_ROUND))
      } else {
        roomChannel.publish('quiz-ended', { quizEnded: true })
        await killWorkerThread()
      }
    }
  })

  hostChannel.subscribe('next-round', () => {
    if (ACTIVE_ROUND < quiz.rounds.length - 1) {
      ACTIVE_ROUND += 1
      ACTIVE_QUESTION_INDEX = 0
      QUESTION_TIMER_SEC = quiz.rounds[ACTIVE_ROUND].timer

      roomChannel.publish('new-round', getRoundMetadata(ACTIVE_ROUND))
    }
  })

  hostChannel.subscribe('skip-timer', () => {
    skipTimer = true
  })

  hostChannel.subscribe('final-results', async () => {
    // TODO: Compute and publish final leaderboard
  })

  hostChannel.subscribe('end-quiz', async () => {
    roomChannel.publish('quiz-ended', { quizEnded: true })
    await killWorkerThread()
  })
}

async function publishQuestion(index, isLast = false) {
  const round = quiz.rounds[ACTIVE_ROUND]
  const question = round.questions[index]
  answeredQuestions.push(index)

  roomChannel.publish('new-question', {
    question: {
      question,
      index,
      isLast,
    },
    answeredQuestions,
  })

  if (QUESTION_TIMER_SEC) {
    await publishTimer('question-timer', QUESTION_TIMER_SEC)
  }
}

async function publishTimer(event, countdown) {
  while (countdown >= 0) {
    await roomChannel.publish(event, { timer: countdown })
    await new Promise((r) => setTimeout(r, 1000))
    if (event === 'question-timer' && skipTimer) break
    countdown -= 1
  }

  if (event === 'question-timer') {
    roomChannel.publish('timer-ended', { message: 'Time is up!' })
  }
}

async function killWorkerThread() {
  try {
    await hostChannel.detach()
    await roomChannel.detach()
    parentPort.postMessage({
      killWorker: true,
      roomCode: roomCode,
      totalPlayers,
    })
  } catch (err) {
    console.error('Error during cleanup:', err)
  } finally {
    process.exit(0)
  }
}
