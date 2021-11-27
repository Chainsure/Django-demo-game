from django.http import JsonResponse
from django.core.cache import cache
from django.contrib.auth.models import User
from game.models.player.player import Player
import requests
from random import randint

def receive_code(request):
    data = request.GET;
    if "errcode" in data:
        return JsonResponse({
            "result": "apply failed",
            "errcode": data["errcode"],
            "errmsg": data["errmsg"],
        })
    code = data.get('code')
    state = data.get('state')
    if not cache.has_key(state):
        return JsonResponse({
            "result": "state not exists",
        })
    cache.delete(state)
    apply_token_url = "https://www.acwing.com/third_party/api/oauth2/access_token/"
    apply_token_params = {
            'appid': '198',
            'secret': 'b975e443b6314e0486ec2ea094e6287e',
            'code': code
        }
    access_token_params = requests.get(apply_token_url, params = apply_token_params).json()
    access_token = access_token_params['access_token']
    openid = access_token_params['openid']
    players = Player.objects.filter(openid=openid) 
    if players.exists():
        player = players[0]
        return JsonResponse({
            'result': 'success',
            'username': player.username,
            'photo': player.photo,
        })
    getinfo_url = "https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    getinfo_params = {
            'access_token': access_token,
            'openid': openid
        }
    user_info = requests.get(getinfo_url, params=getinfo_params).json()
    username = user_info['username']
    photo = user_info['photo']
    while User.objects.filter(username=username).exists():
        username += str(randint(0, 9))
    user = User.objects.create(username=username)
    player = Player.objects.create(user=user, photo = photo)

    return JsonResponse({
        'result': 'success',
        'username': player.user.username,
        'photo': player.photo,
    })
