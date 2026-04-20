import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MessagesService } from '../../services/messages.service';
import { ReviewsService } from '../../services/reviews.service';
import { AuthService } from '../../services/auth.service';
import { Conversation, Message, ReviewEligibility } from '@campusexchange/shared';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink],
  template: `
    <div class="messages-page">
      <div class="messages-container">

        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>Messages</h3>
            <p>{{ conversations.length }} conversation(s)</p>
          </div>

          <div class="conversations-list">
            @for (conv of conversations; track conv.id) {
              <button
                type="button"
                class="conversation-item"
                [class.active]="selectedConversation?.id === conv.id"
                (click)="selectConversation(conv)"
              >
                <div class="conv-avatar">
                  {{ (conv.otherUser.firstName || '?')[0] }}{{ (conv.otherUser.lastName || '?')[0] }}
                </div>

                <div class="conv-info">
                  <div class="conv-top-row">
                    <p class="conv-name">
                      {{ conv.otherUser.firstName }} {{ conv.otherUser.lastName }}
                    </p>
                    <span class="conv-time">
                      {{ conv.lastMessageAt | date:'shortTime' }}
                    </span>
                  </div>

                  <p class="conv-listing">Regarding: {{ conv.listing.title }}</p>
                  <p class="conv-preview">
                    {{ conv.lastMessage ? 'Last message: ' + conv.lastMessage : 'No messages yet' }}
                  </p>
                </div>

                @if (conv.unreadCount > 0) {
                  <span class="unread-badge">{{ conv.unreadCount }}</span>
                }
              </button>
            } @empty {
              <div class="empty-state">
                <p>No conversations yet</p>
              </div>
            }
          </div>
        </aside>

        <section class="chat-panel">
          @if (selectedConversation) {

            <div class="chat-header">
              <div class="header-left">
                <div class="header-avatar">
                  {{ (selectedConversation.otherUser.firstName || '?')[0] }}{{ (selectedConversation.otherUser.lastName || '?')[0] }}
                </div>

                <div class="header-info">
                  <h3>
                    {{ selectedConversation.otherUser.firstName }}
                    {{ selectedConversation.otherUser.lastName }}
                  </h3>
                  <p>
                    Regarding:
                    <span class="listing-title">
                      {{ selectedConversation.listing.title }}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            @if (reviewEligibility) {
              <div class="review-banner" [class.review-banner-active]="reviewEligibility.canReview">
                @if (reviewEligibility.canReview && reviewEligibility.reviewedUser) {
                  <p>Review available for this transaction.</p>
                  <a class="btn-review-link" [routerLink]="['/listing', selectedConversation.listing.id]">
                    Open Listing Review
                  </a>
                } @else if (reviewEligibility.reason) {
                  <p>{{ reviewEligibility.reason }}</p>
                  @if (reviewEligibility.messageCount !== undefined) {
                    <span class="review-progress">
                      Messages exchanged: {{ reviewEligibility.messageCount }}/{{ reviewEligibility.minimumMessages }}
                    </span>
                  }
                }
              </div>
            }

            <div class="chat-messages" #chatMessages>
              @for (msg of messages; track msg.id) {
                <div class="message-row" [class.mine]="msg.senderId === auth.currentUser?.id">
                  <div class="message-bubble">
                    <p>{{ msg.content }}</p>
                    <span class="message-time">{{ msg.createdAt | date:'short' }}</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-chat">
                  <p>No messages yet. Start the conversation.</p>
                </div>
              }
            </div>

            <div class="chat-input">
              <input
                type="text"
                [(ngModel)]="newMessage"
                placeholder="Type a message..."
                (keyup.enter)="sendReply()"
              />
              <button
                (click)="sendReply()"
                [disabled]="sending || !newMessage.trim()"
              >
                {{ sending ? 'Sending...' : 'Send' }}
              </button>
            </div>

          } @else {
            <div class="no-chat">
              <div class="no-chat-card">
                <h3>Your Messages</h3>
                <p>Select a conversation to start chatting.</p>
              </div>
            </div>
          }
        </section>

      </div>
    </div>
  `,
  styles: [`
    .messages-page {
      height: calc(100vh - 64px);
      padding: 16px;
      background: #f4f6f8;
      box-sizing: border-box;
      overflow: hidden;
    }

    .messages-container {
      height: 100%;
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 340px 1fr;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      border-right: 1px solid #ececec;
      background: #fff;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 20px 16px 16px;
      border-bottom: 1px solid #ececec;
      flex-shrink: 0;
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .sidebar-header p {
      margin: 4px 0 0;
      color: #777;
      font-size: 0.9rem;
    }

    .conversations-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .conversation-item {
      width: 100%;
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      border: none;
      background: transparent;
      text-align: left;
    }

    .conversation-item:hover,
    .conversation-item.active {
      background: #f3f6fb;
    }

    .conv-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #003366;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .conv-info {
      flex: 1;
      min-width: 0;
    }

    .conv-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .conv-name {
      margin: 0;
      font-weight: 700;
      font-size: 0.95rem;
      color: #1f1f1f;
    }

    .conv-time {
      font-size: 0.75rem;
      color: #999;
      flex-shrink: 0;
    }

    .conv-listing {
      margin: 3px 0 2px;
      font-size: 0.8rem;
      color: #5f6b7a;
      font-weight: 600;
    }

    .conv-preview {
      margin: 0;
      font-size: 0.82rem;
      color: #8a94a6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unread-badge {
      background: #cc0000;
      color: #fff;
      min-width: 22px;
      height: 22px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 10px;
    }

    .chat-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      background: #fafbfc;
    }

    .chat-header {
      padding: 14px 18px;
      border-bottom: 1px solid #e6e6e6;
      background: #ffffff;
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #003366;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .header-info {
      display: flex;
      flex-direction: column;
    }

    .header-info h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 700;
      color: #1f1f1f;
    }

    .header-info p {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: #6f7b8a;
    }

    .listing-title {
      font-weight: 600;
      color: #003366;
    }

    .review-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 1rem;
      border-bottom: 1px solid #ececec;
      background: #f6f8fb;
      color: #334;
      flex-shrink: 0;
    }
    .review-banner p { margin: 0; line-height: 1.4; }
    .review-banner-active { background: #eef6ee; }
    .review-progress {
      font-size: 0.85rem;
      color: #667;
      white-space: nowrap;
    }
    .btn-review-link {
      flex-shrink: 0;
      padding: 10px 14px;
      border-radius: 8px;
      background: #003366;
      color: white;
      text-decoration: none;
      font-weight: 600;
    }

    .chat-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message-row {
      display: flex;
      justify-content: flex-start;
    }

    .message-row.mine {
      justify-content: flex-end;
    }

    .message-bubble {
      max-width: 65%;
      padding: 10px 14px;
      border-radius: 16px;
      background: #e9edf2;
      color: #222;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .message-row.mine .message-bubble {
      background: #003366;
      color: white;
    }

    .message-bubble p {
      margin: 0 0 6px;
      line-height: 1.4;
      word-break: break-word;
    }

    .message-time {
      font-size: 0.72rem;
      opacity: 0.75;
    }

    .chat-input {
      display: flex;
      gap: 10px;
      padding: 14px 18px;
      border-top: 1px solid #ececec;
      background: #fff;
      flex-shrink: 0;
    }

    .chat-input input {
      flex: 1;
      min-width: 0;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #d9dfe6;
      font-size: 1rem;
      outline: none;
      box-sizing: border-box;
    }

    .chat-input input:focus {
      border-color: #003366;
    }

    .chat-input button {
      padding: 12px 22px;
      background: #cc0000;
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
    }

    .chat-input button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .no-chat {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      padding: 2rem;
      text-align: center;
    }

    .no-chat-card {
      background: white;
      border: 1px solid #ececec;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .empty-state,
    .empty-chat {
      text-align: center;
      color: #888;
      padding: 2rem;
    }

    @media (max-width: 900px) {
      .messages-container {
        grid-template-columns: 1fr;
      }

      .sidebar {
        border-right: none;
        border-bottom: 1px solid #ececec;
        max-height: 260px;
      }

      .message-bubble {
        max-width: 85%;
      }
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') chatMessagesRef?: ElementRef;

  conversations: Conversation[] = [];
  selectedConversation?: Conversation;
  messages: Message[] = [];
  reviewEligibility?: ReviewEligibility;
  newMessage = '';
  sending = false;

  private conversationsPollSub?: Subscription;
  private messagesPollSub?: Subscription;

  constructor(
    private messagesService: MessagesService,
    private reviewsService: ReviewsService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadConversations();

    // 15s poll keeps conversation list fresh without hammering the global 60/min rate limit
    this.conversationsPollSub = interval(15000).subscribe(() => {
      this.loadConversations();
    });
  }

  ngOnDestroy() {
    this.conversationsPollSub?.unsubscribe();
    this.messagesPollSub?.unsubscribe();
  }

  loadConversations() {
    this.messagesService.getConversations().subscribe({
      next: (convs) => {
        this.conversations = convs;

        if (this.selectedConversation) {
          const updated = convs.find(c => c.id === this.selectedConversation?.id);
          if (updated) {
            this.selectedConversation = updated;
          }
        }
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
      }
    });
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation = conv;
    this.loadMessages(conv.id, true); // initial load — scroll to bottom
    this.loadReviewEligibility(conv.listing.id);

    this.messagesPollSub?.unsubscribe();
    this.messagesPollSub = interval(5000).subscribe(() => {
      // Poll without forcing scroll — respect where the user is reading
      if (this.selectedConversation) {
        this.loadMessages(this.selectedConversation.id);
      }
    });
  }

  loadReviewEligibility(listingId: number) {
    this.reviewsService.getEligibility(listingId).subscribe({
      next: (eligibility) => {
        this.reviewEligibility = eligibility;
      },
      error: () => {
        this.reviewEligibility = undefined;
      },
    });
  }

  loadMessages(id: number, forceScroll = false) {
    // Remember whether the user was already pinned to the bottom before refresh.
    // If they've scrolled up to read older messages, don't yank them back on poll.
    const wasAtBottom = this.isScrolledToBottom();

    this.messagesService.getMessages(id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        if (forceScroll || wasAtBottom) {
          this.scrollToBottom();
        }
      },
      error: (err) => {
        console.error('Failed to load messages', err);
      }
    });
  }

  private isScrolledToBottom(): boolean {
    const el = this.chatMessagesRef?.nativeElement;
    if (!el) return true; // first load — we want to scroll to bottom
    // Allow 40px slack so "near bottom" still counts as bottom
    return el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  }

  sendReply() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.sending = true;

    this.messagesService.sendMessage({
      listingId: this.selectedConversation.listing.id,
      receiverId: this.selectedConversation.otherUser.id,
      content: this.newMessage.trim(),
    }).subscribe({
      next: () => {
        this.newMessage = '';
        this.sending = false;
        this.loadConversations();
        this.loadMessages(this.selectedConversation!.id, true); // jump to bottom on send
      },
      error: (err) => {
        console.error('Failed to send message', err);
        this.sending = false;
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.chatMessagesRef?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}