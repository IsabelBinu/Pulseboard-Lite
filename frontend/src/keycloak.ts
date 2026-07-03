import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'pulseboard',
  clientId: 'pulseboard-frontend',
});

export default keycloak;