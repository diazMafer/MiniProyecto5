/*
                    PARTE FUZZY 
    variables crisp (entrada):
    - distancia entre el jugador y la pelota (delta s):
        * lejos
        * medio
        * cerca
    - angulo de rotacion del jugador hacia la pelota (alfa)
        * derecha
        * izquierda
        * recto

    variables linguisticas de output:
    - angulo de rotacion del jugador para la pelota (delta beta) -> hasta 45 grados
        * girar a la derecha
        * girar a la izquierda
        * seguir recto
    -> para cada ciclo de reloj que se haga (iteracion), el robot se moverá 15 pixeles en cualesquiera dirección. Por lo que esta no será una variable de output. 

    clausulas de horne:
    * si alfa = norte y s = positivo, entonces beta = izquierda 
    * si alfa = norte y s = 0, entonces beta = seguir recto
    * si alfa = norte y s = negativo, entonces beta = derecha
    * si alfa = este y s = positivo, entonces beta = izquierda
    * si alfa = este y s = 0, entonces beta = izquierda
    * si alfa = este y s = negativo, entonces beta = recto
    * si alfa = sur y s = positivo, entonces beta = derecha
    * si alfa = sur y s = 0, entonces beta = izquierda
    * si alfa = sur y s = negativo, entonces beta = izquierda
    * si alfa = oeste y s = positivo, entonces beta = recto
    * si alfa = oeste y s = 0, entonces beta = derecha
    * si alfa = oeste y s = negativo, entonces beta = derecha

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
    best_alpha = turn_right_deg <= turn_left_deg ? [-1 * turn_right_deg,"R"] : [turn_left_deg, "L"]
    // Si el jugador ya esta viendo la pelota, seguir recto; de lo contrario girar
    if (theta_deg == 0)
        best_alpha = [0, "C"]

    console.log("player init rotation", player_initial_rotation, "turn left", turn_left_deg, "turn right", turn_right_deg)
    console.log("result", best_alpha)
    return best_alpha
}
