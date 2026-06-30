/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Category = 'Roads' | 'Waste' | 'Lighting' | 'Water' | 'Other';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Pending' | 'Under Investigation' | 'In Progress' | 'Resolved';

export interface Comment {
  id: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  coordinates?: [number, number]; // Neighbor verification coordinates
}

export interface StatusUpdate {
  id: string;
  fromStatus: IssueStatus;
  toStatus: IssueStatus;
  updatedBy: string;
  comment: string;
  createdAt: string;
}

export interface CommunityReport {
  id: string;
  title: string;
  category: Category;
  severity: Severity;
  status: IssueStatus;
  description: string;
  coordinates: [number, number]; // [lat, lng]
  locationName: string;
  upvotes: number;
  upvotedBy: string[]; // List of userIds
  author: string;
  authorId: string;
  createdAt: string;
  resolvedAt?: string;
  comments: Comment[];
  statusHistory: StatusUpdate[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon identifier
  tier: 'Gold' | 'Silver' | 'Bronze';
  unlockedAt: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  points: number;
  reportsFiled: string[]; // List of report IDs
  badges: Badge[];
}
