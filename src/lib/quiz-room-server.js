const { parentPort, workerData } = require('node:worker_threads')
const { Realtime } = require('ably')

const { roomCode, hostRoomCode, quizId, eventType, quiz, creatorId } =
  workerData

const START_TIMER_SEC = 3
let QUESTION_TIMER_SEC = 0

let QUIZ_STARTED = false
let ACTIVE_ROUND = 0
let ROUND_STARTED = false
let ACTIVE_QUESTION_INDEX = 0
let skipTimer = false
let totalPlayers = 0
let answeredQuestions = []
let numberAnswered = 0
let hostDevices = 0
let canRevealAnswer = false

let DEALER_INDEX = 0

const globalPlayersState = {}
const playerChannels = {}

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
    eventType,
    quizHost: creatorId,
  })

  roomChannel.publish('room-ready', {})
  subscribeToHostEvents()
  roomChannel.presence.subscribe('enter', handleNewPlayerJoined)
  roomChannel.presence.subscribe('leave', handlePlayerExitedQuiz)
})

function getRoundMetadata(roundIndex) {
  const round = quiz.rounds[roundIndex]
  return {
    round: {
      title: round.round_name,
      type: round.round_type,
      time: round.timer,
      index: roundIndex,
      round_started: ROUND_STARTED,
      round_ended: false,
      isLastRound: roundIndex === quiz.rounds.length - 1,
      totalQuestions: round.questions.length,
    },
    canRevealAnswer,
    answeredQuestions,
    dealer_index: DEALER_INDEX,
  }
}

function subscribeToHostEvents() {
  hostChannel.presence.subscribe('enter', (player) => {
    hostDevices++
    roomChannel.publish('new-remote-device', {
      hostDevices,
      deviceId: player.clientId,
    })

    if (QUIZ_STARTED) {
      const round = quiz.rounds[ACTIVE_ROUND]
      const question =
        ROUND_STARTED && ACTIVE_QUESTION_INDEX !== null
          ? round.questions[ACTIVE_QUESTION_INDEX]
          : null

      const baseState = {
        quiz_started: true,
        ...getRoundMetadata(ACTIVE_ROUND),
      }

      if (question) {
        baseState.question = {
          question,
          index: ACTIVE_QUESTION_INDEX,
          isLast: ACTIVE_QUESTION_INDEX === round.questions.length - 1,
        }
      }
      hostChannel.publish('sync-state', {
        clientId: player.clientId,
        state: baseState,
      })
    }
  })

  hostChannel.presence.subscribe('leave', (player) => {
    hostDevices--
    roomChannel.publish('exiting-remote-device', {
      hostDevices,
      deviceId: player.clientId,
    })
  })

  hostChannel.subscribe('start-quiz', () => {
    console.log('Quiz started')
    QUIZ_STARTED = true
    ACTIVE_ROUND = 0
    ACTIVE_QUESTION_INDEX = 0
    QUESTION_TIMER_SEC = quiz.rounds[0].timer

    roomChannel.publish('quiz-started', getRoundMetadata(0))
  })

  hostChannel.subscribe('start-round', async () => {
    ROUND_STARTED = true
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
    canRevealAnswer = true

    await publishQuestion(ACTIVE_QUESTION_INDEX)
    roomChannel.publish('answer-reveal', {})
  })

  hostChannel.subscribe('set-question-index', async ({ data }) => {
    skipTimer = false
    const { index } = data
    const questions = quiz.rounds[ACTIVE_ROUND].questions

    if (index === null) {
      ACTIVE_QUESTION_INDEX = null
      DEALER_INDEX = DEALER_INDEX >= totalPlayers - 1 ? 0 : DEALER_INDEX + 1
      roomChannel.publish('new-question', {
        question: null,
        answeredQuestions,
        dealer_index: DEALER_INDEX,
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
      if (!isLastRound) {
        ACTIVE_ROUND += 1
        ACTIVE_QUESTION_INDEX =
          quiz.rounds[ACTIVE_ROUND].round_type === 'trivia' ? 0 : null
        QUESTION_TIMER_SEC = quiz.rounds[ACTIVE_ROUND].timer
        canRevealAnswer = quiz.rounds[ACTIVE_ROUND].round_type !== 'trivia'
        ROUND_STARTED = false
        answeredQuestions = []
        DEALER_INDEX = 0

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
      ACTIVE_QUESTION_INDEX =
        quiz.rounds[ACTIVE_ROUND].round_type === 'trivia' ? 0 : null

      QUESTION_TIMER_SEC = quiz.rounds[ACTIVE_ROUND].timer
      canRevealAnswer = quiz.rounds[ACTIVE_ROUND].round_type !== 'trivia'
      ROUND_STARTED = false
      answeredQuestions = []
      DEALER_INDEX = 0

      roomChannel.publish('new-round', getRoundMetadata(ACTIVE_ROUND))
    }
  })

  hostChannel.subscribe('skip-timer', () => {
    skipTimer = true
  })

  hostChannel.subscribe('allow-buzzer', () => {
    roomChannel.publish('allow-buzzer')
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
  numberAnswered = 0
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

  if (QUESTION_TIMER_SEC && !skipTimer) {
    await publishTimer('question-timer', QUESTION_TIMER_SEC)
  }
}

function handleNewPlayerJoined(player) {
  const playerGameId = player.data.gameId

  if (globalPlayersState[playerGameId]) return

  totalPlayers++
  postMessage({
    roomCode,
    hostRoomCode,
    totalPlayers,
    quizId,
    isRoomActive: true,
  })

  const playerState = {
    gameId: playerGameId,
    clientId: player.clientId,
    name: player.data.name,
    avatar_url: player.data.avatar,
    player_id: player.data.player_id,
    score: 0,
  }

  playerChannels[playerGameId] = realtime.channels.get(
    `${roomCode}:player-ch-${playerGameId}`
  )

  globalPlayersState[playerGameId] = playerState
  roomChannel.publish('new-player', { player: playerState })

  subscribeToPlayerChannels(playerChannels[playerGameId], playerGameId)
  if (QUIZ_STARTED) {
    //update player with current gameState
  }
}

function handlePlayerExitedQuiz(player) {
  const leavingPlayerId = player.clientId

  roomChannel.publish('exiting-player', { playerId: leavingPlayerId })
}

function subscribeToPlayerChannels(playerChannel, playerId) {
  playerChannel.subscribe('submit-answer', (msg) => {
    const round = quiz.rounds[ACTIVE_ROUND]
    const answer = msg.data.answer
    const questionIndex = msg.data.questionIndex
    const timeAnswered = msg.data.timeAnswered
    numberAnswered++

    const correctAnswer = round.questions[questionIndex].answer.answer_text

    if (
      removeSpaceFromAnswerString(answer) ===
      removeSpaceFromAnswerString(correctAnswer)
    ) {
      const point = pointAllocationByTimeAnswered(timeAnswered, round.timer)
      globalPlayersState[playerId].score += point
    }
    if (numberAnswered === totalPlayers) {
      skipTimer = true
    }
  })

  playerChannel.subscribe('request-bonus', (msg) => {
    roomChannel.publish('bonus-request', {
      player: {
        gameId: msg.clientId,
        name: msg.data.name,
      },
    })
  })
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

function removeSpaceFromAnswerString(value) {
  return value.replace(/\s+/g, '').toLowerCase()
}

function pointAllocationByTimeAnswered(timeAnswered, totalTime) {
  const percentageTimeOfAnswer = (timeAnswered / totalTime) * 100

  switch (true) {
    case percentageTimeOfAnswer >= 75:
      return 10
    case percentageTimeOfAnswer >= 50:
      return (75 / 100) * 10
    case percentageTimeOfAnswer >= 30:
      return (50 / 100) * 10
    default:
      return (10 / 100) * 10
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
