export type GithubAuthStatus = 'unauthenticated' | 'authenticated' | 'no-remote';

export type PullRequestState = 'open' | 'closed' | 'merged';
export type IssueState = 'open' | 'closed';
export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED';

export interface PullRequestSummary {
  number: number;
  title: string;
  author: string;
  state: PullRequestState;
  labels: string[];
  updatedAt: string;
}

export interface IssueSummary {
  number: number;
  title: string;
  author: string;
  state: IssueState;
  labels: string[];
  updatedAt: string;
}

export interface CommentSummary {
  author: string;
  bodyMarkdown: string;
  createdAt: string;
}

export interface ReviewSummary {
  author: string;
  state: ReviewState;
  bodyMarkdown: string;
  submittedAt: string;
}

export interface PullRequestDetail extends PullRequestSummary {
  bodyMarkdown: string;
  comments: CommentSummary[];
  reviews: ReviewSummary[];
}

export interface IssueDetail extends IssueSummary {
  bodyMarkdown: string;
  comments: CommentSummary[];
}
