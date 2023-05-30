<script>
  export let isLoggedIn = false;
  let username = "",
    password = "";

  const handleLogin = () => {
    if (username.trim() === "guest" || password.trim() === "guest") {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
      alert("Invalid username or password.");
    }
  };
</script>

<section class="login-section">
  <form>
    <h5 class="login-heading">Login</h5>
    <label for="username">Username : </label>
    <input
      type="text"
      name="username"
      id="username"
      value={username}
      on:change={(e) => {
        username = e.target.value;
      }}
    />
    <br />
    <br />
    <label for="password">Password &nbsp;: </label>
    <input
      type="password"
      name="password"
      id="password"
      value={password}
      on:change={(e) => {
        password = e.target.value;
      }}
    />
    <br />
    <br />
    <div class="button-row">
      <button type="button" on:click={handleLogin}>Login</button>
      <button type="reset">Reset</button>
    </div>
  </form>
</section>

<style>
  .login-section {
    max-width: fit-content;
    margin: auto;
    margin-top: 3rem;
    padding: 2rem 4rem;
    border: 1px solid black;
  }

  .login-heading {
    margin: 0;
    margin-bottom: 1rem;
    text-align: center;
  }

  .button-row {
    display: flex;
    justify-content: center;
    column-gap: 2rem;
  }
</style>
