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
                    退出
                </div>
            </div>
        </div>
        `);
        this.$menu.hide();
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
            outer.root.playground.show("single mode");
        })

        this.$multi_mode.click(function(){
            outer.hide();
            outer.root.playground.show("multi mode")
        })

        this.$settings.click(function(){
            outer.root.settings.logout_on_remote();
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
        // this.destroyed = false;
        this.timedelta = 0;
        this.uuid = this.create_uuid();
    }

    create_uuid(){
        let res = "";
        for(let i = 0; i < 10; ++i){
            let x = Math.floor(Math.random() * 10);
            res += x;
        }
        return res;
    }

    start(){ // call start when constructed
    }

    update(){ // call update every frame
    }

    late_update(){ // call late update at the end of each frame
    }

    on_destroy(){ //call before destroy
    }

    destroy() { // destroy the object
        this.on_destroy();
        for(let i = 0; i < AC_GAME_OBJECTS.length; ++i)
        {
            if(AC_GAME_OBJECTS[i] === this)
            {
                // AC_GAME_OBJECTS[i].destroyed = true;
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }

}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp){
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

    for(let i = 0; i < AC_GAME_OBJECTS.length; ++i)
    {
        AC_GAME_OBJECTS[i].late_update();
    }
    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}
requestAnimationFrame(AC_GAME_ANIMATION);

class ChatField{
    constructor(playground){
        this.playground = playground;
        this.$history = $('<div class="ac-game-chat-field-history">[Chat Field]</div>')
        this.$input = $('<input type="text" class="ac-game-chat-field-input">');
        this.func_id = null;

        this.$history.hide();
        this.$input.hide();

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start(){
        this.add_listening_event();
    }

    add_listening_event(){
        let outer = this;
        this.$input.keydown(function(e) {
            if(e.which === 27){
                outer.hide_input();
                return false;
            }
            else if(e.which === 13){
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if(text){
                    outer.$input.val('');
                    outer.add_message(username, text);
                    outer.playground.mps.send_message(text);
                }
                return false;
            }
        });
    }

    show_history(){
        let outer = this;
        this.$history.fadeIn();

        if(this.func_id) clearTimeout(this.func_id);
        this.func_id = setTimeout(function(){
            outer.$history.fadeOut();
            outer.func_id = null;
        }, 3000)
    }

    render_message(message){
        return $(`<div>${message}</div>`);
    }

    add_message(username, text){
        this.show_history();
        let message = `[${username}]${text}`;
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_input(){
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input(){
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }

}
class GameMap extends GameObjects{
    constructor(playground)
    {
        super();
        this.playground = playground;
        this.$canvas = $("<canvas tabindex=0></canvas>");
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start(){
        this.$canvas.focus();
    }

    update(){
        this.render();
    }

    resize(){
        this.ctx.canvas.height = this.playground.height;
        this.ctx.canvas.width = this.playground.width;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    render()
    {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

}
class NoticeBoard extends GameObjects{
    constructor(playground){
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "";
    }

    start(){
    }

    update(){
        this.render();
    }

    writeText(text){
        this.text = text;
    }

    render(){
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
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
        this.eps = 0.01;
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
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
            /*if(outer.destroyed){
                return false;
            }*/
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
            /*if(outer.destroyed){
                return true;
            }*/

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
        this.update_win();
        this.update_move();
        this.render();
    }

    update_win()
    {
        if(this.playground.state === "fighting" && this.role === "me" && this.playground.players.length === 1)
        {
            this.playground.state = "over";
            this.playground.score_board.win();
        }
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
            // this.playground.state = "over";
            // this.playground.notice_board.writeText("游戏结束");
            if(this.playground.state === "fighting")
            {
                this.playground.state = "over";
                this.playground.score_board.lose();
            }
        }
        for(let i = 0; i < this.playground.players.length; ++i){
            if(this.playground.players[i] === this){
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
class ScoreBoard extends GameObjects{
    constructor(playground)
    {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.state = null;

        this.win_image = new Image();
        this.win_image.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_8f58341a5e-win.png";

        this.lose_image = new Image();
        this.lose_image.src = "https://cdn.acwing.com/media/article/image/2021/12/17/1_9254b5f95e-lose.png";
    }

    start()
    {
    }

    add_listening_events()
    {
        let outer = this;
        let $canvas = this.playground.game_map.$canvas;
        ($canvas).on('click', function() {
            outer.playground.hide();
            outer.playground.root.menu.show();
        });
    }

    win()
    {
        this.state = "win";

        let outer = this;
        setTimeout(function() {
            outer.add_listening_events();
        }, 1000);
    }

    lose()
    {
        this.state = "lose";
        let outer = this;
        setTimeout(function() {
            outer.add_listening_events();
        }, 1000);
    }

    late_update()
    {
        this.render();
    }

    render() {
        let len = this.playground.height / 2;
        let upper_left_x = this.playground.width / 2 - len / 2;
        let upper_left_y = this.playground.height / 2 - len / 2;
        if(this.state === "win") {
            this.ctx.drawImage(this.win_image, upper_left_x, upper_left_y, len, len);
        }
        else if(this.state === "lose") {
            this.ctx.drawImage(this.lose_image, upper_left_x, upper_left_y, len, len);
        }
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
        this.eps = 0.01;
    }

    start() {}

    update() {
        if(this.move_length < this.eps)
        {
            this.destroy();
            return false;
        }
        this.update_move();
        if(this.player.role !== "enemy"){
            this.update_attack();
        }
        this.render();
    }

    update_move(){
        let move_d = Math.min(this.move_length, this.speed * this.timedelta / 1000);
        this.x += this.vx * move_d;
        this.y += this.vy * move_d;
        this.move_length -= move_d;
    }

    update_attack(){
        let players = this.playground.players;
        for(let i = 0; i < players.length; ++i){
            if(players[i] !== this.player && this.is_collision(players[i])){
                this.attack(players[i]);
                break;
            }
        }
    }

    attack(player){
        let angle = Math.atan2(player.y - this.y, player.x - this.x);
        player.is_attacked(angle, this.damage);
        if(this.playground.mode === "multi mode"){
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, this.damage, this.uuid);
        }
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

    on_destroy(){
        for(let i = 0; i < this.player.fireballs.length; ++i){
            if(this.player.fireballs[i] === this){
                this.player.fireballs.splice(i, 1);
                break;
            }
        }
    }
}
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
class AcGameplayground{
    constructor(root){
        this.root = root;
        this.$playground = $('<div class="ac-game-playground"></div>');
        this.root.$ac_game.append(this.$playground);
        this.hide();
        this.start();
    }

    get_random_color(){
        let colors = ['blue', 'green', 'grey', 'pink', 'red', 'yellow', 'purple'];
        let idx = Math.floor(Math.random() * colors.length);
        return colors[idx];
    }

    create_uuid(){
        let res = '';
        for(let i = 0; i < 10; ++i){
            let x = Math.floor(Math.random() * 10);
            res += x;
        }
        return res;
    }

    start(){
        let outer = this;
        let uuid = this.create_uuid();
        $(window).on(`resize.${uuid}`,function(){
            outer.resize();
        });
        if(this.root.AcwingOS){
            this.root.AcwingOS.api.window.on_close(function(){
                $(window).off(`resize.${uuid}`);
            })
        }
    }

    resize(){
        let height = this.$playground.height();
        let width = this.$playground.width();
        let unit = Math.min(height / 1080, width / 1920);
        this.height = unit * 1080;
        this.width = unit * 1920;
        this.scale = this.height;
        if(this.game_map){
            this.game_map.resize();
        }
    }

    show(mode){ //open playground interface
        let outer = this;
        // this.start();
        this.$playground.show();
        // this.width = this.$playground.width();
        // this.height = this.$playground.height();
        //this.root.$ac_game.append(this.$playground);
        this.game_map = new GameMap(this);
        this.state = "waiting";
        this.notice_board = new NoticeBoard(this);
        this.notice_board.writeText("已就绪: 0人");
        this.score_board = new ScoreBoard(this);
        this.playercount = 0;
        this.resize();
        this.players = [];
        this.mode = mode;
        // GamePlayer(playground, x, y, radius, speed, color, is_me)
        this.players.push(new GamePlayer(this, this.width / 2 / this.scale, 0.5, 0.05, 0.15, "white", "me", this.root.settings.username, this.root.settings.photo));
        if(mode === "single mode"){
            for(let i = 0; i < 2; ++i){
                this.players.push(new GamePlayer(this, this.width / 2 / this.scale, 0.5, 0.05, 0.15, this.get_random_color(), "robot"));
            }
        }
        else if(mode === "multi mode"){
            let outer = this;
            this.chat_field = new ChatField(this);
            this.mps = new MultiPlayerSocket(this);
            this.mps.uuid = this.players[0].uuid;

            this.mps.ws.onopen = function(){
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            }
        }
    }

    hide(){ //hide playground interface
        while(this.players && this.players.length > 0)
        {
            this.players[0].destroy();
        }

        if(this.game_map)
        {
            this.game_map.destroy();
            this.game_map = null;
        }

        if(this.notice_board)
        {
            this.notice_board.destroy();
            this.notice_board = null;
        }

        if(this.score_board)
        {
            this.score_board.destroy();
            this.score_board = null;
        }

        this.$playground.empty();
        this.$playground.hide();
    }
}
class Settings{
    constructor(root){
        this.root = root;
        this.platform = "WEB";
        if(this.root.AcwingOS){
            this.platform = "ACAPP";
        }

        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src= "https://cdn.acwing.com/media/article/image/2021/11/18/1_ea3d5e7448-logo64x64_2.png">
            <div>
                Acwing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src= "https://cdn.acwing.com/media/article/image/2021/11/18/1_ea3d5e7448-logo64x64_2.png">
            <div>
                Acwing一键登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");
        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");
        this.$register.hide();

        this.$acwing_login = this.$settings.find(".ac-game-settings-acwing img");
        this.root.$ac_game.append(this.$settings);
        this.start();
    }

    start(){
        if(this.platform === "ACAPP"){
            this.getinfo_acapp();
        }
        else{
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    add_listening_events(){
        let outer = this;
        this.add_listening_events_login();
        this.add_listening_events_register();

        this.$acwing_login.click(function(){
            outer.acwing_login();
        });
    }

    add_listening_events_login(){
        let outer = this;
        this.$login_register.click(function(){
            outer.register();
        });
        this.$login_submit.click(function(){
            outer.login_on_remote();
        });
    }

    add_listening_events_register(){
        let outer = this;
        this.$register_login.click(function(){
            outer.login();
        });
        this.$register_submit.click(function(){
            outer.register_on_remote();
        })
    }

    acwing_login(){
        $.ajax({
            url: "https://app198.acapp.acwing.com.cn/settings/acwing/web/apply_code/",
            type: 'GET',
            success: function(resp){
                // console.log(resp);
                if(resp.result == "success"){
                    window.location.replace(resp.apply_code_url);
                }
            },
        });
    }

    login_on_remote(){
        let outer = this;

        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();
        $.ajax({
            url: "https://app198.acapp.acwing.com.cn/settings/login/",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp){
                if(resp.result === "success"){
                    location.reload();
                }
                else{
                    outer.$login_error_message.html(resp.result);
                }
            },
        });
    }

    logout_on_remote(){
        let outer = this;
        if(this.platform === "ACAPP"){
            this.root.AcwingOS.api.window.close();
        }
        else{
            $.ajax({
                url:"https://app198.acapp.acwing.com.cn/settings/logout/",
                type: "GET",
                success: function(resp) {
                    if(resp.result === "success"){
                        location.reload();
                    }
                },
            });
        }
    }

    register_on_remote(){
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let confirm_password = this.$register_password_confirm.val();
        $.ajax({
            url:"https://app198.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                confirm_password: confirm_password,
            },
            success: function(resp) {
                // console.log(resp);
                if(resp.result === 'success'){
                    location.reload();
                }
                else{
                    outer.$register_error_message.html(resp.error);
                }
            },
        });
    }

    register(){
        this.$login.hide();
        this.$register.show();
    }

    login(){
        this.$register.hide();
        this.$login.show();
    }

    acapp_login(appid, redirect_uri, scope, state){
        let outer = this;
        this.root.AcwingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp){
            // console.log(resp);
            if(resp.result === "success"){
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    getinfo_acapp() {
        let outer = this;
        $.ajax({
            url: "https://app198.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/",
            type: "GET",
            success: function(resp){
                if(resp.result === "success"){
                    // console.log(resp.appid);
                    // console.log(resp.redirect_uri);
                    // console.log(resp.scope);
                    // console.log(resp.state);
                    outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
                }
            },
        });
    }

    getinfo_web(){
        let outer = this;

        $.ajax({
            url:"https://app198.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                // console.log(resp);
                if(resp.result === "success"){
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                }
                else{
                    outer.login();
                }
            }
        });
    }

    hide(){
        this.$settings.hide();
    }

    show(){
        this.$settings.show();
    }
}
export class AcGame{
    constructor(id, AcwingOS){
        this.id = id;
        this.$ac_game = $('#' + id);
        this.AcwingOS = AcwingOS;

        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGameplayground(this);

        this.start();
    }

    start(){
    }
}
