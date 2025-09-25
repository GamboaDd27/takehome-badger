import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TaskConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.task_id = self.scope["url_route"]["kwargs"]["task_id"]
        self.group_name = f"task_{self.task_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def task_update(self, event):
        await self.send(text_data=json.dumps({
            "status": event["status"],
            "task_id": event["task_id"],
            "result": event.get("result"),
        }))

class ResultsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print(">>> CONNECT attempt", self.scope["path"])

        self.group_name = "results"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def task_update(self, event):
        await self.send(text_data=json.dumps({
            "status": event["status"],
            "task_id": event["task_id"],
            "result": event.get("result"),
        }))
