class AcGameplayground{
    constructor(root){
        this.root = root;
        this.$playground = $('<div class="ac-game-playground"></div>');
        this.root.$ac_game.append(this.$playground);
        this.hide();
        //this.start();
    }

    get_random_color(){
        let colors = ['blue', 'green', 'grey', 'pink', 'red', 'yellow', 'purple'];
        let idx = Math.floor(Math.random() * colors.length);
        return colors[idx];
    }
    start(){
        let outer = this;
        $(window).resize(function(){
            outer.resize();
        });
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

    show(){ //open playground interface
        this.start();
        this.$playground.show();
        this.resize();
        //this.width = this.$playground.width();
        //this.height = this.$playground.height();
        //this.root.$ac_game.append(this.$playground);
        this.game_map = new GameMap(this);
        this.players = [];
        // GamePlayer(playground, x, y, radius, speed, color, is_me)
        this.players.push(new GamePlayer(this, this.width / 2 / this.scale, 0.5, 0.05, 0.15, "white", true));
        for(let i = 0; i < 10; ++i){
            this.players.push(new GamePlayer(this, this.width / 2 / this.scale, 0.5, 0.05, 0.15, this.get_random_color(), false));
        }
        console.log(this.players.length);
    }

    hide(){ //hide playground interface
        this.$playground.hide();
    }
}
