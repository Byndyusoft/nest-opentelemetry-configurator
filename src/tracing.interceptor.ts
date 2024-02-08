/*
 * Copyright 2024 Byndyusoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { PATH_METADATA } from "@nestjs/common/constants";
import { Reflector } from "@nestjs/core";
import { context, trace } from "@opentelemetry/api";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";

import { SpanName } from "./span-name.decorator";

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  public constructor(private reflector: Reflector) {}

  public intercept(executionContext: ExecutionContext, next: CallHandler): Observable<unknown> {
    let spanName = this.reflector.get<string>(SpanName.name, executionContext.getHandler());

    if (!spanName) {
      const pathMeta = this.reflector.get<string>(PATH_METADATA, executionContext.getHandler());
      spanName = pathMeta
        .split("/")
        .map((pathPart) => (pathPart.includes(":") ? `{${pathPart.replace(":", "")}}` : pathPart))
        .join("/");
    }

    const span = trace.getSpan(context.active());
    if (spanName) {
      span?.updateName(spanName);
    }

    const request = executionContext.switchToHttp().getRequest<Request>();

    span?.setAttributes({ "http.request.body": String(request.body) });

    return next.handle().pipe(
      tap((data) => {
        const response = executionContext.switchToHttp().getResponse<Response>();

        span?.setAttributes({
          "http.response.body": String(data),
          error: response.statusCode >= 500,
        });
      }),
    );
  }
}
