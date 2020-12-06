$(".info-item .btn").click(function(){
  $(".container").toggleClass("log-in");
});
$(".container-form .btn").click(function(){
  $(".container").addClass("active");
});
$(".container-form .btn").click(function(){
  	$(".table-cell").css("background-color","#FAA41A");
});
// $(window).on('resize', function(event){
// 	var windowSize = $(window).width(); // Could've done $(this).width()
//     if(windowSize < 880)
//     {
//     	$('table').remove();
//     }
// });
