$(document).ready(function() {
  let loginFormSubmitButtonNode = $('#login-form-submit-button');

  loginFormSubmitButtonNode.on('click', validateForm);

  function validateForm(e) {
    let loginUsernameValue = $('#login-username').val();
    let loginPasswordValue = $('#login-password').val();
    let error = false;

    clearErrors();

    if (loginUsernameValue === "") {
      $('#login-username-error').html('Username must be filled out.');
      error = true;
    } else {
      $('#login-username-error').html();
    }

    if (loginPasswordValue === "") {
      $('#login-password-error').html('Password must be filled out.');
      error = true;
    } else {
      $('#login-password-error').html();
    }

    if (error) {
      e.preventDefault();
    }
  }

  function clearErrors() {
    $('#login-username-error').html('');
    $('#login-password-error').html('');
  }
});