export interface DifyBlog {
  id: number;
  title: string;
  content: string;
  topicid: string;
  approvedby?: string;
  publushedat?: string;
  createdat?: string;
  status?: string;
  createdby?: string;
  viewcount?: number;
}

export interface DifyBlogResponse {
  task_id: string;
  workflow_run_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      text: string; // This contains the JSON string of blogs
    };
    error: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}
