FROM python:3.12-slim
WORKDIR /agent
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd -u 10001 -m collector
COPY agent.py .
USER 10001
CMD ["python", "-u", "agent.py"]
