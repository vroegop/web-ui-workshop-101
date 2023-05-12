import { LitElement, html } from 'lit-element';
import { Amplify } from 'aws-amplify';
import { Auth } from 'aws-amplify';
import { API } from 'aws-amplify';

Amplify.configure({
  Auth: {
    identityPoolId: 'your-identity-pool-id',
    region: 'your-region',
    userPoolId: 'your-user-pool-id',
    userPoolWebClientId: 'your-user-pool-client-id'
  },
  API: {
    endpoints: [
      {
        name: 'MyLambdaAPI',
        endpoint: 'your-lambda-endpoint'
      }
    ]
  }
});

class MyLoginComponent extends LitElement {
  static get properties() {
    return {
      username: { type: String },
      password: { type: String },
      isLoggedIn: { type: Boolean }
    };
  }

  constructor() {
    super();
    this.username = '';
    this.password = '';
    this.isLoggedIn = false;
  }

  async handleLogin() {
    try {
      const user = await Auth.signIn(this.username, this.password);
      console.log('Logged in user:', user);
      this.isLoggedIn = true;
    } catch (err) {
      console.error('Login error:', err);
      // Handle login errors
    }
  }

  async handleCallLambda() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const token = user.signInUserSession.accessToken.jwtToken;
      const lambdaResult = await API.post('MyLambdaAPI', '/myLambdaFunction', {
        headers: {
          Authorization: token
        },
        body: {}
      });
      console.log('Lambda result:', lambdaResult);
      // Do something with the Lambda result
    } catch (err) {
      console.error('Lambda call error:', err);
      // Handle Lambda call errors
    }
  }

  render() {
    if (!this.isLoggedIn) {
      return html`
        <form>
          <label for="username">Username:</label>
          <input type="text" id="username" .value="${this.username}" @input="${(e) => this.username = e.target.value}" />
          <br />
          <label for="password">Password:</label>
          <input type="password" id="password" .value="${this.password}" @input="${(e) => this.password = e.target.value}" />
          <br />
          <button type="button" @click="${this.handleLogin}">Log In</button>
        </form>
      `;
    } else {
      return html`
        <p>You are logged in.</p>
        <button type="button" @click="${this.handleCallLambda}">Call Lambda</button>
      `;
    }
  }
}

customElements.define('my-login-component', MyLoginComponent);
