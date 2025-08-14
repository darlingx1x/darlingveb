function login() {
    const username = document.getElementById("auth-username").value;
    const password = document.getElementById("auth-password").value;
  
    fetch("/api/login.php", {
      method: "POST",
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("auth-message").textContent = data.message;
      if (data.status === "success") location.reload();
    });
  }
  
  function register() {
    const username = document.getElementById("auth-username").value;
    const password = document.getElementById("auth-password").value;
  
    fetch("/api/register.php", {
      method: "POST",
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("auth-message").textContent = data.message;
    });
  }
  