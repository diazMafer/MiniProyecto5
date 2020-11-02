
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

function sum(arr) {
    total = arr.reduce((totalValue, currentValue) => {
        return totalValue + currentValue
    }, 0);
    return total
}

function get_screen_diagonal() {
    w = window.outerWidth; 
    h = window.outerHeight; 
    max_distance = Math.sqrt(w*w + h*h);
    // console.log("screen diagonal:", max_distance)
    return max_distance
}

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
  * @params
  * delta_s : 
  * alpha : cuántos grados de rotación hacen falta (y en qué dirección) para que el jugador vea a la pelota directamente 
*/

function eval_horn(delta_s, alpha, consecuente_v, consecuente_beta) {
    output = []
    D = get_screen_diagonal()
    max_angle = 180
    max_beta = 30
    max_distance = 40
    // clausulas para obtener beta 
    if (typeof consecuente_beta != "undefined") {
        bc1 = Math.min(
                get_membership_value(consecuente_beta, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta), // girar mucho
                get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
        bc2 = Math.min(
            // get_membership_value(alpha
                get_membership_value(consecuente_beta, 0, max_beta/2, max_beta/2, -max_beta, max_beta), // girar poco
                get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
        bc3 = Math.min(
                get_membership_value(consecuente_beta, 0, max_beta/4, max_beta/4, -max_beta, max_beta), // ir recto
                get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        )
        clausulas_beta = [bc1, bc2, bc3]
        return clausulas_beta
    }
    if (typeof consecuente_v != "undefined") {
        // clausulas para obtener la distancia a recorrer (velocidad)
        vc1 = Math.min(
                get_membership_value(consecuente_v, max_distance, max_distance/2, 0, 0, max_distance), // rapido
                get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
        )
        vc2 = Math.min(
                get_membership_value(consecuente_v, max_distance/2, max_distance/4, max_distance/4, 0, max_distance), // medio
                get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
        )
        vc3 = Math.min(
                get_membership_value(consecuente_v, 0, 0, max_distance/4, 0, max_distance), // lento
                get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
        )
        clausulas_v = [vc1, vc2, vc3]
        return clausulas_v
    }    
}
function defuzzy(delta_s, alpha){
    max_beta = 30
    max_distance = 40
    x_beta = range(0, max_beta, 0.5)
    x_v = range(0, max_distance, 1)
    v_res = []
    beta_res = []
    for (let index = 0; index < x_beta.length; index++) {
        const beta = x_beta[index]
        res_beta = (eval_horn(delta_s, alpha, undefined, beta))
        beta_res.push(res_beta)
    }
    for (let index = 0; index < x_v.length; index++) {
        const vel = x_v[index]
        res_v = (eval_horn(delta_s, alpha, vel, undefined))
        v_res.push(res_v)   
    }
    // console.log("velocidad", v_res)
    // console.log("beta", beta_res)
    // console.log("xv", x_v, x_beta)
    y_velocidad = []
    y_beta = []
    v_res.forEach(element => {
        y_velocidad.push(Math.max.apply(Math, element))
    });
    beta_res.forEach(element => {
        y_beta.push(Math.max.apply(Math, element))
    });
    // console.log("velocidad_p", y_velocidad)
    // console.log("beta_p", y_beta)

    product = []
    // obtencion de centro de gravedad - beta
    for (let i = 0; i < x_beta.length; i++) {
        product.push(x_beta[i] * y_beta[i])
    }
    cog_beta = sum(product) / sum(y_beta)
    console.log("product", product, "y_beta", y_beta, "sumprod", sum(product), sum(y_beta), "res", cog_beta)
    product = []
    // obtencion de centro de gravedad - velocidad
    for (let i = 0; i < x_v.length; i++) {
        product.push(x_v[i] * y_velocidad[i])
    }
    
    cog_v = sum(product) / sum(y_velocidad)
    return {
        "beta": cog_beta,
        "s": cog_v
    }
    // return [cog_beta, cog_v]

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
    // console.log("typeof maxnumber:", typeof max_member_value)
    // las funciones pueden tener mas de un peak
    if (typeof max_member_value != "number") {
        max_array = [...max_member_value]
        leftr_arr = [...left_range]
        rightr_arr = [...right_range]
        max_array.forEach(peak => {
            peak_index = max_array.indexOf(peak)
            // console.log("ranges", leftr_arr, rightr_arr)
            // console.log("peak_index", peak_index, "input", input_value, "ranges", leftr_arr[peak_index], rightr_arr[peak_index], "arr", max_array)
            if ((input_value >= (peak - leftr_arr[peak_index])) & ((peak + rightr_arr[peak_index]) >= input_value)) {
                max_member_value = peak
                left_range = leftr_arr[peak_index]
                right_range = rightr_arr[peak_index]
            }
        });
    }
    if (typeof max_member_value != "number") return 0
    // si el valor input se encuentra dentro de los valores con pertenencia 0 (fuera de los valores con pendiente)
    if (input_value === max_member_value) return 1
    if ((input_value >= min_f_value & (input_value <= max_member_value - left_range)) | ((input_value <= max_f_value) & input_value >= (max_member_value + right_range))) {
        return 0
    }
    // si el valor input esta dentro de los valores con pendiente
    //por el lado izquierdo
    if ((input_value >= (max_member_value - left_range) & (input_value < max_member_value))) {
        // obtener la pendiente del lado izquierdo
        m = 1 / (max_member_value - (max_member_value - left_range))
    }
    //por el lado derecho
    else if ((input_value > max_member_value) & ((max_member_value + right_range) >= input_value)){
        m = -1 / ((max_member_value + right_range) - max_member_value)
    }
    b = 1 - (m * max_member_value)
    y = (m * input_value) + b
    // console.log("valor de pertenencia", y, "input_value", input_value, "pico_x", max_member_value, "right_range", right_range, "left_range", left_range)
    return y  
}


/*
    init/main function
*/
$(document).ready(function () {
    // iniciar jugador y pelota con posiciones random
    // angle = Math.floor((Math.random() * 360) + 1) * -1;
    angle =0
    top_player = Math.floor((Math.random() * 60) + 21);
    left_player = Math.floor((Math.random() * 60) + 21);
    top_ball = Math.floor((Math.random() * 90) + 1);
    left_ball = Math.floor((Math.random() * 90) + 1);
    // $('#player').css({'position': 'absolute','bottom': top_player + 'vh', 'left': left_player+ 'vw', '-webkit-transform': 'rotate(' + angle + 'deg)'});
    $('#ball').css({'bottom': top_ball + 'vh', 'left': left_ball+ 'vw'});
    var c = 0
    player_x = 0
    player_y = 0
    var inter = setInterval(function(){ 
        const player_coords = document.getElementById("player").getBoundingClientRect()
        const ball_coords = document.getElementById("ball").getBoundingClientRect()
        delta_s = get_delta_s()
        alpha = get_alpha(
            get_plane_position(ball_coords.top, ball_coords.left), 
            get_plane_position(player_coords.top, player_coords.left), 
            angle
        )
        direction = alpha[1]
        alpha = alpha[0]
        console.log("distancia", delta_s, "alpha", alpha, "angle", angle)
        if ((Math.abs(alpha) >= 2) | delta_s > 100) { //si todavia esta lejos, que haga la parte fuzzy
        // if (c < 6){
            res = defuzzy(delta_s, alpha)
            beta = direction == "clockwise" ? res.beta : res.beta * -1
            v = res.s
            console.log("resultados:", beta, v)
            angle = Math.abs(alpha) >= 2 ? angle + beta : angle
            //mover el jugador 
            player_x = player_coords.left + (v * Math.cos(angle * Math.PI / 180));
            player_y = player_coords.top + (v * Math.sin(angle * Math.PI / 180));
            console.log("l", player_x, "t", player_y, angle)
            transform = delta_s > 100 & Math.abs(alpha) <=2 ? {'left': player_x + 'px', 'top': player_y + 'px'} : // si ya esta viendo en direccion pero le falta acercarse
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

