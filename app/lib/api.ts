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
export interface User {
  id: number
  name: string
  email: string
  role: 'attendee' | 'organizer'
  avatar_url?: string
}

export interface Event {
  id: number
  title: string
  description: string
  date: string
  location: string
  city?: string
  country?: string
  category: string
  capacity: number
  organizer_id: number
  source: string
  photo_urls?: string[]
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

export interface PostComment {
  id: number
  post_id: number
  user_id: number
  body: string
  created_at: string
  user: User
}

export interface CommunityPost {
  id: number
  title: string
  body: string
  votes: number
  saves: number
  reposts: number
  user_id: number
  created_at: string
  user?: User
  comments?: PostComment[]
}
export interface Notification {
  id: number
  user_id: number
  actor_id: number
  type: string
  post_id?: number
  event_id?: number
  message: string
  read: boolean
  created_at: string
  actor: User
}

export interface EventDetail extends Event {
  spots_taken: number
  spots_remaining: number
  sold_out: boolean
}

export interface ProfileData {
  user: User
  my_posts: CommunityPost[]
  saved_posts: CommunityPost[]
  reposted_posts: CommunityPost[]
  stats: {
    posts: number
    saved: number
    reposts: number
    bookings: number
  }
}

export const profile = {
  getMine: () => api.get<ProfileData>('/profile/me'),
  updateAvatar: (avatarUrl: string) =>
    api.put('/profile/avatar', { avatar_url: avatarUrl }),
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
  getAll: (params?: { category?: string; city?: string; country?: string; search?: string }) =>
    api.get<EventsResponse>('/events', { params }),

  getOne: (id: number) =>
    api.get<EventDetail>(`/events/${id}`),

  create: (data: {
    title: string; description: string; date: string; location: string
    category: string; capacity: number; city?: string; country?: string
    photo_urls?: string[]
  }) => api.post<Event>('/events', data),

  update: (id: number, data: Partial<Event>) =>
    api.put<Event>(`/events/${id}`, data),

  delete: (id: number) =>
    api.delete(`/events/${id}`),

  book: (id: number) =>
    api.post(`/events/${id}/book`),

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

  addComment: (id: number, body: string) =>
    api.post<PostComment>(`/community/${id}/comment`, { body }),

  getComments: (id: number) =>
    api.get<PostComment[]>(`/community/${id}/comments`),

  toggleSave: (id: number) =>
    api.post<{ saved: boolean }>(`/community/${id}/save`),

  getMySaved: () =>
    api.get<CommunityPost[]>('/community/saved'),

  repost: (id: number) =>
    api.post(`/community/${id}/repost`),

  
deleteComment: (commentId: number) =>
  api.delete(`/community/comment/${commentId}`),

deletePost: (id: number) =>
  api.delete(`/community/${id}`),
}

export interface Notification {
  id: number
  user_id: number
  actor_id: number
  type: string
  post_id?: number
  event_id?: number
  message: string
  read: boolean
  created_at: string
  actor: User
}

export interface EventDetail extends Event {
  spots_taken: number
  spots_remaining: number
  sold_out: boolean
}

export const notifications = {
  getAll: () => api.get<{ notifications: Notification[]; unread_count: number }>('/notifications'),
  markRead: () => api.put('/notifications/read'),
}


export default api