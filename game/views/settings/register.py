from django.http import JsonResponse
from django.contrib.auth import login
from django.contrib.auth.models import User
from game.models.player.player import Player

def register(request):
    data = request.GET;
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    confirm_password = data.get('confirm_password', '').strip()

    if not username or not password:
        return JsonResponse({
            "error": "用户名或密码不能为空"
        })
    if password != confirm_password:
        return JsonResponse({
            'error': "密码与确认密码不一致"
        })
    if User.objects.filter(username=username).exists():
        return JsonResponse({
            'error': '该用户名已存在'
        })
    user = User(username=username)
    user.set_password(password)
    user.save()
    Player.objects.create(user = user, photo="https://img2.baidu.com/it/u=3183181036,929941785&fm=26&fmt=auto")
    login(request, user)
    return JsonResponse({
        'result': "success"
    })

