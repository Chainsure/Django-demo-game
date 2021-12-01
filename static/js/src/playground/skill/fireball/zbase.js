class FireBall extends GameObjects{
    constructor(playground, player, x, y, radius, vx, vy, color, speed, move_length, damage)
    {
        super();
        this.playground = playground;
        this.player = player;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.ctx = this.playground.game_map.ctx;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;
        this.eps = 0.01;
    }

    start() {}

    update() {
        if(this.move_length < this.eps)
        {
            this.destroy();
            return false;
        }
        let move_d = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * move_d;
        this.y += this.vy * move_d;
        this.move_length -= move_d;
        let players = this.playground.players;
        for(let i = 0; i < players.length; ++i){
            if(players[i] !== this.player && this.is_collision(players[i]))
                this.attack(players[i]);
        }
        this.render();
    }

    attack(player){
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage);
        this.destroy();
    }
    is_collision(player){
       let dist = this.get_dist(player.x, player.y, this.x, this.y);
       return dist < this.radius + player.radius;
    }


    get_dist(x1, y1, x2, y2){
        let dx = x1 - x2, dy = y1 - y2;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
