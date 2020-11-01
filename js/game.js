function range(start, stop, step) {
    if (typeof stop == 'undefined') {
        stop = start
        start = 0
    }
    if (typeof step == 'undefined')
        step = 1
    if ((step > 0 && start >= stop) || (step < 0 && start <= stop))
        return []
    let result = []
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i)
    }
    return result
};

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

    clausulas de horn (al momento de ejecucion, las clausulas se partiran en dos sets (uno para la velocidad y otro para el angulo de rotacion), pero para brevedad, se combinaran):
    * [si s = lejos y angulo es clockwise <- valor constante , entonces v = rapido <- for de evaluacion (lambda i)] <- min a ambos

    * si s = lejos y alfa = muy girado, entonces v = rapido y beta = mucho
    * si s = lejos y alfa = girado, entonces v = rapido y beta = poco
    * si s = lejos y alfa = recto, entonces v = rapido y beta = recto
    * si s = medio y alfa = muy girado, entonces v = medio y beta = mucho
    * si s = medio y alfa = girado, entonces v = medio y beta = poco
    * si s = medio y alfa = recto, entonces v = medio y beta = recto
    * si s = cerca y alfa = muy girado, entonces v = lento y beta = mucho
    * si s = cerca y alfa = girado, entonces v = lento y beta = poco
    * si s = cerca y alfa = recto, entonces v = lento y beta = recto
    
    clausula 1 = [3, 5, 6, 7, 8]
    clausula 2 = [1, 6, 8, 9, 0]
    clausula 3 = [9, 5, 6, 8, 1]
    y = max(de cada posicion de los arrays de clausulas)


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
  * @params
  * delta_s : 
  * alpha : cuántos grados de rotación hacen falta (y en qué dirección) para que el jugador vea a la pelota directamente 
*/

function defuzzy(delta_s, alpha) {
    output = []
    D = get_screen_diagonal()
    max_angle = 180
    max_beta = 15
    max_distance = 40
    // clausulas para obtener beta 
    consecuente = range(-max_beta, max_beta, 0.5)
    // clausula 1
    // si s = lejos y alfa = muy girado, entonces beta = mucho
    c1 = Math.min(
        consecuente.map(function(x) {
            return get_membership_value(x, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta) // girar mucho
        }).push(Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        ))
    )
    // clausula 2
    //si s = lejos y alfa = girado, entonces v = rapido y beta = poco
    c2 = Math.min(
        // get_membership_value(alpha, -max_angle, 0, max_angle/2, -max_angle, max_angle) // counterclockwise
        consecuente.map(function(x) {
            return get_membership_value(x, 0, max_beta/2, max_beta/2, -max_beta, max_beta) // girar poco
        }).push(Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        ))
    )
    // clausula 3
    // si s = lejos y alfa = recto, entonces v = rapido y beta = recto
    c3 = Math.min(
        // get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        consecuente.map(function(x) {
            return get_membership_value(x, 0, max_beta/4, max_beta/4, -max_beta, max_beta) // ir recto
        }).push(Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        ))
    )
    // union de las 3 clausulas 
    union_clause = Math.max(c1, c2, c3)
    console.log("evaluacion de las 3 clausulas para beta:", union_clause)
    output.push(union_clause)
    // return union_clause

    // clausulas para obtener la distancia a recorrer (velocidad)
    // clausula 1 : si s = lejos y alfa = muy girado, entonces v = rapido
    c1 = Math.min(
        consecuente.map(function(x) {
            return get_membership_value(x, max_distance, max_distance/2, 0, 0, max_distance) // rapido
        }).push(Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        ))
    )
    // clausula 2 : si s = medio y alfa = muy girado, entonces v = medio
    // c2 = get_membership_value(delta_s, D/2, D/4, D/4, 0, D) // medio
    c2 = Math.min(
        consecuente.map(function(x) {
            return get_membership_value(x, max_distance/2, max_distance/4, max_distance/4, 0, max_distance) // medio
        }).push(Math.min(
            get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        ))
    )
    // clausula 3 : si s = cerca y alfa = muy girado, entonces v = lento
    // c3 = get_membership_value(delta_s, 0, 0, D/2, 0, D) // cerca
    c3 = Math.min(
        consecuente.map(function(x) {
            return get_membership_value(x, 0, 0, max_distance/4, 0, max_distance) // lento
        }).push(Math.min(
            get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        ))
    )
    output.push(union_clause)
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
    // las funciones pueden tener mas de un peak
    if (typeof max_member_value != "number") {
        max_array = [...max_member_value]
        leftr_arr = [...left_range]
        rightr_arr = [...right_range]
        max_array.forEach(peak => {
            if ((input_value >= (peak - left_range)) & ((peak + right_range) >= input_value)) {
                peak_index = max_array.indexOf(peak)
                max_member_value = peak
                left_range = leftr_arr[peak_index]
                right_range = rightr_arr[peak_index]
            }
        });
    }
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
    )[0]
    console.log("delta s", delta_s, "alpha", alpha)
    defuzzy(delta_s, undefined)
    defuzzy(undefined, alpha)
});

