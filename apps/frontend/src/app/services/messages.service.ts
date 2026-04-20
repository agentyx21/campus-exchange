import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Conversation, Message } from '@campusexchange/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MessagesService {
  private apiUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  getConversations() {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  getMessages(conversationId: number) {
    return this.http.get<Message[]>(`${this.apiUrl}/conversations/${conversationId}`);
  }

  sendMessage(data: { listingId: number; receiverId: number; content: string }) {
    return this.http.post<Message>(this.apiUrl, data);
  }
}
