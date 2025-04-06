let signup_form = document.querySelector(".signup-form");

signup_form.addEventListener("submit", (e) => {
    e.preventDefault();

    let name = document.getElementById("fullname");
    let username = document.getElementById("username");
    let email = document.getElementById("email");
    let password = document.getElementById("password");
    
    //Getting names from form using DOM 
    let fullname = name.value;
    let username_raw_txt = username.value;
    let email_raw_txt = email.value;
    let password_raw_txt = password.value;

    //HASHING DATA
    let username_hash = CryptoJS.SHA256(username_raw_txt).toString();
    let email_hash = CryptoJS.SHA256(email_raw_txt).toString();
    let password_raw_hash = CryptoJS.SHA256(password_raw_txt).toString();

    console.log(fullname);
    console.log(username_hash);

    // Format data to send to backend for processing
    const data = {
        fullname: fullname,
        usernameHash: username_hash,
        emailHash: email_hash,
        passwordHash: password_raw_hash // NOT safe yet!
      };
      
      // Send `data` to backend
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    
})
