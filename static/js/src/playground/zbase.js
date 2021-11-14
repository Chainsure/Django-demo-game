class AcGameplayground{
    constructor(root){
        this.root = root;
        this.$playground = $('<div class="ac-game-playground"></div>');
        this.hide();
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

    }

    hide(){ //hide playground interface
        this.$playground.hide();
    }
}
