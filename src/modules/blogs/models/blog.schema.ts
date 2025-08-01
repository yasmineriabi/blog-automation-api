import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Blog {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  topicid: string;

  @Prop({ default: '' })
  approvedby: string;

  @Prop()
  publushedat: Date;

  @Prop({ default: Date.now })
  createdat: Date;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: '123' })
  createdby: string;

  @Prop({ default: 0 })
  viewcount: number;
}

export type BlogDocument = HydratedDocument<Blog>;

export const BlogSchema = SchemaFactory.createForClass(Blog); 