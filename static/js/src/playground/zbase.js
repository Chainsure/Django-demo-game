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
    start(){
        let outer = this;
        $(window).resize(function(){
            outer.resize();
        });
    }

    resize(){
        console.log("resize");
        let height = this.$playground.height();
        let width = this.$playground.width();
        let unit = Math.min(height / 9, width / 16);
        this.height = unit * 9;
        this.width = unit * 16;
        this.scale = this.height;
        if(this.game_map){
            this.game_map.resize();
        }
    }

    show(){ //open playground interface
        this.$playground.show();
        this.resize();
        //this.width = this.$playground.width();
        //this.height = this.$playground.height();
        //this.root.$ac_game.append(this.$playground);
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new GamePlayer(this, this.width / 2, this.height / 2, this.height * 0.05, this.height * 0.15, "white", true));
        for(let i = 0; i < 10; ++i){
            this.players.push(new GamePlayer(this, this.width / 2, this.height / 2, this.height * 0.05, this.height * 0.15, this.get_random_color(), false));
        }

    }

    hide(){ //hide playground interface
        this.$playground.hide();
    }
}
