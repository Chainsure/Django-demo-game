from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache

from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from match_system.src.match_server.match_service import Match
from game.models.player.player import Player
from channels.db import database_sync_to_async

class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        if(self.room_name):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def create_player(self, data):
        self.room_name = None
        self.uuid = data['uuid']
        transport = TSocket.TSocket('localhost', 9090)

        def db_get_player():
            return Player.objects.get(user__username=data['username'])
        player = await database_sync_to_async(db_get_player)()

        # Buffering is critical. Raw sockets are very slow
        transport = TTransport.TBufferedTransport(transport)

        # Wrap in a protocol
        protocol = TBinaryProtocol.TBinaryProtocol(transport)

        # Create a client to use the protocol encoder
        client = Match.Client(protocol)

        # Connect!
        transport.open()

        client.add_player(player.score, data['uuid'], data['username'], data['photo'], self.channel_name)

        # Close!
        transport.close()

        ''' create player without match system
        self.room_name = None
        for i in range(1000): ## create a new room or find an available room to join
            room_name = "room-%d" % (i)
            if not cache.has_key(room_name) or len(cache.get(room_name)) < settings.ROOM_CAPACITY:
                self.room_name = room_name
                break
        if not self.room_name:
            return
        if not cache.has_key(self.room_name): ## create a new room if no available room
            cache.set(self.room_name, [], 3600) # expire in 1 hour

        for player in cache.get(self.room_name): ## send the info of every player in the room to the frontend of the new player to draw them
            await self.send(text_data=json.dumps({
                'event': "create player",
                'uuid': player['uuid'],
                'username': player['username'],
                'photo': player['photo'],
            }))

        await self.channel_layer.group_add(self.room_name, self.channel_name) ## add this room name as a group to support group send

        players = cache.get(self.room_name)
        players.append({
            'uuid': data['uuid'],
            'username': data['username'],
            'photo': data['photo']
        }) ## add this new player in the room

        cache.set(self.room_name, players, 3600) # expire in 1 hour
        await self.channel_layer.group_send( ## group send the info of this new player to every user in this room
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'create player',
                'uuid': data['uuid'],
                'username': data['username'],
                'photo': data['photo'],
            }
        )
        '''
    async def move_to(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'move to',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    async def shoot_fireball(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'shoot fireball',
                'uuid': data['uuid'],
                'ball_uuid': data['ball_uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )

    async def attack(self, data):
        if not self.room_name:
            return

        players = cache.get(self.room_name)
        if not players:
            return

        for player in players:
            if player['uuid'] == data['attackee_uuid']:
                player['hp'] -= 25

        remain_cnt = 0
        for player in players:
            if player['hp'] > 0:
                remain_cnt += 1

        if remain_cnt > 1:
            if self.room_name:
                cache.set(self.room_name, players, 3600)
        else:
            def db_update_player_score(username, score):
                player = Player.objects.get(user__username=username)
                player.score += score
                player.save()
            for player in players:
                if player['hp'] <= 0:
                    await database_sync_to_async(db_update_player_score)(player['username'], -5)
                else:
                    await database_sync_to_async(db_update_player_score)(player['username'], 10)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'attack',
                'uuid': data['attacker_uuid'],
                'attackee_uuid': data['attackee_uuid'],
                'x': data['x'],
                'y': data['y'],
                'angle': data['angle'],
                'damage': data['damage'],
                'ball_uuid': data['ball_uuid'],
            }
        )

    async def blink(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'group_send_event',
                'event': 'blink',
                'uuid': data['uuid'],
                'tx': data['tx'],
                'ty': data['ty'],
            }
        )
    async def message(self, data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': "group_send_event",
                'event': 'message',
                'uuid': data['uuid'],
                'text': data['text'],
            }
        )

    async def group_send_event(self, data): ## the function called when receiving group send
        if not self.room_name:
            keys = cache.keys("*%s*" % (self.uuid))
            if keys:
                self.room_name = keys[0]
        await self.send(text_data=json.dumps(data))

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data['event']
        if event == 'create player':
            await self.create_player(data)
        elif event == 'move to':
            await self.move_to(data)
        elif event == 'shoot fireball':
            await self.shoot_fireball(data)
        elif event == "attack":
            await self.attack(data)
        elif event == "blink":
            await self.blink(data)
        elif event == "message":
            await self.message(data)
