import { SetMetadata } from '@nestjs/common';

export const AllowPublic = () => SetMetadata('allow-public', true);
