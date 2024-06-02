$(document).ready(function () {

  $('#zip').on('change', async function() {
    let zipCode = $('#zip').val();
    let url = `https://webspace.csumb.edu/~lara4594/ajax/cityInfoByZip.php?zip=${zipCode}`;
    let response = await fetch(url);
    let data = await response.json();

    $('#city').val(data.city);
    $('#state').val(data.state);
  }); 

  $('#updateProfile').on('submit', function(e){
    clearErrors();

    if(!isFormValid()) {
      e.preventDefault();
    }
  });

  function isFormValid(){
    let zipCode = $('#zip').val();

    isValid = true;
    if ($('#fName').val().length == 0){
      $('#fNameError').html('Please enter your first name.');
      isValid = false;
    }

    if ($('#lName').val().length == 0){
      $('#lNameError').html('Please enter your last name.');
      isValid = false;
    }

    if ($('#streetAddress').val().length == 0){
      $('#addressError').html('Please enter your street address.');
      isValid = false;
    }

    if ($('#city').val().length == 0){
      $('#cityError').html('Please enter your city.');
      isValid = false;
    }

    if ($('#state').val().length == 0){
      $('#stateError').html('Please enter your state.');
      isValid = false;
    }

    if (!isValidZip(zipCode)) {
      $('#zipError').html('Zipcode must be 5 numbers.');
      isValid = false;
    }

    return isValid;
  }

  function isValidZip(str){
    let pattern = /^\d{5}$/;
    let valid = pattern.test(str);

    return valid;
  }

  function clearErrors(){
    $('#fNameError').html('');
    $('#lNameError').html('');
    $('#addressError').html('');
    $('#cityError').html('');
    $('#stateError').html('');
    $('#zipError').html('');
  }
});