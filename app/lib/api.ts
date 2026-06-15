import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
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
  source: string
  image_url: string
}

export interface RSSItem {
  title: string
  description: string
  link: string
  pub_date: string
}


export interface EventsResponse {
  events: Event[]
  rss: RSSItem[]
}

export interface CommunityPost {
  id: number
  title: string
  body: string
  votes: number
  user_id: number
  created_at: string
}
export interface Booking {
  id: number
  user_id: number
  event_id: number
  status: string
  created_at: string
  event: Event
}

export const auth = {
  register: (data: {
    name: string
    email: string
    password: string
    role: string
  }) => api.post<{ token: string; user: User }>('/auth/register', data),

  login: (data: {
    email: string
    password: string
  }) => api.post<{ token: string; user: User }>('/auth/login', data),
}

export const events = {
  getAll: (params?: { category?: string }) =>
    api.get<EventsResponse>('/events', { params }),

  getOne: (id: number) =>
    api.get<Event>(`/events/${id}`),

  create: (data: Omit<Event, 'id' | 'organizer_id' | 'source'>) =>
    api.post<Event>('/events', data),

  book: (id: number) =>
    api.post(`/events/${id}/book`),

  //added a booking endpoint to get the user's bookings
  getMyBookings: () =>
  api.get<Booking[]>('/bookings/my'),
}

export const community = {
  getPosts: () =>
    api.get<CommunityPost[]>('/community'),

  createPost: (data: { title: string; body: string }) =>
    api.post<CommunityPost>('/community', data),

  vote: (id: number, direction: 'up' | 'down') =>
    api.post(`/community/${id}/vote`, { direction }),
}


export default api