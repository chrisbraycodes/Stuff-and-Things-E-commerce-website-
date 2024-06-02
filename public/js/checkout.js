$(document).ready(function () {

// Displaying City from API after typing a zip Code
  $('#zip').on('change', async function(){
    let zipCode = $("#zip").val();
    let url = `https://webspace.csumb.edu/~lara4594/ajax/cityInfoByZip.php?zip=${zipCode}`;
    let response = await fetch(url);
    let data = await response.json();

    if (data === false) {
      $('#city').html('City: Not Found');
      $('#state').html('State: Not Found');
    } else {
      $('#city').html(`City: ${data.city}`);
      $('#state').html(`State: ${data.state}`);
    }
  }); //zip

  $('#checkoutForm').on('submit', function(e){
    clearErrors();

    if(!isFormValid()){
      e.preventDefault();
    }
  });

  function isFormValid(){
    let zipCode = $("#zip").val();

    isValid = true;
    if ($('#shipping').val() == 'null'){
      $('#shippingError').html('Please choose a shipping method.');
      isValid = false;
    }

    if ($('#card').val() == 'null'){
      $('#cardError').html('Please select a payment form.');
      isValid = false;
    }

    if ($('#fname').val().length == 0){
      $('#fname-error').html('Please enter your first name.');
      isValid = false;
    }

     if ($('#lname').val().length == 0){
      $('#lname-error').html('Please enter your last name.');
      isValid = false;
    }

    if (!isValidZip(zipCode)) {
      $('#zip-error').html('Zipcode must be 5 numbers.');
      isValid = false;
    }

    return isValid;
  }

  fetch('https://webspace.csumb.edu/~lara4594/ajax/promo/shippingMethods.php')
    .then(response => response.json())  // convert to json
    .then(json => {
      $('#twoDmethod').html(json[0].shippingMethod + ': $' + json[0].price);
      $('#nexDmethod').html(json[1].shippingMethod + ': $' + json[1].price);
      $('#Rmethod').html(json[2].shippingMethod + ': $' + json[2].price);
    })
  .catch(err => console.log('Request Failed', err));

  function isValidZip(str){
    let pattern = /^\d{5}$/;
    let valid = pattern.test(str);

    return valid;
  }

  function clearErrors(){
    $('#shippingError').html('');
    $('#cardError').html('');
    $('#fname-error').html('');
    $('#lname-error').html('');
    $('#zip-error').html('');
  }

});