document.getElementById('signupForm').addEventListener('submit', function(event) {
    event.preventDefault();
  
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
  
    // Check if the passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match! Please try again.");
      return;
    }
  handleSubmit();
    // Proceed with form submission (e.g., send data to the server)
    // alert("Signup successful!");
  
    // Reset the form
    document.getElementById('signupForm').reset();
  });
  



  const api_key = "patlXMCmSgPTWyGT5.643a96f40fd05db76535878f2f3edb2ac32481daf5cf83476df3964f07ef16e2"


  const BASE_ID = "appSunSHf6bdvfsLj"; // Replace with your Airtable Base ID
const TABLE_NAME = "user_details"; // Replace with your Table Name or friendly name
const API_KEY = "patlXMCmSgPTWyGT5.643a96f40fd05db76535878f2f3edb2ac32481daf5cf83476df3964f07ef16e2"; // Replace with your Airtable API Key

// Function to write form data to Airtable
async function writeToAirtable(name, email, password) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const record = {
        records: [
            {
                fields: {
                    Name: name, // Name field in Airtable
                    email: email, // Email field in Airtable
                    password: password, // Message field in Airtable
                },
            },
        ],
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(record),
        });

        const responseBody = await response.json();

        if (response.ok) {
            alert("signup successfull !");
            console.log("signup successfull", responseBody);
            

        } else {
            alert("Error in sign up. Please try again.");
            console.error("Error signing up", responseBody);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Function to handle form submission
async function handleSubmit() {
    event.preventDefault();
    // Collect user input values
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log(name);
    console.log(email)
    console.log(password)

    // Validate form inputs
    if (!name || !email || !password) {
        alert("Please fill out all fields.");
        return;
    }

    // Call function to save data to Airtable
    await writeToAirtable(name, email, password);

    // Clear the form after submission
    document.querySelector("form").reset();
}




