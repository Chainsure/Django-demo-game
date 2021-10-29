from django.http import HttpResponse

def index(request):
    line1 = '<h1 style="text-align: center">New world</h1>'
    line2 = '<img src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Finews.gtimg.com%2Fnewsapp_match%2F0%2F11978201640%2F0.jpg&refer=http%3A%2F%2Finews.gtimg.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1638082061&t=f776a856d6a7c2fe42562b01ddc89251" width=1250 height=750>'
    return HttpResponse(line1 + line2)

