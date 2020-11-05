import {defuzzy, move_player, get_plane_position} from './fuzzy.js'

/*
    traduccion de coordenadas en pantalla a coordenadas en el plano cartesiano de la pantalla
*/

function get_delta_s() {
    const player_coords = document.getElementById("player").getBoundingClientRect()
    const ball_coords = document.getElementById("ball").getBoundingClientRect()
    // console.log("player -> top:", player_coords.top, "left:", player_coords.left)
    // console.log("ball -> top:", ball_coords.top, "left:", ball_coords.left)
    const a = ball_coords.top - player_coords.top
    const b = ball_coords.left - player_coords.left
    const distance = Math.sqrt((a*a) + (b*b)); // obtener la distancia del jugador a la pelota con teorema de pitagoras
    console.log("distancia entre jugador-pelota:", distance)
    return distance
}

function get_alpha(ball_coords, player_coords, player_initial_rotation) {
    player_initial_rotation = Math.abs(player_initial_rotation)
    // y coords => top, x coords => left
    let delta_y = ball_coords[1] - player_coords[1]
    let delta_x = ball_coords[0] - player_coords[0]
    delta_y = Math.abs(delta_y) > 50 ? delta_y : 0
    // theta = angulo que el jugador debe girar para ver a la pelota 
    let theta = Math.atan2(delta_y, delta_x)
    let turn_right_deg = 0
    let turn_left_deg = 0
    // arctan devuelve numeros negativos para 180-360 y positivos para 0-180, hay que traducirlos a grados 
    let theta_deg = theta < 0 ? (theta * (180/Math.PI) + (2*Math.PI)) : (theta * (180/Math.PI))
    console.log("delta_y", delta_y, "delta_x", delta_x, "theta", theta, "dheta d", theta_deg)

    // para ver cual es la mejor direccion a girar se prueba girando a la derecha y luego a la izquierda 
    // la direccion que de el menor angulo de rotacion es la mejor direccion a tomar
    turn_right_deg = player_initial_rotation >= theta_deg ? (player_initial_rotation - theta_deg) : (player_initial_rotation - (theta_deg - 360))
    turn_left_deg = theta_deg >= player_initial_rotation ? (theta_deg - player_initial_rotation) : (theta_deg - (player_initial_rotation - 360))
    console.log("get alpha angles left", turn_left_deg, "right", turn_right_deg)
    let best_alpha = turn_right_deg <= turn_left_deg ? [turn_right_deg,"clockwise"] : [-1 * turn_left_deg, "counterclockwise"]
    // Si el jugador ya esta viendo la pelota, seguir recto; de lo contrario girar
    if (theta_deg == 0)
        best_alpha = [0, "recto"]

    // console.log("player init rotation", player_initial_rotation, "turn left", turn_left_deg, "turn right", turn_right_deg)
    // console.log("result", best_alpha)
    return best_alpha
}

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

/*
    init/main function
*/
$(document).ready(function () {
    // iniciar jugador y pelota con posiciones random
    let angle = Math.floor((Math.random() * 360) + 1) * -1;
    // angle =0
    let top_player = Math.floor((Math.random() * 60) + 21);
    let left_player = Math.floor((Math.random() * 60) + 21);
    let top_ball = Math.floor((Math.random() * 90) + 1);
    let left_ball = Math.floor((Math.random() * 90) + 1);
    $('#player').css({'position': 'absolute','top': top_player + 'vh', 'left': left_player+ 'vw', '-webkit-transform': 'rotate(' + angle + 'deg)'});
    $('#ball').css({'top': top_ball + 'vh', 'left': left_ball+ 'vw'});
    var c = 0
    var angle_threshold = 5
    var distance_threshold = 200
    var inter = setInterval(function(){ 
        // let player_x = 0
        // let player_y = 0
        const player_coords = document.getElementById("player").getBoundingClientRect()
        const ball_coords = document.getElementById("ball").getBoundingClientRect()
        var delta_s = get_delta_s()
        var alpha = get_alpha(
            get_plane_position(ball_coords.top, ball_coords.left), 
            get_plane_position(player_coords.top, player_coords.left), 
            angle
        )
        console.log("distancia", delta_s, "alpha", alpha, "angle", angle)
        let direction = alpha[1]
        alpha = (Math.abs(alpha[0]) >=  angle_threshold) ? alpha[0] : 0
        if ((Math.abs(alpha) >=  angle_threshold) | delta_s > distance_threshold) { //si todavia esta lejos, que haga la parte fuzzy
        // if (c < 30){
            let res = defuzzy(delta_s, alpha)
            let beta = direction == "clockwise" ? res.beta : res.beta * -1
            let v = res.s
            console.log("resultados:", beta, v, "beta og", res.beta)
            let move = move_player(delta_s, alpha, beta, v, angle, player_coords, direction)
            let transform = move.transform
            angle = move.angle
            // $('#player').css({'-webkit-transform': 'rotate(' + angle + 'deg)', 'left': player_x + 'px', 'top': player_y + 'px'});
            $('#player').css(transform);
            // $('#player').css({'-webkit-transform': 'rotate(' + angle + 'deg)'});
            c +=1
            // console.log("lejos")
        }
        else {// de lo contrario, que haga la parte estocastica
            console.log("cerca")
            clearInterval(inter)
            var player = document.getElementById('player')
            var ball = document.getElementById('ball')
            var deg = Math.random() * 90
            deg = deg + angle
            console.log(deg)
            var positionRandom = Math.random() * 20 
            var offsets = document.getElementById('ball').getBoundingClientRect()
            var balltop = offsets.top;
            var ballleft = offsets.left;
            var yPositionOfPlayer = balltop  + positionRandom
            var xPositionOfPlayer = ballleft - positionRandom
            player.style.top = yPositionOfPlayer +"px"
            player.style.left = xPositionOfPlayer +"px"
            console.log(yPositionOfPlayer)
            sleep(1000).then(() => {
                player.style.mozTransform    = 'rotate('+deg+'deg)'
                player.style.msTransform     = 'rotate('+deg+'deg)'
                player.style.oTransform      = 'rotate('+deg+'deg)'
                player.style.transform       = 'rotate('+deg+'deg)'
                var offsetsGoal = document.getElementById('goaal').getBoundingClientRect()
                var goaltop = offsetsGoal.top;
                var winHeight = window.innerHeight
                var goalLeft = offsetsGoal.left;
                var probabilidadDesviar = (Math.random() * winHeight) / 10
                               
                var winWidth = window.innerWidth
                var distancia = (Math.random() * winWidth) + goalLeft
                if (distancia > winWidth){
                    distancia = goalLeft + 5
                }
                probabilidadDesviar += goaltop
                console.log(distancia)
                console.log(probabilidadDesviar)
                sleep(1000).then(() => {
                    ball.style.left = distancia + "px"
                    ball.style.top = probabilidadDesviar +"px"
                });
            })
            


            
            
        }
    }, 100);
    
});

