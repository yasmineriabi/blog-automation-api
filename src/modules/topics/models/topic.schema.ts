import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Topic {
  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  domain: string;

  @Prop({ default: '123' })
  created_by: string;

  @Prop({ default: false })
  is_assigned: boolean;

  @Prop({ default: false })
  isApproved: boolean;
}

export type TopicDocument = HydratedDocument<Topic>;

export const TopicSchema = SchemaFactory.createForClass(Topic);
