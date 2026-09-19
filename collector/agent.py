"""Read-only host collector. Run directly on the monitored Linux host for host metrics."""
import json, os, socket, time, urllib.request, urllib.error
import psutil
URL = os.environ['CLOUDPILOT_URL'].rstrip('/') + '/api/ingest'
TOKEN = os.environ['INGEST_TOKEN']
RESOURCE_ID = os.getenv('RESOURCE_ID', socket.gethostname())
HEALTH_URL = os.environ['HEALTH_URL']
INTERVAL = max(10, int(os.getenv('INTERVAL_SECONDS', '30')))
def sample():
    cpu = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory().percent
    start = time.monotonic()
    try:
        with urllib.request.urlopen(HEALTH_URL, timeout=10) as response:
            response.read(1024)
        latency = round((time.monotonic() - start) * 1000, 2)
    except (urllib.error.URLError, TimeoutError):
        latency = 10000  # failed health probe: deliberately exceeds the threshold
    return {'id': RESOURCE_ID, 'name': os.getenv('RESOURCE_NAME', RESOURCE_ID),
            'kind': 'Linux host', 'region': os.getenv('REGION', 'local'),
            'cpu': cpu, 'memory': memory, 'latency': latency,
            'cost': float(os.getenv('MONTHLY_COST_USD', '0'))}
if __name__ == '__main__':
    while True:
        try:
            body = json.dumps(sample()).encode()
            request = urllib.request.Request(URL, data=body, headers={
                'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN})
            with urllib.request.urlopen(request, timeout=15) as response:
                print('Telemetry accepted:', response.status, flush=True)
        except Exception as error:
            print('Collection failed:', type(error).__name__, flush=True)
        time.sleep(INTERVAL)
