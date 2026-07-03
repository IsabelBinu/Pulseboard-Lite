
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Create JWKS client pointing to Keycloak's public keys
const client = jwksClient({
  jwksUri: `${process.env.KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`,
});

// Get the signing key from Keycloak
function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

// Middleware function
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(
    token,
    getKey,
    {
      algorithms: ['RS256'],
      issuer: process.env.KEYCLOAK_REALM_URL,
    },
    (err, decoded) => {
      if (err) {
        console.error('JWT error:', err.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Attach decoded token to request
      (req as any).auth = decoded;
      next();
    }
  );
};