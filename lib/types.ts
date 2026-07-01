export type Priority = 'high' | 'medium' | 'low'
export type Category = 'todo' | 'calendar' | 'finance' | 'habit' | 'goal'

export interface Todo {
  id: string
  text: string
  completed: boolean
  priority: Priority
  createdAt: string
  dueDate?: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  duration?: number // minutes
  description?: string
  createdAt?: string
  source?: 'local' | 'google'
  googleEventId?: string
}

export interface Transaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category?: string
  date: string
  createdAt: string
}

export interface Habit {
  id: string
  name: string
  frequency: 'daily' | 'weekly'
  completedDates: string[]
  createdAt: string
  color?: string
}

export interface Goal {
  id: string
  title: string
  description?: string
  deadline?: string
  progress: number
  unit?: string
  target?: number
  current?: number
  timeframe: 'week' | 'month' | 'quarter' | 'year' | 'custom'
  completed: boolean
  createdAt: string
}

export interface SocialStats {
  followers: number
  following?: number
  posts?: number
  views?: number
  likes?: number
  reach?: number
  updatedAt: string
}

export interface SocialPost {
  id: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  thumbnailUrl: string
  permalink: string
  timestamp: string
  likeCount: number
  commentsCount: number
  caption?: string
}

export interface SocialAccount {
  platform: 'instagram' | 'tiktok' | 'wix'
  connected: boolean
  username?: string
  displayName?: string
  profilePictureUrl?: string
  accessToken?: string
  userId?: string
  stats?: SocialStats
  recentPosts?: SocialPost[]
}

export interface Note {
  id: string
  text: string
  color: 'yellow' | 'cyan' | 'pink' | 'green' | 'default'
  createdAt: string
  updatedAt: string
}

export interface AppData {
  todos: Todo[]
  events: CalendarEvent[]
  transactions: Transaction[]
  habits: Habit[]
  goals: Goal[]
  userName: string
  social: SocialAccount[]
  notes: Note[]
}

export interface CaptureResult {
  category: Category
  data: Todo | CalendarEvent | Transaction | Habit | Goal
  confidence: number
  reasoning: string
}
