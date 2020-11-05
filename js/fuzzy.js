
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
    - angulo de rotacion del jugador para la pelota (delta beta) -> de -30 grados hasta 30 grados
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

function get_screen_diagonal() {
    const w = window.innerWidth; 
    const h = window.innerHeight; 
    const max_distance = Math.sqrt(w*w + h*h);
    return max_distance
}

/*
    Función que realiza la evaluación de las cláusulas de Horn para determinado input. 
  @params
  * delta_s : valor input de la distancia entre el jugador y la pelota. 
  * alpha : cuántos grados de rotación hacen falta (y en qué dirección) para que el jugador vea a la pelota directamente.
  * consecuente_v : los dos parámetros anteriores son del antecedente de la cláusula. Este parámetro contiene el valor de evaluación del consecuente para la distancia (velocidad)
        que el player debe moverse. 
  * consecuente_beta : valor de evaluación de consecuente para el ángulo que el player girará. 
  @returns un arreglo del valor de evaluación de las cláusulas. 
*/

function eval_horn(delta_s, alpha, consecuente_v, consecuente_beta) {
    let output = []
    const D = get_screen_diagonal()
    let max_angle = 180
    let max_beta = 30
    let max_distance = 40
    // clausulas para obtener beta 
    if (typeof consecuente_beta != "undefined") {
        const bc1 = Math.min(
                get_membership_value(consecuente_beta, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta), // girar mucho
                get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
        const bc2 = Math.min(
            // get_membership_value(alpha
                get_membership_value(consecuente_beta, 0, max_beta/2, max_beta/2, -max_beta, max_beta), // girar poco
                get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
        const bc3 = Math.min(
                get_membership_value(consecuente_beta, 0, max_beta/4, max_beta/4, -max_beta, max_beta), // ir recto
                get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        )
        const clausulas_beta = [bc1, bc2, bc3]
        return clausulas_beta
    }
    if (typeof consecuente_v != "undefined") {
        // clausulas para obtener la distancia a recorrer (velocidad)
        const vc1 = Math.min(
                get_membership_value(consecuente_v, max_distance, max_distance/2, 0, 0, max_distance), // rapido
                get_membership_value(delta_s, D, D/6, 0, 0, D), //lejos
        )
        const vc2 = Math.min(
                get_membership_value(consecuente_v, max_distance/2, max_distance/4, max_distance/4, 0, max_distance), // medio
                get_membership_value(delta_s, D/2, D/3, D/3, 0, D), // medio
        )
        const vc3 = Math.min(
                get_membership_value(consecuente_v, 0, 0, max_distance/4, 0, max_distance), // lento
                get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
        )
        const clausulas_v = [vc1, vc2, vc3]
        return clausulas_v
    }    
}
/*
    Devuelve los valores de output (distancia a recorrer por iteración y ángulo a girar) para la lógica difusa establecida. 
    @params 
    * delta_s : distancia entre player y pelota. 
    * alpha : ángulo de rotación faltante para que el jugador vea directo a la pelota. 
    
    @returns valor calculado para la velocidad y beta. 
*/
export function defuzzy(delta_s, alpha){
    let max_beta = 30
    let max_distance = 40
    let x_beta = range(0, max_beta, 0.5)
    let x_v = range(0, max_distance, 0.5)
    let v_res = []
    let beta_res = []
    for (let index = 0; index < x_beta.length; index++) {
        let beta = x_beta[index]
        let res_beta = (eval_horn(delta_s, alpha, undefined, beta))
        beta_res.push(res_beta)
    }
    for (let index = 0; index < x_v.length; index++) {
        let vel = x_v[index]
        let res_v = (eval_horn(delta_s, alpha, vel, undefined))
        v_res.push(res_v)   
    }
    let y_velocidad = []
    let y_beta = []
    v_res.forEach(element => {
        y_velocidad.push(Math.max.apply(Math, element))
    });
    beta_res.forEach(element => {
        y_beta.push(Math.max.apply(Math, element))
    });

    let product = []
    // obtencion de centro de gravedad - beta
    for (let i = 0; i < x_beta.length; i++) {
        product.push(x_beta[i] * y_beta[i])
    }
    const cog_beta = sum(product) / sum(y_beta)
    product = []
    // obtencion de centro de gravedad - velocidad
    for (let i = 0; i < x_v.length; i++) {
        product.push(x_v[i] * y_velocidad[i])
    }
    const cog_v = sum(product) / sum(y_velocidad)
    return {
        "beta": cog_beta,
        "s": cog_v
    }
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
    let y = 0
    // las funciones pueden tener mas de un peak
    if (typeof max_member_value != "number") {
        const max_array = [...max_member_value]
        const leftr_arr = [...left_range]
        const rightr_arr = [...right_range]
        max_array.forEach(peak => {
            const peak_index = max_array.indexOf(peak)
            if ((input_value >= (peak - leftr_arr[peak_index])) & ((peak + rightr_arr[peak_index]) >= input_value)) {
                max_member_value = peak
                left_range = leftr_arr[peak_index]
                right_range = rightr_arr[peak_index]
            }
        });
    }
    if (typeof max_member_value != "number") return 0 //si para cuando ya paso la validacion anterior y max_member_value sigue apareciendo como array, es que el input no esta dentro del rango de valores != 0
    if (input_value === max_member_value) return 1 // si el input es el punto de inflexion
    // si el valor input se encuentra dentro de los valores con pertenencia 0 (fuera de los valores con pendiente)
    if ((input_value >= min_f_value & (input_value <= max_member_value - left_range)) | ((input_value <= max_f_value) & input_value >= (max_member_value + right_range))) {
        return 0
    }
    // si el valor input esta dentro de los valores con pendiente
    //por el lado izquierdo
    if ((input_value >= (max_member_value - left_range) & (input_value < max_member_value))) {
        // obtener la pendiente del lado izquierdo
        var m = 1 / (max_member_value - (max_member_value - left_range))
    }
    //por el lado derecho
    else if ((input_value > max_member_value) & ((max_member_value + right_range) >= input_value)){
        var m = -1 / ((max_member_value + right_range) - max_member_value)
    }
    let b = 1 - (m * max_member_value)
    y = (m * input_value) + b
    return y  
}
/*
    Mover al jugador en pantalla. 
*/
export function move_player(delta_s, alpha, beta, v, angle, player_coords){
    var angle_threshold = 5
    var distance_threshold = 150
    const w = window.innerWidth; 
    const h = window.innerHeight; 
    angle = Math.abs(alpha) >=  angle_threshold ? angle + beta : angle
    let angle_abs = Math.abs(angle)
    //mover el jugador 
    if (delta_s > distance_threshold & (player_coords.top < h) & (player_coords.left < w)) {
        let player_x = (v * Math.cos(angle_abs * Math.PI / 180))
        var tras_x = player_coords.left + player_x;
        let player_y = (v * Math.sin(angle_abs * Math.PI / 180)) *-1
        var tras_y = player_coords.top + player_y;
    }
    if (player_coords.top > h){
        tras_y = h
    }
    if (player_coords.top < 0){
        tras_y = Math.abs(tras_y)
    }
    if (player_coords.left > w){
        tras_x = w
    }
    if (player_coords.left < 0){
        tras_x = Math.abs(tras_x)
    }
    let transform = delta_s > distance_threshold & Math.abs(alpha) <= angle_threshold ? {'left': tras_x + 'px', 'top': tras_y + 'px'} : // si ya esta viendo en direccion pero le falta acercarse
                delta_s < distance_threshold & Math.abs(alpha) >= angle_threshold ? {'-webkit-transform': 'rotate(' + angle + 'deg)'} : // si ya esta cerca pero le falta voltearse
                {'-webkit-transform': 'rotate(' + angle + 'deg)', 'left': tras_x + 'px', 'top': tras_y + 'px'} // si le faltan ambos 
    return { 
        "transform": transform, 
        "angle": angle
    }
}

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
}

function sum(arr) {
    let total = arr.reduce((totalValue, currentValue) => {
        return totalValue + currentValue
    }, 0);
    return total
}

export function get_plane_position(top_value, left_value) {
    const y_coord = (window.innerHeight / 2) - top_value
    const x_coord = left_value + (window.innerWidth / 2)
    return [x_coord, y_coord]
}