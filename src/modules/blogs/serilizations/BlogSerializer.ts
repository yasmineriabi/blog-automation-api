import { Exclude, Expose, ExposeOptions, Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export function TransformMongoId(
  options?: ExposeOptions,
): (target: BlogSerializer, propertyKey: string) => void {
  return (target: BlogSerializer, propertyKey: string): void => {
    Transform((params) => params.obj[propertyKey]?.toString(), options)(
      target,
      propertyKey,
    );
  };
}

export class BlogSerializer {
  @Expose()
  @IsMongoId()
  @TransformMongoId()
  _id: string;

  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  topicid: number;

  @Expose()
  approvedby: string;

  @Expose()
  publushedat: Date;

  @Expose()
  createdat: Date;

  @Expose()
  status: string;

  @Expose()
  createdby: string;

  @Expose()
  viewcount: number;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  constructor(partial: Partial<BlogSerializer>) {
    Object.assign(this, partial);
  }
} 