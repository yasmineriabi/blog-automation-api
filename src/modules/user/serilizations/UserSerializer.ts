import { Exclude, Expose, ExposeOptions, Transform } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export function TransformMongoId(
  options?: ExposeOptions,
): (target: UserSerializer, propertyKey: string) => void {
  return (target: UserSerializer, propertyKey: string): void => {
    Transform((params) => params.obj[propertyKey]?.toString(), options)(
      target,
      propertyKey,
    );
  };
}

export class UserSerializer {
  @Expose()
  @IsMongoId()
  @TransformMongoId()
  _id: string;

  @Exclude()
  password: string;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  avatar: string;

  @Expose()
  role: string;

  @Expose()
  isVerified: boolean;

  constructor(partial: Partial<UserSerializer>) {
    Object.assign(this, partial);
  }
}
