document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    // Check if the passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match! Please try again.");
      return;
    }
  
    // Proceed with form submission (e.g., send data to the server)
    alert("Signup successful!");
  
    // Reset the form
    document.getElementById('signupForm').reset();
  });
  