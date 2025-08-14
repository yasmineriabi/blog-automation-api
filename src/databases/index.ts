import { Blog, BlogSchema } from 'src/modules/blogs/models/blog.schema';
import { Topic, TopicSchema } from 'src/modules/topics/models/topic.schema';
import { User, UserSchema } from 'src/modules/user/models/user.schema';

export const MONGOOSE_MODELS = [
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Topic.name,
    schema: TopicSchema,
  },
  {
    name: Blog.name,
    schema: BlogSchema,
  },
];
