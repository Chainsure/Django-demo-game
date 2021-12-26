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
