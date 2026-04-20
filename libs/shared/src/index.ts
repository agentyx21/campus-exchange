export interface SessionUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  role: 'student' | 'admin';
}

export interface UserProfile extends SessionUser {
  bio?: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
}

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  bio?: string;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export interface ListingImage {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  listingType: 'fixed' | 'bidding';
  conditionStatus: string;
  status: string;
  bidEndDate?: string;
  viewsCount: number;
  createdAt: string;
  seller: {
    id: number;
    firstName: string;
    lastName: string;
    averageRating: number;
    profileImage?: string;
  };
  soldToBuyer?: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
  } | null;
  category: Category;
  images: ListingImage[];
  bids?: Bid[];
}

export interface EligibleBuyer {
  conversationId: number;
  buyerId: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  lastMessageAt: string;
  messageCount: number;
  reviewUnlocked: boolean;
}

export interface Bid {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  bidder: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface Conversation {
  id: number;
  listing: {
    id: number;
    title: string;
    image?: string;
  };
  otherUser: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface ReviewEligibility {
  canReview: boolean;
  reason?: string | null;
  minimumMessages: number;
  messageCount?: number;
  reviewedId?: number;
  reviewedUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  listingType?: 'fixed' | 'bidding';
  conditionStatus?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  bidEndDate?: string;
  imageUrls?: string[];
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  conditionStatus?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  imageUrls?: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface ListingsResponse {
  data: Listing[];
  total: number;
  page: number;
  totalPages: number;
}
