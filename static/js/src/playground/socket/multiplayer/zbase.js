class MultiPlayerSocket{
    constructor(playground){
        this.playground = playground;
        this.ws = new WebSocket("wss://app198.acapp.acwing.com.cn/wss/multiplayer/");

        this.start();
    }

    start(){
        this.receive();
    }

    receive() {
        let outer = this;
        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            if(uuid === outer.uuid) return false;

            let event = data.event;
            if(event === "create player"){
                outer.receive_create_player(uuid, data.username, data.photo);
            }
        };
    }
    send_create_player(username, photo){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "create player",
            "uuid": outer.uuid,
            'username': username,
            'photo': photo,
        }));
    }

    receive_create_player(uuid, username, photo){
        let player = new GamePlayer(this.playground, this.playground.width / 2 / this.playground.scale, 0.5, 0.05, 0.15, "white", "enemy", username, photo);
        player.uuid = uuid;
        this.playground.players.push(player);
        console.log(this.playground.players.length);
    }
}
