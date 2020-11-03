import {defuzzy} from './fuzzy.js'





/*
    traduccion de coordenadas en pantalla a coordenadas en el plano cartesiano de la pantalla
*/
function get_plane_position(top_value, left_value) {
    y_coord = (window.outerHeight / 2) - top_value
    x_coord = left_value + (window.outerWidth / 2)
    // console.log("y_coord", y_coord, "x_coord", x_coord)
    return [x_coord, y_coord]
}

/*
                    PARTE FUZZY 
    variables crisp (entrada):
    - distancia entre el jugador y la pelota (delta s):
        * lejos
        * medio
        * cerca
    - angulo de rotacion del jugador hacia la pelota (alfa)
        * muy girado
        * girado
        * recto

    variables linguisticas de output:
    - angulo de rotacion del jugador para la pelota (delta beta) -> de -15 grados hasta 15 grados
        * voltear mucho
        * voltear poco
        * seguir recto
    - velocidad del jugador (que tanta distancia puede recorrer por cada iteracion) (v) -> hasta 40 pixeles:
        * rapido
        * medio
        * lento 

    clausulas de horn
    * si s = lejos, entonces v = rapido
    * si s = medio, entonces v = medio
    * si s = cerca, entonces v = lento
    * si alfa = muy girado, entonces beta = mucho
    * si alfa = girado, entonces beta = poco
    * si alfa = recto, entonces beta = recto

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
    // y coords => top, x coords => left
    delta_y = ball_coords[1] - player_coords[1]
    delta_x = ball_coords[0] - player_coords[0]
    // theta = angulo que el jugador debe girar para ver a la pelota 
    theta = Math.atan2(delta_y, delta_x)
    turn_right_deg = 0
    turn_left_deg = 0

    // arctan devuelve numeros negativos para 180-360 y positivos para 0-180, hay que traducirlos a grados 
    theta_deg = theta < 0 ? (theta * (180/Math.PI) + (2*Math.PI)) : (theta * (180/Math.PI))

    // para ver cual es la mejor direccion a girar se prueba girando a la derecha y luego a la izquierda 
    // la direccion que de el menor angulo de rotacion es la mejor direccion a tomar
    turn_right_deg = player_initial_rotation >= theta_deg ? (player_initial_rotation - theta_deg) : (player_initial_rotation - (theta_deg - 360))
    turn_left_deg = theta_deg >= player_initial_rotation ? (theta_deg - player_initial_rotation) : (theta_deg - (player_initial_rotation - 360))
    best_alpha = turn_right_deg <= turn_left_deg ? [-1 * turn_right_deg,"counterclockwise"] : [turn_left_deg, "clockwise"]
    // Si el jugador ya esta viendo la pelota, seguir recto; de lo contrario girar
    if (theta_deg == 0)
        best_alpha = [0, "recto"]

    // console.log("player init rotation", player_initial_rotation, "turn left", turn_left_deg, "turn right", turn_right_deg)
    // console.log("result", best_alpha)
    return best_alpha
}


/*
    init/main function
*/
$(document).ready(function () {
    // iniciar jugador y pelota con posiciones random
    // angle = Math.floor((Math.random() * 360) + 1) * -1;
    var angle =0
    var top_player = Math.floor((Math.random() * 60) + 21);
    var left_player = Math.floor((Math.random() * 60) + 21);
    var top_ball = Math.floor((Math.random() * 90) + 1);
    var left_ball = Math.floor((Math.random() * 90) + 1);
    // $('#player').css({'position': 'absolute','bottom': top_player + 'vh', 'left': left_player+ 'vw', '-webkit-transform': 'rotate(' + angle + 'deg)'});
    $('#ball').css({'bottom': top_ball + 'vh', 'left': left_ball+ 'vw'});
    var c = 0
    var player_x = 0
    var player_y = 0
    var inter = setInterval(function(){ 
        const player_coords = document.getElementById("player").getBoundingClientRect()
        const ball_coords = document.getElementById("ball").getBoundingClientRect()
        var delta_s = get_delta_s()
        var alpha = get_alpha(
            get_plane_position(ball_coords.top, ball_coords.left), 
            get_plane_position(player_coords.top, player_coords.left), 
            angle
        )
        var direction = alpha[1]
        alpha = alpha[0]
        console.log("distancia", delta_s, "alpha", alpha, "angle", angle)
        if ((Math.abs(alpha) >= 2) | delta_s > 100) { //si todavia esta lejos, que haga la parte fuzzy
        // if (c < 6){
            var res = defuzzy(delta_s, alpha)
            var beta = direction == "clockwise" ? res.beta : res.beta * -1
            var v = res.s
            console.log("resultados:", beta, v)
            angle = Math.abs(alpha) >= 2 ? angle + beta : angle
            //mover el jugador 
            player_x = player_coords.left + (v * Math.cos(angle * Math.PI / 180));
            player_y = player_coords.top + (v * Math.sin(angle * Math.PI / 180));
            console.log("l", player_x, "t", player_y, angle)
            var transform = delta_s > 100 & Math.abs(alpha) <=2 ? {'left': player_x + 'px', 'top': player_y + 'px'} : // si ya esta viendo en direccion pero le falta acercarse
                        delta_s < 100 & Math.abs(alpha) >=2 ? {'-webkit-transform': 'rotate(' + angle + 'deg)'} : // si ya esta cerca pero le falta voltearse
                        {'-webkit-transform': 'rotate(' + angle + 'deg)', 'left': player_x + 'px', 'top': player_y + 'px'} // si le faltan ambos 
            console.log("transform", transform)
            // $('#player').css({'-webkit-transform': 'rotate(' + angle + 'deg)', 'left': player_x + 'px', 'top': player_y + 'px'});
            $('#player').css(transform);
            // $('#player').css({'-webkit-transform': 'rotate(' + angle + 'deg)'});
            c +=1
            // console.log("lejos")
        }
        else {// de lo contrario, que haga la parte estocastica
            console.log("cerca")
            clearInterval(inter)
        }
    }, 500);
    
});

