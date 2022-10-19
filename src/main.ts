import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig, swaggerOption } from './configs/swagger.cnf';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { MorganLogService } from './loggers/morgan.logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, swaggerOption);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const morganLog = new MorganLogService();
  app.use(morganLog.middleware());
  await app.listen(3000);
}
bootstrap();
