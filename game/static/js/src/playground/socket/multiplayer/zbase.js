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
            else if(event === "move to"){
                outer.receive_move_to(uuid, data.tx, data.ty);
            }
            else if(event === "shoot fireball"){
                outer.receive_shoot_fireball(uuid, data.ball_uuid, data.tx, data.ty);
            }
            else if(event === "attack"){
                outer.receive_attack(data.attackee_uuid, uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            }
            else if(event === "blink"){
                outer.receive_blink(uuid, data.tx, data.ty);
            }
            else if(event === "message"){
                outer.receive_message(uuid, data.text);
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
    }

    send_move_to(tx, ty){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "move to",
            "uuid": outer.uuid,
            "tx": tx,
            "ty": ty,
        }))
    }

    receive_move_to(uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player){
            player.move_to(tx, ty);
        }
    }

    send_shoot_fireball(ball_uuid, tx, ty){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "shoot fireball",
            "uuid": outer.uuid,
            "ball_uuid": ball_uuid,
            "tx": tx,
            "ty": ty,
        }))
    }

    receive_shoot_fireball(uuid, ball_uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player){
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid;
        }
    }

    send_attack(attackee_uuid, x, y, angle, damage, ball_uuid){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "attack",
            "attacker_uuid": outer.uuid,
            "attackee_uuid": attackee_uuid,
            "x": x,
            "y": y,
            "angle": angle,
            "damage": damage,
            "ball_uuid": ball_uuid,
        }));
    }

    receive_attack(attackee_uuid, attacker_uuid, x, y, angle, damage, ball_uuid){
        let attacker = this.get_player(attacker_uuid);
        let attackee = this.get_player(attackee_uuid);
        if(attacker && attackee){
            attacker.destroy_fireball(ball_uuid);
            attackee.receive_attack(x, y, angle, damage, attacker, ball_uuid);
        }
    }

    send_blink(tx, ty){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "blink",
            "uuid": outer.uuid,
            "tx": tx,
            "ty": ty,
        }));
    }

    receive_blink(uuid, tx, ty){
        let player = this.get_player(uuid);
        if(player){
            player.blink(tx, ty);
        }
    }

    send_message(text){
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "message",
            "uuid": outer.uuid,
            "text": text,
        }));
    }

    receive_message(uuid, text){
        let player = this.get_player(uuid);
        if(player){
            console.log("receive message");
            player.playground.chat_field.add_message(player.username, text);
        }
    }

    get_player(uuid){
        let players = this.playground.players;
        for(let i = 0; i < players.length; ++i){
            if(players[i].uuid === uuid){
                return players[i];
            }
        }
        return null;
    }
}
