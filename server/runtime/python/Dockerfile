FROM python:3.12-slim

RUN useradd --create-home --shell /usr/sbin/nologin runner

WORKDIR /runtime

COPY runner.py /runner.py

RUN chown runner:runner /runner.py

USER runner

# No ENTRYPOINT here deliberately: docker-worker.ts already builds the
# full command (ExecutionRuntime.command + the source as the final
# argument) and passes it as the `docker run <image> <command...>`
# invocation. An ENTRYPOINT would get those args appended onto it rather
# than replaced by them, so "python /runner.py <source>" would actually
# run as "python /runner.py python /runner.py <source>" — which is
# exactly what produced the "runner: expected source code argument"
# error (see Decision 053). No CMD either: a runtime image with no
# default command is required to run at all, which is intentional here.