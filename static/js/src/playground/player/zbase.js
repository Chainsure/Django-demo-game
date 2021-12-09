class GamePlayer extends GameObjects{
    constructor(playground, x, y, radius, speed, color, role, username, photo)
    {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.damage_x = 0;
        this.damage_y = 0;
        this.damage_speed = 0;
        this.friction = 0.9;
        this.move_length = 0;
        this.radius = radius;
        this.speed = speed;
        this.color = color;
        this.role = role;
        this.eps = 0.01;
        this.timespan = 0;
        this.cur_skill = null;
        this.username = username;
        this.photo = photo;
        this.fireballs = [];

        if(this.role !== "robot"){
            this.img = new Image();
            this.img.src = this.photo;
        }

        if(this.role === "me"){
            if(this.playground.mode === "single mode"){
                this.origin_fireball_coldtime = 0.3;
                this.fireball_coldtime = this.origin_fireball_coldtime;
            }
            else if(this.playground.mode === "multi mode"){
                this.origin_fireball_coldtime = 1;
                this.fireball_coldtime = this.origin_fireball_coldtime;
            }
            this.blink_coldtime = 3;
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start(){
        this.playground.playercount++;
        this.playground.notice_board.writeText("已就绪: " + this.playground.playercount + "人" );
        if(this.playground.playercount >= 3){
            this.playground.notice_board.writeText("战斗中");
            this.playground.state = "fighting";
        }
        if(this.role === "me"){
            this.add_listening_events();
        }
        else if(this.role === "robot"){
            this.random_move();
        }
    }

    random_move(){
        let scale = this.playground.scale
        let tx = Math.random() * this.playground.width / scale, ty = Math.random() * this.playground.height / scale;
        this.move_to(tx, ty);
    }

    add_listening_events()
    {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function(){
            return false;
        })
        this.playground.game_map.$canvas.mousedown(function(e){
            if(outer.playground.state !== "fighting"){
                return true;
            }
            if(outer.destroyed){
                return false;
            }
            let scale = outer.playground.scale
            const rect = outer.ctx.canvas.getBoundingClientRect();
            if(e.which === 3) {
                let tx = (e.clientX - rect.left) / scale;
                let ty = (e.clientY - rect.top) / scale;
                outer.move_to(tx, ty);
                if(outer.playground.mode === "multi mode"){
                    outer.playground.mps.send_move_to(tx, ty);
                }
                outer.move_to((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
            }
            else if(e.which === 1){
                let tx = (e.clientX - rect.left) / scale;
                let ty = (e.clientY - rect.top) / scale;
                if(outer.cur_skill === "fireball"){
                    if(outer.fireball_coldtime > outer.eps){
                        return false;
                    }
                    let fireball = outer.shoot_fireball(tx, ty);
                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_shoot_fireball(fireball.uuid, tx, ty);
                    }
                }
                else if(outer.cur_skill === "blink"){
                    if(outer.blink_coldtime > outer.eps){
                        return false;
                    }
                    outer.blink(tx, ty);
                    if(outer.playground.mode === "multi mode"){
                        outer.playground.mps.send_blink(tx, ty);
                    }
                }
                outer.cur_skill = null;
            }
        })

        this.playground.game_map.$canvas.keydown(function(e){
            if(e.which === 13){
                if(outer.playground.mode === "multi mode"){
                    outer.playground.chat_field.show_input();
                    return false;
                }
            }
            else if(e.which === 27){
                if(outer.playground.mode === "multi mode"){
                    outer.playground.chat_field.hide();
                }
            }

            if(outer.playground.state !== "fighting"){
                return true;
            }
            if(outer.destroyed){
                return true;
            }

            if(e.which === 81){
                if(outer.fireball_coldtime > outer.eps){
                    return true;
                }
                outer.cur_skill = "fireball";
                return false;
            }
            else if(e.which === 70){
                if(outer.blink_coldtime > outer.eps){
                    return true;
                }
                outer.cur_skill = "blink";
                return false;
            }
        })
    }

    shoot_fireball(tx, ty){
        let x = this.x, y = this.y;
        let radius = 0.01;
        let angle = Math.atan2(ty - y, tx - x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let speed = 0.5;
        let move_length = 1;
        let fireball = new FireBall(this.playground, this, this.x, this.y, radius, vx, vy, "orange", speed, move_length, 0.01);
        this.fireballs.push(fireball);
        this.fireball_coldtime = this.origin_fireball_coldtime;
        return fireball;
    }

    destroy_fireball(uuid){
        for(let i = 0; i < this.fireballs.length; ++i){
            let fireball = this.fireballs[i];
            if(fireball.uuid === uuid){
                fireball.destroy();
                break;
            }
        }
    }

    blink(tx, ty){
        let d = this.get_dist(this.x, this.y, tx, ty);
        d = Math.min(d, 0.8);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let dx = d * Math.cos(angle);
        let dy = d * Math.sin(angle);
        this.x += dx;
        this.y += dy;
        this.blink_coldtime = 3;
        this.move_length = 0;
    }

    is_attacked(angle, damage){
        for(let i = 0; i < 20 + Math.random() * 10; ++i){
            let x = this.x, y = this.y;
            let angle = Math.random() * Math.PI * 2;
            let vx = Math.cos(angle), vy = Math.sin(angle);
            let radius = this.radius * 0.1 * Math.random();
            let speed = this.speed * 10;
            let color = this.color;
            let move_length = this.radius * Math.random() * 5;
            new particle(this.playground, x, y, vx, vy, radius, speed, color, move_length);
        }
        this.radius -= damage;
        if(this.radius < this.eps){
            this.destroy();
            return false;
        }
        this.damage_x = Math.cos(angle);
        this.damage_y = Math.sin(angle);
        this.damage_speed = damage * 100;
        this.speed *= 0.8
    }

    receive_attack(x, y, angle, damage, attacker, ball_uuid){
        this.x = x;
        this.y = y;
        this.is_attacked(angle, damage);
    }

    get_dist(x, y, tx, ty)
    {
        let dx = tx - x;
        let dy = ty - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty){
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    update(){
        this.timespan += this.timedelta / 1000;
        if(this.playground.state === "fighting" && this.role === "me"){
            this.update_coldtime();
        }
        this.update_move();
        this.render();
    }

    update_coldtime(){
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);
        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    update_move(){
        if(this.role === "robot" && this.timespan > 4 && Math.random() < 1 / 180.0){
            let select_player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            let tx = select_player.x + select_player.vx * select_player.speed * select_player.timedelta / 1000 * 0.3;
            let ty = select_player.y + select_player.vy * select_player.speed * select_player.timedelta / 1000 * 0.3;
            this.shoot_fireball(tx, ty);
        }
        if(this.damage_speed > this.eps){
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_x * this.damage_speed * this.timedelta / 1000;
            this.y += this.damage_y * this.damage_speed * this.timedelta / 1000;
            this.damage_speed *= this.friction;
        }
        else{
            if(this.move_length < this.eps)
            {
                this.move_length = 0;
                this.vx = 0;
                this.vy = 0;
                if(this.role === "robot"){
                    this.random_move();
                }
            }
            else
            {
                let move_d = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                this.x += this.vx * move_d;
                this.y += this.vy * move_d;
                this.move_length -= move_d;
            }
        }
    }

    render(){
        let scale = this.playground.scale;
        if(this.role !== "robot"){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        }
        else
        {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if(this.playground.state === "fighting" && this.role === "me"){
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime(){
        let scale = this.playground.scale;
        let x = 1.5, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.fireball_coldtime > 0){
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / this.origin_fireball_coldtime) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
        
        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if(this.blink_coldtime > 0){
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 3) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
    }

    on_destroy(){
        if(this.role === "me"){
            this.playground.state = "over";
            this.playground.notice_board.writeText("游戏结束");
        }
        for(let i = 0; i < this.playground.players.length; ++i){
            if(this.playground.players[i] === this){
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
