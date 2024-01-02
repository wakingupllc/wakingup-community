import { forumSelect } from '../forumTypeUtils';
import { afRoutes } from './afRoutes'
import { eaRoutes } from './eaRoutes'
import { lwRoutes } from './lwRoutes'
import { wuRoutes } from './wuRoutes'

export const forumSpecificRoutes = forumSelect({
  AlignmentForum: afRoutes,
  EAForum: eaRoutes,
  LessWrong: lwRoutes,
  WakingUp: wuRoutes,
  default: () => {},
})
