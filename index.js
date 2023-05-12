import { LitElement, html } from 'lit-element';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
import axios from 'axios';

const userPoolId = 'your-user-pool-id';
const clientId = 'your-client-id';
const region = 'your-region';
const lambdaFunctionName = 'your-lambda-function-name';
const apiGatewayUrl = 'your-api-gateway-url';

class MyLoginComponent extends LitElement {
  static get properties() {
    return {
      isLoggedIn: { type: Boolean },
      username: { type: String },
      password: { type: String },
      result: { type: Object },
      token: { type: String },
    };
  }

  constructor() {
    super();
    this.isLoggedIn = false;
    this.username = '';
    this.password = '';
    this.result = {};
    this.token = '';
  }

  async handleLogin(event) {
    event.preventDefault();

    const userPool = new CognitoUserPool({
      UserPoolId: userPoolId,
      ClientId: clientId,
    });

    const authenticationData = {
      Username: this.username,
      Password: this.password,
    };

    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const cognitoUser = new CognitoUser({
      Username: this.username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log('Authentication succeeded:', result);
        this.token = result.getAccessToken().getJwtToken();
        this.result = {};
        this.isLoggedIn = true;
      },
      onFailure: (error) => {
        console.error('Authentication failed:', error);
        this.result = { message: 'Authentication failed' };
        this.isLoggedIn = false;
      },
    });
  }

  async handleInvokeLambda(event) {
    event.preventDefault();

    if (!this.token) {
      console.error('No authentication token available');
      this.result = { message: 'Not authenticated' };
      return;
    }

    try {
      const response = await axios.post(
        `${apiGatewayUrl}/${lambdaFunctionName}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );
      console.log('API call succeeded:', response.data);
      this.result = response.data;
    } catch (error) {
      console.error('API call failed:', error.response.data);
      this.result = error.response.data;
    }
  }

  render() {
    return html`
      <form @submit="${this.handleLogin}">
        <input type="text" placeholder="Username" .value="${this.username}" @input="${(event) => { this.username = event.target.value; }}" required>
        <input type="password" placeholder="Password" .value="${this.password}" @input="${(event) => { this.password = event.target.value; }}" required>
        <button type="submit">Login</button>
      </form>
      <button @click="${this.handleInvokeLambda}" ?disabled="${!this.isLoggedIn}">Invoke Lambda Function</button>
      ${this.result && this.result.message ? html`<p>${this.result.message}</p>` : ''}
    `;
  }
}

customElements.define('my-login-component', MyLoginComponent);
