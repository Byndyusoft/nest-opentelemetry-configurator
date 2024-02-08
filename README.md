# nest-opentelemetry-configurator

Opentelemetry tracing module for Nest.js services

## Prerequisites

Make sure you have installed all of the following prerequisites on your development machine:

- [Git](https://git-scm.com)
- [Node.js](https://nodejs.org) (version 16 LTS or higher)
- [Yarn](https://yarnpkg.com) package manager

## Code conventions

Some code conventions are enforced automatically by ESLint + Prettier + markdownlint + husky + lint-staged stack.

## Service development lifecycle

- Implement business logic
- Add or adapt unit-tests (prefer before and simultaneously with coding)
- Add or change the documentation as needed
- Open pull request in the correct branch. Target the project's `master` branch

## Usage

1. Import module in `main.ts`

   ```typescript
   import { OpenTelemetryConfigurator } from "@byndyusoft/opentelemetry-configurator";
   ```

2. Call setup method before creating app with options

   IMPORTANT! Setup method has to be called before importing http module. This means that there should be no `http` module import in the `main.ts`

   ```typescript
   async function bootstrap(): Promise<void> {
     await OpenTelemetryConfigurator.setup({
       serviceName: "service name",
       exporterUrl: "http://jaeger_host:4318/v1/traces",
       ignoreUrls: ["_healthz", "_readiness", "metrics", "engine-rest/external-task/fetchAndLock"], // Optional. Default values
     });

     const app = (await NestFactory.create)<NestExpressApplication>(await AppModule.register(), {
       bufferLogs: true,
     });
     //  ...
   }
   ```

3. Add `TracingInterceptor` for controllers.

   By default `TracingInterceptor` set span name from route of controller method.
   If you need to change the span name use a decorator `SpanName`

   ```typescript
   import { SpanName, TracingInterceptor } from "@byndyusoft/nest-opentelemetry-configurator";

   @UseInterceptors(TracingInterceptor)
   export class AppController {
     // Span name is /returns/{returnId}
     @Get("/returns/:returnId")
     public async get(/*...*/) {
       //....
     }

     // Span name is customName
     @SpanName("customName")
     @Post("/returns/:returnId")
     public async update(/*...*/) {
       //....
     }
   }
   ```
