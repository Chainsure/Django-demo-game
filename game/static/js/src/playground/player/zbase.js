class GamePlayer extends GameObjects{
    constructor(playground, x, y, radius, speed, color, role, username, photo)
    {
        console.log(role, username, photo);
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

        if(this.role !== "robot"){
            this.img = new Image();
            //this.img.src = this.playground.root.settings.photo;
            this.img.src = this.photo;
        }
    }

    start(){
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
            let scale = outer.playground.scale
            if(outer.destroyed){
                return false;
            }
            const rect = outer.ctx.canvas.getBoundingClientRect();
            if(e.which === 3) {
                outer.move_to((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
            }
            else if(e.which === 1){
                if(outer.cur_skill === "fireball"){
                    outer.shoot_fireball((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
                }
                outer.cur_skill = null;
            }
        })

        $(window).keydown(function(e){
            if(outer.destroyed){
                return false;
            }
            if(e.which === 81){
                outer.cur_skill = "fireball";
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
        new FireBall(this.playground, this, this.x, this.y, radius, vx, vy, "orange", speed, move_length, 0.01);
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
        this.update_move();
        this.render();
    };

    update_move(){
        this.timespan += this.timedelta / 1000;
        if(!this.role === "robot" && this.timespan > 4 && Math.random() < 1 / 180.0){
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
    }
}
