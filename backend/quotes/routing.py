from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/tasks/(?P<task_id>[0-9a-f-]+)/$", consumers.TaskConsumer.as_asgi()),
    re_path(r"^ws/results/$", consumers.ResultsConsumer.as_asgi()),
]
