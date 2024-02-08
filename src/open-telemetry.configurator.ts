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

import { RequestOptions } from "http";

import { trace } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { JaegerPropagator } from "@opentelemetry/propagator-jaeger";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { TracerShim } from "@opentelemetry/shim-opentracing";
import * as opentracing from "opentracing";

import { OpentelemetryConfigDto } from "./open-telemetry-config.dto";

export class OpenTelemetryConfigurator {
  public static setup(config: OpentelemetryConfigDto): void {
    const exporter = new OTLPTraceExporter({
      url: config.exporterUrl,
    });

    const otel = new NodeSDK({
      serviceName: config.serviceName,
      spanProcessor: new BatchSpanProcessor(exporter),
      contextManager: new AsyncLocalStorageContextManager(),
      textMapPropagator: new CompositePropagator({
        propagators: [
          new JaegerPropagator(),
          new W3CTraceContextPropagator(),
          new W3CBaggagePropagator(),
        ],
      }),
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook(request) {
            return config.ignoreUrls.some((x) => !!request.url?.includes(x));
          },
          ignoreOutgoingRequestHook(request: RequestOptions) {
            return config.ignoreUrls.some((x) => !!request.path?.includes(x));
          },
        }),
      ],
    });

    const tracer = trace.getTracer("default");
    opentracing.initGlobalTracer(new TracerShim(tracer));

    otel.start();
  }
}
