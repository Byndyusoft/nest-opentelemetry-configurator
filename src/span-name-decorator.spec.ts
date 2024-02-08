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

/* eslint-disable @typescript-eslint/no-empty-function */

import { Reflector } from "@nestjs/core";

import { SpanName } from "./span-name.decorator";

class TestClass {
  @SpanName("testSpan")
  public someMethod(): void {}
}

describe("SpanName decorator", () => {
  it("define span name metadata for a method", () => {
    const reflector = new Reflector();
    const metadata = reflector.get<string>(
      SpanName.name,
      TestClass.prototype.someMethod,
    );

    expect(metadata).toBe("testSpan");
  });
});
