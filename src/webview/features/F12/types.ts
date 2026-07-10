export type GithubAuthStatus = 'unauthenticated' | 'authenticated' | 'no-remote';

export type PullRequestState = 'open' | 'closed' | 'merged';
export type IssueState = 'open' | 'closed';

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

export interface PullRequestDetail extends PullRequestSummary {
  bodyMarkdown: string;
}

export interface IssueDetail extends IssueSummary {
  bodyMarkdown: string;
}
