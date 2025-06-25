export interface TeamGameScore {
  [key: string]: {
    score: number
    name: string
    team_id?: string
  }
}

export interface RoundLeaderboard {
  [key: string]: TeamGameScore
}
