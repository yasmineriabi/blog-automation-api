import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Role } from '../../../enums/userRole.enum';

@Schema({ timestamps: true })
export class User {
  @Prop()
  username: string;

  @Prop({ unique: [true, 'Email already exist.'] })
  email: string;

  @Prop()
  password: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  })
  role: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode: string;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);
