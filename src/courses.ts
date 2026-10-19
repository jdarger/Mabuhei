import type { Course, LangCode } from './content/types'
import { course as no } from './content/no'
import { course as tl } from './content/tl'

export const COURSES: Record<LangCode, Course> = { no, tl }
export const LANGS: LangCode[] = ['no', 'tl']
