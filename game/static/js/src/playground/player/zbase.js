class GamePlayer extends GameObjects{
    constructor(playground, x, y, radius, speed, color, is_me)
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
        this.is_me = is_me;
        this.eps = 0.1;
        this.timespan = 0;
        this.cur_skill = null;
    }

    start(){
        if(this.is_me){
            this.add_listening_events();
        }
        else{
            this.random_move();
        }
    }

    random_move(){
        let tx = Math.random() * this.playground.width, ty = Math.random() * this.playground.height;
        this.move_to(tx, ty);
    }

    add_listening_events()
    {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function(){
            return false;
        })
        this.playground.game_map.$canvas.mousedown(function(e){
            if(outer.destroyed){
                return false;
            }
            const rect = outer.ctx.canvas.getBoundingClientRect();
            if(e.which === 3) {
                outer.move_to(e.clientX - rect.left, e.clientY - rect.top);
            }
            else if(e.which === 1){
                if(outer.cur_skill === "fireball"){
                    outer.shoot_fireball(e.clientX - rect.left, e.clientY - rect.top);
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
        let radius = this.playground.height * 0.01;
        let angle = Math.atan2(ty - y, tx - x);
        let vx = Math.cos(angle), vy = Math.sin(angle);
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height;
        new FireBall(this.playground, this, this.x, this.y, radius, vx, vy, "orange", speed, move_length, this.playground.height * 0.01);
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
        if(this.radius < 10){
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
        this.timespan += this.timedelta / 1000;
        if(!this.is_me && this.timespan > 4 && Math.random() < 1 / 180.0){
            let select_player = this.playground.players[(Math.floor(Math.random() * this.playground.players.length) + 1) % this.playground.players.length];
            //let select_player = this.playground.players[0];
            let tx = select_player.x + this.vx * select_player.speed * this.timedelta / 1000 * 0.3;
            let ty = select_player.y + this.vy * select_player.speed * this.timedelta / 1000 * 0.3;
            this.shoot_fireball(tx, ty);
        }
        if(this.damage_speed > 10){
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
                if(!this.is_me){
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
        this.render();
    };

    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}