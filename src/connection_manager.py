from fastapi import WebSocket
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, authority_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[authority_id] = websocket
        logger.info(f"Authority {authority_id} connected")

    def disconnect(self, authority_id: int):
        self.active_connections.pop(authority_id, None)
        logger.info(f"Authority {authority_id} disconnected")

    async def notify_authorities(self, authority_ids: list[int], data: dict):
        try:
            message = json.dumps(data)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to serialize notification data: {e}")
            return
        for authority_id in authority_ids:
            websocket = self.active_connections.get(authority_id)
            if websocket:
                try:
                    await websocket.send_text(message)
                except Exception:
                    logger.warning(f"Failed to send to authority {authority_id}, disconnecting")
                    self.disconnect(authority_id)

    async def broadcast(self, data: dict):
        try:
            message = json.dumps(data)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to serialize broadcast data: {e}")
            return
        for authority_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.send_text(message)
            except Exception:
                logger.warning(f"Failed to broadcast to authority {authority_id}, disconnecting")
                self.disconnect(authority_id)

manager = ConnectionManager()