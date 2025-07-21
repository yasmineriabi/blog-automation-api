

  import { User, UserSchema } from 'src/modules/user/models/user.schema';
  
  export const MONGOOSE_MODELS = [
    {
      name: User.name,
      schema: UserSchema,
    },
  
  ];