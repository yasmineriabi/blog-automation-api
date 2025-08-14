import { Expose, ExposeOptions, Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export function TransformMongoId(
  options?: ExposeOptions,
): (target: TopicSerializer, propertyKey: string) => void {
  return (target: TopicSerializer, propertyKey: string): void => {
    Transform((params) => params.obj[propertyKey]?.toString(), options)(
      target,
      propertyKey,
    );
  };
}

export class TopicSerializer {
  @Expose()
  @IsMongoId()
  @TransformMongoId()
  _id: string;

  @Expose()
  topic: string;

  @Expose()
  description: string;

  @Expose()
  domain: string;

  @Expose()
  created_by: string;

  @Expose()
  is_assigned: boolean;

  @Expose()
  isApproved: boolean;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  constructor(partial: Partial<TopicSerializer>) {
    Object.assign(this, partial);
  }
}
