import { Stage } from '@prisma/client'

export const getMatchOrder = (matchStage: Stage, mobile?: boolean) => {
  if (mobile) {
    switch (matchStage) {
      case 'FINALS_8_1': return 1
      case 'FINALS_8_2': return 2
      case 'FINALS_8_3': return 3
      case 'FINALS_8_4': return 4
      case 'FINALS_8_5': return 5
      case 'FINALS_8_6': return 6
      case 'FINALS_8_7': return 7
      case 'FINALS_8_8': return 8
      case 'FINALS_4_1': return 9
      case 'FINALS_4_2': return 10
      case 'FINALS_4_3': return 11
      case 'FINALS_4_4': return 12
      case 'FINALS_2_1': return 13
      case 'FINALS_2_2': return 14
      case 'FINALS': return 15
      case 'THIRD_PLACE': return 16
      default: return 0
    }
  }
  switch (matchStage) {
    case 'FINALS_8_1': return 1
    case 'FINALS_8_3': return 5
    case 'FINALS_8_5': return 2
    case 'FINALS_8_7': return 6
    case 'FINALS_8_2': return 7
    case 'FINALS_8_4': return 3
    case 'FINALS_8_6': return 4
    case 'FINALS_8_8': return 8
    case 'FINALS_4_1': return 10
    case 'FINALS_4_3': return 11
    case 'FINALS_4_2': return 12
    case 'FINALS_4_4': return 13
    case 'FINALS_2_1': return 15
    case 'FINALS_2_2': return 16
    case 'FINALS': return 18
    case 'THIRD_PLACE': return 19
    default: return 0
  }
}
