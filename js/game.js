// function rotatePlayer() {
//     var img = document.getElementById('myimage');
//     img.className = 'element';
// }

$(document).ready(function () {
    angle = Math.floor((Math.random() * 270) + 1);
    top_player = Math.floor((Math.random() * 60) + 21);
    left_player = Math.floor((Math.random() * 60) + 21);
    top_ball = Math.floor((Math.random() * 90) + 1);
    left_ball = Math.floor((Math.random() * 90) + 1);
    $('#player').css({'position': 'absolute','bottom': top_player + 'vh', 'left': left_player+ 'vw', '-webkit-transform': 'rotate(' + angle + 'deg)'});
    $('#ball').css({'bottom': top_ball + 'vh', 'left': left_ball+ 'vw'});
});