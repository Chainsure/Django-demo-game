class AcGameplayground{
    constructor(root){
        this.root = root;
        this.$playground = $('<div>游戏界面</div>');
        this.hide();
        this.root.$ac_game.append(this.$playground);
        this.start();
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