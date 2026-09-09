FROM python:3.12-slim

RUN useradd --create-home --shell /usr/sbin/nologin runner

WORKDIR /runtime

COPY runner.py /runner.py

RUN chown runner:runner /runner.py

USER runner

ENTRYPOINT ["python", "/runner.py"]