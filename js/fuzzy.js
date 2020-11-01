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

/*
  * @params
  * delta_s : 
  * alpha : cuántos grados de rotación hacen falta (y en qué dirección) para que el jugador vea a la pelota directamente 
*/

function eval_horn(delta_s, alpha, consecuente) {
    output = []
    D = get_screen_diagonal()
    max_angle = 180
    max_beta = 15
    max_distance = 40
    // clausulas para obtener beta 
    // clausula 1
    // si s = lejos y alfa = muy girado, entonces beta = mucho
    bc1 = Math.min(
            get_membership_value(consecuente, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta), // girar mucho
            Math.min(
                get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
                get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 2 
    //si s = lejos y alfa = girado, entonces v = rapido y beta = poco
    bc2 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/2, max_beta/2, -max_beta, max_beta), // girar poco
            Math.min(
                get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
                get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 3
    // si s = lejos y alfa = recto, entonces v = rapido y beta = recto
    bc3 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/4, max_beta/4, -max_beta, max_beta), // ir recto
            Math.min(
                get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
                get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        )
    )
    // clausula 4
    // si s = medio y alfa = muy girado, entonces beta = mucho
    bc4 = Math.min(
        get_membership_value(consecuente, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta), // girar mucho
        Math.min(
            get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 5
    //si s = medio y alfa = girado, entonces beta = poco
    bc5 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/2, max_beta/2, -max_beta, max_beta), // girar poco
            Math.min(
                get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
                get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 6
    // si s = medio y alfa = recto, entonces beta = recto
    bc6 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/4, max_beta/4, -max_beta, max_beta), // ir recto
            Math.min(
                get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
                get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        )
    )
    // clausula 7
    // si s = cerca y alfa = muy girado, entonces beta = mucho
    bc7 = Math.min(
        get_membership_value(consecuente, [-max_beta, max_beta], [0, max_beta/2], [max_beta/2, 0], -max_beta, max_beta), // girar mucho
        Math.min(
            get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 5
    //si s = cerca y alfa = girado, entonces beta = poco
    bc8 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/2, max_beta/2, -max_beta, max_beta), // girar poco
            Math.min(
                get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
                get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 6
    // si s = cerca y alfa = recto, entonces beta = recto
    bc9 = Math.min(
        // get_membership_value(alpha
            get_membership_value(consecuente, 0, max_beta/4, max_beta/4, -max_beta, max_beta), // ir recto
            Math.min(
                get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
                get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto
        )
    )

    // union de las 3 clausulas 
    clausulas_beta = [bc1, bc2, bc3, bc4, bc5, bc6, bc7, bc8, bc9]
    console.log("resultados de clausulas beta",bc1, bc2, bc3, bc4, bc5, bc6, bc7, bc8, bc9)
    // bunion_clause = Math.max(bc1, bc2, bc3, bc4, bc5, bc6, bc7, bc8, bc9)
    // console.log("evaluacion de las 3 clausulas para beta:", bunion_clause)

    // return union_clause

    // clausulas para obtener la distancia a recorrer (velocidad)
    // clausula 1 : si s = lejos y alfa = muy girado, entonces v = rapido
    vc1 = Math.min(
            get_membership_value(consecuente, max_distance, max_distance/2, 0, 0, max_distance), // rapido
            Math.min(
                get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
                get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 2 : si s = lejos y alfa = girado, entonces v = rapido 
    vc2 = Math.min(
        get_membership_value(consecuente, max_distance, max_distance/2, 0, 0, max_distance), // rapido
        Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 3 : si s = lejos y alfa = recto, entonces v = rapido
    vc3 = Math.min(
        get_membership_value(consecuente, max_distance, max_distance/2, 0, 0, max_distance), // rapido
        Math.min(
            get_membership_value(delta_s, D, D/2, 0, 0, D), //lejos
            get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto 
        )
    )
    // c2 = get_membership_value(delta_s, D/2, D/4, D/4, 0, D) // medio
    // clausula 4 : si s = medio y alfa = muy girado, entonces v = medio
    vc4 = Math.min(
            get_membership_value(consecuente, max_distance/2, max_distance/4, max_distance/4, 0, max_distance), // medio
            Math.min(
                get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
                get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 5 : si s = medio y alfa = girado, entonces v = medio
    vc5 = Math.min(
        get_membership_value(consecuente, max_distance/2, max_distance/4, max_distance/4, 0, max_distance), // medio
        Math.min(
            get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
            get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 6 : si s = medio y alfa = recto, entonces v = medio
    vc6 = Math.min(
        get_membership_value(consecuente, max_distance/2, max_distance/4, max_distance/4, 0, max_distance), // medio
        Math.min(
            get_membership_value(delta_s, D/2, D/4, D/4, 0, D), // medio
            get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto 
        )
    )

    // clausula 7 : si s = cerca y alfa = muy girado, entonces v = lento
    vc7 = Math.min(
        get_membership_value(consecuente, 0, 0, max_distance/4, 0, max_distance), // lento
        Math.min(
            get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
            get_membership_value(alpha, [-max_angle, max_angle], [0,max_angle/2], [max_angle/2, 0], -max_angle, max_angle) // muy girado 
        )
    )
    // clausula 8 : si s = cerca y alfa = girado, entonces v = lento
    vc8 = Math.min(
        get_membership_value(consecuente, 0, 0, max_distance/4, 0, max_distance), // lento
        Math.min(
            get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
            get_membership_value(alpha, 0, max_angle/2, max_angle/2, -max_angle, max_angle) // girado 
        )
    )
    // clausula 9 : si s = cerca y alfa = recto, entonces v = lento
    vc9 = Math.min(
        get_membership_value(consecuente, 0, 0, max_distance/4, 0, max_distance), // lento
        Math.min(
            get_membership_value(delta_s, 0, 0, D/2, 0, D), // cerca
            get_membership_value(alpha, 0, max_angle/4, max_angle/4, -max_angle, max_angle) // recto 
        )
    )
    clausulas_v = [vc1, vc2, vc3, vc4, vc5, vc6, vc7, vc8, vc9]
    // console.log("resultados de clausulas beta",vc1, vc2, vc3, vc4, vc5, vc6, vc7, vc8, vc9)
    // console.log("evaluacion de las 3 clausulas para la velocidad:", vunion_clause)
    return {
        "beta": clausulas_beta,
        "v": clausulas_v,
    }
}
export function defuzzy(delta_s, alpha){
    max_beta = 15
    consecuente = range(-max_beta, max_beta, 5)
    v_res = []
    beta_res = []
    consecuente.forEach(x => {
        res = (eval_horn(delta_s, alpha, x))
        v_res.push(res.v)
        beta_res.push(res.beta)
    });
    console.log("velocidad", v_res)
    console.log("beta", beta_res)
    y_velocidad = []
    y_beta = []
    v_res.forEach(element => {
        y_velocidad.push(Math.max.apply(Math, element))
    });
    beta_res.forEach(element => {
        y_beta.push(Math.max.apply(Math, element))
    });
    console.log("velocidad_p", y_velocidad)
    console.log("beta_p", y_beta)
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
                // console.log("p index", peak_index, input_value, max_array)
                max_member_value = peak
                left_range = leftr_arr[peak_index]
                right_range = rightr_arr[peak_index]
            }
        });
    }
    if (typeof max_member_value != "number") return 0
    // si el valor input se encuentra dentro de los valores con pertenencia 0 (fuera de los valores con pendiente)
    if ((input_value >= min_f_value & (input_value <= max_member_value - left_range)) | ((input_value <= max_f_value) & input_value >= (max_member_value + right_range))) {
        // console.log("valor de pertenencia", y, "input_value", input_value, "pico_x", max_member_value, "right_range", right_range, "left_range", left_range)
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
        m = - 1 / ((max_member_value - right_range) - max_member_value)
    }
    // else return 0
    // else {
    //     console.log("typeof maxnumber:", typeof max_member_value)
    //     console.log("no se encuentra en rango, vars:", input_value, max_member_value, left_range, right_range, min_f_value, max_f_value)
    // }
    b = 1 - (m * max_member_value)
    y = (m * input_value) + b
    // console.log("m", m, "b", b)
    // console.log("y b4 cap", y)
    y = y < 0 ? 0 : y > 1 ? 1 : y // si el valor de pertenencia < 0 o > 1, redondear
    // console.log("valor de pertenencia", y, "input_value", input_value, "pico_x", max_member_value, "right_range", right_range, "left_range", left_range)
    return y  
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
};