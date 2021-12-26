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
