document.getElementById('signupForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check if the passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match! Please try again.");
        return;
    }
    
    await handleSubmit();
});

// ✅ Your Airtable API details
const BASE_ID = "appSunSHf6bdvfsLj"; // Replace with your Airtable Base ID
const TABLE_NAME = "user_details"; // Replace with your Table Name in Airtable
const API_KEY = "patlXMCmSgPTWyGT5.643a96f40fd05db76535878f2f3edb2ac32481daf5cf83476df3964f07ef16e2"; // Replace with your Airtable API Key

// ✅ Function to check if user already exists
async function checkUserExists(email) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=({email}="${email}")`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
        });

        const responseBody = await response.json();
        
        // If user exists, return true
        return responseBody.records.length > 0;
    } catch (error) {
        console.error("Error checking user:", error);
        return false;
    }
}

// ✅ Function to write user data to Airtable
async function writeToAirtable(name, email, password) {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const record = {
        records: [
            {
                fields: {
                    Name: name, // Name field in Airtable
                    email: email, // Email field in Airtable
                    password: password, // Password field in Airtable
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
            alert("Signup successful! Redirecting to login...");
            console.log("Signup successful", responseBody);
            
            // ✅ Redirect to login page
            window.location.href = "index.html";
        } else {
            alert("Error in signup. Please try again.");
            console.error("Error signing up", responseBody);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// ✅ Function to handle form submission
async function handleSubmit() {
    event.preventDefault();

    // Collect user input values
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password:", password);

    // Validate form inputs
    if (!name || !email || !password) {
        alert("Please fill out all fields.");
        return;
    }

    // ✅ Check if user already exists
    const userExists = await checkUserExists(email);
    if (userExists) {
        alert("User already exists! Please use a different email.");
        return;
    }

    // ✅ Call function to save data to Airtable
    await writeToAirtable(name, email, password);

    // ✅ Clear the form after successful signup
    document.getElementById("signupForm").reset();
}




