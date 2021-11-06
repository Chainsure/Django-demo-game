class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
        <div class="ac-game-menu">
            <div class="ac-game-menu-field">
                <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
                    单人模式
                </div>
                <br>
                <div class='ac-game-menu-field-item ac-game-menu-field-item-multi-mode'>
                    多人模式
                </div>
                <br>
                <div class='ac-game-menu-field-item ac-game-menu-field-item-settings'>
                    设置
                </div>
            </div>
        </div>
        `);
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');
        
        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show();
        })

        this.$multi_mode.click(function(){
            console.log("click multi mode");
        })

        this.$settings.click(function(){
            console.log("click settings");
        })
    }

    show(){
        this.$menu.show();
    }

    hide(){
        this.$menu.hide();
    }
}
let AC_GAME_OBJECTS = [];
class GameObjects{
    constructor(){
        AC_GAME_OBJECTS.push(this);
        this.has_called_start = false;
        this.destroyed = false;
        this.timedelta = 0;
    }

    start(){ // call start when constructed

    }

    update(){ // call update every frame
        
    }

    on_destroy(){ //call before destroy

    }
    destroy() { // destroy the object
        this.on_destroy();
        for(let i = 0; i < AC_GAME_OBJECTS.length; ++i)
        {
            if(AC_GAME_OBJECTS[i] === this)
            {
                AC_GAME_OBJECTS[i].destroyed = true;
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }

}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp){
    console.log(AC_GAME_OBJECTS.length);
    for(let i = 0; i < AC_GAME_OBJECTS.length; i++)
    {
        let obj = AC_GAME_OBJECTS[i];
        if(!obj.has_called_start)
        {
            obj.has_called_start = true;
            obj.start();
        }
        else
        {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }
    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}
requestAnimationFrame(AC_GAME_ANIMATION);

class GameMap extends GameObjects{
    constructor(playground)
    {
        super();
        this.playground = playground;
        this.$canvas = $("<canvas></canvas>");
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start(){}

    update(){
        this.render();
    }

    render()
    {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

}
class particle extends GameObjects{
    constructor(playground, x, y, vx, vy, radius, speed, color, move_length){
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.speed = speed;
        this.color = color;
        this.move_length = move_length;
        this.friction = 0.9;
        this.eps = 1;
    }

    start(){
    }

    update(){
        if(this.speed < this.eps || this.move_length < this.eps){
            this.destroy();
            return false;
        }
        let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += moved * this.vx;
        this.y += moved * this.vy;
        this.speed *= this.friction;
        this.move_length -= moved;
        this.render();
    }

    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
            if(e.which === 3) {
                outer.move_to(e.clientX, e.clientY);
            }
            else if(e.which === 1){
                if(outer.cur_skill === "fireball"){
                    outer.shoot_fireball(e.clientX, e.clientY);
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
        if(!this.is_me && this.timespan > 4 && Math.random() < 1 / 300.0){
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
        this.eps = 0.1;
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class AcGameplayground{
    constructor(root){
        this.root = root;
        this.$playground = $('<div class="ac-game-playground"></div>');
        //this.hide();
        this.root.$ac_game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.root.$ac_game.append(this.$playground);
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new GamePlayer(this, this.width / 2, this.height / 2, this.height * 0.05, this.height * 0.15, "white", true));
        for(let i = 0; i < 10; ++i){
            this.players.push(new GamePlayer(this, this.width / 2, this.height / 2, this.height * 0.05, this.height * 0.15, this.get_random_color(), false));
        }
        this.start();
    }

    get_random_color(){
        let colors = ['blue', 'green', 'grey', 'pink', 'red', 'yellow', 'purple'];
        let idx = Math.floor(Math.random() * colors.length);
        return colors[idx];
    }
    start(){

    }

    show(){ //open playground interface
        this.$playground.show();
    }

    hide(){ //hide playground interface
        this.$playground.hide();
    }
}
export class AcGame{
    constructor(id){
        this.id = id;
        this.$ac_game = $('#' + id);
        //this.menu = new AcGameMenu(this);
        this.playground = new AcGameplayground(this);

        this.start();
    }

    start(){
    }
}
