$(document).ready(function(){

  $('#account-tab').on('click', function(){
    location.href= '/profile';
  });


  $('#history-tab').on('click', function(){
    location.href= '/purchaseHistory';
  });
});