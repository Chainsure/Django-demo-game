#! /usr/bin/env python3

import glob
import sys
sys.path.insert(0, glob.glob('../../')[0])

from match_server.match_service import Match

from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol
from thrift.server import TServer

from queue import Queue
from time import sleep

from threading import Thread
from acapp.asgi import channel_layer
from asgiref.sync import async_to_sync
from django.core.cache import cache


queue = Queue() # a thread safe queue to save player info from client and let pool take player from it to match
class Player: ## the player class
    def __init__(self, score, uuid, username, photo, channel_name):
        self.score = score
        self.uuid = uuid
        self.username = username
        self.photo = photo
        self.channel_name = channel_name
        self.waiting_time = 0 # 等待时间

class Pool: ## the pool to accommodate players to be matched
    def __init__(self):
        self.players = []

    def add_player(self, player):
        self.players.append(player)
        print("Add player %d %s" % (player.score, player.username))

    def check_match(self, p1, p2): ## check if 2 players can match, the match threshold is increasing by 50/s
        dt = abs(p1.score - p2.score)
        p1_max_dif = p1.waiting_time * 50
        p2_max_dif = p2.waiting_time * 50
        return dt <= p1_max_dif and dt <= p2_max_dif
    
    def match_success(self, ps):
        print("Match success: %s %s %s" % (ps[0].username, ps[1].username, ps[2].username))
        players = []
        room_name = "room-%s-%s-%s" % (ps[0].uuid, ps[1].uuid, ps[2].uuid) 
        for p in ps: ## fill the players with the 3 matched players, add the room name into the channel of each player
            async_to_sync(channel_layer.group_add)(room_name, p.channel_name)
            players.append({
                "uuid": p.uuid,
                "username": p.username,
                "photo": p.photo,
                "hp": 100,
            })
        cache.set(room_name, players, 3600) ## record the room info and players with redis
        for p in ps: ## broadcast the info of each player to others in the same room to create player
            async_to_sync(channel_layer.group_send)(
                room_name,
                {
                    'type': 'group_send_event',
                    'event': 'create player',
                    'uuid': p.uuid,
                    'username': p.username,
                    'photo': p.photo,
                }
            )

    def match(self): ## check which 3 players can be matched and match them
        while len(self.players) >= 3:
            self.players = sorted(self.players, key = lambda p: p.score)
            flag = False
            for i in range(len(self.players) - 2):
                a, b, c = self.players[i], self.players[i + 1], self.players[i + 2]
                if self.check_match(a, b) and self.check_match(a, c) and self.check_match(b, c):
                    self.players = self.players[:i] + self.players[i+3:]
                    self.match_success([a, b, c])
                    flag = True
                    break
            if not flag:
                break
        self.increase_waiting_time()

    def increase_waiting_time(self): ## increase waiting time of each player in th pool
        for player in self.players:
            player.waiting_time += 1

class MatchHandler: ## receive the info of player from client
    def add_player(self, score, uuid, username, photo, channel_name):
        player = Player(score, uuid, username, photo, channel_name)
        queue.put(player)
        return 0

def get_player_from_queue():
    try:
        return queue.get_nowait() ## if the queue is not empty, get the item right now; if the queue is empty, throw an empty exception
    except:
        return None

def worker(): ## a thread used to take player from queue and put it in match pool to match
    pool = Pool()
    while(True):
        player = get_player_from_queue()
        ## if the queue is not empty, take player from the queue; or start matching and sleep
        if player:
            pool.add_player(player)
        else:
            pool.match()
            sleep(1) ## after each match, the thread will sleep 1s


if __name__ == '__main__':
    handler = MatchHandler()
    processor = Match.Processor(handler)
    transport = TSocket.TServerSocket(host='127.0.0.1', port=9090)
    tfactory = TTransport.TBufferedTransportFactory()
    pfactory = TBinaryProtocol.TBinaryProtocolFactory()

    server = TServer.TThreadedServer(
        processor, transport, tfactory, pfactory)

    Thread(target = worker, daemon = True).start()

    print('Starting the server...')
    server.serve()
    print('done.')
