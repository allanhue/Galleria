import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Types
export interface User {
  id: number
  name: string
  email: string
  role: 'attendee' | 'organizer'
}

export interface Event {
  id: number
  title: string
  description: string
  date: string
  location: string
  category: string
  capacity: number
  organizer_id: number
}

export interface CommunityPost {
  id: number
  title: string
  body: string
  votes: number
  user_id: number
  created_at: string
}

// Auth
export const auth = {
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data),
}

// Events
export const events = {
  getAll: (params?: { category?: string }) =>
    api.get<Event[]>('/events', { params }),

  getOne: (id: number) =>
    api.get<Event>(`/events/${id}`),

  create: (data: Omit<Event, 'id' | 'organizer_id'>) =>
    api.post<Event>('/events', data),

  book: (id: number) =>
    api.post(`/events/${id}/book`),
}

// Community
export const community = {
  getPosts: () =>
    api.get<CommunityPost[]>('/community'),

  createPost: (data: { title: string; body: string }) =>
    api.post<CommunityPost>('/community', data),

  vote: (id: number, direction: 'up' | 'down') =>
    api.post(`/community/${id}/vote`, { direction }),
}

export default api