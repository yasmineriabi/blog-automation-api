export interface DifyBlog {
  text: {
    id: number;
    title: string;
    content: string;
    topicid: string;
    approvedby?: string;
    publushedat?: Date;
    createdat?: Date;
    status?: string;
    createdby?: string;
    viewcount?: number;
  };
}
