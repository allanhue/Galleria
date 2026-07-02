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
export interface Conversation {
  id: number
  user_a_id: number
  user_b_id: number
  user_a: User
  user_b: User
  created_at: string
  last_message: Message | null
  unread_count: number
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  body: string
  read: boolean
  created_at: string
  sender: User
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




export interface AttendeesResponse {
  event: Event
  attendees: Attendee[]
  total: number
  capacity: number
  percentage: number
}

export interface OrganizerStats {
  total_events: number
  total_bookings: number
  events: {
    id: number
    title: string
    date: string
    capacity: number
    booked: number
    percentage: number
  }[]
}

export interface Report {
  id: number
  reporter_id: number
  target_type: string
  target_id: number
  reason: string
  details: string
  status: string
  created_at: string
  reporter: User
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




export const follow = {
  followUser: (userId: number) => api.post(`/follow/${userId}`),
  unfollowUser: (userId: number) => api.delete(`/follow/${userId}`),
  getStatus: (userId: number) =>
    api.get<{ is_following: boolean; is_followed_by: boolean }>(`/follow/${userId}/status`),
 //get my following list
  getFollowing: () => api.get<User[]>('/follow/following'),
}

export const messages = {
  start: (userId: number) => api.post<Conversation>(`/messages/start/${userId}`),
  getConversations: () => api.get<Conversation[]>('/messages/conversations'),
  getMessages: (conversationId: number) => api.get<Message[]>(`/messages/${conversationId}`),
  send: (conversationId: number, body: string) =>
    api.post<Message>(`/messages/${conversationId}`, { body }),
  //unread messages api
  getUnreadCount: () => api.get<{ unread: number }>('/messages/unread'),
}


export interface SuggestedUser extends User {
  shared_categories: string[]
  match_score: number
}

export const notifications = {
  getAll: () => api.get<{ notifications: Notification[]; unread_count: number }>('/notifications'),
  markRead: () => api.put('/notifications/read'),
  dismiss: (id: number) => api.delete(`/notifications/${id}`),
}

export const discover = {
  getSuggestedPeople: () => api.get<SuggestedUser[]>('/discover/people'),
}


export const block = {
  blockUser: (userId: number) => api.post(`/block/${userId}`),
  unblockUser: (userId: number) => api.delete(`/block/${userId}`),
  getBlocked: () => api.get<User[]>('/block/mine'),
}

export const report = {
  create: (data: { target_type: string; target_id: number; reason: string; details?: string }) =>
    api.post('/report', data),
  getAll: () => api.get<Report[]>('/admin/reports'),
  updateStatus: (id: number, status: string) =>
    api.put(`/admin/reports/${id}`, { status }),
}


export interface Attendee extends Booking {
  user: User
}


export const organizerTools = {
  getAttendees: (eventId: number) =>
    api.get<AttendeesResponse>(`/events/${eventId}/attendees`),
  getStats: () =>
    api.get<OrganizerStats>('/dashboard/stats'),
}
export default api