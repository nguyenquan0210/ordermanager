import { DocumentBuilder, SwaggerCustomOptions } from "@nestjs/swagger";

const swaggerConfig = new DocumentBuilder()
    .setTitle('Hifive API docs')
    .setDescription('The Hifive API description')
    .setExternalDoc('Postman Collection', '/api-docs-json')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

const swaggerOption: SwaggerCustomOptions = {
    customSiteTitle: 'Hifive API Docs',
}
export { swaggerConfig, swaggerOption }