// const email = document.getElementById('email');
// const password = document.getElementById('password');
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    // alert("Signup successful!");
    
  
  handleSubmit();
   
  });


const BASE_ID = "appSunSHf6bdvfsLj"; // Replace with your Airtable Base ID
const TABLE_NAME = "user_details"; // Replace with your Table Name or friendly name
const API_KEY = "patlXMCmSgPTWyGT5.643a96f40fd05db76535878f2f3edb2ac32481daf5cf83476df3964f07ef16e2"; // Replace with your Airtable API Key


async function matchFromAirtable(email, password) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=AND(email='${email}', password='${password}')`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const responseBody = await response.json();

        if (response.ok && responseBody.records.length > 0) {
            alert("Login successful!");
            console.log("Login successful", responseBody);
        } else {
            alert("Invalid credentials. Please try again.");
            console.error("Login failed", responseBody);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Function to handle form submission
async function handleSubmit() {
    // event.preventDefault();
    
    // Collect user input values
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log(email);
    console.log(password);
// alert("handle submit called");

    // Call function to match credentials from Airtable
    await matchFromAirtable(email, password);

    // Clear the form after submission
    document.querySelector("form").reset();
    
}



