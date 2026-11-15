import { objectParticle } from './my-rules'

/** ProposalChat: the posting that came with a proposal is one line in the thread, not a card. */
export const postingSentLine = (sender: string, title: string) => `${sender} 님이 ${title}${objectParticle(title)} 보냈어요`
