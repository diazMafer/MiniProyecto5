// function rotatePlayer() {
//     var img = document.getElementById('myimage');
//     img.className = 'element';
// }

var max_distance = 0 // medida en pixeles de la diagonal de la pantalla, se considera como la distancia maxima entre el player y la pelota 
function get_screen_diagonal() {
    w = window.outerWidth; 
    h = window.outerHeight; 
    max_distance = Math.sqrt(w*w + h*h);
    console.log("screen diagonal:", max_distance)
    return max_distance
}

/*
    traduccion de coordenadas en pantalla a coordenadas en el plano cartesiano de la pantalla
*/
function get_plane_position(top_value, left_value) {
    y_coord = (window.outerHeight / 2) - top_value
    x_coord = left_value + (window.outerWidth / 2)
    console.log("y_coord", y_coord, "x_coord", x_coord)
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
        * clockwise
        * counterclockwise
        * recto

    variables linguisticas de output:
    - angulo de rotacion del jugador para la pelota (delta beta) -> hasta 45 grados
        * girar a la derecha
        * girar a la izquierda
        * seguir recto
    - velocidad del jugador (v):
        * rapido
        * medio
        * lento 

    clausulas de horn para la velocidad del jugador:
    * si s = lejos, entonces v = rapido
    * si s = medio, entonces v = medio
    * si s = cerca, entonces v = lento

    clausulas de horn para el angulo de rotacion del jugador:
    * si alfa = clockwise, entonces beta = izquierda
    * si alfa = counterclockwise, entonces beta = derecha
    * si alfa = recto, entonces beta = recto

*/

function get_delta_s() {
    const player_coords = document.getElementById("player").getBoundingClientRect()
    const ball_coords = document.getElementById("ball").getBoundingClientRect()
    console.log("player -> top:", player_coords.top, "left:", player_coords.left)
    console.log("ball -> top:", ball_coords.top, "left:", ball_coords.left)
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

    console.log("player init rotation", player_initial_rotation, "turn left", turn_left_deg, "turn right", turn_right_deg)
    console.log("result", best_alpha)
    return best_alpha
}
/*
 * Al ingresar un valor de input, mapea segun la funcion de pertenencia el valor resultante. 
 * max_member_value -> valor en el cual la pertenencia es maxima (1)
 * left_range -> desde el valor del punto de pertenencia maxima, cuantas unidades a la izquierda son necesarias para que el valor de pertenencia llegue a 0. Si este valor es 0 se asume que 
 *      la pertenencia no regresa a 0. 
 * right_range -> lo mismo pero a la derecha
 * min_f_value -> valor en el eje x minimo de la funcion
 * max_f_value -> valor en el eje x maximo de la funcion
*/
function get_membership_value(input_value, max_member_value, left_range = 0, right_range = 0, min_f_value = 0, max_f_value = Number.POSITIVE_INFINITY){
    y = 0
    // si el valor input se encuentra dentro de los valores con pertenencia 0 (fuera de los valores con pendiente)
    if ((input_value > min_f_value & (input_value < max_member_value - left_range)) | ((input_value < max_f_value) & input_value > (max_member_value + right_range))) {
        console.log("valor de pertenencia", y, "input_value", input_value, "pico_x", max_member_value, "right_range", right_range, "left_range", left_range)
        return 0
    }
    // si el valor input esta dentro de los valores con pendiente
    //por el lado izquierdo
    else if ((input_value >= (max_member_value - left_range) & (input_value < max_member_value))) {
        // obtener la pendiente del lado izquierdo
        m = 1 / (max_member_value - (max_member_value - left_range))
    }
    //por el lado derecho
    if ((input_value > max_member_value) & ((max_member_value + right_range) >= input_value)){
        m = - 1 / ((max_member_value - right_range) - max_member_value)
    }
    b = 1 - (m * max_member_value)
    y = (m * input_value) + b
    console.log("m", m, "b", b)
    console.log("y b4 cap", y)
    y = y < 0 ? 0 : y > 1 ? 1 : y // si el valor de pertenencia < 0 o > 1, redondear
    console.log("valor de pertenencia", y, "input_value", input_value, "pico_x", max_member_value, "right_range", right_range, "left_range", left_range)
    return y 
}
function defuzzy(delta_s = undefined, alpha = undefined) {
    if (delta_s) { // se usan set de clausulas para variable v
        D = get_screen_diagonal()
        // clausula 1
        console.log("---> c1", D)
        c1 = get_membership_value(delta_s, D, D/2, 0, 0, D) //lejos
        // clausula 2
        console.log("---> c2", D)
        c2 = get_membership_value(delta_s, D/2, D/4, D/4, 0, D) // medio
        // clausula 3
        console.log("---> c3", D)
        c3 = get_membership_value(delta_s, 0, 0, D/2, 0, D) // cerca
        // union de las 3 clausulas 
        union_clause = Math.max(c1, c2, c3)
    }
    else if (alpha) { // se usa set de clausulas para variable beta

    }

}


/*
    init/main function
*/
$(document).ready(function () {
    // iniciar jugador y pelota con posiciones random
    angle = Math.floor((Math.random() * 360) + 1);
    top_player = Math.floor((Math.random() * 60) + 21);
    left_player = Math.floor((Math.random() * 60) + 21);
    top_ball = Math.floor((Math.random() * 90) + 1);
    left_ball = Math.floor((Math.random() * 90) + 1);
    $('#player').css({'position': 'absolute','bottom': top_player + 'vh', 'left': left_player+ 'vw', '-webkit-transform': 'rotate(-' + angle + 'deg)'});
    $('#ball').css({'bottom': top_ball + 'vh', 'left': left_ball+ 'vw'});
    get_screen_diagonal()
    const player_coords = document.getElementById("player").getBoundingClientRect()
    const ball_coords = document.getElementById("ball").getBoundingClientRect()
    delta_s = get_delta_s()
    alpha = get_alpha(
        get_plane_position(ball_coords.top, ball_coords.left), 
        get_plane_position(player_coords.top, player_coords.left), 
        angle
    )
    console.log("delta s", delta_s, "alpha", alpha)
    defuzzy(delta_s)
});

