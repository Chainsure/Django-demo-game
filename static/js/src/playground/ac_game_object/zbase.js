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

